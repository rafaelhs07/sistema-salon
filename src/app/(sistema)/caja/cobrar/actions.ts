"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MetodoPagoVenta =
    | "EFECTIVO"
    | "TARJETA"
    | "TRANSFERENCIA"
    | "DEPOSITO"
    | "OTRO";

export type PagoVentaEntrada = {
    metodoPago: MetodoPagoVenta;
    monto: number;
    montoRecibido?: number | null;
    terminalPosId?: string | null;
    referencia?: string;
    banco?: string;
    observaciones?: string;
};

export type DatosCobroCita = {
    citaId: string;
    cajaSesionId: string;
    descuento: number;
    notas: string;
    pagos: PagoVentaEntrada[];
};

export type ResultadoCobro = {
    exito: boolean;
    mensaje: string;
    ventaId?: string;
    codigoVenta?: string;
    saldoPendiente?: number;
};

export async function cobrarCita(
    datos: DatosCobroCita,
): Promise<ResultadoCobro> {
    try {
        if (!datos.citaId) {
            return { exito: false, mensaje: "Selecciona una cita." };
        }

        if (!datos.cajaSesionId) {
            return { exito: false, mensaje: "Selecciona una caja abierta." };
        }

        if (!Number.isFinite(datos.descuento) || datos.descuento < 0) {
            return {
                exito: false,
                mensaje: "El descuento no puede ser negativo.",
            };
        }

        for (const pago of datos.pagos) {
            if (!Number.isFinite(pago.monto) || pago.monto <= 0) {
                return {
                    exito: false,
                    mensaje: "Cada pago debe tener un monto mayor que cero.",
                };
            }

            if (
                pago.metodoPago === "EFECTIVO" &&
                pago.montoRecibido != null &&
                pago.montoRecibido < pago.monto
            ) {
                return {
                    exito: false,
                    mensaje:
                        "El efectivo recibido no puede ser menor al monto aplicado.",
                };
            }

            if (
                pago.metodoPago === "TARJETA" &&
                !pago.terminalPosId
            ) {
                return {
                    exito: false,
                    mensaje:
                        "Selecciona la terminal POS utilizada en cada pago con tarjeta.",
                };
            }
        }

        const supabase = await createClient();
        const {
            data: { user },
            error: usuarioError,
        } = await supabase.auth.getUser();

        if (usuarioError || !user) {
            return { exito: false, mensaje: "Tu sesión ha vencido." };
        }

        const { data, error } = await supabase.rpc(
            "registrar_venta_cita",
            {
                p_cita_id: datos.citaId,
                p_caja_sesion_id: datos.cajaSesionId,
                p_descuento: Number(datos.descuento.toFixed(2)),
                p_notas: datos.notas.trim() || null,
                p_pagos: datos.pagos.map((pago) => ({
                    metodoPago: pago.metodoPago,
                    monto: Number(pago.monto.toFixed(2)),
                    montoRecibido:
                        pago.montoRecibido == null
                            ? null
                            : Number(pago.montoRecibido.toFixed(2)),
                    terminalPosId: pago.terminalPosId || null,
                    referencia: pago.referencia?.trim() || null,
                    banco: pago.banco?.trim() || null,
                    observaciones: pago.observaciones?.trim() || null,
                })),
            },
        );

        if (error) {
            return {
                exito: false,
                mensaje:
                    error.message ||
                    "No fue posible registrar la venta.",
            };
        }

        const resultado = data as {
            exito?: boolean;
            ventaId?: string;
            codigoVenta?: string;
            saldoPendiente?: number;
        } | null;

        if (!resultado?.exito) {
            return {
                exito: false,
                mensaje: "No fue posible completar el cobro.",
            };
        }

        revalidatePath("/caja");
        revalidatePath("/caja/cobrar");
        revalidatePath(`/agenda/${datos.citaId}`);

        return {
            exito: true,
            mensaje:
                Number(resultado.saldoPendiente ?? 0) > 0
                    ? "Venta registrada con saldo pendiente."
                    : "Venta cobrada correctamente.",
            ventaId: resultado.ventaId,
            codigoVenta: resultado.codigoVenta,
            saldoPendiente: Number(resultado.saldoPendiente ?? 0),
        };
    } catch (error) {
        console.error("Error cobrando cita:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar el cobro.",
        };
    }
}