import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CompraDetalleClient, {
    type CompraDetalle,
} from "./CompraDetalleClient";

export default async function CompraDetallePage({
    params,
}: {
    params: Promise<{
        compraId: string;
    }>;
}) {
    const {
        compraId,
    } = await params;

    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
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
            "INVENTARIO",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const {
        data: compra,
        error,
    } = await supabase
        .from("compras")
        .select(`
            id,
            codigo_compra,
            numero_factura,
            fecha_compra,
            condicion_pago,
            fecha_vencimiento,
            subtotal,
            descuento,
            impuestos,
            total,
            monto_pagado,
            saldo_pendiente,
            estado_pago,
            estado,
            notas,
            fecha_confirmacion,
            proveedor_id,
            sucursal_id
        `)
        .eq("id", compraId)
        .eq(
            "salon_id",
            perfil.salon_id,
        )
        .maybeSingle();

    if (error) {
        console.error(
            "Error cargando compra:",
            error,
        );
    }

    if (!compra) {
        notFound();
    }

    const [
        resultadoProveedor,
        resultadoSucursal,
        resultadoDetalles,
        resultadoMovimientos,
    ] = await Promise.all([
        supabase
            .from("proveedores")
            .select(`
                id,
                nombre,
                codigo_proveedor
            `)
            .eq(
                "id",
                compra.proveedor_id,
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle(),

        supabase
            .from("sucursales")
            .select(`
                id,
                nombre
            `)
            .eq(
                "id",
                compra.sucursal_id,
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle(),

        supabase
            .from("compra_detalles")
            .select(`
                id,
                producto_id,
                descripcion,
                cantidad,
                costo_unitario,
                descuento,
                subtotal,
                total,
                lote,
                fecha_vencimiento,
                orden
            `)
            .eq(
                "compra_id",
                compra.id,
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .order(
                "orden",
                {
                    ascending: true,
                },
            ),

        supabase
            .from("inventario_movimientos")
            .select(`
                id,
                producto_id,
                cantidad,
                cantidad_anterior,
                cantidad_nueva,
                fecha_movimiento
            `)
            .eq(
                "compra_id",
                compra.id,
            )
            .eq(
                "tipo",
                "COMPRA",
            )
            .eq(
                "naturaleza",
                "ENTRADA",
            )
            .order(
                "fecha_movimiento",
                {
                    ascending: true,
                },
            ),
    ]);

    const productoIds = [
        ...new Set(
            (
                resultadoDetalles.data ??
                []
            ).map(
                (
                    detalle,
                ) =>
                    detalle.producto_id,
            ),
        ),
    ];

    const {
        data: productos,
    } =
        productoIds.length >
            0
            ? await supabase
                .from("productos")
                .select(`
                      id,
                      codigo_producto,
                      nombre,
                      unidad_medida
                  `)
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .in(
                    "id",
                    productoIds,
                )
            : {
                data: [],
            };

    const detalleCompleto: CompraDetalle =
    {
        id:
            compra.id,

        codigoCompra:
            compra.codigo_compra,

        numeroFactura:
            compra.numero_factura,

        fechaCompra:
            compra.fecha_compra,

        condicionPago:
            compra.condicion_pago,

        fechaVencimiento:
            compra.fecha_vencimiento,

        subtotal:
            Number(
                compra.subtotal,
            ),

        descuento:
            Number(
                compra.descuento,
            ),

        impuestos:
            Number(
                compra.impuestos,
            ),

        total:
            Number(
                compra.total,
            ),

        montoPagado:
            Number(
                compra.monto_pagado,
            ),

        saldoPendiente:
            Number(
                compra.saldo_pendiente,
            ),

        estadoPago:
            compra.estado_pago,

        estado:
            compra.estado,

        notas:
            compra.notas,

        fechaConfirmacion:
            compra.fecha_confirmacion,

        proveedorNombre:
            resultadoProveedor.data
                ?.nombre ??
            "Proveedor",

        proveedorCodigo:
            resultadoProveedor.data
                ?.codigo_proveedor ??
            "",

        sucursalNombre:
            resultadoSucursal.data
                ?.nombre ??
            "Sucursal",

        items:
            (
                resultadoDetalles.data ??
                []
            ).map(
                (
                    detalle,
                ) => {
                    const producto =
                        (
                            productos ??
                            []
                        ).find(
                            (
                                item,
                            ) =>
                                item.id ===
                                detalle.producto_id,
                        );

                    const movimiento =
                        (
                            resultadoMovimientos.data ??
                            []
                        ).find(
                            (
                                item,
                            ) =>
                                item.producto_id ===
                                detalle.producto_id,
                        );

                    return {
                        id:
                            detalle.id,

                        productoId:
                            detalle.producto_id,

                        codigoProducto:
                            producto
                                ?.codigo_producto ??
                            "",

                        nombre:
                            producto
                                ?.nombre ??
                            detalle.descripcion,

                        unidad:
                            producto
                                ?.unidad_medida ??
                            "",

                        cantidad:
                            Number(
                                detalle.cantidad,
                            ),

                        costoUnitario:
                            Number(
                                detalle.costo_unitario,
                            ),

                        descuento:
                            Number(
                                detalle.descuento,
                            ),

                        subtotal:
                            Number(
                                detalle.subtotal,
                            ),

                        total:
                            Number(
                                detalle.total,
                            ),

                        lote:
                            detalle.lote,

                        fechaVencimiento:
                            detalle.fecha_vencimiento,

                        stockAnterior:
                            movimiento
                                ? Number(
                                    movimiento.cantidad_anterior,
                                )
                                : null,

                        stockNuevo:
                            movimiento
                                ? Number(
                                    movimiento.cantidad_nueva,
                                )
                                : null,
                    };
                },
            ),
    };

    return (
        <div className="mx-auto max-w-[1600px]">
            <CompraDetalleClient
                compra={
                    detalleCompleto
                }
            />
        </div>
    );
}