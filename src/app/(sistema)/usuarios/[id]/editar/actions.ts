"use server";

import {
    revalidatePath,
} from "next/cache";

import {
    createAdminClient,
} from "@/lib/supabase/admin";

import {
    exigirPermisoAccion,
    ErrorPermisoAccion,
} from "@/lib/permisos/acciones";

import {
    PERMISOS,
} from "@/lib/permisos/codigos";

export type EditarUsuarioInput = {
    usuarioId: string;
    nombre: string;
    correo: string;
    rol: string;
    sucursalId: string;
    estado: "ACTIVO" | "INACTIVO";
    nuevaContrasena?: string;
};

export type EditarUsuarioResultado = {
    exito: boolean;
    mensaje: string;
};

function correoValido(
    correo: string,
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        correo,
    );
}

export async function editarUsuarioSistema(
    datos: EditarUsuarioInput,
): Promise<EditarUsuarioResultado> {
    let contexto;

    try {
        contexto =
            await exigirPermisoAccion(
                PERMISOS.USUARIOS_EDITAR,
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
        user: actor,
        perfil: perfilActor,
    } =
        contexto;

    const nombre =
        datos.nombre
            .trim();

    const correo =
        datos.correo
            .trim()
            .toLowerCase();

    const rol =
        datos.rol
            .trim()
            .toUpperCase();

    const sucursalId =
        datos.sucursalId
            .trim();

    const estado =
        datos.estado;

    const nuevaContrasena =
        datos.nuevaContrasena
            ?.trim() ??
        "";

    if (
        nombre.length <
        2
    ) {
        return {
            exito: false,
            mensaje:
                "El nombre debe tener al menos 2 caracteres.",
        };
    }

    if (
        !correoValido(
            correo,
        )
    ) {
        return {
            exito: false,
            mensaje:
                "El correo electrónico no es válido.",
        };
    }

    if (
        !sucursalId
    ) {
        return {
            exito: false,
            mensaje:
                "Selecciona una sucursal.",
        };
    }

    if (
        nuevaContrasena &&
        nuevaContrasena.length <
        8
    ) {
        return {
            exito: false,
            mensaje:
                "La nueva contraseña debe tener al menos 8 caracteres.",
        };
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
            datos.usuarioId,
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
        return {
            exito: false,
            mensaje:
                "El usuario no existe o pertenece a otro salón.",
        };
    }

    if (perfilObjetivo.rol === "SUPER_ADMIN" && perfilActor.rol !== "SUPER_ADMIN") {
        return { exito: false, mensaje: "No puedes modificar una cuenta SUPER_ADMIN." };
    }
    const { data: borrado } = await supabase.from("usuarios_perfiles")
        .select("eliminado_en").eq("id", datos.usuarioId).single();
    if (!borrado || borrado.eliminado_en) {
        return { exito: false, mensaje: "Esta cuenta fue eliminada y no puede editarse." };
    }

    if (
        datos.usuarioId ===
        actor.id
    ) {
        if (
            rol !==
            perfilObjetivo.rol
        ) {
            return {
                exito: false,
                mensaje:
                    "No puedes cambiar tu propio rol.",
            };
        }

        if (
            estado !==
            "ACTIVO"
        ) {
            return {
                exito: false,
                mensaje:
                    "No puedes desactivar tu propia cuenta.",
            };
        }
    }

    const [
        rolActorResultado,
        rolObjetivoResultado,
        sucursalResultado,
    ] =
        await Promise.all([
            supabase
                .from(
                    "roles_sistema",
                )
                .select(
                    "codigo, nivel, estado",
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
                    "codigo, nivel, estado",
                )
                .eq(
                    "codigo",
                    rol,
                )
                .single(),

            supabase
                .from(
                    "sucursales",
                )
                .select(
                    "id, salon_id",
                )
                .eq(
                    "id",
                    sucursalId,
                )
                .eq(
                    "salon_id",
                    perfilActor.salon_id,
                )
                .maybeSingle(),
        ]);

    const rolActor =
        rolActorResultado.data;

    const rolObjetivo =
        rolObjetivoResultado.data;

    if (
        !rolActor ||
        rolActor.estado !==
        "ACTIVO"
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible validar tu rol.",
        };
    }

    if (
        !rolObjetivo ||
        rolObjetivo.estado !==
        "ACTIVO"
    ) {
        return {
            exito: false,
            mensaje:
                "El rol seleccionado no es válido.",
        };
    }

    if (
        rolObjetivo.nivel <
        rolActor.nivel
    ) {
        return {
            exito: false,
            mensaje:
                "No puedes asignar un rol con mayor autoridad que el tuyo.",
        };
    }

    if (
        perfilActor.rol ===
        "ADMIN" &&
        rol ===
        "SUPER_ADMIN"
    ) {
        return {
            exito: false,
            mensaje:
                "Un administrador no puede asignar SUPER_ADMIN.",
        };
    }

    if (
        !sucursalResultado.data
    ) {
        return {
            exito: false,
            mensaje:
                "La sucursal seleccionada no pertenece a tu salón.",
        };
    }

    const admin =
        createAdminClient();

    const {
        data: authAnteriorResultado,
        error: authAnteriorError,
    } =
        await admin.auth.admin.getUserById(
            datos.usuarioId,
        );

    if (
        authAnteriorError ||
        !authAnteriorResultado.user
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible leer la cuenta de autenticación.",
        };
    }

    const authAnterior =
        authAnteriorResultado.user;

    const metadataAnterior =
        (
            authAnterior.user_metadata ??
            {}
        ) as Record<
            string,
            unknown
        >;

    const perfilAnterior =
    {
        sucursal_id:
            perfilObjetivo.sucursal_id,
        rol:
            perfilObjetivo.rol,
        estado:
            perfilObjetivo.estado,
    };

    const {
        error: perfilUpdateError,
    } =
        await admin
            .from(
                "usuarios_perfiles",
            )
            .update({
                sucursal_id:
                    sucursalId,
                rol,
                estado,
            })
            .eq(
                "id",
                datos.usuarioId,
            )
            .eq(
                "salon_id",
                perfilActor.salon_id,
            );

    if (
        perfilUpdateError
    ) {
        console.error(
            "Error actualizando perfil:",
            perfilUpdateError,
        );

        return {
            exito: false,
            mensaje:
                "No fue posible actualizar el perfil del usuario.",
        };
    }

    const authCambios: {
        email: string;
        user_metadata: Record<
            string,
            unknown
        >;
        password?: string;
    } = {
        email:
            correo,
        user_metadata: {
            ...metadataAnterior,
            nombre,
            salon_id:
                perfilActor.salon_id,
            sucursal_id:
                sucursalId,
            rol,
        },
    };

    if (
        nuevaContrasena
    ) {
        authCambios.password =
            nuevaContrasena;
    }

    const {
        error: authUpdateError,
    } =
        await admin.auth.admin.updateUserById(
            datos.usuarioId,
            authCambios,
        );

    if (
        authUpdateError
    ) {
        console.error(
            "Error actualizando Auth:",
            authUpdateError,
        );

        const {
            error: rollbackPerfilError,
        } =
            await admin
                .from(
                    "usuarios_perfiles",
                )
                .update(
                    perfilAnterior,
                )
                .eq(
                    "id",
                    datos.usuarioId,
                );

        if (
            rollbackPerfilError
        ) {
            console.error(
                "Error revirtiendo perfil:",
                rollbackPerfilError,
            );
        }

        return {
            exito: false,
            mensaje:
                authUpdateError.message
                    .toLowerCase()
                    .includes(
                        "already",
                    )
                    ? "Ya existe otra cuenta con ese correo."
                    : "No fue posible actualizar la cuenta de acceso.",
        };
    }

    revalidatePath(
        "/usuarios",
    );
    revalidatePath(
        `/usuarios/${datos.usuarioId}/editar`,
    );
    revalidatePath(
        `/usuarios/${datos.usuarioId}/permisos`,
    );

    return {
        exito: true,
        mensaje:
            "Usuario actualizado correctamente.",
    };
}
