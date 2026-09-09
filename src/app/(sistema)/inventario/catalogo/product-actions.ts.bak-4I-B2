"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type DatosProducto = {
    categoriaId: string | null;
    codigoBarras: string;
    nombre: string;
    descripcion: string;
    marca: string;
    presentacion: string;
    unidadMedida: string;
    costoUnitario: number;
    precioVenta: number;
    permiteVenta: boolean;
    permiteConsumoServicio: boolean;
    controlaStock: boolean;
    stockMinimoGeneral: number;
};

type ResultadoAccion = {
    exito: boolean;
    mensaje: string;
};

async function obtenerContextoAdmin() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        return {
            error: "Tu sesión ha vencido.",
            supabase,
            user: null,
            perfil: null,
        };
    }

    const { data: perfil, error: perfilError } =
        await supabase
            .from("usuarios_perfiles")
            .select("salon_id, rol, estado")
            .eq("id", user.id)
            .single();

    if (
        perfilError ||
        !perfil ||
        perfil.estado !== "ACTIVO"
    ) {
        return {
            error:
                "No fue posible verificar tu perfil.",
            supabase,
            user,
            perfil: null,
        };
    }

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
        ].includes(perfil.rol)
    ) {
        return {
            error:
                "Solo administración puede gestionar productos.",
            supabase,
            user,
            perfil,
        };
    }

    return {
        error: null,
        supabase,
        user,
        perfil,
    };
}

function validarProducto(
    datos: DatosProducto,
): string | null {
    if (datos.nombre.trim().length < 2) {
        return "El nombre debe tener al menos 2 caracteres.";
    }

    if (
        !Number.isFinite(
            datos.costoUnitario,
        ) ||
        datos.costoUnitario < 0
    ) {
        return "El costo unitario no es válido.";
    }

    if (
        !Number.isFinite(
            datos.precioVenta,
        ) ||
        datos.precioVenta < 0
    ) {
        return "El precio de venta no es válido.";
    }

    if (
        !Number.isFinite(
            datos.stockMinimoGeneral,
        ) ||
        datos.stockMinimoGeneral < 0
    ) {
        return "El stock mínimo no es válido.";
    }

    if (
        ![
            "UNIDAD",
            "ML",
            "LITRO",
            "GRAMO",
            "KILOGRAMO",
            "ONZA",
            "CAJA",
            "PAQUETE",
        ].includes(
            datos.unidadMedida,
        )
    ) {
        return "La unidad de medida no es válida.";
    }

    return null;
}

export async function crearProducto(
    datos: DatosProducto,
): Promise<ResultadoAccion> {
    const errorValidacion =
        validarProducto(datos);

    if (errorValidacion) {
        return {
            exito: false,
            mensaje: errorValidacion,
        };
    }

    const contexto =
        await obtenerContextoAdmin();

    if (
        contexto.error ||
        !contexto.user ||
        !contexto.perfil
    ) {
        return {
            exito: false,
            mensaje:
                contexto.error ??
                "No autorizado.",
        };
    }

    const codigoBarras =
        datos.codigoBarras.trim();

    const { data, error } =
        await contexto.supabase
            .from("productos")
            .insert({
                salon_id:
                    contexto.perfil.salon_id,
                categoria_id:
                    datos.categoriaId || null,
                codigo_barras:
                    codigoBarras || null,
                nombre:
                    datos.nombre.trim(),
                descripcion:
                    datos.descripcion.trim() ||
                    null,
                marca:
                    datos.marca.trim() ||
                    null,
                presentacion:
                    datos.presentacion.trim() ||
                    null,
                unidad_medida:
                    datos.unidadMedida,
                costo_unitario:
                    datos.costoUnitario,
                precio_venta:
                    datos.precioVenta,
                permite_venta:
                    datos.permiteVenta,
                permite_consumo_servicio:
                    datos.permiteConsumoServicio,
                controla_stock:
                    datos.controlaStock,
                stock_minimo_general:
                    datos.controlaStock
                        ? datos.stockMinimoGeneral
                        : 0,
                estado: "ACTIVO",
                creado_por:
                    contexto.user.id,
                actualizado_por:
                    contexto.user.id,
            })
            .select("id")
            .single();

    if (error) {
        if (error.code === "23505") {
            return {
                exito: false,
                mensaje:
                    "El código de barras ya está registrado en otro producto.",
            };
        }

        return {
            exito: false,
            mensaje: error.message,
        };
    }

    revalidatePath("/inventario");
    revalidatePath(
        "/inventario/catalogo",
    );

    return {
        exito: true,
        mensaje:
            "Producto creado correctamente.",
    };
}

export async function editarProducto(
    productoId: string,
    datos: DatosProducto,
): Promise<ResultadoAccion> {
    if (!productoId) {
        return {
            exito: false,
            mensaje:
                "No se recibió el producto.",
        };
    }

    const errorValidacion =
        validarProducto(datos);

    if (errorValidacion) {
        return {
            exito: false,
            mensaje: errorValidacion,
        };
    }

    const contexto =
        await obtenerContextoAdmin();

    if (
        contexto.error ||
        !contexto.user ||
        !contexto.perfil
    ) {
        return {
            exito: false,
            mensaje:
                contexto.error ??
                "No autorizado.",
        };
    }

    const codigoBarras =
        datos.codigoBarras.trim();

    const { error } =
        await contexto.supabase
            .from("productos")
            .update({
                categoria_id:
                    datos.categoriaId || null,
                codigo_barras:
                    codigoBarras || null,
                nombre:
                    datos.nombre.trim(),
                descripcion:
                    datos.descripcion.trim() ||
                    null,
                marca:
                    datos.marca.trim() ||
                    null,
                presentacion:
                    datos.presentacion.trim() ||
                    null,
                unidad_medida:
                    datos.unidadMedida,
                costo_unitario:
                    datos.costoUnitario,
                precio_venta:
                    datos.precioVenta,
                permite_venta:
                    datos.permiteVenta,
                permite_consumo_servicio:
                    datos.permiteConsumoServicio,
                controla_stock:
                    datos.controlaStock,
                stock_minimo_general:
                    datos.controlaStock
                        ? datos.stockMinimoGeneral
                        : 0,
                actualizado_por:
                    contexto.user.id,
            })
            .eq("id", productoId)
            .eq(
                "salon_id",
                contexto.perfil.salon_id,
            );

    if (error) {
        if (error.code === "23505") {
            return {
                exito: false,
                mensaje:
                    "El código de barras ya está registrado en otro producto.",
            };
        }

        return {
            exito: false,
            mensaje: error.message,
        };
    }

    // Sincronizar el stock mínimo general a las existencias
    // solo cuando controla stock.
    if (datos.controlaStock) {
        await contexto.supabase
            .from("inventario_existencias")
            .update({
                stock_minimo:
                    datos.stockMinimoGeneral,
            })
            .eq(
                "producto_id",
                productoId,
            )
            .eq(
                "salon_id",
                contexto.perfil.salon_id,
            );
    }

    revalidatePath("/inventario");
    revalidatePath(
        "/inventario/catalogo",
    );
    revalidatePath(
        `/inventario/catalogo/${productoId}/editar`,
    );

    return {
        exito: true,
        mensaje:
            "Producto actualizado correctamente.",
    };
}

export async function cambiarEstadoProducto(
    productoId: string,
    nuevoEstado:
        | "ACTIVO"
        | "INACTIVO",
): Promise<ResultadoAccion> {
    const contexto =
        await obtenerContextoAdmin();

    if (
        contexto.error ||
        !contexto.user ||
        !contexto.perfil
    ) {
        return {
            exito: false,
            mensaje:
                contexto.error ??
                "No autorizado.",
        };
    }

    const { error } =
        await contexto.supabase
            .from("productos")
            .update({
                estado:
                    nuevoEstado,
                actualizado_por:
                    contexto.user.id,
            })
            .eq("id", productoId)
            .eq(
                "salon_id",
                contexto.perfil.salon_id,
            );

    if (error) {
        return {
            exito: false,
            mensaje: error.message,
        };
    }

    revalidatePath("/inventario");
    revalidatePath(
        "/inventario/catalogo",
    );

    return {
        exito: true,
        mensaje:
            nuevoEstado === "ACTIVO"
                ? "Producto activado."
                : "Producto inactivado.",
    };
}