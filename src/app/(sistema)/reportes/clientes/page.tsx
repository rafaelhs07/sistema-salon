import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReporteClientesClient, {
    type CitaClienteReporte,
    type ClienteReporte,
    type VentaClienteReporte,
} from "./ReporteClientesClient";

function fechaDesdeConsulta() {
    const hoy = new Date();

    return new Date(
        hoy.getFullYear() - 1,
        0,
        1,
    )
        .toISOString()
        .slice(0, 10);
}

export default async function ReporteClientesPage() {
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
        clientesResultado,
        citasResultado,
        ventasResultado,
        configuracionResultado,
    ] = await Promise.all([
        supabase
            .from("clientes")
            .select(`
                id,
                codigo_cliente,
                nombre_completo,
                telefono,
                whatsapp,
                correo
            `)
            .order(
                "nombre_completo",
            )
            .limit(10000),

        supabase
            .from("citas")
            .select(`
                id,
                cliente_id,
                fecha,
                estado,
                total
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .gte(
                "fecha",
                desde,
            )
            .limit(10000),

        supabase
            .from("ventas")
            .select(`
                id,
                cliente_id,
                fecha_venta,
                total,
                monto_pagado,
                saldo_pendiente,
                estado,
                estado_pago
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .gte(
                "fecha_venta",
                `${desde}T00:00:00`,
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

    if (
        clientesResultado.error
    ) {
        console.error(
            "Error cargando clientes para reporte:",
            clientesResultado.error,
        );
    }

    if (
        citasResultado.error
    ) {
        console.error(
            "Error cargando citas de clientes:",
            citasResultado.error,
        );
    }

    if (
        ventasResultado.error
    ) {
        console.error(
            "Error cargando ventas de clientes:",
            ventasResultado.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1750px]">
            <ReporteClientesClient
                simboloMoneda={
                    configuracionResultado
                        .data
                        ?.simbolo_moneda ??
                    "C$"
                }
                clientes={
                    (
                        clientesResultado.data ??
                        []
                    ) as ClienteReporte[]
                }
                citas={
                    (
                        citasResultado.data ??
                        []
                    ) as CitaClienteReporte[]
                }
                ventas={
                    (
                        ventasResultado.data ??
                        []
                    ) as VentaClienteReporte[]
                }
            />
        </div>
    );
}
