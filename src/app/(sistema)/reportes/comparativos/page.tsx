import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ComparativosClient, {
    type CompraComparativa,
    type CitaComparativa,
    type MovimientoComparativo,
    type VentaComparativa,
} from "./ComparativosClient";

function fechaDesdeConsulta() {
    const hoy = new Date();

    return new Date(
        hoy.getFullYear() - 2,
        0,
        1,
    ).toISOString();
}

export default async function ComparativosPage() {
    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (
        usuarioError ||
        !user
    ) {
        redirect("/login");
    }

    const {
        data: perfil,
        error: perfilError,
    } = await supabase
        .from("usuarios_perfiles")
        .select(
            "salon_id, rol, estado",
        )
        .eq("id", user.id)
        .single();

    if (
        perfilError ||
        !perfil ||
        perfil.estado !== "ACTIVO"
    ) {
        redirect("/login");
    }

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
        ].includes(
            perfil.rol,
        )
    ) {
        redirect("/inicio");
    }

    const desde =
        fechaDesdeConsulta();

    const [
        ventasResultado,
        movimientosResultado,
        citasResultado,
        comprasResultado,
        configuracionResultado,
    ] = await Promise.all([
        supabase
            .from("ventas")
            .select(
                "id, cliente_id, fecha_venta, total, monto_pagado, estado",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .gte(
                "fecha_venta",
                desde,
            )
            .limit(10000),

        supabase
            .from(
                "movimientos_financieros",
            )
            .select(
                "id, fecha_movimiento, tipo, monto, estado",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .gte(
                "fecha_movimiento",
                desde,
            )
            .limit(10000),

        supabase
            .from("citas")
            .select(
                "id, cliente_id, fecha, estado, total",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .gte(
                "fecha",
                desde.slice(
                    0,
                    10,
                ),
            )
            .limit(10000),

        supabase
            .from("compras")
            .select(
                "id, fecha_compra, total, estado",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .gte(
                "fecha_compra",
                desde,
            )
            .limit(10000),

        supabase
            .from(
                "configuracion_salon",
            )
            .select(
                "simbolo_moneda",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle(),
    ]);

    return (
        <div className="mx-auto max-w-[1700px]">
            <ComparativosClient
                simboloMoneda={
                    configuracionResultado
                        .data
                        ?.simbolo_moneda ??
                    "C$"
                }
                ventas={
                    (
                        ventasResultado.data ??
                        []
                    ) as VentaComparativa[]
                }
                movimientos={
                    (
                        movimientosResultado.data ??
                        []
                    ) as MovimientoComparativo[]
                }
                citas={
                    (
                        citasResultado.data ??
                        []
                    ) as CitaComparativa[]
                }
                compras={
                    (
                        comprasResultado.data ??
                        []
                    ) as CompraComparativa[]
                }
            />
        </div>
    );
}
