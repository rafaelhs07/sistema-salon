"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DatosMovimientoManual = {
    cajaSesionId: string;
    tipo: "INGRESO" | "EGRESO";
    monto: number;
    concepto: string;
    referencia: string;
    observaciones: string;
};

export async function registrarMovimientoManual(
    datos: DatosMovimientoManual,
) {
    try {
        if (!datos.cajaSesionId) {
            return { exito: false, mensaje: "No se recibió la caja." };
        }

        if (!Number.isFinite(datos.monto) || datos.monto <= 0) {
            return { exito: false, mensaje: "El monto debe ser mayor que cero." };
        }

        if (datos.concepto.trim().length < 3) {
            return { exito: false, mensaje: "Escribe un concepto de al menos 3 caracteres." };
        }

        const supabase = await createClient();

        const { data, error } = await supabase.rpc(
            "registrar_movimiento_manual_caja",
            {
                p_caja_sesion_id: datos.cajaSesionId,
                p_tipo: datos.tipo,
                p_monto: Number(datos.monto.toFixed(2)),
                p_concepto: datos.concepto.trim(),
                p_referencia: datos.referencia.trim() || null,
                p_observaciones: datos.observaciones.trim() || null,
            },
        );

        if (error) return { exito: false, mensaje: error.message };

        const resultado = data as { exito?: boolean; mensaje?: string } | null;

        revalidatePath("/caja");
        revalidatePath(`/caja/movimientos/${datos.cajaSesionId}`);
        revalidatePath(`/caja/cierre/${datos.cajaSesionId}`);
        revalidatePath("/caja/reportes");

        return {
            exito: Boolean(resultado?.exito),
            mensaje: resultado?.mensaje ?? "Movimiento registrado.",
        };
    } catch (error) {
        console.error(error);
        return {
            exito: false,
            mensaje: "Ocurrió un error inesperado al registrar el movimiento.",
        };
    }
}