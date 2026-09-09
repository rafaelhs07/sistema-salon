import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import DetalleVentaClient, {
    type VentaDetalle,
} from "./DetalleVentaClient";

export default async function DetalleVentaPage({
    params,
}: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;
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
        resultadoVenta,
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
                cambio_entregado,
                estado_pago,
                estado,
                notas,
                fecha_venta,
                cliente_id,
                cita_id,
                sucursal_id,
                caja_sesion_id,
                motivo_anulacion,
                fecha_anulacion,
                cajas_sesiones (
                    estado,
                    fecha_apertura,
                    fecha_cierre
                ),
                clientes (
                    id,
                    codigo_cliente,
                    nombre_completo,
                    telefono,
                    whatsapp,
                    correo
                ),
                sucursales (
                    nombre,
                    direccion,
                    telefono
                ),
                venta_detalles (
                    id,
                    tipo_item,
                    descripcion,
                    cantidad,
                    precio_unitario,
                    descuento,
                    subtotal,
                    total,
                    tipo_comision,
                    valor_comision,
                    monto_comision,
                    orden,
                    trabajadores (
                        nombre_completo
                    )
                ),
                venta_pagos (
                    id,
                    metodo_pago,
                    monto,
                    monto_recibido,
                    cambio,
                    terminal_pos_id,
                    porcentaje_comision_pos,
                    monto_comision_pos,
                    monto_neto,
                    referencia,
                    banco,
                    observaciones,
                    estado,
                    fecha_pago,
                    terminales_pos (
                        nombre,
                        banco
                    )
                )
            `)
            .eq("id", id)
            .eq("salon_id", perfil.salon_id)
            .single(),

        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq("salon_id", perfil.salon_id)
            .single(),
    ]);

    if (
        resultadoVenta.error ||
        !resultadoVenta.data
    ) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-[1450px]">
            <DetalleVentaClient
                venta={
                    resultadoVenta.data as unknown as VentaDetalle
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
            />
        </div>
    );
}