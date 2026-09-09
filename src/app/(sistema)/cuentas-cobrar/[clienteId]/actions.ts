"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cambiarVencimiento(
    cuentaId: string,
    clienteId: string,
    fechaVencimiento: string | null,
) {
    try {
        if (!cuentaId) {
            return {
                exito: false,
                mensaje:
                    "No se recibió la cuenta.",
            };
        }

        const supabase = await createClient();

        const { data, error } = await supabase.rpc(
            "cambiar_vencimiento_cuenta",
            {
                p_cuenta_id: cuentaId,
                p_fecha_vencimiento:
                    fechaVencimiento || null,
            },
        );

        if (error) {
            return {
                exito: false,
                mensaje: error.message,
            };
        }

        const resultado = data as {
            exito?: boolean;
            mensaje?: string;
        } | null;

        revalidatePath("/cuentas-cobrar");
        revalidatePath(
            `/cuentas-cobrar/${clienteId}`,
        );

        return {
            exito: Boolean(
                resultado?.exito,
            ),
            mensaje:
                resultado?.mensaje ??
                "Vencimiento actualizado.",
        };
    } catch (error) {
        console.error(
            "Error cambiando vencimiento:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}