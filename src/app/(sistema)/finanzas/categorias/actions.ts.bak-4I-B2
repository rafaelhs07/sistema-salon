"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TipoCategoriaFinanciera =
    | "INGRESO"
    | "GASTO";

export async function crearCategoriaFinanciera(datos: {
    nombre: string;
    tipo: TipoCategoriaFinanciera;
    descripcion: string;
}) {
    try {
        const nombre = datos.nombre.trim();

        if (nombre.length < 2) {
            return {
                exito: false,
                mensaje:
                    "El nombre debe tener al menos 2 caracteres.",
            };
        }

        const supabase =
            await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                exito: false,
                mensaje:
                    "Tu sesión ha vencido.",
            };
        }

        const { data: perfil } =
            await supabase
                .from(
                    "usuarios_perfiles",
                )
                .select(
                    "salon_id, rol, estado",
                )
                .eq(
                    "id",
                    user.id,
                )
                .single();

        if (
            !perfil ||
            perfil.estado !==
            "ACTIVO" ||
            ![
                "SUPER_ADMIN",
                "ADMIN",
            ].includes(
                perfil.rol,
            )
        ) {
            return {
                exito: false,
                mensaje:
                    "No tienes permisos para administrar categorías.",
            };
        }

        const {
            error,
        } = await supabase
            .from(
                "categorias_financieras",
            )
            .insert({
                salon_id:
                    perfil.salon_id,
                nombre,
                tipo: datos.tipo,
                descripcion:
                    datos.descripcion.trim() ||
                    null,
                sistema: false,
                estado: "ACTIVA",
                creado_por:
                    user.id,
            });

        if (error) {
            console.error(
                "Error creando categoría financiera:",
                error,
            );

            if (
                error.code ===
                "23505"
            ) {
                return {
                    exito: false,
                    mensaje:
                        "Ya existe una categoría con ese nombre y tipo.",
                };
            }

            return {
                exito: false,
                mensaje:
                    error.message,
            };
        }

        revalidatePath(
            "/finanzas",
        );

        revalidatePath(
            "/finanzas/categorias",
        );

        revalidatePath(
            "/finanzas/ingresos/nuevo",
        );

        revalidatePath(
            "/finanzas/gastos/nuevo",
        );

        return {
            exito: true,
            mensaje:
                "Categoría creada correctamente.",
        };
    } catch (error) {
        console.error(
            "Error inesperado creando categoría:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}

export async function cambiarEstadoCategoriaFinanciera(
    categoriaId: string,
    estado: "ACTIVA" | "INACTIVA",
) {
    try {
        const supabase =
            await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                exito: false,
                mensaje:
                    "Tu sesión ha vencido.",
            };
        }

        const {
            data: perfil,
        } = await supabase
            .from(
                "usuarios_perfiles",
            )
            .select(
                "salon_id, rol, estado",
            )
            .eq(
                "id",
                user.id,
            )
            .single();

        if (
            !perfil ||
            perfil.estado !==
            "ACTIVO" ||
            ![
                "SUPER_ADMIN",
                "ADMIN",
            ].includes(
                perfil.rol,
            )
        ) {
            return {
                exito: false,
                mensaje:
                    "No tienes permisos para administrar categorías.",
            };
        }

        const {
            data: categoria,
        } = await supabase
            .from(
                "categorias_financieras",
            )
            .select(
                "id, sistema",
            )
            .eq(
                "id",
                categoriaId,
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .single();

        if (!categoria) {
            return {
                exito: false,
                mensaje:
                    "La categoría no existe.",
            };
        }

        if (
            categoria.sistema
        ) {
            return {
                exito: false,
                mensaje:
                    "Las categorías internas del sistema no se pueden desactivar.",
            };
        }

        const {
            error,
        } = await supabase
            .from(
                "categorias_financieras",
            )
            .update({
                estado,
            })
            .eq(
                "id",
                categoriaId,
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            );

        if (error) {
            return {
                exito: false,
                mensaje:
                    error.message,
            };
        }

        revalidatePath(
            "/finanzas/categorias",
        );

        revalidatePath(
            "/finanzas/ingresos/nuevo",
        );

        revalidatePath(
            "/finanzas/gastos/nuevo",
        );

        return {
            exito: true,
            mensaje:
                estado ===
                    "ACTIVA"
                    ? "Categoría activada."
                    : "Categoría desactivada.",
        };
    } catch (error) {
        console.error(
            "Error cambiando categoría:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}