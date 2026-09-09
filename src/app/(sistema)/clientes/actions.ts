"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GeneroCliente =
    | "FEMENINO"
    | "MASCULINO"
    | "OTRO"
    | "NO_ESPECIFICADO";

export type EstadoCliente = "ACTIVO" | "INACTIVO";

export type DatosCliente = {
    id?: string;
    sucursalId: string;
    nombreCompleto: string;
    telefono: string;
    whatsapp: string;
    correo: string;
    direccion: string;
    fechaNacimiento: string;
    genero: GeneroCliente;
    contactoEmergenciaNombre: string;
    contactoEmergenciaTelefono: string;
    comoConocioSalon: string;
    permiteNotificaciones: boolean;
    permiteWhatsapp: boolean;
    permiteCorreo: boolean;
    clienteFrecuente: boolean;
    estado: EstadoCliente;
    observaciones: string;
};

export type ResultadoCliente = {
    exito: boolean;
    mensaje: string;
    clienteId?: string;
};

export type ResultadoDuplicado = {
    existe: boolean;
    clientes: {
        id: string;
        codigo_cliente: string | null;
        nombre_completo: string;
        telefono: string | null;
        whatsapp: string | null;
    }[];
};

async function obtenerContextoUsuario() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        return {
            supabase,
            perfil: null,
            user: null,
            error: "Tu sesión ha vencido.",
        };
    }

    const { data: perfil, error: perfilError } = await supabase
        .from("usuarios_perfiles")
        .select("salon_id, sucursal_id, rol, estado")
        .eq("id", user.id)
        .single();

    if (perfilError || !perfil) {
        return {
            supabase,
            perfil: null,
            user,
            error: "No fue posible verificar tu perfil.",
        };
    }

    if (perfil.estado !== "ACTIVO") {
        return {
            supabase,
            perfil: null,
            user,
            error: "Tu usuario se encuentra inactivo.",
        };
    }

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
            "RECEPCION",
            "CAJA",
            "TRABAJADOR",
        ].includes(perfil.rol)
    ) {
        return {
            supabase,
            perfil: null,
            user,
            error: "No tienes permisos para administrar clientes.",
        };
    }

    return {
        supabase,
        perfil,
        user,
        error: null,
    };
}

function validarCliente(
    datos: DatosCliente,
): ResultadoCliente | null {
    if (datos.nombreCompleto.trim().length < 3) {
        return {
            exito: false,
            mensaje:
                "El nombre del cliente debe tener al menos 3 caracteres.",
        };
    }

    if (!datos.sucursalId) {
        return {
            exito: false,
            mensaje: "Selecciona una sucursal.",
        };
    }

    if (
        datos.correo.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())
    ) {
        return {
            exito: false,
            mensaje: "El correo electrónico no tiene un formato válido.",
        };
    }

    if (
        datos.permiteWhatsapp &&
        !datos.whatsapp.trim() &&
        !datos.telefono.trim()
    ) {
        return {
            exito: false,
            mensaje:
                "Agrega un número de WhatsApp o teléfono para permitir mensajes.",
        };
    }

    if (datos.permiteCorreo && !datos.correo.trim()) {
        return {
            exito: false,
            mensaje:
                "Agrega un correo electrónico para permitir notificaciones por correo.",
        };
    }

    return null;
}

export async function buscarTelefonosDuplicados(
    telefono: string,
    whatsapp: string,
    clienteId?: string,
): Promise<ResultadoDuplicado> {
    const contexto = await obtenerContextoUsuario();

    if (contexto.error || !contexto.perfil) {
        return {
            existe: false,
            clientes: [],
        };
    }

    const valores = [
        telefono.trim(),
        whatsapp.trim(),
    ].filter(Boolean);

    if (valores.length === 0) {
        return {
            existe: false,
            clientes: [],
        };
    }

    let consulta = contexto.supabase
        .from("clientes")
        .select(
            "id, codigo_cliente, nombre_completo, telefono, whatsapp",
        )
        .eq("salon_id", contexto.perfil.salon_id)
        .or(
            valores
                .flatMap((valor) => [
                    `telefono.eq.${valor}`,
                    `whatsapp.eq.${valor}`,
                ])
                .join(","),
        )
        .limit(10);

    if (clienteId) {
        consulta = consulta.neq("id", clienteId);
    }

    const { data, error } = await consulta;

    if (error) {
        console.error("Error verificando teléfonos:", error);

        return {
            existe: false,
            clientes: [],
        };
    }

    return {
        existe: (data?.length ?? 0) > 0,
        clientes: data ?? [],
    };
}

export async function crearCliente(
    datos: DatosCliente,
): Promise<ResultadoCliente> {
    try {
        const validacion = validarCliente(datos);

        if (validacion) {
            return validacion;
        }

        const contexto = await obtenerContextoUsuario();

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

        const { supabase, perfil, user } = contexto;

        const { data: sucursal, error: sucursalError } =
            await supabase
                .from("sucursales")
                .select("id")
                .eq("id", datos.sucursalId)
                .eq("salon_id", perfil.salon_id)
                .eq("estado", "ACTIVA")
                .single();

        if (sucursalError || !sucursal) {
            return {
                exito: false,
                mensaje:
                    "La sucursal seleccionada no pertenece a tu salón.",
            };
        }

        const { data: cliente, error } = await supabase
            .from("clientes")
            .insert({
                salon_id: perfil.salon_id,
                sucursal_id: datos.sucursalId,
                nombre_completo: datos.nombreCompleto.trim(),
                telefono: datos.telefono.trim() || null,
                whatsapp: datos.whatsapp.trim() || null,
                correo: datos.correo.trim().toLowerCase() || null,
                direccion: datos.direccion.trim() || null,
                fecha_nacimiento: datos.fechaNacimiento || null,
                genero: datos.genero,
                contacto_emergencia_nombre:
                    datos.contactoEmergenciaNombre.trim() || null,
                contacto_emergencia_telefono:
                    datos.contactoEmergenciaTelefono.trim() || null,
                como_conocio_salon:
                    datos.comoConocioSalon.trim() || null,
                permite_notificaciones:
                    datos.permiteNotificaciones,
                permite_whatsapp: datos.permiteWhatsapp,
                permite_correo: datos.permiteCorreo,
                cliente_frecuente: datos.clienteFrecuente,
                estado: datos.estado,
                observaciones:
                    datos.observaciones.trim() || null,
                creado_por: user.id,
                actualizado_en: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (error || !cliente) {
            console.error("Error creando cliente:", error);

            return {
                exito: false,
                mensaje: error
                    ? `No fue posible registrar el cliente: ${error.message}`
                    : "No fue posible obtener el cliente creado.",
            };
        }

        revalidatePath("/clientes");

        return {
            exito: true,
            mensaje: "Cliente registrado correctamente.",
            clienteId: cliente.id,
        };
    } catch (error) {
        console.error("Error inesperado creando cliente:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar el cliente.",
        };
    }
}

export async function actualizarCliente(
    datos: DatosCliente,
): Promise<ResultadoCliente> {
    try {
        if (!datos.id) {
            return {
                exito: false,
                mensaje: "No se recibió el cliente a actualizar.",
            };
        }

        const validacion = validarCliente(datos);

        if (validacion) {
            return validacion;
        }

        const contexto = await obtenerContextoUsuario();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar los permisos.",
            };
        }

        const { supabase, perfil } = contexto;

        const { data: cliente, error: clienteError } =
            await supabase
                .from("clientes")
                .select("id")
                .eq("id", datos.id)
                .eq("salon_id", perfil.salon_id)
                .single();

        if (clienteError || !cliente) {
            return {
                exito: false,
                mensaje:
                    "El cliente no existe o no pertenece a tu salón.",
            };
        }

        const { data: sucursal, error: sucursalError } =
            await supabase
                .from("sucursales")
                .select("id")
                .eq("id", datos.sucursalId)
                .eq("salon_id", perfil.salon_id)
                .eq("estado", "ACTIVA")
                .single();

        if (sucursalError || !sucursal) {
            return {
                exito: false,
                mensaje:
                    "La sucursal seleccionada no pertenece a tu salón.",
            };
        }

        const { error } = await supabase
            .from("clientes")
            .update({
                sucursal_id: datos.sucursalId,
                nombre_completo: datos.nombreCompleto.trim(),
                telefono: datos.telefono.trim() || null,
                whatsapp: datos.whatsapp.trim() || null,
                correo: datos.correo.trim().toLowerCase() || null,
                direccion: datos.direccion.trim() || null,
                fecha_nacimiento: datos.fechaNacimiento || null,
                genero: datos.genero,
                contacto_emergencia_nombre:
                    datos.contactoEmergenciaNombre.trim() || null,
                contacto_emergencia_telefono:
                    datos.contactoEmergenciaTelefono.trim() || null,
                como_conocio_salon:
                    datos.comoConocioSalon.trim() || null,
                permite_notificaciones:
                    datos.permiteNotificaciones,
                permite_whatsapp: datos.permiteWhatsapp,
                permite_correo: datos.permiteCorreo,
                cliente_frecuente: datos.clienteFrecuente,
                estado: datos.estado,
                observaciones:
                    datos.observaciones.trim() || null,
                actualizado_en: new Date().toISOString(),
            })
            .eq("id", datos.id)
            .eq("salon_id", perfil.salon_id);

        if (error) {
            console.error("Error actualizando cliente:", error);

            return {
                exito: false,
                mensaje: `No fue posible actualizar el cliente: ${error.message}`,
            };
        }

        revalidatePath("/clientes");
        revalidatePath(`/clientes/${datos.id}`);

        return {
            exito: true,
            mensaje: "Cliente actualizado correctamente.",
            clienteId: datos.id,
        };
    } catch (error) {
        console.error(
            "Error inesperado actualizando cliente:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al actualizar el cliente.",
        };
    }
}

export async function cambiarEstadoCliente(
    clienteId: string,
    estado: EstadoCliente,
): Promise<ResultadoCliente> {
    try {
        const contexto = await obtenerContextoUsuario();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar los permisos.",
            };
        }

        const { error } = await contexto.supabase
            .from("clientes")
            .update({
                estado,
                actualizado_en: new Date().toISOString(),
            })
            .eq("id", clienteId)
            .eq("salon_id", contexto.perfil.salon_id);

        if (error) {
            return {
                exito: false,
                mensaje: `No fue posible cambiar el estado: ${error.message}`,
            };
        }

        revalidatePath("/clientes");

        return {
            exito: true,
            mensaje:
                estado === "ACTIVO"
                    ? "Cliente activado correctamente."
                    : "Cliente desactivado correctamente.",
        };
    } catch (error) {
        console.error("Error cambiando estado:", error);

        return {
            exito: false,
            mensaje: "Ocurrió un error inesperado.",
        };
    }
}