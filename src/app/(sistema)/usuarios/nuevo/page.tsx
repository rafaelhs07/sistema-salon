import {
    redirect,
} from "next/navigation";

import {
    createClient,
} from "@/lib/supabase/server";

import NuevoUsuarioClient, {
    type RolDisponible,
    type SucursalDisponible,
} from "./NuevoUsuarioClient";

export default async function NuevoUsuarioPage() {
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
        redirect(
            "/login",
        );
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
        "ACTIVO"
    ) {
        redirect(
            "/login",
        );
    }

    const {
        data: puedeCrear,
    } =
        await supabase.rpc(
            "usuario_actual_tiene_permiso",
            {
                p_permiso:
                    "USUARIOS_CREAR",
            },
        );

    if (
        puedeCrear !==
        true
    ) {
        redirect(
            "/inicio",
        );
    }

    const {
        data: rolActor,
    } = await supabase
        .from(
            "roles_sistema",
        )
        .select(
            "nivel",
        )
        .eq(
            "codigo",
            perfil.rol,
        )
        .single();

    const [
        rolesResultado,
        sucursalesResultado,
    ] =
        await Promise.all([
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
                .gte(
                    "nivel",
                    rolActor?.nivel ??
                    999,
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
                    perfil.salon_id,
                )
                .order(
                    "nombre",
                    {
                        ascending:
                            true,
                    },
                ),
        ]);

    let roles =
        (
            rolesResultado.data ??
            []
        ) as RolDisponible[];

    // ADMIN no puede crear SUPER_ADMIN.
    if (
        perfil.rol ===
        "ADMIN"
    ) {
        roles =
            roles.filter(
                (
                    rol,
                ) =>
                    rol.codigo !==
                    "SUPER_ADMIN",
            );
    }

    return (
        <div className="mx-auto max-w-5xl">
            <NuevoUsuarioClient
                roles={
                    roles
                }
                sucursales={
                    (
                        sucursalesResultado.data ??
                        []
                    ) as SucursalDisponible[]
                }
            />
        </div>
    );
}
