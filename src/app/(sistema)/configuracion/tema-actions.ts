"use server";

import { revalidatePath } from "next/cache";

import { exigirPermisoAccion } from "@/lib/permisos/acciones";
import { PERMISOS } from "@/lib/permisos/codigos";
import { createClient } from "@/lib/supabase/server";

export type TemaColorSistema =
    | "SALVIA"
    | "AZUL"
    | "LILA"
    | "ROSA"
    | "TERRACOTA"
    | "GRAFITO"
    | "ESMERALDA"
    | "OLIVA"
    | "ARENA"
    | "VINO"
    | "LAVANDA"
    | "CELESTE";

const TEMAS_VALIDOS =
    new Set<TemaColorSistema>([
        "SALVIA",
        "AZUL",
        "LILA",
        "ROSA",
        "TERRACOTA",
        "GRAFITO",
        "ESMERALDA",
        "OLIVA",
        "ARENA",
        "VINO",
        "LAVANDA",
        "CELESTE"
    ]);

export async function guardarTemaSistema(
    tema: TemaColorSistema,
) {
    await exigirPermisoAccion(
        PERMISOS.CONFIGURACION_EDITAR,
    );

    if (!TEMAS_VALIDOS.has(tema)) {
        return {
            exito: false,
            mensaje:
                "El tema seleccionado no es válido.",
        };
    }

    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } =
        await supabase.auth.getUser();

    if (
        usuarioError ||
        !user
    ) {
        return {
            exito: false,
            mensaje:
                "Tu sesión ha vencido.",
        };
    }

    const {
        data: perfil,
        error: perfilError,
    } =
        await supabase
            .from("usuarios_perfiles")
            .select("salon_id, estado")
            .eq("id", user.id)
            .single();

    if (
        perfilError ||
        !perfil ||
        perfil.estado !== "ACTIVO"
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible verificar tu perfil.",
        };
    }

    const { error } =
        await supabase
            .from("configuracion_salon")
            .update({
                tema_color: tema,
                actualizado_en:
                    new Date().toISOString(),
            })
            .eq(
                "salon_id",
                perfil.salon_id,
            );

    if (error) {
        console.error(
            "Error guardando tema:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "No fue posible guardar la apariencia.",
        };
    }

    revalidatePath("/", "layout");
    revalidatePath("/configuracion");

    return {
        exito: true,
        mensaje:
            "Apariencia actualizada correctamente.",
    };
}
