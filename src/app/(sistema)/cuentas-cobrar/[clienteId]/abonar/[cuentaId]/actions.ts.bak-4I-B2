"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PagoAbonoInput = {
    metodoPago:
    | "EFECTIVO"
    | "TARJETA"
    | "TRANSFERENCIA"
    | "DEPOSITO"
    | "OTRO";
    monto: number;
    montoRecibido?: number | null;
    terminalPosId?: string | null;
    referencia?: string | null;
    banco?: string | null;
    observaciones?: string | null;
};

export async function registrarAbono(datos: {
    cuentaId: string;
    clienteId: string;
    cajaSesionId: string;
    pagos: PagoAbonoInput[];
    referencia: string;
    observaciones: string;
}) {
    try {
        if (!datos.cuentaId) {
            return {
                exito: false,
                mensaje:
                    "No se recibió la cuenta por cobrar.",
            };
        }

        if (!datos.cajaSesionId) {
            return {
                exito: false,
                mensaje:
                    "Selecciona una caja abierta.",
            };
        }

        if (datos.pagos.length === 0) {
            return {
                exito: false,
                mensaje:
                    "Agrega al menos un método de pago.",
            };
        }

        const total = datos.pagos.reduce(
            (acumulado, pago) =>
                acumulado +
                Number(pago.monto || 0),
            0,
        );

        if (total <= 0) {
            return {
                exito: false,
                mensaje:
                    "El monto del abono debe ser mayor que cero.",
            };
        }

        const supabase = await createClient();

        const { data, error } = await supabase.rpc(
            "registrar_abono_cuenta",
            {
                p_cuenta_id: datos.cuentaId,
                p_caja_sesion_id:
                    datos.cajaSesionId,
                p_pagos: datos.pagos,
                p_referencia:
                    datos.referencia.trim() ||
                    null,
                p_observaciones:
                    datos.observaciones.trim() ||
                    null,
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
            abonoId?: string;
        } | null;

        if (!resultado?.exito) {
            return {
                exito: false,
                mensaje:
                    resultado?.mensaje ??
                    "No fue posible registrar el abono.",
            };
        }

        revalidatePath(
            `/cuentas-cobrar/${datos.clienteId}`,
        );
        revalidatePath("/cuentas-cobrar");
        revalidatePath("/caja");
        revalidatePath("/caja/ventas");
        revalidatePath("/caja/reportes");

        return {
            exito: true,
            mensaje:
                resultado.mensaje ??
                "Abono registrado correctamente.",
            abonoId: resultado.abonoId,
        };
    } catch (error) {
        console.error(
            "Error registrando abono:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar el abono.",
        };
    }
}