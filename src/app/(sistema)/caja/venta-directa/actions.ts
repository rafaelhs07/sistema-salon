"use server";



import { exigirPermisoAccion, exigirCualquieraPermisosAccion } from "@/lib/permisos/acciones";
import { PERMISOS } from "@/lib/permisos/codigos";import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ItemVentaDirecta = {
    servicioId: string;
    trabajadorId: string;
    precio: number;
    descuento: number;
};

export type PagoVentaDirecta = {
    metodoPago:
    | "EFECTIVO"
    | "TARJETA"
    | "TRANSFERENCIA"
    | "DEPOSITO"
    | "OTRO";
    monto: number;
    montoRecibido?: number | null;
    terminalPosId?: string | null;
    referencia?: string;
    banco?: string;
    observaciones?: string;
};

export type DatosVentaDirecta = {
    cajaSesionId: string;
    clienteId: string | null;
    descuento: number;
    notas: string;
    items: ItemVentaDirecta[];
    pagos: PagoVentaDirecta[];
};

export type ResultadoVentaDirecta = {
    exito: boolean;
    mensaje: string;
    ventaId?: string;
    codigoVenta?: string;
};

export async function registrarVentaDirecta(
    datos: DatosVentaDirecta,
): Promise<ResultadoVentaDirecta> {
        await exigirPermisoAccion(PERMISOS.CAJA_VENTA_DIRECTA);
    try {
        if (!datos.cajaSesionId) {
            return {
                exito: false,
                mensaje: "Selecciona una caja abierta.",
            };
        }

        if (datos.items.length === 0) {
            return {
                exito: false,
                mensaje: "Agrega al menos un servicio.",
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

        const { data, error } = await supabase.rpc(
            "registrar_venta_directa",
            {
                p_caja_sesion_id: datos.cajaSesionId,
                p_cliente_id: datos.clienteId || null,
                p_descuento: Number(datos.descuento.toFixed(2)),
                p_notas: datos.notas.trim() || null,
                p_items: datos.items.map((item) => ({
                    servicioId: item.servicioId,
                    trabajadorId: item.trabajadorId || null,
                    precio: Number(item.precio.toFixed(2)),
                    descuento: Number(item.descuento.toFixed(2)),
                })),
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
            return { exito: false, mensaje: error.message };
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
                mensaje: "No fue posible registrar la venta.",
            };
        }

        revalidatePath("/caja");
        revalidatePath("/caja/venta-directa");

        return {
            exito: true,
            mensaje:
                Number(resultado.saldoPendiente ?? 0) > 0
                    ? "Venta registrada con saldo pendiente."
                    : "Venta registrada correctamente.",
            ventaId: resultado.ventaId,
            codigoVenta: resultado.codigoVenta,
        };
    } catch (error) {
        console.error("Error registrando venta directa:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar la venta.",
        };
    }
}