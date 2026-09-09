"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type MetodoIngresoManual =
    | "EFECTIVO"
    | "TARJETA"
    | "TRANSFERENCIA"
    | "DEPOSITO"
    | "CHEQUE"
    | "OTRO";

export type DatosIngresoManual = {
    sucursalId: string;
    categoriaId: string;
    metodoPago: MetodoIngresoManual;
    concepto: string;
    monto: number;
    referencia: string;
    descripcion: string;
};

export type ResultadoIngresoManual = {
    exito: boolean;
    mensaje: string;
};

export async function registrarIngresoManual(
    datos: DatosIngresoManual,
): Promise<ResultadoIngresoManual> {
    try {
        if (!datos.sucursalId) {
            return {
                exito: false,
                mensaje:
                    "Selecciona una sucursal.",
            };
        }

        if (!datos.categoriaId) {
            return {
                exito: false,
                mensaje:
                    "Selecciona una categoría.",
            };
        }

        if (
            !Number.isFinite(
                datos.monto,
            ) ||
            datos.monto <= 0
        ) {
            return {
                exito: false,
                mensaje:
                    "El monto debe ser mayor que cero.",
            };
        }

        if (
            datos.concepto.trim().length <
            3
        ) {
            return {
                exito: false,
                mensaje:
                    "Escribe un concepto de al menos 3 caracteres.",
            };
        }

        const supabase =
            await createClient();

        const {
            data,
            error,
        } = await supabase.rpc(
            "registrar_ingreso_manual_financiero",
            {
                p_sucursal_id:
                    datos.sucursalId,

                p_categoria_id:
                    datos.categoriaId,

                p_metodo_pago:
                    datos.metodoPago,

                p_concepto:
                    datos.concepto.trim(),

                p_monto:
                    Number(
                        datos.monto.toFixed(
                            2,
                        ),
                    ),

                p_referencia:
                    datos.referencia.trim() ||
                    null,

                p_descripcion:
                    datos.descripcion.trim() ||
                    null,
            },
        );

        if (error) {
            console.error(
                "Error registrando ingreso manual:",
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
                    "No fue posible registrar el ingreso.",
            };
        }

        revalidatePath(
            "/finanzas",
        );

        revalidatePath(
            "/finanzas/ingresos/nuevo",
        );

        revalidatePath(
            "/caja",
        );

        revalidatePath(
            "/caja/reportes",
        );

        return {
            exito: true,

            mensaje:
                resultado.mensaje ??
                "Ingreso registrado correctamente.",
        };
    } catch (error) {
        console.error(
            "Error inesperado registrando ingreso:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar el ingreso.",
        };
    }
}