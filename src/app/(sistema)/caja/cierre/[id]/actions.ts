"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResultadoCierreCaja = {
    exito: boolean;
    mensaje: string;
    montoEsperado?: number;
    montoContado?: number;
    diferencia?: number;
};

export async function cerrarCaja(
    cajaId: string,
    montoContado: number,
    observaciones: string,
): Promise<ResultadoCierreCaja> {
    try {
        if (!cajaId) {
            return {
                exito: false,
                mensaje: "No se recibió la caja.",
            };
        }

        if (
            !Number.isFinite(montoContado) ||
            montoContado < 0
        ) {
            return {
                exito: false,
                mensaje:
                    "El monto contado no puede ser negativo.",
            };
        }

        const supabase = await createClient();

        const { data, error } = await supabase.rpc(
            "cerrar_caja",
            {
                p_caja_sesion_id: cajaId,
                p_monto_contado: Number(
                    montoContado.toFixed(2),
                ),
                p_observaciones:
                    observaciones.trim() || null,
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
            montoEsperado?: number;
            montoContado?: number;
            diferencia?: number;
        } | null;

        if (!resultado?.exito) {
            return {
                exito: false,
                mensaje:
                    resultado?.mensaje ??
                    "No fue posible cerrar la caja.",
            };
        }

        revalidatePath("/caja");
        revalidatePath("/caja/ventas");

        return {
            exito: true,
            mensaje:
                resultado.mensaje ??
                "Caja cerrada correctamente.",
            montoEsperado: Number(
                resultado.montoEsperado ?? 0,
            ),
            montoContado: Number(
                resultado.montoContado ?? 0,
            ),
            diferencia: Number(
                resultado.diferencia ?? 0,
            ),
        };
    } catch (error) {
        console.error(
            "Error cerrando caja:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al cerrar la caja.",
        };
    }
}