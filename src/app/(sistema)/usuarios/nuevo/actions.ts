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

export type CrearUsuarioInput = {
    nombre: string;
    correo: string;
    contrasena: string;
    rol: string;
    sucursalId: string;
};

export type CrearUsuarioResultado = {
    exito: boolean;
    mensaje: string;
};

function normalizarCorreo(
    valor: string,
) {
    return valor
        .trim()
        .toLowerCase();
}

function correoValido(
    correo: string,
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        correo,
    );
}

export async function crearUsuarioSistema(
    datos: CrearUsuarioInput,
): Promise<CrearUsuarioResultado> {
    let contexto;

    try {
        contexto =
            await exigirPermisoAccion(
                PERMISOS.USUARIOS_CREAR,
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


    // ========================================================
    // 3. VALIDACIONES
    // ========================================================

    const nombre =
        datos.nombre
            .trim();

    const correo =
        normalizarCorreo(
            datos.correo,
        );

    const contrasena =
        datos.contrasena;

    const rol =
        datos.rol
            .trim()
            .toUpperCase();

    const sucursalId =
        datos.sucursalId
            .trim();

    if (
        nombre.length <
        2
    ) {
        return {
            exito: false,
            mensaje:
                "Escribe el nombre del usuario.",
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
        contrasena.length <
        8
    ) {
        return {
            exito: false,
            mensaje:
                "La contraseña inicial debe tener al menos 8 caracteres.",
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


    // ========================================================
    // 4. VALIDAR ROL SOLICITADO
    // ========================================================

    const {
        data: rolActor,
        error: rolActorError,
    } = await supabase
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
        .single();

    const {
        data: rolObjetivo,
        error: rolObjetivoError,
    } = await supabase
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
        .single();

    if (
        rolActorError ||
        !rolActor ||
        rolActor.estado !==
        "ACTIVO"
    ) {
        return {
            exito: false,
            mensaje:
                "No fue posible validar tu nivel de acceso.",
        };
    }

    if (
        rolObjetivoError ||
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

    // Un usuario no puede crear a otro con mayor autoridad.
    if (
        rolObjetivo.nivel <
        rolActor.nivel
    ) {
        return {
            exito: false,
            mensaje:
                "No puedes crear un usuario con un nivel superior al tuyo.",
        };
    }

    // ADMIN nunca crea SUPER_ADMIN.
    if (
        perfilActor.rol ===
        "ADMIN" &&
        rol ===
        "SUPER_ADMIN"
    ) {
        return {
            exito: false,
            mensaje:
                "Un administrador no puede crear cuentas SUPER_ADMIN.",
        };
    }


    // ========================================================
    // 5. VALIDAR SUCURSAL DEL MISMO SALON
    // ========================================================

    const {
        data: sucursal,
        error: sucursalError,
    } = await supabase
        .from(
            "sucursales",
        )
        .select(
            "id, salon_id, nombre",
        )
        .eq(
            "id",
            sucursalId,
        )
        .eq(
            "salon_id",
            perfilActor.salon_id,
        )
        .maybeSingle();

    if (
        sucursalError ||
        !sucursal
    ) {
        return {
            exito: false,
            mensaje:
                "La sucursal seleccionada no pertenece a tu salón.",
        };
    }


    // ========================================================
    // 6. CREAR AUTH USER CON SERVICE ROLE
    // ========================================================

    let admin;

    try {
        admin =
            createAdminClient();
    } catch (
    error
    ) {
        console.error(
            "No se pudo crear el cliente administrativo:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Falta configurar la clave administrativa de Supabase en el servidor.",
        };
    }

    const {
        data: authCreado,
        error: crearAuthError,
    } =
        await admin.auth.admin.createUser({
            email:
                correo,
            password:
                contrasena,
            email_confirm:
                true,
            user_metadata: {
                nombre,
                salon_id:
                    perfilActor.salon_id,
                sucursal_id:
                    sucursalId,
                rol,
            },
        });

    if (
        crearAuthError ||
        !authCreado.user
    ) {
        console.error(
            "Error creando Auth user:",
            crearAuthError,
        );

        const mensaje =
            crearAuthError?.message
                ?.toLowerCase()
                .includes(
                    "already",
                )
                ? "Ya existe un usuario con ese correo."
                : "No fue posible crear el usuario.";

        return {
            exito: false,
            mensaje,
        };
    }


    // ========================================================
    // 7. CONFIGURAR PERFIL
    // ========================================================

    const usuarioCreadoId =
        authCreado.user.id;

    const {
        error: perfilError,
    } =
        await admin.rpc(
            "configurar_perfil_usuario_creado",
            {
                p_usuario_id:
                    usuarioCreadoId,
                p_salon_id:
                    perfilActor.salon_id,
                p_sucursal_id:
                    sucursalId,
                p_nombre_completo:
                    nombre,
                p_correo:
                    correo,
                p_rol:
                    rol,
                p_estado:
                    "ACTIVO",
            },
        );

    if (
        perfilError
    ) {
        console.error(
            "Error configurando perfil del usuario:",
            perfilError,
        );

        // Rollback compensatorio:
        // no dejamos un Auth user sin perfil correcto.
        const {
            error: rollbackError,
        } =
            await admin.auth.admin.deleteUser(
                usuarioCreadoId,
            );

        if (
            rollbackError
        ) {
            console.error(
                "Error eliminando Auth user después del fallo del perfil:",
                rollbackError,
            );
        }

        return {
            exito: false,
            mensaje:
                "No fue posible completar el perfil del usuario. La cuenta no fue conservada.",
        };
    }


    // ========================================================
    // 8. VERIFICAR PERFIL FINAL
    // ========================================================

    const {
        data: perfilFinal,
        error: verificarError,
    } = await admin
        .from(
            "usuarios_perfiles",
        )
        .select(
            "id, salon_id, rol, estado",
        )
        .eq(
            "id",
            usuarioCreadoId,
        )
        .maybeSingle();

    if (
        verificarError ||
        !perfilFinal ||
        perfilFinal.salon_id !==
        perfilActor.salon_id ||
        perfilFinal.rol !==
        rol ||
        perfilFinal.estado !==
        "ACTIVO"
    ) {
        console.error(
            "Perfil final inconsistente:",
            verificarError,
            perfilFinal,
        );

        await admin.auth.admin.deleteUser(
            usuarioCreadoId,
        );

        return {
            exito: false,
            mensaje:
                "La cuenta no pudo verificarse correctamente y fue revertida.",
        };
    }


    revalidatePath(
        "/usuarios",
    );
    revalidatePath(
        "/usuarios/nuevo",
    );

    return {
        exito: true,
        mensaje:
            `Usuario ${nombre} creado correctamente.`,
    };
}
