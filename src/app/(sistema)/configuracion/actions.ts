"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type EstadoGuardarConfiguracion = {
    exito: boolean;
    mensaje: string;
};

export type DatosConfiguracion = {
    nombreSalon: string;
    telefono: string;
    whatsapp: string;
    correo: string;
    direccion: string;
    moneda: string;
    simboloMoneda: string;
    horaApertura: string;
    horaCierre: string;
    intervaloCitasMinutos: number;
    permitirCredito: boolean;
    permitirPagoCombinado: boolean;
    mensajeRecibo: string;
    politicaCancelacion: string;
};

export type EstadoTerminalPos =
    | "ACTIVO"
    | "INACTIVO";

export type DatosTerminalPos = {
    id?: string;
    nombre: string;
    banco: string;
    sucursalId: string;
    porcentajeComision: number;
    estado: EstadoTerminalPos;
};

async function obtenerContextoAdministrador() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        return {
            supabase,
            perfil: null,
            userId: null,
            error:
                "Tu sesión ha vencido. Inicia sesión nuevamente.",
        };
    }

    const { data: perfil, error: perfilError } =
        await supabase
            .from("usuarios_perfiles")
            .select("salon_id, rol, estado")
            .eq("id", user.id)
            .single();

    if (
        perfilError ||
        !perfil ||
        perfil.estado !== "ACTIVO"
    ) {
        return {
            supabase,
            perfil: null,
            userId: user.id,
            error:
                "No fue posible verificar tu perfil.",
        };
    }

    if (
        !["SUPER_ADMIN", "ADMIN"].includes(
            perfil.rol,
        )
    ) {
        return {
            supabase,
            perfil: null,
            userId: user.id,
            error:
                "No tienes permisos para modificar la configuración.",
        };
    }

    return {
        supabase,
        perfil,
        userId: user.id,
        error: null,
    };
}

export async function guardarConfiguracion(
    datos: DatosConfiguracion,
): Promise<EstadoGuardarConfiguracion> {
    try {
        const contexto =
            await obtenerContextoAdministrador();

        if (
            contexto.error ||
            !contexto.perfil
        ) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar tu sesión.",
            };
        }

        const { supabase, perfil } = contexto;

        const nombreSalon =
            datos.nombreSalon.trim();
        const telefono = datos.telefono.trim();
        const whatsapp = datos.whatsapp.trim();
        const correo = datos.correo
            .trim()
            .toLowerCase();
        const direccion = datos.direccion.trim();
        const moneda = datos.moneda
            .trim()
            .toUpperCase();
        const simboloMoneda =
            datos.simboloMoneda.trim();
        const mensajeRecibo =
            datos.mensajeRecibo.trim();
        const politicaCancelacion =
            datos.politicaCancelacion.trim();

        if (nombreSalon.length < 2) {
            return {
                exito: false,
                mensaje:
                    "El nombre del salón debe tener al menos 2 caracteres.",
            };
        }

        if (!moneda) {
            return {
                exito: false,
                mensaje: "Selecciona una moneda.",
            };
        }

        if (!simboloMoneda) {
            return {
                exito: false,
                mensaje:
                    "Ingresa el símbolo de la moneda.",
            };
        }

        if (
            !Number.isInteger(
                datos.intervaloCitasMinutos,
            ) ||
            datos.intervaloCitasMinutos < 5 ||
            datos.intervaloCitasMinutos > 240
        ) {
            return {
                exito: false,
                mensaje:
                    "El intervalo de citas debe estar entre 5 y 240 minutos.",
            };
        }

        if (
            !datos.horaApertura ||
            !datos.horaCierre
        ) {
            return {
                exito: false,
                mensaje:
                    "Debes indicar el horario de apertura y cierre.",
            };
        }

        if (
            datos.horaApertura >=
            datos.horaCierre
        ) {
            return {
                exito: false,
                mensaje:
                    "La hora de cierre debe ser posterior a la hora de apertura.",
            };
        }

        const ahora = new Date().toISOString();

        const { error: configuracionError } =
            await supabase
                .from("configuracion_salon")
                .update({
                    nombre_salon: nombreSalon,
                    telefono: telefono || null,
                    whatsapp: whatsapp || null,
                    correo: correo || null,
                    direccion: direccion || null,
                    moneda,
                    simbolo_moneda:
                        simboloMoneda,
                    hora_apertura:
                        datos.horaApertura,
                    hora_cierre:
                        datos.horaCierre,
                    intervalo_citas_minutos:
                        datos.intervaloCitasMinutos,
                    permitir_credito:
                        datos.permitirCredito,
                    permitir_pago_combinado:
                        datos.permitirPagoCombinado,
                    mensaje_recibo:
                        mensajeRecibo ||
                        "Gracias por preferir nuestros servicios.",
                    politica_cancelacion:
                        politicaCancelacion ||
                        null,
                    actualizado_en: ahora,
                })
                .eq(
                    "salon_id",
                    perfil.salon_id,
                );

        if (configuracionError) {
            console.error(
                "Error actualizando configuración:",
                configuracionError,
            );

            return {
                exito: false,
                mensaje:
                    "No fue posible guardar la configuración.",
            };
        }

        const { error: salonError } =
            await supabase
                .from("salones")
                .update({
                    nombre: nombreSalon,
                    nombre_comercial:
                        nombreSalon,
                    telefono: telefono || null,
                    whatsapp: whatsapp || null,
                    correo: correo || null,
                    direccion: direccion || null,
                    actualizado_en: ahora,
                })
                .eq("id", perfil.salon_id);

        if (salonError) {
            console.error(
                "Error actualizando datos generales del salón:",
                salonError,
            );

            return {
                exito: false,
                mensaje:
                    "La configuración se guardó parcialmente, pero no se pudo actualizar el nombre general del salón.",
            };
        }

        revalidatePath("/", "layout");
        revalidatePath("/configuracion");
        revalidatePath("/inicio");

        return {
            exito: true,
            mensaje:
                "La configuración se guardó correctamente.",
        };
    } catch (error) {
        console.error(
            "Error inesperado guardando configuración:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al guardar.",
        };
    }
}

export async function guardarTerminalPos(
    datos: DatosTerminalPos,
): Promise<EstadoGuardarConfiguracion> {
    try {
        const contexto =
            await obtenerContextoAdministrador();

        if (
            contexto.error ||
            !contexto.perfil ||
            !contexto.userId
        ) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar tu sesión.",
            };
        }

        const {
            supabase,
            perfil,
            userId,
        } = contexto;

        const nombre = datos.nombre.trim();
        const banco = datos.banco.trim();

        if (nombre.length < 2) {
            return {
                exito: false,
                mensaje:
                    "El nombre del POS debe tener al menos 2 caracteres.",
            };
        }

        if (
            !Number.isFinite(
                datos.porcentajeComision,
            ) ||
            datos.porcentajeComision < 0 ||
            datos.porcentajeComision > 100
        ) {
            return {
                exito: false,
                mensaje:
                    "La comisión debe estar entre 0% y 100%.",
            };
        }

        if (datos.sucursalId) {
            const {
                data: sucursal,
                error: sucursalError,
            } = await supabase
                .from("sucursales")
                .select("id")
                .eq(
                    "id",
                    datos.sucursalId,
                )
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .maybeSingle();

            if (
                sucursalError ||
                !sucursal
            ) {
                return {
                    exito: false,
                    mensaje:
                        "La sucursal seleccionada no es válida.",
                };
            }
        }

        const ahora =
            new Date().toISOString();

        const registro = {
            salon_id: perfil.salon_id,
            sucursal_id:
                datos.sucursalId || null,
            nombre,
            banco: banco || null,
            porcentaje_comision:
                Number(
                    datos.porcentajeComision.toFixed(
                        4,
                    ),
                ),
            estado: datos.estado,
            actualizado_por: userId,
            actualizado_en: ahora,
        };

        if (datos.id) {
            const { error } = await supabase
                .from("terminales_pos")
                .update(registro)
                .eq("id", datos.id)
                .eq(
                    "salon_id",
                    perfil.salon_id,
                );

            if (error) {
                return {
                    exito: false,
                    mensaje:
                        error.code === "23505"
                            ? "Ya existe otra terminal POS con ese nombre."
                            : `No fue posible actualizar el POS: ${error.message}`,
                };
            }
        } else {
            const { error } = await supabase
                .from("terminales_pos")
                .insert({
                    ...registro,
                    creado_por: userId,
                    fecha_registro: ahora,
                });

            if (error) {
                return {
                    exito: false,
                    mensaje:
                        error.code === "23505"
                            ? "Ya existe una terminal POS con ese nombre."
                            : `No fue posible crear el POS: ${error.message}`,
                };
            }
        }

        revalidatePath("/configuracion");
        revalidatePath("/caja");
        revalidatePath("/caja/cobrar");
        revalidatePath(
            "/caja/venta-directa",
        );

        return {
            exito: true,
            mensaje: datos.id
                ? "Terminal POS actualizada correctamente."
                : "Terminal POS creada correctamente.",
        };
    } catch (error) {
        console.error(
            "Error guardando terminal POS:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al guardar el POS.",
        };
    }
}

export async function cambiarEstadoTerminalPos(
    id: string,
    estado: EstadoTerminalPos,
): Promise<EstadoGuardarConfiguracion> {
    try {
        const contexto =
            await obtenerContextoAdministrador();

        if (
            contexto.error ||
            !contexto.perfil ||
            !contexto.userId
        ) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar tu sesión.",
            };
        }

        const { error } =
            await contexto.supabase
                .from("terminales_pos")
                .update({
                    estado,
                    actualizado_por:
                        contexto.userId,
                    actualizado_en:
                        new Date().toISOString(),
                })
                .eq("id", id)
                .eq(
                    "salon_id",
                    contexto.perfil.salon_id,
                );

        if (error) {
            return {
                exito: false,
                mensaje:
                    "No fue posible cambiar el estado del POS.",
            };
        }

        revalidatePath("/configuracion");
        revalidatePath("/caja/cobrar");
        revalidatePath(
            "/caja/venta-directa",
        );

        return {
            exito: true,
            mensaje:
                estado === "ACTIVO"
                    ? "Terminal POS activada."
                    : "Terminal POS desactivada.",
        };
    } catch (error) {
        console.error(
            "Error cambiando estado POS:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}

export async function eliminarTerminalPos(
    id: string,
): Promise<EstadoGuardarConfiguracion> {
    try {
        const contexto =
            await obtenerContextoAdministrador();

        if (
            contexto.error ||
            !contexto.perfil
        ) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar tu sesión.",
            };
        }

        const { error } =
            await contexto.supabase
                .from("terminales_pos")
                .delete()
                .eq("id", id)
                .eq(
                    "salon_id",
                    contexto.perfil.salon_id,
                );

        if (error) {
            return {
                exito: false,
                mensaje:
                    "No fue posible eliminar el POS. Puedes desactivarlo para conservar su historial.",
            };
        }

        revalidatePath("/configuracion");

        return {
            exito: true,
            mensaje:
                "Terminal POS eliminada correctamente.",
        };
    } catch (error) {
        console.error(
            "Error eliminando POS:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado.",
        };
    }
}