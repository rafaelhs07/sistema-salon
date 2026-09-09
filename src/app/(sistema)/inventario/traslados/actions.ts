"use server";



import { exigirPermisoAccion, exigirCualquieraPermisosAccion } from "@/lib/permisos/acciones";
import { PERMISOS } from "@/lib/permisos/codigos";import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type DatosTraslado = {
    sucursalOrigenId: string;
    sucursalDestinoId: string;
    productoId: string;
    cantidad: number;
    referencia: string;
    observaciones: string;
};

export async function registrarTraslado(
    datos: DatosTraslado,
) {
        await exigirPermisoAccion(PERMISOS.INVENTARIO_TRASLADAR);
    try {
        if (
            !datos.sucursalOrigenId ||
            !datos.sucursalDestinoId
        ) {
            return {
                exito: false,
                mensaje:
                    "Selecciona sucursal de origen y destino.",
            };
        }

        if (
            datos.sucursalOrigenId ===
            datos.sucursalDestinoId
        ) {
            return {
                exito: false,
                mensaje:
                    "La sucursal de origen y destino deben ser diferentes.",
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
                "registrar_traslado_inventario",
                {
                    p_sucursal_origen_id:
                        datos.sucursalOrigenId,
                    p_sucursal_destino_id:
                        datos.sucursalDestinoId,
                    p_producto_id:
                        datos.productoId,
                    p_cantidad:
                        datos.cantidad,
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
            "/inventario/alertas",
        );
        revalidatePath(
            "/inventario/movimientos",
        );
        revalidatePath(
            "/inventario/traslados",
        );

        return {
            exito: true,
            mensaje:
                (
                    data as {
                        mensaje?: string;
                    } | null
                )?.mensaje ??
                "Traslado realizado.",
        };
    } catch (error) {
        console.error(
            "Error registrando traslado:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}