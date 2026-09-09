import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import VentasClient, {
    type SucursalVenta,
    type VentaHistorial,
} from "./VentasClient";

export default async function VentasPage() {
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
            "RECEPCION",
            "CAJA",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const [
        resultadoVentas,
        resultadoSucursales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("ventas")
            .select(`
                id,
                codigo_venta,
                tipo_venta,
                subtotal,
                descuento,
                impuestos,
                total,
                monto_pagado,
                saldo_pendiente,
                estado_pago,
                estado,
                fecha_venta,
                cliente_id,
                cita_id,
                sucursal_id,
                clientes (
                    nombre_completo,
                    codigo_cliente,
                    telefono,
                    whatsapp
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
            .limit(1000),

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
            "Error cargando historial de ventas:",
            resultadoVentas.error,
        );
    }

    if (resultadoSucursales.error) {
        console.error(
            "Error cargando sucursales:",
            resultadoSucursales.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1500px]">
            <VentasClient
                ventas={
                    (resultadoVentas.data ??
                        []) as unknown as VentaHistorial[]
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalVenta[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
            />
        </div>
    );
}