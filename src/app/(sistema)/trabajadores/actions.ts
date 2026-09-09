"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TipoComision =
    | "PORCENTAJE"
    | "MONTO_FIJO"
    | "SIN_COMISION";

export type ModalidadPago =
    | "SALARIO_FIJO"
    | "SOLO_COMISION"
    | "SALARIO_MAS_COMISION"
    | "SIN_PAGO";

export type FrecuenciaPago =
    | "SEMANAL"
    | "QUINCENAL"
    | "MENSUAL";

export type EstadoTrabajador = "ACTIVO" | "INACTIVO";

export type DatosTrabajador = {
    id?: string;
    sucursalId: string;
    nombreCompleto: string;
    telefono: string;
    correo: string;
    direccion: string;
    especialidadesIds: string[];
    descripcion: string;
    fechaNacimiento: string;
    fechaIngreso: string;
    colorCalendario: string;
    modalidadPago: ModalidadPago;
    salarioFijo: number;
    frecuenciaPago: FrecuenciaPago;
    tipoComision: TipoComision;
    comisionGeneral: number;
    permiteCitas: boolean;
    estado: EstadoTrabajador;
    observaciones: string;
};

export type ResultadoTrabajador = {
    exito: boolean;
    mensaje: string;
};

export type ResultadoEspecialidad = ResultadoTrabajador & {
    especialidad?: {
        id: string;
        nombre: string;
    };
};

async function obtenerContextoAdministrador() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        return {
            error: "Tu sesión ha vencido.",
            supabase,
            perfil: null,
        };
    }

    const { data: perfil, error: perfilError } = await supabase
        .from("usuarios_perfiles")
        .select("salon_id, sucursal_id, rol, estado")
        .eq("id", user.id)
        .single();

    if (perfilError || !perfil) {
        return {
            error: "No fue posible verificar tu perfil.",
            supabase,
            perfil: null,
        };
    }

    if (perfil.estado !== "ACTIVO") {
        return {
            error: "Tu usuario se encuentra inactivo.",
            supabase,
            perfil: null,
        };
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(perfil.rol)) {
        return {
            error: "No tienes permisos para administrar trabajadores.",
            supabase,
            perfil: null,
        };
    }

    return {
        error: null,
        supabase,
        perfil,
    };
}

function validarTrabajador(
    datos: DatosTrabajador,
): ResultadoTrabajador | null {
    const nombre = datos.nombreCompleto.trim();

    if (nombre.length < 3) {
        return {
            exito: false,
            mensaje:
                "El nombre del trabajador debe tener al menos 3 caracteres.",
        };
    }

    if (!datos.sucursalId) {
        return {
            exito: false,
            mensaje: "Selecciona una sucursal.",
        };
    }

    if (datos.especialidadesIds.length === 0) {
        return {
            exito: false,
            mensaje: "Selecciona al menos una especialidad.",
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

    const usaSalario =
        datos.modalidadPago === "SALARIO_FIJO" ||
        datos.modalidadPago === "SALARIO_MAS_COMISION";

    const usaComision =
        datos.modalidadPago === "SOLO_COMISION" ||
        datos.modalidadPago === "SALARIO_MAS_COMISION";

    if (usaSalario && datos.salarioFijo <= 0) {
        return {
            exito: false,
            mensaje: "El salario fijo debe ser mayor que cero.",
        };
    }

    if (usaComision && datos.tipoComision === "SIN_COMISION") {
        return {
            exito: false,
            mensaje: "Selecciona un tipo de comisión.",
        };
    }

    if (
        usaComision &&
        datos.tipoComision === "PORCENTAJE" &&
        (datos.comisionGeneral < 0 || datos.comisionGeneral > 100)
    ) {
        return {
            exito: false,
            mensaje: "La comisión porcentual debe estar entre 0 y 100.",
        };
    }

    if (
        usaComision &&
        datos.tipoComision === "MONTO_FIJO" &&
        datos.comisionGeneral < 0
    ) {
        return {
            exito: false,
            mensaje: "La comisión fija no puede ser negativa.",
        };
    }

    return null;
}

function obtenerDatosPago(datos: DatosTrabajador) {
    const usaSalario =
        datos.modalidadPago === "SALARIO_FIJO" ||
        datos.modalidadPago === "SALARIO_MAS_COMISION";

    const usaComision =
        datos.modalidadPago === "SOLO_COMISION" ||
        datos.modalidadPago === "SALARIO_MAS_COMISION";

    return {
        salarioFijo: usaSalario ? datos.salarioFijo : 0,
        tipoComision: usaComision
            ? datos.tipoComision
            : ("SIN_COMISION" as TipoComision),
        comisionGeneral: usaComision ? datos.comisionGeneral : 0,
    };
}

async function validarEspecialidadesDelSalon(
    supabase: Awaited<ReturnType<typeof createClient>>,
    salonId: string,
    especialidadesIds: string[],
) {
    const idsUnicos = [...new Set(especialidadesIds)];

    const { data, error } = await supabase
        .from("especialidades")
        .select("id")
        .eq("salon_id", salonId)
        .eq("estado", "ACTIVA")
        .in("id", idsUnicos);

    return {
        validas: !error && (data?.length ?? 0) === idsUnicos.length,
        idsUnicos,
    };
}

export async function crearEspecialidad(
    nombre: string,
): Promise<ResultadoEspecialidad> {
    try {
        const nombreLimpio = nombre.trim();

        if (nombreLimpio.length < 2) {
            return {
                exito: false,
                mensaje: "La especialidad debe tener al menos 2 caracteres.",
            };
        }

        if (nombreLimpio.length > 80) {
            return {
                exito: false,
                mensaje: "La especialidad no puede superar 80 caracteres.",
            };
        }

        const contexto = await obtenerContextoAdministrador();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ?? "No fue posible verificar los permisos.",
            };
        }

        const { supabase, perfil } = contexto;

        const { data: existente } = await supabase
            .from("especialidades")
            .select("id, nombre, estado")
            .eq("salon_id", perfil.salon_id)
            .ilike("nombre", nombreLimpio)
            .maybeSingle();

        if (existente) {
            if (existente.estado === "INACTIVA") {
                const { data: reactivada, error: reactivarError } =
                    await supabase
                        .from("especialidades")
                        .update({
                            estado: "ACTIVA",
                            actualizado_en: new Date().toISOString(),
                        })
                        .eq("id", existente.id)
                        .eq("salon_id", perfil.salon_id)
                        .select("id, nombre")
                        .single();

                if (reactivarError || !reactivada) {
                    return {
                        exito: false,
                        mensaje: "No fue posible reactivar la especialidad.",
                    };
                }

                revalidatePath("/trabajadores");

                return {
                    exito: true,
                    mensaje: "Especialidad reactivada correctamente.",
                    especialidad: reactivada,
                };
            }

            return {
                exito: true,
                mensaje: "La especialidad ya estaba registrada.",
                especialidad: {
                    id: existente.id,
                    nombre: existente.nombre,
                },
            };
        }

        const { data, error } = await supabase
            .from("especialidades")
            .insert({
                salon_id: perfil.salon_id,
                nombre: nombreLimpio,
                estado: "ACTIVA",
                actualizado_en: new Date().toISOString(),
            })
            .select("id, nombre")
            .single();

        if (error || !data) {
            console.error("Error creando especialidad:", error);

            return {
                exito: false,
                mensaje: "No fue posible crear la especialidad.",
            };
        }

        revalidatePath("/trabajadores");

        return {
            exito: true,
            mensaje: "Especialidad creada correctamente.",
            especialidad: data,
        };
    } catch (error) {
        console.error("Error inesperado creando especialidad:", error);

        return {
            exito: false,
            mensaje: "Ocurrió un error inesperado al crear la especialidad.",
        };
    }
}

export async function crearTrabajador(
    datos: DatosTrabajador,
): Promise<ResultadoTrabajador> {
    try {
        const validacion = validarTrabajador(datos);

        if (validacion) {
            return validacion;
        }

        const contexto = await obtenerContextoAdministrador();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ?? "No fue posible verificar los permisos.",
            };
        }

        const { supabase, perfil } = contexto;

        const { data: sucursal, error: sucursalError } = await supabase
            .from("sucursales")
            .select("id")
            .eq("id", datos.sucursalId)
            .eq("salon_id", perfil.salon_id)
            .single();

        if (sucursalError || !sucursal) {
            return {
                exito: false,
                mensaje: "La sucursal seleccionada no pertenece a tu salón.",
            };
        }

        const validacionEspecialidades =
            await validarEspecialidadesDelSalon(
                supabase,
                perfil.salon_id,
                datos.especialidadesIds,
            );

        if (!validacionEspecialidades.validas) {
            return {
                exito: false,
                mensaje:
                    "Una o más especialidades no pertenecen a tu salón o están inactivas.",
            };
        }

        const pago = obtenerDatosPago(datos);

        const { data: trabajadorCreado, error } = await supabase
            .from("trabajadores")
            .insert({
                salon_id: perfil.salon_id,
                sucursal_id: datos.sucursalId,
                nombre_completo: datos.nombreCompleto.trim(),
                telefono: datos.telefono.trim() || null,
                correo: datos.correo.trim().toLowerCase() || null,
                direccion: datos.direccion.trim() || null,
                descripcion: datos.descripcion.trim() || null,
                fecha_nacimiento: datos.fechaNacimiento || null,
                fecha_ingreso: datos.fechaIngreso || null,
                color_calendario: datos.colorCalendario || "#6F8F83",
                modalidad_pago: datos.modalidadPago,
                salario_fijo: pago.salarioFijo,
                frecuencia_pago: datos.frecuenciaPago,
                tipo_comision: pago.tipoComision,
                comision_general: pago.comisionGeneral,
                permite_citas: datos.permiteCitas,
                estado: datos.estado,
                observaciones: datos.observaciones.trim() || null,
                actualizado_en: new Date().toISOString(),
            })
            .select("id")
            .single();
        if (error || !trabajadorCreado) {
            console.error("Error creando trabajador:", error);

            return {
                exito: false,
                mensaje: error
                    ? `No fue posible registrar el trabajador: ${error.message}`
                    : "No fue posible obtener el identificador del trabajador.",
            };
        }

        const relaciones = validacionEspecialidades.idsUnicos.map(
            (especialidadId) => ({
                salon_id: perfil.salon_id,
                trabajador_id: trabajadorCreado.id,
                especialidad_id: especialidadId,
            }),
        );

        const { error: especialidadesError } = await supabase
            .from("trabajador_especialidades")
            .insert(relaciones);

        if (especialidadesError) {
            console.error(
                "Error asignando especialidades:",
                especialidadesError,
            );

            await supabase
                .from("trabajadores")
                .delete()
                .eq("id", trabajadorCreado.id)
                .eq("salon_id", perfil.salon_id);

            return {
                exito: false,
                mensaje:
                    "No fue posible asignar las especialidades al trabajador.",
            };
        }

        revalidatePath("/trabajadores");

        return {
            exito: true,
            mensaje: "Trabajador registrado correctamente.",
        };
    } catch (error) {
        console.error("Error inesperado:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar el trabajador.",
        };
    }
}

export async function actualizarTrabajador(
    datos: DatosTrabajador,
): Promise<ResultadoTrabajador> {
    try {
        if (!datos.id) {
            return {
                exito: false,
                mensaje: "No se recibió el trabajador a actualizar.",
            };
        }

        const validacion = validarTrabajador(datos);

        if (validacion) {
            return validacion;
        }

        const contexto = await obtenerContextoAdministrador();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ?? "No fue posible verificar los permisos.",
            };
        }

        const { supabase, perfil } = contexto;

        const { data: trabajador, error: trabajadorError } =
            await supabase
                .from("trabajadores")
                .select("id")
                .eq("id", datos.id)
                .eq("salon_id", perfil.salon_id)
                .single();

        if (trabajadorError || !trabajador) {
            return {
                exito: false,
                mensaje: "El trabajador no existe o no pertenece a tu salón.",
            };
        }

        const { data: sucursal, error: sucursalError } = await supabase
            .from("sucursales")
            .select("id")
            .eq("id", datos.sucursalId)
            .eq("salon_id", perfil.salon_id)
            .single();

        if (sucursalError || !sucursal) {
            return {
                exito: false,
                mensaje: "La sucursal seleccionada no pertenece a tu salón.",
            };
        }

        const validacionEspecialidades =
            await validarEspecialidadesDelSalon(
                supabase,
                perfil.salon_id,
                datos.especialidadesIds,
            );

        if (!validacionEspecialidades.validas) {
            return {
                exito: false,
                mensaje:
                    "Una o más especialidades no pertenecen a tu salón o están inactivas.",
            };
        }

        const pago = obtenerDatosPago(datos);

        const { error } = await supabase
            .from("trabajadores")
            .update({
                sucursal_id: datos.sucursalId,
                nombre_completo: datos.nombreCompleto.trim(),
                telefono: datos.telefono.trim() || null,
                correo: datos.correo.trim().toLowerCase() || null,
                direccion: datos.direccion.trim() || null,
                descripcion: datos.descripcion.trim() || null,
                fecha_nacimiento: datos.fechaNacimiento || null,
                fecha_ingreso: datos.fechaIngreso || null,
                color_calendario: datos.colorCalendario || "#6F8F83",
                modalidad_pago: datos.modalidadPago,
                salario_fijo: pago.salarioFijo,
                frecuencia_pago: datos.frecuenciaPago,
                tipo_comision: pago.tipoComision,
                comision_general: pago.comisionGeneral,
                permite_citas: datos.permiteCitas,
                estado: datos.estado,
                observaciones: datos.observaciones.trim() || null,
                actualizado_en: new Date().toISOString(),
            })
            .eq("id", datos.id)
            .eq("salon_id", perfil.salon_id);

        if (error) {
            console.error("Error actualizando trabajador:", error);

            return {
                exito: false,
                mensaje: "No fue posible actualizar el trabajador.",
            };
        }

        const { error: eliminarError } = await supabase
            .from("trabajador_especialidades")
            .delete()
            .eq("trabajador_id", datos.id)
            .eq("salon_id", perfil.salon_id);

        if (eliminarError) {
            console.error(
                "Error eliminando especialidades anteriores:",
                eliminarError,
            );

            return {
                exito: false,
                mensaje:
                    "Los datos principales se actualizaron, pero no fue posible actualizar las especialidades.",
            };
        }

        const nuevasRelaciones =
            validacionEspecialidades.idsUnicos.map(
                (especialidadId) => ({
                    salon_id: perfil.salon_id,
                    trabajador_id: datos.id,
                    especialidad_id: especialidadId,
                }),
            );

        const { error: insertarError } = await supabase
            .from("trabajador_especialidades")
            .insert(nuevasRelaciones);

        if (insertarError) {
            console.error(
                "Error insertando especialidades nuevas:",
                insertarError,
            );

            return {
                exito: false,
                mensaje:
                    "Los datos principales se actualizaron, pero ocurrió un error al asignar las especialidades.",
            };
        }

        revalidatePath("/trabajadores");

        return {
            exito: true,
            mensaje: "Trabajador actualizado correctamente.",
        };
    } catch (error) {
        console.error("Error inesperado:", error);

        return {
            exito: false,
            mensaje: "Ocurrió un error inesperado al actualizar.",
        };
    }
}

export async function cambiarEstadoTrabajador(
    trabajadorId: string,
    estado: EstadoTrabajador,
): Promise<ResultadoTrabajador> {
    try {
        const contexto = await obtenerContextoAdministrador();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ?? "No fue posible verificar los permisos.",
            };
        }

        const { supabase, perfil } = contexto;

        const { error } = await supabase
            .from("trabajadores")
            .update({
                estado,
                actualizado_en: new Date().toISOString(),
            })
            .eq("id", trabajadorId)
            .eq("salon_id", perfil.salon_id);

        if (error) {
            console.error("Error cambiando estado:", error);

            return {
                exito: false,
                mensaje: "No fue posible cambiar el estado del trabajador.",
            };
        }

        revalidatePath("/trabajadores");

        return {
            exito: true,
            mensaje:
                estado === "ACTIVO"
                    ? "Trabajador activado correctamente."
                    : "Trabajador desactivado correctamente.",
        };
    } catch (error) {
        console.error("Error inesperado:", error);

        return {
            exito: false,
            mensaje: "Ocurrió un error inesperado.",
        };
    }
}