import {
    notFound,
    redirect,
} from "next/navigation";

import {
    createAdminClient,
} from "@/lib/supabase/admin";

import {
    createClient,
} from "@/lib/supabase/server";

import PermisosUsuarioClient, {
    type PermisoUsuarioVista,
    type UsuarioPermisosInfo,
} from "./PermisosUsuarioClient";

export default async function PermisosUsuarioPage({
    params,
}: {
    params: Promise<{
        id: string;
    }>;
}) {
    const {
        id,
    } =
        await params;

    const supabase =
        await createClient();

    const {
        data: {
            user: actor,
        },
        error: actorError,
    } =
        await supabase.auth.getUser();

    if (
        actorError ||
        !actor
    ) {
        redirect(
            "/login",
        );
    }

    const {
        data: perfilActor,
        error: perfilActorError,
    } = await supabase
        .from(
            "usuarios_perfiles",
        )
        .select(
            "salon_id, rol, estado",
        )
        .eq(
            "id",
            actor.id,
        )
        .single();

    if (
        perfilActorError ||
        !perfilActor ||
        perfilActor.estado !==
        "ACTIVO"
    ) {
        redirect(
            "/login",
        );
    }

    const {
        data: puedeGestionar,
    } =
        await supabase.rpc(
            "usuario_actual_tiene_permiso",
            {
                p_permiso:
                    "USUARIOS_PERMISOS",
            },
        );

    if (
        puedeGestionar !==
        true
    ) {
        redirect(
            "/inicio",
        );
    }

    const {
        data: perfilObjetivo,
        error: perfilObjetivoError,
    } = await supabase
        .from(
            "usuarios_perfiles",
        )
        .select(
            "id, salon_id, sucursal_id, rol, estado",
        )
        .eq(
            "id",
            id,
        )
        .eq(
            "salon_id",
            perfilActor.salon_id,
        )
        .maybeSingle();

    if (
        perfilObjetivoError ||
        !perfilObjetivo
    ) {
        notFound();
    }

    const admin =
        createAdminClient();

    const {
        data: authObjetivo,
        error: authObjetivoError,
    } =
        await admin.auth.admin.getUserById(
            id,
        );

    if (
        authObjetivoError ||
        !authObjetivo.user
    ) {
        notFound();
    }

    const [
        permisosResultado,
        rolResultado,
        sucursalResultado,
    ] =
        await Promise.all([
            supabase.rpc(
                "obtener_permisos_usuario",
                {
                    p_usuario_id:
                        id,
                },
            ),

            supabase
                .from(
                    "roles_sistema",
                )
                .select(
                    "codigo, nombre, descripcion",
                )
                .eq(
                    "codigo",
                    perfilObjetivo.rol,
                )
                .single(),

            perfilObjetivo.sucursal_id
                ? supabase
                    .from(
                        "sucursales",
                    )
                    .select(
                        "id, nombre",
                    )
                    .eq(
                        "id",
                        perfilObjetivo.sucursal_id,
                    )
                    .maybeSingle()
                : Promise.resolve({
                    data: null,
                    error: null,
                }),
        ]);

    if (
        permisosResultado.error
    ) {
        throw new Error(
            `No fue posible cargar los permisos: ${permisosResultado.error.message}`,
        );
    }

    const metadata =
        (
            authObjetivo.user.user_metadata ??
            {}
        ) as Record<
            string,
            unknown
        >;

    const nombreMetadata =
        typeof metadata.nombre ===
            "string"
            ? metadata.nombre
            : "";

    const nombreAlternativo =
        typeof metadata.full_name ===
            "string"
            ? metadata.full_name
            : "";

    const usuario: UsuarioPermisosInfo =
    {
        id:
            perfilObjetivo.id,
        nombre:
            nombreMetadata.trim() ||
            nombreAlternativo.trim() ||
            authObjetivo.user.email?.split(
                "@",
            )[0] ||
            "Usuario",
        correo:
            authObjetivo.user.email ??
            "",
        rolCodigo:
            perfilObjetivo.rol,
        rolNombre:
            rolResultado.data?.nombre ??
            perfilObjetivo.rol,
        rolDescripcion:
            rolResultado.data?.descripcion ??
            null,
        sucursalNombre:
            sucursalResultado.data?.nombre ??
            "Sin sucursal",
        estado:
            perfilObjetivo.estado,
        esUsuarioActual:
            perfilObjetivo.id ===
            actor.id,
    };

    return (
        <PermisosUsuarioClient
            usuario={
                usuario
            }
            permisosIniciales={
                (
                    permisosResultado.data ??
                    []
                ) as PermisoUsuarioVista[]
            }
        />
    );
}
