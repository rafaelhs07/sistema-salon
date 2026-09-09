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

import EditarUsuarioClient, {
    type RolDisponibleEditar,
    type SucursalDisponibleEditar,
    type UsuarioEditarInicial,
} from "./EditarUsuarioClient";

export default async function EditarUsuarioPage({
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
        data: puedeEditar,
    } =
        await supabase.rpc(
            "usuario_actual_tiene_permiso",
            {
                p_permiso:
                    "USUARIOS_EDITAR",
            },
        );

    if (
        puedeEditar !==
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
        rolActorResultado,
        rolesResultado,
        sucursalesResultado,
    ] =
        await Promise.all([
            supabase
                .from(
                    "roles_sistema",
                )
                .select(
                    "codigo, nivel",
                )
                .eq(
                    "codigo",
                    perfilActor.rol,
                )
                .single(),

            supabase
                .from(
                    "roles_sistema",
                )
                .select(
                    "codigo, nombre, descripcion, nivel",
                )
                .eq(
                    "estado",
                    "ACTIVO",
                )
                .order(
                    "nivel",
                    {
                        ascending:
                            true,
                    },
                ),

            supabase
                .from(
                    "sucursales",
                )
                .select(
                    "id, nombre",
                )
                .eq(
                    "salon_id",
                    perfilActor.salon_id,
                )
                .order(
                    "nombre",
                    {
                        ascending:
                            true,
                    },
                ),
        ]);

    const nivelActor =
        rolActorResultado.data?.nivel ??
        999;

    let roles =
        (
            rolesResultado.data ??
            []
        ).filter(
            (
                item,
            ) =>
                item.nivel >=
                nivelActor,
        ) as RolDisponibleEditar[];

    if (
        perfilActor.rol ===
        "ADMIN"
    ) {
        roles =
            roles.filter(
                (
                    item,
                ) =>
                    item.codigo !==
                    "SUPER_ADMIN",
            );
    }

    const metadata =
        (
            authObjetivo.user
                .user_metadata ??
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

    const usuarioInicial: UsuarioEditarInicial =
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
        rol:
            perfilObjetivo.rol,
        sucursalId:
            perfilObjetivo.sucursal_id,
        estado:
            perfilObjetivo.estado,
        creadoEn:
            authObjetivo.user.created_at ??
            null,
        ultimoAcceso:
            authObjetivo.user.last_sign_in_at ??
            null,
        esUsuarioActual:
            perfilObjetivo.id ===
            actor.id,
    };

    return (
        <EditarUsuarioClient
            usuario={
                usuarioInicial
            }
            roles={
                roles
            }
            sucursales={
                (
                    sucursalesResultado.data ??
                    []
                ) as SucursalDisponibleEditar[]
            }
        />
    );
}
