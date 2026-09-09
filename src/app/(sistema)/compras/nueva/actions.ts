"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ItemCompraFormulario = {
    productoId: string;
    cantidad: number;
    costoUnitario: number;
    descuento: number;
    lote: string;
    fechaVencimiento: string;
};

export type DatosCompraFormulario = {
    sucursalId: string;
    proveedorId: string;
    numeroFactura: string;
    condicionPago:
    | "CONTADO"
    | "CREDITO"
    | "MIXTA";
    fechaVencimiento: string;
    descuento: number;
    impuestos: number;
    notas: string;
    items: ItemCompraFormulario[];
};

export type ResultadoRegistrarCompra = {
    exito: boolean;
    mensaje: string;
    compraId?: string;
    codigoCompra?: string;
};

export async function registrarCompraBorrador(
    datos: DatosCompraFormulario,
): Promise<ResultadoRegistrarCompra> {
    try {
        if (!datos.sucursalId) {
            return {
                exito: false,
                mensaje:
                    "Selecciona una sucursal.",
            };
        }

        if (!datos.proveedorId) {
            return {
                exito: false,
                mensaje:
                    "Selecciona un proveedor.",
            };
        }

        if (
            datos.items.length ===
            0
        ) {
            return {
                exito: false,
                mensaje:
                    "Agrega al menos un producto.",
            };
        }

        if (
            ["CREDITO", "MIXTA"].includes(
                datos.condicionPago,
            ) &&
            !datos.fechaVencimiento
        ) {
            return {
                exito: false,
                mensaje:
                    "Selecciona la fecha de vencimiento.",
            };
        }

        for (
            const item of datos.items
        ) {
            if (
                !item.productoId ||
                item.cantidad <= 0 ||
                item.costoUnitario < 0
            ) {
                return {
                    exito: false,
                    mensaje:
                        "Revisa cantidades y costos de los productos.",
                };
            }
        }

        const supabase =
            await createClient();

        const {
            data,
            error,
        } = await supabase.rpc(
            "registrar_compra_borrador",
            {
                p_sucursal_id:
                    datos.sucursalId,

                p_proveedor_id:
                    datos.proveedorId,

                p_numero_factura:
                    datos.numeroFactura.trim() ||
                    null,

                p_condicion_pago:
                    datos.condicionPago,

                p_fecha_vencimiento:
                    datos.condicionPago ===
                        "CONTADO"
                        ? null
                        : datos.fechaVencimiento ||
                        null,

                p_descuento:
                    datos.descuento,

                p_impuestos:
                    datos.impuestos,

                p_notas:
                    datos.notas.trim() ||
                    null,

                p_items:
                    datos.items.map(
                        (item) => ({
                            productoId:
                                item.productoId,

                            cantidad:
                                item.cantidad,

                            costoUnitario:
                                item.costoUnitario,

                            descuento:
                                item.descuento,

                            lote:
                                item.lote.trim(),

                            fechaVencimiento:
                                item.fechaVencimiento ||
                                null,
                        }),
                    ),
            },
        );

        if (error) {
            console.error(
                "Error registrando compra:",
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
                compraId?: string;
                codigoCompra?: string;
                mensaje?: string;
            } | null;

        if (!resultado?.exito) {
            return {
                exito: false,
                mensaje:
                    resultado?.mensaje ??
                    "No fue posible registrar la compra.",
            };
        }

        revalidatePath(
            "/compras",
        );

        revalidatePath(
            "/compras/nueva",
        );

        return {
            exito: true,

            mensaje:
                resultado.mensaje ??
                "Compra registrada correctamente.",

            compraId:
                resultado.compraId,

            codigoCompra:
                resultado.codigoCompra,
        };
    } catch (error) {
        console.error(
            "Error inesperado registrando compra:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar la compra.",
        };
    }
}