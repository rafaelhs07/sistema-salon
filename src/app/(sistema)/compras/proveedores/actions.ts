"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type EstadoProveedor =
    | "ACTIVO"
    | "INACTIVO";

export type DatosProveedor = {
    id?: string;

    nombre: string;
    ruc: string;
    categoria: string;

    contacto: string;

    telefono: string;
    whatsapp: string;
    correo: string;

    direccion: string;
    condicionesPago: string;

    observaciones: string;

    estado: EstadoProveedor;
};

export type ResultadoProveedor = {
    exito: boolean;
    mensaje: string;
};

async function obtenerContexto() {
    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        return {
            supabase,
            user: null,
            perfil: null,
            error:
                "Tu sesión ha vencido.",
        };
    }

    const {
        data: perfil,
        error: perfilError,
    } = await supabase
        .from("usuarios_perfiles")
        .select(
            "salon_id, rol, estado",
        )
        .eq("id", user.id)
        .single();

    if (
        perfilError ||
        !perfil ||
        perfil.estado !== "ACTIVO"
    ) {
        return {
            supabase,
            user,
            perfil: null,
            error:
                "No fue posible verificar tu perfil.",
        };
    }

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
            "INVENTARIO",
        ].includes(perfil.rol)
    ) {
        return {
            supabase,
            user,
            perfil: null,
            error:
                "No tienes permisos para administrar proveedores.",
        };
    }

    return {
        supabase,
        user,
        perfil,
        error: null,
    };
}

function validarProveedor(
    datos: DatosProveedor,
): ResultadoProveedor | null {
    const nombre =
        datos.nombre.trim();

    if (nombre.length < 2) {
        return {
            exito: false,
            mensaje:
                "El nombre del proveedor debe tener al menos 2 caracteres.",
        };
    }

    if (
        datos.correo.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            datos.correo.trim(),
        )
    ) {
        return {
            exito: false,
            mensaje:
                "El correo electrónico no tiene un formato válido.",
        };
    }

    return null;
}

export async function crearProveedor(
    datos: DatosProveedor,
): Promise<ResultadoProveedor> {
    try {
        const validacion =
            validarProveedor(datos);

        if (validacion) {
            return validacion;
        }

        const contexto =
            await obtenerContexto();

        if (
            contexto.error ||
            !contexto.perfil ||
            !contexto.user
        ) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar los permisos.",
            };
        }

        const {
            supabase,
            perfil,
            user,
        } = contexto;

        const nombre =
            datos.nombre.trim();

        const {
            data: existente,
            error: existenteError,
        } = await supabase
            .from("proveedores")
            .select("id, nombre, estado")
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .ilike("nombre", nombre)
            .maybeSingle();

        if (existenteError) {
            console.error(
                "Error buscando proveedor:",
                existenteError,
            );
        }

        if (existente) {
            return {
                exito: false,
                mensaje:
                    existente.estado ===
                        "ACTIVO"
                        ? "Ya existe un proveedor con ese nombre."
                        : "Ya existe un proveedor inactivo con ese nombre. Puedes reactivarlo desde la lista.",
            };
        }

        const {
            error,
        } = await supabase
            .from("proveedores")
            .insert({
                salon_id:
                    perfil.salon_id,

                nombre,

                ruc:
                    datos.ruc.trim() ||
                    null,

                categoria:
                    datos.categoria.trim() ||
                    null,

                contacto:
                    datos.contacto.trim() ||
                    null,

                telefono:
                    datos.telefono.trim() ||
                    null,

                whatsapp:
                    datos.whatsapp.trim() ||
                    null,

                correo:
                    datos.correo.trim() ||
                    null,

                direccion:
                    datos.direccion.trim() ||
                    null,

                condiciones_pago:
                    datos.condicionesPago.trim() ||
                    null,

                observaciones:
                    datos.observaciones.trim() ||
                    null,

                estado:
                    datos.estado,

                creado_por:
                    user.id,

                actualizado_por:
                    user.id,
            });

        if (error) {
            console.error(
                "Error creando proveedor:",
                error,
            );

            return {
                exito: false,
                mensaje:
                    `No fue posible registrar el proveedor: ${error.message}`,
            };
        }

        revalidatePath(
            "/compras/proveedores",
        );

        return {
            exito: true,
            mensaje:
                "Proveedor registrado correctamente.",
        };
    } catch (error) {
        console.error(
            "Error inesperado creando proveedor:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar el proveedor.",
        };
    }
}

export async function actualizarProveedor(
    datos: DatosProveedor,
): Promise<ResultadoProveedor> {
    try {
        if (!datos.id) {
            return {
                exito: false,
                mensaje:
                    "No se recibió el proveedor a actualizar.",
            };
        }

        const validacion =
            validarProveedor(datos);

        if (validacion) {
            return validacion;
        }

        const contexto =
            await obtenerContexto();

        if (
            contexto.error ||
            !contexto.perfil ||
            !contexto.user
        ) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar los permisos.",
            };
        }

        const {
            supabase,
            perfil,
            user,
        } = contexto;

        const {
            data: proveedor,
            error: proveedorError,
        } = await supabase
            .from("proveedores")
            .select("id")
            .eq("id", datos.id)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle();

        if (
            proveedorError ||
            !proveedor
        ) {
            return {
                exito: false,
                mensaje:
                    "El proveedor no existe o no pertenece a tu salón.",
            };
        }

        const {
            data: duplicado,
        } = await supabase
            .from("proveedores")
            .select("id")
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .neq("id", datos.id)
            .ilike(
                "nombre",
                datos.nombre.trim(),
            )
            .maybeSingle();

        if (duplicado) {
            return {
                exito: false,
                mensaje:
                    "Ya existe otro proveedor con ese nombre.",
            };
        }

        const {
            error,
        } = await supabase
            .from("proveedores")
            .update({
                nombre:
                    datos.nombre.trim(),

                ruc:
                    datos.ruc.trim() ||
                    null,

                categoria:
                    datos.categoria.trim() ||
                    null,

                contacto:
                    datos.contacto.trim() ||
                    null,

                telefono:
                    datos.telefono.trim() ||
                    null,

                whatsapp:
                    datos.whatsapp.trim() ||
                    null,

                correo:
                    datos.correo.trim() ||
                    null,

                direccion:
                    datos.direccion.trim() ||
                    null,

                condiciones_pago:
                    datos.condicionesPago.trim() ||
                    null,

                observaciones:
                    datos.observaciones.trim() ||
                    null,

                estado:
                    datos.estado,

                actualizado_por:
                    user.id,
            })
            .eq("id", datos.id)
            .eq(
                "salon_id",
                perfil.salon_id,
            );

        if (error) {
            console.error(
                "Error actualizando proveedor:",
                error,
            );

            return {
                exito: false,
                mensaje:
                    `No fue posible actualizar el proveedor: ${error.message}`,
            };
        }

        revalidatePath(
            "/compras/proveedores",
        );

        return {
            exito: true,
            mensaje:
                "Proveedor actualizado correctamente.",
        };
    } catch (error) {
        console.error(
            "Error inesperado actualizando proveedor:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al actualizar el proveedor.",
        };
    }
}

export async function cambiarEstadoProveedor(
    proveedorId: string,
    estado: EstadoProveedor,
): Promise<ResultadoProveedor> {
    try {
        const contexto =
            await obtenerContexto();

        if (
            contexto.error ||
            !contexto.perfil ||
            !contexto.user
        ) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar los permisos.",
            };
        }

        const {
            supabase,
            perfil,
            user,
        } = contexto;

        const {
            error,
        } = await supabase
            .from("proveedores")
            .update({
                estado,
                actualizado_por:
                    user.id,
            })
            .eq("id", proveedorId)
            .eq(
                "salon_id",
                perfil.salon_id,
            );

        if (error) {
            return {
                exito: false,
                mensaje:
                    `No fue posible cambiar el estado: ${error.message}`,
            };
        }

        revalidatePath(
            "/compras/proveedores",
        );

        return {
            exito: true,
            mensaje:
                estado === "ACTIVO"
                    ? "Proveedor activado correctamente."
                    : "Proveedor desactivado correctamente.",
        };
    } catch (error) {
        console.error(
            "Error cambiando estado de proveedor:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}