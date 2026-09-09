import {
    redirect,
} from "next/navigation";

import {
    createClient,
} from "@/lib/supabase/server";

import {
    createAdminClient,
} from "@/lib/supabase/admin";

import UsuariosClient, {
    type UsuarioListado,
    type RolFiltro,
    type SucursalFiltro,
} from "./UsuariosClient";

export default async function UsuariosPage() {
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
        data: puedeVer,
    } =
        await supabase.rpc(
            "usuario_actual_tiene_permiso",
            {
                p_permiso:
                    "USUARIOS_VER",
            },
        );

    if (
        puedeVer !==
        true
    ) {
        redirect(
            "/inicio",
        );
    }

    const admin =
        createAdminClient();

    const [
        perfilesResultado,
        sucursalesResultado,
        rolesResultado,
        authResultado,
    ] =
        await Promise.all([
            supabase
                .from(
                    "usuarios_perfiles",
                )
                .select(
                    "id, salon_id, sucursal_id, rol, estado",
                )
                .eq(
                    "salon_id",
                    perfil.salon_id,
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

            supabase
                .from(
                    "roles_sistema",
                )
                .select(
                    "codigo, nombre, nivel",
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

            admin.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
            }),
        ]);

    const perfiles =
        perfilesResultado.data ??
        [];

    const authUsers =
        authResultado.data?.users ??
        [];

    const authPorId =
        new Map(
            authUsers.map(
                (
                    authUser,
                ) => [
                        authUser.id,
                        authUser,
                    ],
            ),
        );

    const sucursales =
        (
            sucursalesResultado.data ??
            []
        ) as SucursalFiltro[];

    const sucursalPorId =
        new Map(
            sucursales.map(
                (
                    sucursal,
                ) => [
                        sucursal.id,
                        sucursal.nombre,
                    ],
            ),
        );

    const usuarios: UsuarioListado[] =
        perfiles.map(
            (
                item,
            ) => {
                const authUser =
                    authPorId.get(
                        item.id,
                    );

                const metadata =
                    (
                        authUser?.user_metadata ??
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

                const nombre =
                    nombreMetadata.trim() ||
                    nombreAlternativo.trim() ||
                    authUser?.email?.split(
                        "@",
                    )[0] ||
                    "Usuario";

                return {
                    id:
                        item.id,
                    nombre,
                    correo:
                        authUser?.email ??
                        "",
                    rol:
                        item.rol,
                    estado:
                        item.estado,
                    sucursalId:
                        item.sucursal_id,
                    sucursalNombre:
                        item.sucursal_id
                            ? sucursalPorId.get(
                                item.sucursal_id,
                            ) ??
                            "Sucursal no disponible"
                            : "Sin sucursal",
                    creadoEn:
                        authUser?.created_at ??
                        null,
                    ultimoAcceso:
                        authUser?.last_sign_in_at ??
                        null,
                    esUsuarioActual:
                        item.id ===
                        user.id,
                };
            },
        );

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

    const {
        data: puedePermisos,
    } =
        await supabase.rpc(
            "usuario_actual_tiene_permiso",
            {
                p_permiso:
                    "USUARIOS_PERMISOS",
            },
        );

    return (
        <UsuariosClient
            usuariosIniciales={
                usuarios
            }
            roles={
                (
                    rolesResultado.data ??
                    []
                ) as RolFiltro[]
            }
            sucursales={
                sucursales
            }
            puedeCrear={
                puedeCrear ===
                true
            }
            puedeEditar={
                puedeEditar ===
                true
            }
            puedePermisos={
                puedePermisos ===
                true
            }
        />
    );
}
