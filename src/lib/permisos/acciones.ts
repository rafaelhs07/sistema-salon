import "server-only";

import {
    createClient,
} from "@/lib/supabase/server";

import type {
    CodigoPermiso,
} from "./codigos";

export class ErrorPermisoAccion extends Error {
    readonly codigo =
        "PERMISO_DENEGADO";

    constructor(
        public readonly permiso: string,
        mensaje?: string,
    ) {
        super(
            mensaje ??
            `No tienes permiso para realizar esta acción (${permiso}).`,
        );

        this.name =
            "ErrorPermisoAccion";
    }
}

export type ContextoAccionSegura = {
    supabase: Awaited<
        ReturnType<
            typeof createClient
        >
    >;
    user: {
        id: string;
        email?: string;
    };
    perfil: {
        salon_id: string;
        rol: string;
        estado: string;
    };
};

/**
 * Guardia central para Server Actions.
 *
 * Valida:
 * 1. sesión;
 * 2. perfil existente;
 * 3. estado ACTIVO;
 * 4. permiso efectivo real.
 *
 * Si cualquiera falla, lanza una excepción y NO debe continuar
 * ninguna mutación.
 */
export async function exigirPermisoAccion(
    permiso: CodigoPermiso | string,
): Promise<ContextoAccionSegura> {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
        error: userError,
    } =
        await supabase.auth.getUser();

    if (
        userError ||
        !user
    ) {
        throw new ErrorPermisoAccion(
            permiso,
            "La sesión no es válida.",
        );
    }

    const {
        data: perfil,
        error: perfilError,
    } =
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
            .maybeSingle();

    if (
        perfilError ||
        !perfil ||
        perfil.estado !==
        "ACTIVO"
    ) {
        throw new ErrorPermisoAccion(
            permiso,
            "Tu cuenta no está activa.",
        );
    }

    const {
        data: permitido,
        error: permisoError,
    } =
        await supabase.rpc(
            "usuario_actual_tiene_permiso",
            {
                p_permiso:
                    permiso,
            },
        );

    if (
        permisoError ||
        permitido !==
        true
    ) {
        throw new ErrorPermisoAccion(
            permiso,
        );
    }

    return {
        supabase,
        user: {
            id:
                user.id,
            email:
                user.email,
        },
        perfil: {
            salon_id:
                perfil.salon_id,
            rol:
                perfil.rol,
            estado:
                perfil.estado,
        },
    };
}

/**
 * Igual que exigirPermisoAccion, pero devuelve false
 * en vez de lanzar error.
 */
export async function puedeEjecutarAccion(
    permiso: CodigoPermiso | string,
) {
    try {
        await exigirPermisoAccion(
            permiso,
        );

        return true;
    } catch {
        return false;
    }
}
