"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ResultadoConfirmarCompra = {
    exito: boolean;
    mensaje: string;
};

export async function confirmarCompra(
    compraId: string,
): Promise<ResultadoConfirmarCompra> {
    try {
        if (!compraId) {
            return {
                exito: false,
                mensaje:
                    "No se recibió la compra.",
            };
        }

        const supabase =
            await createClient();

        const {
            data,
            error,
        } = await supabase.rpc(
            "confirmar_compra",
            {
                p_compra_id:
                    compraId,
            },
        );

        if (error) {
            console.error(
                "Error confirmando compra:",
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
            } | null;

        if (!resultado?.exito) {
            return {
                exito: false,
                mensaje:
                    resultado?.mensaje ??
                    "No fue posible confirmar la compra.",
            };
        }

        revalidatePath(
            "/compras",
        );

        revalidatePath(
            `/compras/${compraId}`,
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

        return {
            exito: true,
            mensaje:
                resultado.mensaje ??
                "Compra confirmada correctamente.",
        };
    } catch (error) {
        console.error(
            "Error inesperado confirmando compra:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al confirmar la compra.",
        };
    }
}

export async function anularCompra(
    compraId: string,
    motivo: string,
): Promise<ResultadoConfirmarCompra> {
    try {
        if (!compraId) {
            return {
                exito: false,
                mensaje: "No se recibió la compra.",
            };
        }

        if (motivo.trim().length < 3) {
            return {
                exito: false,
                mensaje: "Escribe un motivo de anulación.",
            };
        }

        const supabase = await createClient();

        const { data, error } = await supabase.rpc(
            "anular_compra",
            {
                p_compra_id: compraId,
                p_motivo: motivo.trim(),
            },
        );

        if (error) {
            console.error("Error anulando compra:", error);

            return {
                exito: false,
                mensaje: error.message,
            };
        }

        const resultado = data as {
            exito?: boolean;
            mensaje?: string;
        } | null;

        if (!resultado?.exito) {
            return {
                exito: false,
                mensaje:
                    resultado?.mensaje ??
                    "No fue posible anular la compra.",
            };
        }

        revalidatePath("/compras");
        revalidatePath(`/compras/${compraId}`);
        revalidatePath("/compras/cuentas-pagar");
        revalidatePath("/inventario");
        revalidatePath("/inventario/movimientos");
        revalidatePath("/inventario/alertas");

        return {
            exito: true,
            mensaje:
                resultado.mensaje ??
                "Compra anulada correctamente.",
        };
    } catch (error) {
        console.error(
            "Error inesperado anulando compra:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al anular la compra.",
        };
    }
}