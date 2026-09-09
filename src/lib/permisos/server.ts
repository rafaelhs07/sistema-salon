import "server-only";

import {
    redirect,
} from "next/navigation";

import {
    createClient,
} from "@/lib/supabase/server";

export async function tienePermisoActual(
    codigoPermiso: string,
) {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();

    if (
        !user
    ) {
        return false;
    }

    const {
        data,
        error,
    } =
        await supabase.rpc(
            "usuario_actual_tiene_permiso",
            {
                p_permiso:
                    codigoPermiso,
            },
        );

    if (
        error
    ) {
        console.error(
            `Error validando permiso ${codigoPermiso}:`,
            error,
        );

        return false;
    }

    return data === true;
}

export async function exigirPermiso(
    codigoPermiso: string,
) {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();

    if (
        !user
    ) {
        redirect(
            "/login",
        );
    }

    const {
        data,
        error,
    } =
        await supabase.rpc(
            "usuario_actual_tiene_permiso",
            {
                p_permiso:
                    codigoPermiso,
            },
        );

    if (
        error ||
        data !== true
    ) {
        redirect(
            `/sin-acceso?permiso=${encodeURIComponent(
                codigoPermiso,
            )}`,
        );
    }

    return user;
}

export async function obtenerPermisosActuales() {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();

    if (
        !user
    ) {
        return new Set<string>();
    }

    const {
        data,
        error,
    } =
        await supabase.rpc(
            "obtener_permisos_usuario_actual",
        );

    if (
        error
    ) {
        console.error(
            "Error cargando permisos actuales:",
            error,
        );

        return new Set<string>();
    }

    return new Set(
        (
            data ??
            []
        )
            .filter(
                (
                    item: {
                        permitido: boolean;
                        codigo: string;
                    },
                ) =>
                    item.permitido ===
                    true,
            )
            .map(
                (
                    item: {
                        codigo: string;
                    },
                ) =>
                    item.codigo,
            ),
    );
}
