"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type DatosAjusteInventario = {
    sucursalId: string;
    productoId: string;
    tipo:
    | "ENTRADA_INICIAL"
    | "AJUSTE_ENTRADA"
    | "AJUSTE_SALIDA"
    | "MERMA";
    cantidad: number;
    costoUnitario: number | null;
    referencia: string;
    observaciones: string;
};

export async function registrarAjusteInventario(
    datos: DatosAjusteInventario,
) {
    try {
        if (!datos.sucursalId) {
            return {
                exito: false,
                mensaje:
                    "Selecciona una sucursal.",
            };
        }

        if (!datos.productoId) {
            return {
                exito: false,
                mensaje:
                    "Selecciona un producto.",
            };
        }

        if (
            !Number.isFinite(
                datos.cantidad,
            ) ||
            datos.cantidad <= 0
        ) {
            return {
                exito: false,
                mensaje:
                    "La cantidad debe ser mayor que cero.",
            };
        }

        const supabase = await createClient();

        const { data, error } =
            await supabase.rpc(
                "registrar_ajuste_inventario",
                {
                    p_sucursal_id:
                        datos.sucursalId,
                    p_producto_id:
                        datos.productoId,
                    p_tipo: datos.tipo,
                    p_cantidad:
                        datos.cantidad,
                    p_costo_unitario:
                        datos.costoUnitario,
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

        revalidatePath("/inventario");
        revalidatePath(
            "/inventario/movimientos/nuevo",
        );
        revalidatePath(
            "/inventario/catalogo",
        );

        return {
            exito: true,
            mensaje:
                (
                    data as {
                        mensaje?: string;
                    } | null
                )?.mensaje ??
                "Movimiento registrado.",
        };
    } catch (error) {
        console.error(
            "Error registrando ajuste de inventario:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}