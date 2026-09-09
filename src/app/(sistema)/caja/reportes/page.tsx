import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReportesCajaClient, {
    type MovimientoReporte,
    type SucursalReporte,
    type VentaReporte,
} from "./ReportesCajaClient";

export default async function ReportesCajaPage() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        redirect("/login");
    }

    const { data: perfil, error: perfilError } =
        await supabase
            .from("usuarios_perfiles")
            .select("salon_id, rol, estado")
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
            "CAJA",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const [
        resultadoVentas,
        resultadoMovimientos,
        resultadoSucursales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("ventas")
            .select(`
                id,
                codigo_venta,
                tipo_venta,
                sucursal_id,
                subtotal,
                descuento,
                impuestos,
                total,
                monto_pagado,
                saldo_pendiente,
                estado_pago,
                estado,
                fecha_venta,
                clientes (
                    nombre_completo
                ),
                sucursales (
                    nombre
                ),
                venta_pagos (
                    id,
                    metodo_pago,
                    monto,
                    monto_comision_pos,
                    monto_neto,
                    estado,
                    terminales_pos (
                        nombre,
                        banco
                    )
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_venta", {
                ascending: false,
            })
            .limit(3000),

        supabase
            .from("movimientos_caja")
            .select(`
                id,
                sucursal_id,
                tipo,
                naturaleza,
                metodo_pago,
                concepto,
                monto,
                fecha_movimiento,
                venta_id,
                sucursales (
                    nombre
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_movimiento", {
                ascending: false,
            })
            .limit(5000),

        supabase
            .from("sucursales")
            .select(`
                id,
                nombre,
                es_principal
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("es_principal", {
                ascending: false,
            })
            .order("nombre"),

        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq("salon_id", perfil.salon_id)
            .single(),
    ]);

    if (resultadoVentas.error) {
        console.error(
            "Error cargando ventas para reportes:",
            resultadoVentas.error,
        );
    }

    if (resultadoMovimientos.error) {
        console.error(
            "Error cargando movimientos para reportes:",
            resultadoMovimientos.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1550px]">
            <ReportesCajaClient
                ventas={
                    (resultadoVentas.data ??
                        []) as unknown as VentaReporte[]
                }
                movimientos={
                    (resultadoMovimientos.data ??
                        []) as unknown as MovimientoReporte[]
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalReporte[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
            />
        </div>
    );
}