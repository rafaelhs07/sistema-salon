import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReporteVentasClient, {
    type SucursalReporteVentas,
    type VentaReporte,
} from "./ReporteVentasClient";

function fechaDesdeConsulta() {
    const hoy = new Date();

    return new Date(
        hoy.getFullYear() - 1,
        0,
        1,
    ).toISOString();
}

export default async function ReporteVentasPage() {
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

    const [
        ventasResultado,
        sucursalesResultado,
        configuracionResultado,
    ] = await Promise.all([
        supabase
            .from("ventas")
            .select(`
                id,
                sucursal_id,
                codigo_venta,
                tipo_venta,
                subtotal,
                descuento,
                impuestos,
                total,
                monto_pagado,
                saldo_pendiente,
                cambio_entregado,
                estado_pago,
                estado,
                fecha_venta,
                sucursales (
                    nombre
                ),
                venta_pagos (
                    id,
                    metodo_pago,
                    monto,
                    estado,
                    fecha_pago
                )
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .gte(
                "fecha_venta",
                fechaDesdeConsulta(),
            )
            .order(
                "fecha_venta",
                {
                    ascending: false,
                },
            )
            .limit(7000),

        supabase
            .from("sucursales")
            .select(
                "id, nombre",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "ACTIVA",
            )
            .order("nombre"),

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
        ventasResultado.error
    ) {
        console.error(
            "Error cargando reporte de ventas:",
            ventasResultado.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1700px]">
            <ReporteVentasClient
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
                    ) as unknown as VentaReporte[]
                }
                sucursales={
                    (
                        sucursalesResultado.data ??
                        []
                    ) as SucursalReporteVentas[]
                }
            />
        </div>
    );
}