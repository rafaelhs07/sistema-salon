"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

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
                "Solo administración puede gestionar categorías.",
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

export async function crearCategoria(
    datos: {
        nombre: string;
        descripcion: string;
    },
): Promise<ResultadoAccion> {
    try {
        const nombre =
            datos.nombre.trim();

        if (nombre.length < 2) {
            return {
                exito: false,
                mensaje:
                    "El nombre debe tener al menos 2 caracteres.",
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

        const { error } =
            await contexto.supabase
                .from(
                    "categorias_productos",
                )
                .insert({
                    salon_id:
                        contexto.perfil.salon_id,
                    nombre,
                    descripcion:
                        datos.descripcion.trim() ||
                        null,
                    estado: "ACTIVA",
                    creado_por:
                        contexto.user.id,
                    actualizado_por:
                        contexto.user.id,
                });

        if (error) {
            if (
                error.code === "23505"
            ) {
                return {
                    exito: false,
                    mensaje:
                        "Ya existe una categoría con ese nombre.",
                };
            }

            return {
                exito: false,
                mensaje: error.message,
            };
        }

        revalidatePath(
            "/inventario/catalogo",
        );
        revalidatePath("/inventario");

        return {
            exito: true,
            mensaje:
                "Categoría creada correctamente.",
        };
    } catch (error) {
        console.error(
            "Error creando categoría:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}

export async function editarCategoria(
    categoriaId: string,
    datos: {
        nombre: string;
        descripcion: string;
    },
): Promise<ResultadoAccion> {
    try {
        const nombre =
            datos.nombre.trim();

        if (!categoriaId) {
            return {
                exito: false,
                mensaje:
                    "No se recibió la categoría.",
            };
        }

        if (nombre.length < 2) {
            return {
                exito: false,
                mensaje:
                    "El nombre debe tener al menos 2 caracteres.",
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

        const { error } =
            await contexto.supabase
                .from(
                    "categorias_productos",
                )
                .update({
                    nombre,
                    descripcion:
                        datos.descripcion.trim() ||
                        null,
                    actualizado_por:
                        contexto.user.id,
                })
                .eq(
                    "id",
                    categoriaId,
                )
                .eq(
                    "salon_id",
                    contexto.perfil.salon_id,
                );

        if (error) {
            if (
                error.code === "23505"
            ) {
                return {
                    exito: false,
                    mensaje:
                        "Ya existe una categoría con ese nombre.",
                };
            }

            return {
                exito: false,
                mensaje: error.message,
            };
        }

        revalidatePath(
            "/inventario/catalogo",
        );
        revalidatePath("/inventario");

        return {
            exito: true,
            mensaje:
                "Categoría actualizada.",
        };
    } catch (error) {
        console.error(
            "Error editando categoría:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}

export async function cambiarEstadoCategoria(
    categoriaId: string,
    nuevoEstado:
        | "ACTIVA"
        | "INACTIVA",
): Promise<ResultadoAccion> {
    try {
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
                .from(
                    "categorias_productos",
                )
                .update({
                    estado:
                        nuevoEstado,
                    actualizado_por:
                        contexto.user.id,
                })
                .eq(
                    "id",
                    categoriaId,
                )
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

        revalidatePath(
            "/inventario/catalogo",
        );
        revalidatePath("/inventario");

        return {
            exito: true,
            mensaje:
                nuevoEstado ===
                    "ACTIVA"
                    ? "Categoría activada."
                    : "Categoría inactivada.",
        };
    } catch (error) {
        console.error(
            "Error cambiando estado de categoría:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}