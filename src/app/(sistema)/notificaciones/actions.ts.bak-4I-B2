"use server";

import {
    revalidatePath,
} from "next/cache";

import {
    createClient,
} from "@/lib/supabase/server";

async function contextoUsuario() {
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
            supabase,
            user: null,
            salonId: null,
        };
    }

    const {
        data: perfil,
    } = await supabase
        .from(
            "usuarios_perfiles",
        )
        .select(
            "salon_id, estado",
        )
        .eq(
            "id",
            user.id,
        )
        .maybeSingle();

    if (
        !perfil ||
        perfil.estado !==
        "ACTIVO"
    ) {
        return {
            supabase,
            user: null,
            salonId: null,
        };
    }

    return {
        supabase,
        user,
        salonId:
            perfil.salon_id as string,
    };
}

function refrescar() {
    revalidatePath(
        "/notificaciones",
    );
}

export async function marcarNotificacionLeida(
    id: string,
) {
    const {
        supabase,
        user,
        salonId,
    } =
        await contextoUsuario();

    if (
        !user ||
        !salonId
    ) {
        return {
            exito: false,
            mensaje:
                "La sesión no es válida.",
        };
    }

    const {
        error,
    } = await supabase
        .from(
            "notificaciones_sistema",
        )
        .update({
            leida: true,
            leida_en:
                new Date().toISOString(),
        })
        .eq(
            "id",
            id,
        )
        .eq(
            "salon_id",
            salonId,
        )
        .eq(
            "archivada",
            false,
        );

    if (
        error
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible marcar la notificación.",
        };
    }

    refrescar();

    return {
        exito: true,
        mensaje:
            "Notificación marcada como leída.",
    };
}

export async function marcarNotificacionNoLeida(
    id: string,
) {
    const {
        supabase,
        user,
        salonId,
    } =
        await contextoUsuario();

    if (
        !user ||
        !salonId
    ) {
        return {
            exito: false,
            mensaje:
                "La sesión no es válida.",
        };
    }

    const {
        error,
    } = await supabase
        .from(
            "notificaciones_sistema",
        )
        .update({
            leida: false,
            leida_en: null,
        })
        .eq(
            "id",
            id,
        )
        .eq(
            "salon_id",
            salonId,
        )
        .eq(
            "archivada",
            false,
        );

    if (
        error
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible marcar la notificación como pendiente.",
        };
    }

    refrescar();

    return {
        exito: true,
        mensaje:
            "Notificación marcada como pendiente.",
    };
}

export async function marcarTodasLeidas() {
    const {
        supabase,
        user,
        salonId,
    } =
        await contextoUsuario();

    if (
        !user ||
        !salonId
    ) {
        return {
            exito: false,
            mensaje:
                "La sesión no es válida.",
        };
    }

    const {
        error,
    } = await supabase
        .from(
            "notificaciones_sistema",
        )
        .update({
            leida: true,
            leida_en:
                new Date().toISOString(),
        })
        .eq(
            "salon_id",
            salonId,
        )
        .eq(
            "archivada",
            false,
        )
        .eq(
            "leida",
            false,
        )
        .or(
            `usuario_id.eq.${user.id},usuario_id.is.null`,
        );

    if (
        error
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible marcar todas como leídas.",
        };
    }

    refrescar();

    return {
        exito: true,
        mensaje:
            "Todas las notificaciones fueron marcadas como leídas.",
    };
}

export async function archivarNotificacion(
    id: string,
) {
    const {
        supabase,
        user,
        salonId,
    } =
        await contextoUsuario();

    if (
        !user ||
        !salonId
    ) {
        return {
            exito: false,
            mensaje:
                "La sesión no es válida.",
        };
    }

    const ahora =
        new Date().toISOString();

    const {
        error,
    } = await supabase
        .from(
            "notificaciones_sistema",
        )
        .update({
            archivada: true,
            archivada_en:
                ahora,
            archivada_por:
                user.id,
            leida: true,
            leida_en:
                ahora,
        })
        .eq(
            "id",
            id,
        )
        .eq(
            "salon_id",
            salonId,
        )
        .eq(
            "archivada",
            false,
        );

    if (
        error
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible archivar la notificación.",
        };
    }

    refrescar();

    return {
        exito: true,
        mensaje:
            "Notificación archivada.",
    };
}

export async function restaurarNotificacion(
    id: string,
) {
    const {
        supabase,
        user,
        salonId,
    } =
        await contextoUsuario();

    if (
        !user ||
        !salonId
    ) {
        return {
            exito: false,
            mensaje:
                "La sesión no es válida.",
        };
    }

    const {
        error,
    } = await supabase
        .from(
            "notificaciones_sistema",
        )
        .update({
            archivada: false,
            archivada_en: null,
            archivada_por: null,
        })
        .eq(
            "id",
            id,
        )
        .eq(
            "salon_id",
            salonId,
        )
        .eq(
            "archivada",
            true,
        );

    if (
        error
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible restaurar la notificación.",
        };
    }

    refrescar();

    return {
        exito: true,
        mensaje:
            "Notificación restaurada a la bandeja.",
    };
}

export async function archivarTodasLeidas() {
    const {
        supabase,
        user,
        salonId,
    } =
        await contextoUsuario();

    if (
        !user ||
        !salonId
    ) {
        return {
            exito: false,
            mensaje:
                "La sesión no es válida.",
        };
    }

    const ahora =
        new Date().toISOString();

    const {
        error,
    } = await supabase
        .from(
            "notificaciones_sistema",
        )
        .update({
            archivada: true,
            archivada_en:
                ahora,
            archivada_por:
                user.id,
        })
        .eq(
            "salon_id",
            salonId,
        )
        .eq(
            "archivada",
            false,
        )
        .eq(
            "leida",
            true,
        )
        .or(
            `usuario_id.eq.${user.id},usuario_id.is.null`,
        );

    if (
        error
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible archivar las notificaciones leídas.",
        };
    }

    refrescar();

    return {
        exito: true,
        mensaje:
            "Las notificaciones leídas fueron archivadas.",
    };
}

/*
 * Se conserva temporalmente por compatibilidad con cualquier
 * componente antiguo que todavía lo importe. La interfaz 21I
 * ya no lo utiliza.
 */
export async function eliminarNotificacion(
    id: string,
) {
    return archivarNotificacion(
        id,
    );
}
