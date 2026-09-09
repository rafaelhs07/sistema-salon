"use server";

import {
    revalidatePath,
} from "next/cache";

import {
    exigirPermisoAccion,
    ErrorPermisoAccion,
} from "@/lib/permisos/acciones";

import {
    PERMISOS,
} from "@/lib/permisos/codigos";

export type EstadoPermiso =
    | "HEREDAR"
    | "PERMITIR"
    | "DENEGAR";

export type GuardarPermisoInput = {
    usuarioId: string;
    codigoPermiso: string;
    estado: EstadoPermiso;
};

export type GuardarPermisoResultado = {
    exito: boolean;
    mensaje: string;
};

export async function guardarPermisoUsuario(
    datos: GuardarPermisoInput,
): Promise<GuardarPermisoResultado> {
    let contexto;

    try {
        contexto =
            await exigirPermisoAccion(
                PERMISOS.USUARIOS_PERMISOS,
            );
    } catch (
    error
    ) {
        return {
            exito: false,
            mensaje:
                error instanceof
                    ErrorPermisoAccion
                    ? error.message
                    : "No fue posible validar tu acceso.",
        };
    }

    const {
        supabase,
    } =
        contexto;

    let valor:
        | boolean
        | null =
        null;

    if (
        datos.estado ===
        "PERMITIR"
    ) {
        valor =
            true;
    } else if (
        datos.estado ===
        "DENEGAR"
    ) {
        valor =
            false;
    }

    const {
        data,
        error,
    } =
        await supabase.rpc(
            "establecer_permiso_usuario",
            {
                p_usuario_id:
                    datos.usuarioId,
                p_codigo_permiso:
                    datos.codigoPermiso,
                p_permitido:
                    valor,
            },
        );

    if (
        error ||
        data !==
        true
    ) {
        console.error(
            "Error guardando permiso:",
            error,
        );

        return {
            exito: false,
            mensaje:
                error?.message ||
                "No fue posible actualizar el permiso.",
        };
    }

    revalidatePath(
        `/usuarios/${datos.usuarioId}/permisos`,
    );
    revalidatePath(
        "/usuarios",
    );

    return {
        exito: true,
        mensaje:
            "Permiso actualizado correctamente.",
    };
}

export async function restablecerPermisosUsuario(
    usuarioId: string,
): Promise<GuardarPermisoResultado> {
    let contexto;

    try {
        contexto =
            await exigirPermisoAccion(
                PERMISOS.USUARIOS_PERMISOS,
            );
    } catch (
    error
    ) {
        return {
            exito: false,
            mensaje:
                error instanceof
                    ErrorPermisoAccion
                    ? error.message
                    : "No fue posible validar tu acceso.",
        };
    }

    const {
        supabase,
    } =
        contexto;

    const {
        data: permisos,
        error: permisosError,
    } =
        await supabase.rpc(
            "obtener_permisos_usuario",
            {
                p_usuario_id:
                    usuarioId,
            },
        );

    if (
        permisosError
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible obtener los permisos del usuario.",
        };
    }

    const personalizados =
        (
            permisos ??
            []
        ).filter(
            (
                item: {
                    codigo: string;
                    origen: string;
                },
            ) =>
                item.origen ===
                "USUARIO",
        );

    for (
        const permiso
        of personalizados
    ) {
        const {
            error,
        } =
            await supabase.rpc(
                "establecer_permiso_usuario",
                {
                    p_usuario_id:
                        usuarioId,
                    p_codigo_permiso:
                        permiso.codigo,
                    p_permitido:
                        null,
                },
            );

        if (
            error
        ) {
            return {
                exito: false,
                mensaje:
                    `No fue posible restablecer ${permiso.codigo}.`,
            };
        }
    }

    revalidatePath(
        `/usuarios/${usuarioId}/permisos`,
    );

    return {
        exito: true,
        mensaje:
            "Todos los permisos volvieron a heredarse del rol.",
    };
}
