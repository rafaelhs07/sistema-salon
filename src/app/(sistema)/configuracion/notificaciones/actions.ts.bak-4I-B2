"use server";

import {
    revalidatePath,
} from "next/cache";

import {
    createClient,
} from "@/lib/supabase/server";

export async function guardarConfiguracionNotificaciones(
    datos: {
        citas_proximas: boolean;
        minutos_cita_proxima: number;
        cita_sin_confirmar: boolean;
        cita_finalizada_sin_cobrar: boolean;
        stock_bajo: boolean;
        stock_agotado: boolean;
        caja_abierta_dia_anterior: boolean;
        diferencia_caja: boolean;
        cuenta_cobrar_vencida: boolean;
        cuenta_pagar_vencida: boolean;
    },
) {
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
                "La sesión no es válida.",
        };
    }

    const {
        data: perfil,
        error: perfilError,
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
        perfilError ||
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
                "No tienes permisos para modificar esta configuración.",
        };
    }

    const minutos =
        Number(
            datos.minutos_cita_proxima,
        );

    if (
        !Number.isFinite(
            minutos,
        ) ||
        minutos <
        5 ||
        minutos >
        240
    ) {
        return {
            exito: false,
            mensaje:
                "La anticipación de citas debe estar entre 5 y 240 minutos.",
        };
    }

    const {
        error,
    } = await supabase
        .from(
            "configuracion_notificaciones",
        )
        .upsert(
            {
                salon_id:
                    perfil.salon_id,
                ...datos,
                minutos_cita_proxima:
                    Math.round(
                        minutos,
                    ),
            },
            {
                onConflict:
                    "salon_id",
            },
        );

    if (
        error
    ) {
        console.error(
            "Error guardando configuración de notificaciones:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "No fue posible guardar la configuración.",
        };
    }

    revalidatePath(
        "/configuracion/notificaciones",
    );
    revalidatePath(
        "/notificaciones",
    );

    return {
        exito: true,
        mensaje:
            "Configuración de notificaciones guardada correctamente.",
    };
}
