"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ItemVentaProducto = {
    productoId: string;
    cantidad: number;
};

export type PagoVentaProducto = {
    metodo:
    | "EFECTIVO"
    | "TARJETA"
    | "TRANSFERENCIA"
    | "DEPOSITO"
    | "CREDITO"
    | "OTRO";

    monto: number;

    montoRecibido: number | null;

    terminalPosId: string | null;

    referencia: string;
};

export type DatosRegistrarVentaProductos = {
    sucursalId: string;

    clienteId: string | null;

    items: ItemVentaProducto[];

    pagos: PagoVentaProducto[];

    notas?: string;
};

type ResultadoVenta = {
    exito: boolean;

    mensaje: string;

    ventaId?: string;

    codigoVenta?: string;

    total?: number;

    montoPagado?: number;

    saldoPendiente?: number;

    cambio?: number;

    estadoPago?: string;
};

export async function registrarVentaProductos(
    datos: DatosRegistrarVentaProductos,
): Promise<ResultadoVenta> {
    try {
        if (!datos.sucursalId) {
            return {
                exito: false,
                mensaje:
                    "Selecciona una sucursal.",
            };
        }

        if (
            !Array.isArray(datos.items) ||
            datos.items.length === 0
        ) {
            return {
                exito: false,
                mensaje:
                    "La venta no contiene productos.",
            };
        }

        if (
            !Array.isArray(datos.pagos) ||
            datos.pagos.length === 0
        ) {
            return {
                exito: false,
                mensaje:
                    "Debes registrar al menos un método de pago.",
            };
        }

        for (const item of datos.items) {
            if (
                !item.productoId ||
                !Number.isFinite(item.cantidad) ||
                item.cantidad <= 0
            ) {
                return {
                    exito: false,
                    mensaje:
                        "Existe un producto con cantidad inválida.",
                };
            }
        }

        for (const pago of datos.pagos) {
            if (
                !Number.isFinite(pago.monto) ||
                pago.monto <= 0
            ) {
                return {
                    exito: false,
                    mensaje:
                        "Existe un pago con monto inválido.",
                };
            }
        }

        const supabase =
            await createClient();

        const {
            data,
            error,
        } = await supabase.rpc(
            "registrar_venta_productos",
            {
                p_sucursal_id:
                    datos.sucursalId,

                p_cliente_id:
                    datos.clienteId ||
                    null,

                p_items:
                    datos.items.map(
                        (item) => ({
                            producto_id:
                                item.productoId,
                            cantidad:
                                item.cantidad,
                        }),
                    ),

                p_pagos:
                    datos.pagos.map(
                        (pago) => ({
                            metodo:
                                pago.metodo,

                            monto:
                                pago.monto,

                            monto_recibido:
                                pago.montoRecibido,

                            terminal_pos_id:
                                pago.terminalPosId,

                            referencia:
                                pago.referencia,
                        }),
                    ),

                p_notas:
                    datos.notas?.trim() ||
                    null,
            },
        );

        if (error) {
            console.error(
                "Error registrando venta de productos:",
                error,
            );

            return {
                exito: false,
                mensaje:
                    error.message,
            };
        }

        const resultado =
            data as {
                exito?: boolean;
                mensaje?: string;
                ventaId?: string;
                codigoVenta?: string;
                total?: number;
                montoPagado?: number;
                saldoPendiente?: number;
                cambio?: number;
                estadoPago?: string;
            } | null;

        revalidatePath("/caja");

        revalidatePath(
            "/caja/venta-productos",
        );

        revalidatePath(
            "/caja/ventas",
        );

        revalidatePath(
            "/inventario",
        );

        revalidatePath(
            "/inventario/movimientos",
        );

        revalidatePath(
            "/inventario/alertas",
        );

        revalidatePath(
            "/cuentas-cobrar",
        );

        return {
            exito: true,

            mensaje:
                resultado?.mensaje ??
                "Venta registrada correctamente.",

            ventaId:
                resultado?.ventaId,

            codigoVenta:
                resultado?.codigoVenta,

            total:
                resultado?.total,

            montoPagado:
                resultado?.montoPagado,

            saldoPendiente:
                resultado?.saldoPendiente,

            cambio:
                resultado?.cambio,

            estadoPago:
                resultado?.estadoPago,
        };
    } catch (error) {
        console.error(
            "Error inesperado registrando venta:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar la venta.",
        };
    }
}