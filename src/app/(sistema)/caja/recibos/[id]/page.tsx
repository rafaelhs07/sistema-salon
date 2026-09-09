import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReciboVentaClient, {
    type VentaRecibo,
} from "./ReciboVentaClient";

export default async function ReciboVentaPage({
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
        resultadoSalon,
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
            .eq("estado", "ACTIVA")
            .single(),

        supabase
            .from("salones")
            .select(`
                nombre,
                telefono,
                correo,
                direccion
            `)
            .eq("id", perfil.salon_id)
            .single(),

        supabase
            .from("configuracion_salon")
            .select(`
                simbolo_moneda,
                mensaje_recibo
            `)
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
        <ReciboVentaClient
            venta={
                resultadoVenta.data as unknown as VentaRecibo
            }
            salon={{
                nombre:
                    resultadoSalon.data?.nombre ??
                    "Salon de belleza",
                telefono:
                    resultadoSalon.data?.telefono ??
                    null,
                correo:
                    resultadoSalon.data?.correo ??
                    null,
                direccion:
                    resultadoSalon.data?.direccion ??
                    null,
            }}
            simboloMoneda={
                resultadoConfiguracion.data
                    ?.simbolo_moneda ?? "C$"
            }
            mensajeRecibo={
                resultadoConfiguracion.data
                    ?.mensaje_recibo ??
                "Gracias por preferir nuestros servicios."
            }
        />
    );
}