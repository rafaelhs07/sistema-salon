import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReciboVentaProductoClient, {
    type DatosReciboProducto,
} from "./ReciboVentaProductoClient";

export default async function ReciboVentaProductoPage({
    params,
}: {
    params: Promise<{
        ventaId: string;
    }>;
}) {
    const { ventaId } = await params;

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
            "RECEPCION",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const { data: venta, error: ventaError } =
        await supabase
            .from("ventas")
            .select(`
                id,
                salon_id,
                sucursal_id,
                cliente_id,
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
                fecha_venta
            `)
            .eq("id", ventaId)
            .eq("salon_id", perfil.salon_id)
            .maybeSingle();

    if (ventaError) {
        console.error(
            "Error cargando venta para recibo:",
            ventaError,
        );
    }

    if (
        ventaError ||
        !venta ||
        venta.tipo_venta !== "PRODUCTOS"
    ) {
        notFound();
    }

    const [
        resultadoDetalles,
        resultadoPagos,
        resultadoSucursal,
        resultadoCliente,
        resultadoSalon,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("venta_detalles")
            .select(`
                id,
                descripcion,
                cantidad,
                precio_unitario,
                descuento,
                subtotal,
                total,
                producto_id
            `)
            .eq("venta_id", venta.id)
            .eq("salon_id", perfil.salon_id)
            .eq("tipo_item", "PRODUCTO")
            .order("orden"),

        supabase
            .from("venta_pagos")
            .select(`
                id,
                metodo_pago,
                monto,
                monto_recibido,
                cambio,
                referencia,
                terminal_pos_id,
                porcentaje_comision_pos,
                monto_comision_pos,
                monto_neto,
                estado,
                fecha_pago
            `)
            .eq("venta_id", venta.id)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "APLICADO")
            .order("fecha_pago", {
                ascending: true,
            }),

        supabase
            .from("sucursales")
            .select(`
                id,
                nombre
            `)
            .eq("id", venta.sucursal_id)
            .eq("salon_id", perfil.salon_id)
            .maybeSingle(),

        venta.cliente_id
            ? supabase
                .from("clientes")
                .select(`
                      id,
                      nombre,
                      telefono,
                      whatsapp
                  `)
                .eq("id", venta.cliente_id)
                .eq("salon_id", perfil.salon_id)
                .maybeSingle()
            : Promise.resolve({
                data: null,
                error: null,
            }),

        supabase
            .from("salones")
            .select(`
                id,
                nombre,
                telefono,
                whatsapp,
                direccion
            `)
            .eq("id", perfil.salon_id)
            .maybeSingle(),

        supabase
            .from("configuracion_salon")
            .select(`
                simbolo_moneda,
                mensaje_recibo
            `)
            .eq("salon_id", perfil.salon_id)
            .maybeSingle(),
    ]);

    if (resultadoDetalles.error) {
        console.error(
            "Error cargando detalles del recibo:",
            resultadoDetalles.error,
        );
    }

    if (resultadoPagos.error) {
        console.error(
            "Error cargando pagos del recibo:",
            resultadoPagos.error,
        );
    }

    if (resultadoSucursal.error) {
        console.error(
            "Error cargando sucursal del recibo:",
            resultadoSucursal.error,
        );
    }

    if (resultadoSalon.error) {
        console.error(
            "Error cargando salón del recibo:",
            resultadoSalon.error,
        );
    }

    if (resultadoConfiguracion.error) {
        console.error(
            "Error cargando configuración del recibo:",
            resultadoConfiguracion.error,
        );
    }

    const terminalIds = (
        resultadoPagos.data ?? []
    )
        .map(
            (pago) =>
                pago.terminal_pos_id,
        )
        .filter(
            (id): id is string =>
                Boolean(id),
        );

    let terminales: {
        id: string;
        nombre: string;
        banco: string | null;
    }[] = [];

    if (terminalIds.length > 0) {
        const {
            data: terminalesData,
            error: terminalesError,
        } = await supabase
            .from("terminales_pos")
            .select(`
                id,
                nombre,
                banco
            `)
            .eq("salon_id", perfil.salon_id)
            .in("id", terminalIds);

        if (terminalesError) {
            console.error(
                "Error cargando terminales POS:",
                terminalesError,
            );
        }

        terminales =
            terminalesData ?? [];
    }

    const datos: DatosReciboProducto = {
        venta: {
            id: venta.id,

            codigoVenta:
                venta.codigo_venta,

            subtotal: Number(
                venta.subtotal ?? 0,
            ),

            descuento: Number(
                venta.descuento ?? 0,
            ),

            impuestos: Number(
                venta.impuestos ?? 0,
            ),

            total: Number(
                venta.total ?? 0,
            ),

            montoPagado: Number(
                venta.monto_pagado ?? 0,
            ),

            saldoPendiente: Number(
                venta.saldo_pendiente ?? 0,
            ),

            cambio: Number(
                venta.cambio_entregado ?? 0,
            ),

            estadoPago:
                venta.estado_pago,

            estado:
                venta.estado,

            notas:
                venta.notas,

            creadoEn:
                venta.fecha_venta,
        },

        detalles: (
            resultadoDetalles.data ?? []
        ).map((detalle) => ({
            id:
                detalle.id,

            descripcion:
                detalle.descripcion ??
                "Producto",

            cantidad: Number(
                detalle.cantidad ?? 0,
            ),

            precioUnitario: Number(
                detalle.precio_unitario ??
                0,
            ),

            descuento: Number(
                detalle.descuento ?? 0,
            ),

            subtotal: Number(
                detalle.subtotal ?? 0,
            ),

            total: Number(
                detalle.total ?? 0,
            ),
        })),

        pagos: (
            resultadoPagos.data ?? []
        ).map((pago) => {
            const terminal =
                terminales.find(
                    (item) =>
                        item.id ===
                        pago.terminal_pos_id,
                ) ?? null;

            return {
                id:
                    pago.id,

                metodo:
                    pago.metodo_pago,

                monto: Number(
                    pago.monto ?? 0,
                ),

                montoRecibido:
                    pago.monto_recibido ==
                        null
                        ? null
                        : Number(
                            pago.monto_recibido,
                        ),

                cambio: Number(
                    pago.cambio ?? 0,
                ),

                referencia:
                    pago.referencia,

                terminalNombre:
                    terminal?.nombre ??
                    null,

                banco:
                    terminal?.banco ??
                    null,

                comisionPos: Number(
                    pago.monto_comision_pos ??
                    0,
                ),
            };
        }),

        sucursal: {
            nombre:
                resultadoSucursal.data
                    ?.nombre ??
                "Sucursal",
        },

        cliente:
            resultadoCliente.data
                ? {
                    nombre:
                        resultadoCliente.data
                            .nombre,

                    telefono:
                        resultadoCliente.data
                            .telefono,

                    whatsapp:
                        resultadoCliente.data
                            .whatsapp,
                }
                : null,

        salon: {
            nombre:
                resultadoSalon.data
                    ?.nombre ??
                "Salón",

            telefono:
                resultadoSalon.data
                    ?.telefono ??
                null,

            whatsapp:
                resultadoSalon.data
                    ?.whatsapp ??
                null,

            direccion:
                resultadoSalon.data
                    ?.direccion ??
                null,
        },

        simboloMoneda:
            resultadoConfiguracion.data
                ?.simbolo_moneda ??
            "C$",

        mensajeRecibo:
            resultadoConfiguracion.data
                ?.mensaje_recibo ??
            "Gracias por preferir nuestros servicios.",
    };

    return (
        <ReciboVentaProductoClient
            datos={datos}
        />
    );
}