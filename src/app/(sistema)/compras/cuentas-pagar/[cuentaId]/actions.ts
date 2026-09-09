"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type MetodoPagoProveedor =
    | "EFECTIVO"
    | "TARJETA"
    | "TRANSFERENCIA"
    | "DEPOSITO"
    | "CHEQUE"
    | "OTRO";

export type DatosAbonoProveedor = {
    cuentaId: string;
    monto: number;
    metodoPago: MetodoPagoProveedor;
    referencia: string;
    observaciones: string;
};

export type ResultadoAbonoProveedor = {
    exito: boolean;
    mensaje: string;
    saldoPendiente?: number;
};

export async function registrarAbonoProveedor(
    datos: DatosAbonoProveedor,
): Promise<ResultadoAbonoProveedor> {
    try {
        if (!datos.cuentaId) {
            return {
                exito: false,
                mensaje:
                    "No se recibió la cuenta por pagar.",
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
                    "Ingresa un monto válido.",
            };
        }

        const supabase =
            await createClient();

        const {
            data,
            error,
        } = await supabase.rpc(
            "registrar_abono_cuenta_pagar",
            {
                p_cuenta_pagar_id:
                    datos.cuentaId,

                p_monto:
                    datos.monto,

                p_metodo_pago:
                    datos.metodoPago,

                p_referencia:
                    datos.referencia.trim() ||
                    null,

                p_observaciones:
                    datos.observaciones.trim() ||
                    null,
            },
        );

        if (error) {
            console.error(
                "Error registrando abono a proveedor:",
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
                saldoPendiente?: number;
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
            "/compras",
        );

        revalidatePath(
            "/compras/cuentas-pagar",
        );

        revalidatePath(
            `/compras/cuentas-pagar/${datos.cuentaId}`,
        );

        return {
            exito: true,

            mensaje:
                resultado.mensaje ??
                "Abono registrado correctamente.",

            saldoPendiente:
                Number(
                    resultado.saldoPendiente ??
                    0,
                ),
        };
    } catch (error) {
        console.error(
            "Error inesperado registrando abono:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar el abono.",
        };
    }
}