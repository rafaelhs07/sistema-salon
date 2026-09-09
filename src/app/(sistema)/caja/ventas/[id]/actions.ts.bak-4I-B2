"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ResultadoAnulacionVenta = {
    exito: boolean;
    mensaje: string;
};

export async function anularVenta(
    ventaId: string,
    motivo: string,
): Promise<ResultadoAnulacionVenta> {
    try {
        if (!ventaId) {
            return {
                exito: false,
                mensaje:
                    "No se recibió la venta.",
            };
        }

        const motivoLimpio =
            motivo.trim();

        if (
            motivoLimpio.length < 5
        ) {
            return {
                exito: false,
                mensaje:
                    "Escribe un motivo de al menos 5 caracteres.",
            };
        }

        const supabase =
            await createClient();

        const { data, error } =
            await supabase.rpc(
                "anular_venta",
                {
                    p_venta_id:
                        ventaId,

                    p_motivo:
                        motivoLimpio,
                },
            );

        if (error) {
            console.error(
                "Error anulando venta:",
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
                inventarioRepuesto?: boolean;
            } | null;

        if (!resultado?.exito) {
            return {
                exito: false,
                mensaje:
                    resultado?.mensaje ??
                    "No fue posible anular la venta.",
            };
        }

        revalidatePath("/caja");

        revalidatePath(
            "/caja/ventas",
        );

        revalidatePath(
            `/caja/ventas/${ventaId}`,
        );

        revalidatePath(
            `/caja/venta-productos/recibo/${ventaId}`,
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

        revalidatePath(
            "/agenda",
        );

        return {
            exito: true,

            mensaje:
                resultado.mensaje ??
                "Venta anulada correctamente.",
        };
    } catch (error) {
        console.error(
            "Error inesperado anulando venta:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al anular la venta.",
        };
    }
}