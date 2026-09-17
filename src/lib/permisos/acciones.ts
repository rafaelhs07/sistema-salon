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

async function obtenerContextoActivo(): Promise<ContextoAccionSegura> {
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
            "SESION",
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
            "USUARIO_ACTIVO",
            "Tu cuenta no está activa.",
        );
    }

    const { data: accesoActivo, error: accesoError } = await supabase.rpc("plataforma_acceso_actual");
    if (accesoError || accesoActivo !== true) {
        throw new ErrorPermisoAccion("SUSCRIPCION_ACTIVA", "El acceso al negocio está suspendido o vencido.");
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
 * Exige un permiso efectivo concreto antes de continuar
 * una Server Action.
 */
export async function exigirPermisoAccion(
    permiso: CodigoPermiso | string,
): Promise<ContextoAccionSegura> {
    const contexto =
        await obtenerContextoActivo();

    const {
        data: permitido,
        error: permisoError,
    } =
        await contexto.supabase.rpc(
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

    return contexto;
}

/**
 * Permite ejecutar una acción cuando el usuario tiene
 * AL MENOS UNO de los permisos indicados.
 *
 * Útil para acciones compartidas, por ejemplo movimientos
 * manuales de Caja que pueden ser ingreso o egreso.
 */
export async function exigirCualquieraPermisosAccion(
    permisos: Array<
        CodigoPermiso | string
    >,
): Promise<ContextoAccionSegura> {
    const unicos =
        [
            ...new Set(
                permisos.filter(
                    Boolean,
                ),
            ),
        ];

    if (
        unicos.length ===
        0
    ) {
        throw new ErrorPermisoAccion(
            "SIN_PERMISOS_CONFIGURADOS",
            "La acción no tiene permisos configurados.",
        );
    }

    const contexto =
        await obtenerContextoActivo();

    for (
        const permiso
        of unicos
    ) {
        const {
            data: permitido,
            error,
        } =
            await contexto.supabase.rpc(
                "usuario_actual_tiene_permiso",
                {
                    p_permiso:
                        permiso,
                },
            );

        if (
            !error &&
            permitido ===
            true
        ) {
            return contexto;
        }
    }

    throw new ErrorPermisoAccion(
        unicos.join(
            " | ",
        ),
        "No tienes permiso para realizar esta acción.",
    );
}

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
