"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoCita =
    | "PENDIENTE"
    | "CONFIRMADA"
    | "EN_ESPERA"
    | "EN_PROCESO"
    | "FINALIZADA"
    | "CANCELADA"
    | "NO_ASISTIO"
    | "REPROGRAMADA";

export type DatosReprogramacion = {
    fecha: string;
    horaInicio: string;
    motivo: string;
};

export type ResultadoAccion = {
    exito: boolean;
    mensaje: string;
    nuevaCitaId?: string;
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
            userId: null,
            error: "Tu sesión ha vencido.",
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
            error: "No fue posible verificar tu perfil.",
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
            userId: user.id,
            error: "No tienes permisos para administrar citas.",
        };
    }

    return {
        supabase,
        perfil,
        userId: user.id,
        error: null,
    };
}

function horaAMinutos(hora: string) {
    const [horas, minutos] = hora
        .slice(0, 5)
        .split(":")
        .map(Number);

    return horas * 60 + minutos;
}

function minutosAHora(total: number) {
    const horas = Math.floor(total / 60);
    const minutos = total % 60;

    return `${String(horas).padStart(2, "0")}:${String(
        minutos,
    ).padStart(2, "0")}`;
}

function seSuperponen(
    inicioA: number,
    finA: number,
    inicioB: number,
    finB: number,
) {
    return inicioA < finB && finA > inicioB;
}

function obtenerDiaSemana(fecha: string) {
    return new Date(`${fecha}T00:00:00`).getDay();
}

async function validarDisponibilidad({
    supabase,
    salonId,
    citaIdExcluir,
    trabajadorId,
    fecha,
    horaInicio,
    horaFin,
}: {
    supabase: Awaited<ReturnType<typeof createClient>>;
    salonId: string;
    citaIdExcluir: string;
    trabajadorId: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
}): Promise<string | null> {
    const diaSemana = obtenerDiaSemana(fecha);
    const inicio = horaAMinutos(horaInicio);
    const fin = horaAMinutos(horaFin);

    const { data: horario, error: horarioError } =
        await supabase
            .from("horarios_trabajadores")
            .select(
                "trabaja, hora_inicio, hora_fin, hora_descanso_inicio, hora_descanso_fin",
            )
            .eq("salon_id", salonId)
            .eq("trabajador_id", trabajadorId)
            .eq("dia_semana", diaSemana)
            .maybeSingle();

    if (horarioError) {
        return `No fue posible consultar el horario: ${horarioError.message}`;
    }

    if (!horario || !horario.trabaja) {
        return "El trabajador no labora en la fecha seleccionada.";
    }

    const inicioJornada = horaAMinutos(horario.hora_inicio);
    const finJornada = horaAMinutos(horario.hora_fin);

    if (inicio < inicioJornada || fin > finJornada) {
        return "El nuevo horario queda fuera de la jornada laboral.";
    }

    if (
        horario.hora_descanso_inicio &&
        horario.hora_descanso_fin
    ) {
        const inicioDescanso = horaAMinutos(
            horario.hora_descanso_inicio,
        );
        const finDescanso = horaAMinutos(
            horario.hora_descanso_fin,
        );

        if (
            seSuperponen(
                inicio,
                fin,
                inicioDescanso,
                finDescanso,
            )
        ) {
            return "El nuevo horario coincide con el descanso del trabajador.";
        }
    }

    const { data: bloqueos, error: bloqueosError } =
        await supabase
            .from("bloqueos_agenda")
            .select(
                "titulo, hora_inicio, hora_fin, todo_el_dia",
            )
            .eq("salon_id", salonId)
            .eq("estado", "ACTIVO")
            .or(
                `trabajador_id.eq.${trabajadorId},trabajador_id.is.null`,
            )
            .lte("fecha_inicio", fecha)
            .gte("fecha_fin", fecha);

    if (bloqueosError) {
        return `No fue posible consultar los bloqueos: ${bloqueosError.message}`;
    }

    for (const bloqueo of bloqueos ?? []) {
        if (bloqueo.todo_el_dia) {
            return `La agenda está bloqueada: ${bloqueo.titulo}.`;
        }

        if (bloqueo.hora_inicio && bloqueo.hora_fin) {
            const inicioBloqueo = horaAMinutos(
                bloqueo.hora_inicio,
            );
            const finBloqueo = horaAMinutos(
                bloqueo.hora_fin,
            );

            if (
                seSuperponen(
                    inicio,
                    fin,
                    inicioBloqueo,
                    finBloqueo,
                )
            ) {
                return `El horario coincide con un bloqueo: ${bloqueo.titulo}.`;
            }
        }
    }

    const { data: serviciosExistentes, error: citasError } =
        await supabase
            .from("cita_servicios")
            .select(`
        cita_id,
        hora_inicio,
        hora_fin,
        citas!inner (
          fecha,
          estado
        )
      `)
            .eq("salon_id", salonId)
            .eq("trabajador_id", trabajadorId)
            .eq("citas.fecha", fecha)
            .neq("cita_id", citaIdExcluir);

    if (citasError) {
        return `No fue posible consultar citas existentes: ${citasError.message}`;
    }

    for (const registro of serviciosExistentes ?? []) {
        const citaRelacion = Array.isArray(registro.citas)
            ? registro.citas[0]
            : registro.citas;

        if (
            !citaRelacion ||
            ["CANCELADA", "REPROGRAMADA", "NO_ASISTIO"].includes(
                citaRelacion.estado,
            )
        ) {
            continue;
        }

        const inicioExistente = horaAMinutos(
            registro.hora_inicio,
        );
        const finExistente = horaAMinutos(
            registro.hora_fin,
        );

        if (
            seSuperponen(
                inicio,
                fin,
                inicioExistente,
                finExistente,
            )
        ) {
            return "El trabajador ya tiene otra cita en ese horario.";
        }
    }

    return null;
}

const transicionesPermitidas: Record<
    EstadoCita,
    EstadoCita[]
> = {
    PENDIENTE: [
        "CONFIRMADA",
        "EN_ESPERA",
        "CANCELADA",
        "NO_ASISTIO",
    ],
    CONFIRMADA: [
        "EN_ESPERA",
        "EN_PROCESO",
        "CANCELADA",
        "NO_ASISTIO",
    ],
    EN_ESPERA: [
        "EN_PROCESO",
        "CANCELADA",
        "NO_ASISTIO",
    ],
    EN_PROCESO: ["FINALIZADA", "CANCELADA"],
    FINALIZADA: [],
    CANCELADA: [],
    NO_ASISTIO: [],
    REPROGRAMADA: [],
};

function obtenerTipoEvento(estado: EstadoCita) {
    const mapa: Record<EstadoCita, string> = {
        PENDIENTE: "EDITADA",
        CONFIRMADA: "CONFIRMADA",
        EN_ESPERA: "EN_ESPERA",
        EN_PROCESO: "INICIADA",
        FINALIZADA: "FINALIZADA",
        CANCELADA: "CANCELADA",
        NO_ASISTIO: "NO_ASISTIO",
        REPROGRAMADA: "REPROGRAMADA",
    };

    return mapa[estado];
}

export async function cambiarEstadoCita(
    citaId: string,
    nuevoEstado: EstadoCita,
    motivo?: string,
): Promise<ResultadoAccion> {
    try {
        const contexto = await obtenerContextoUsuario();

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

        const { supabase, perfil, userId } = contexto;

        const { data: cita, error: citaError } =
            await supabase
                .from("citas")
                .select("id, estado")
                .eq("id", citaId)
                .eq("salon_id", perfil.salon_id)
                .single();

        if (citaError || !cita) {
            return {
                exito: false,
                mensaje:
                    "La cita no existe o no pertenece a tu salón.",
            };
        }

        const estadoAnterior = cita.estado as EstadoCita;

        if (
            !transicionesPermitidas[estadoAnterior].includes(
                nuevoEstado,
            )
        ) {
            return {
                exito: false,
                mensaje: `No se puede cambiar una cita de ${estadoAnterior} a ${nuevoEstado}.`,
            };
        }

        if (
            nuevoEstado === "CANCELADA" &&
            (!motivo || motivo.trim().length < 3)
        ) {
            return {
                exito: false,
                mensaje:
                    "Escribe el motivo de la cancelación.",
            };
        }

        const ahora = new Date().toISOString();

        const cambios: Record<string, unknown> = {
            estado: nuevoEstado,
            actualizado_por: userId,
            actualizado_en: ahora,
        };

        if (nuevoEstado === "CONFIRMADA") {
            cambios.confirmada_en = ahora;
        }

        if (nuevoEstado === "EN_PROCESO") {
            cambios.iniciada_en = ahora;
        }

        if (nuevoEstado === "FINALIZADA") {
            cambios.finalizada_en = ahora;
        }

        if (nuevoEstado === "CANCELADA") {
            cambios.cancelada_en = ahora;
            cambios.cancelada_por = userId;
            cambios.motivo_cancelacion = motivo?.trim();
        }

        const { error: actualizarError } = await supabase
            .from("citas")
            .update(cambios)
            .eq("id", citaId)
            .eq("salon_id", perfil.salon_id);

        if (actualizarError) {
            return {
                exito: false,
                mensaje: `No fue posible actualizar la cita: ${actualizarError.message}`,
            };
        }

        const estadoServicio =
            nuevoEstado === "EN_PROCESO"
                ? "EN_PROCESO"
                : nuevoEstado === "FINALIZADA"
                    ? "FINALIZADO"
                    : nuevoEstado === "CANCELADA"
                        ? "CANCELADO"
                        : "PENDIENTE";

        if (
            [
                "EN_PROCESO",
                "FINALIZADA",
                "CANCELADA",
            ].includes(nuevoEstado)
        ) {
            await supabase
                .from("cita_servicios")
                .update({
                    estado: estadoServicio,
                    actualizado_en: ahora,
                })
                .eq("cita_id", citaId)
                .eq("salon_id", perfil.salon_id);
        }

        await supabase.from("citas_historial").insert({
            salon_id: perfil.salon_id,
            cita_id: citaId,
            usuario_id: userId,
            tipo_evento: obtenerTipoEvento(nuevoEstado),
            estado_anterior: estadoAnterior,
            estado_nuevo: nuevoEstado,
            descripcion:
                nuevoEstado === "CANCELADA"
                    ? `Cita cancelada. Motivo: ${motivo?.trim()}`
                    : `Estado cambiado de ${estadoAnterior} a ${nuevoEstado}.`,
        });

        revalidatePath("/agenda", "page");
        revalidatePath(`/agenda/${citaId}`, "page");

        return {
            exito: true,
            mensaje: mensajeEstado(nuevoEstado),
        };
    } catch (error) {
        console.error("Error cambiando estado:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al actualizar la cita.",
        };
    }
}

export async function reprogramarCita(
    citaId: string,
    datos: DatosReprogramacion,
): Promise<ResultadoAccion> {
    try {
        if (!datos.fecha || !datos.horaInicio) {
            return {
                exito: false,
                mensaje:
                    "Selecciona la nueva fecha y hora.",
            };
        }

        if (datos.motivo.trim().length < 3) {
            return {
                exito: false,
                mensaje:
                    "Escribe el motivo de la reprogramación.",
            };
        }

        const contexto = await obtenerContextoUsuario();

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

        const { supabase, perfil, userId } = contexto;

        const { data: cita, error: citaError } =
            await supabase
                .from("citas")
                .select(`
          id,
          sucursal_id,
          cliente_id,
          fecha,
          hora_inicio,
          hora_fin,
          duracion_total_minutos,
          subtotal,
          descuento,
          total,
          requiere_anticipo,
          monto_anticipo_requerido,
          monto_anticipo_pagado,
          origen,
          notas,
          notas_internas,
          estado,
          cita_servicios (
            servicio_id,
            trabajador_id,
            nombre_servicio,
            precio_unitario,
            descuento,
            total,
            duracion_minutos,
            hora_inicio,
            hora_fin,
            orden,
            tipo_comision,
            valor_comision,
            monto_comision_calculado,
            notas
          )
        `)
                .eq("id", citaId)
                .eq("salon_id", perfil.salon_id)
                .single();

        if (citaError || !cita) {
            return {
                exito: false,
                mensaje:
                    "La cita no existe o no pertenece a tu salón.",
            };
        }

        if (
            [
                "FINALIZADA",
                "CANCELADA",
                "NO_ASISTIO",
                "REPROGRAMADA",
            ].includes(cita.estado)
        ) {
            return {
                exito: false,
                mensaje:
                    "Esta cita ya no puede reprogramarse.",
            };
        }

        const inicioOriginal = horaAMinutos(cita.hora_inicio);
        const nuevoInicioGeneral = horaAMinutos(
            datos.horaInicio,
        );

        const serviciosNuevos = [];

        for (const servicio of cita.cita_servicios) {
            const desplazamiento =
                horaAMinutos(servicio.hora_inicio) -
                inicioOriginal;

            const inicioServicio =
                nuevoInicioGeneral + desplazamiento;
            const finServicio =
                inicioServicio + servicio.duracion_minutos;

            const errorDisponibilidad =
                await validarDisponibilidad({
                    supabase,
                    salonId: perfil.salon_id,
                    citaIdExcluir: citaId,
                    trabajadorId: servicio.trabajador_id,
                    fecha: datos.fecha,
                    horaInicio: minutosAHora(inicioServicio),
                    horaFin: minutosAHora(finServicio),
                });

            if (errorDisponibilidad) {
                return {
                    exito: false,
                    mensaje: `${servicio.nombre_servicio}: ${errorDisponibilidad}`,
                };
            }

            serviciosNuevos.push({
                salon_id: perfil.salon_id,
                servicio_id: servicio.servicio_id,
                trabajador_id: servicio.trabajador_id,
                nombre_servicio: servicio.nombre_servicio,
                precio_unitario: servicio.precio_unitario,
                descuento: servicio.descuento,
                total: servicio.total,
                duracion_minutos: servicio.duracion_minutos,
                hora_inicio: minutosAHora(inicioServicio),
                hora_fin: minutosAHora(finServicio),
                orden: servicio.orden,
                estado: "PENDIENTE",
                tipo_comision: servicio.tipo_comision,
                valor_comision: servicio.valor_comision,
                monto_comision_calculado:
                    servicio.monto_comision_calculado,
                notas: servicio.notas,
                actualizado_en: new Date().toISOString(),
            });
        }

        const nuevaHoraFin = minutosAHora(
            nuevoInicioGeneral +
            cita.duracion_total_minutos,
        );

        const { data: nuevaCita, error: crearError } =
            await supabase
                .from("citas")
                .insert({
                    salon_id: perfil.salon_id,
                    sucursal_id: cita.sucursal_id,
                    cliente_id: cita.cliente_id,
                    fecha: datos.fecha,
                    hora_inicio: datos.horaInicio,
                    hora_fin: nuevaHoraFin,
                    duracion_total_minutos:
                        cita.duracion_total_minutos,
                    subtotal: cita.subtotal,
                    descuento: cita.descuento,
                    total: cita.total,
                    requiere_anticipo:
                        cita.requiere_anticipo,
                    monto_anticipo_requerido:
                        cita.monto_anticipo_requerido,
                    monto_anticipo_pagado:
                        cita.monto_anticipo_pagado,
                    estado: "PENDIENTE",
                    origen: cita.origen,
                    notas: cita.notas,
                    notas_internas: cita.notas_internas,
                    cita_reprogramada_desde: citaId,
                    creado_por: userId,
                    actualizado_por: userId,
                    actualizado_en: new Date().toISOString(),
                })
                .select("id")
                .single();

        if (crearError || !nuevaCita) {
            return {
                exito: false,
                mensaje: crearError
                    ? `No fue posible crear la nueva cita: ${crearError.message}`
                    : "No fue posible obtener la nueva cita.",
            };
        }

        const { error: serviciosError } = await supabase
            .from("cita_servicios")
            .insert(
                serviciosNuevos.map((servicio) => ({
                    ...servicio,
                    cita_id: nuevaCita.id,
                })),
            );

        if (serviciosError) {
            await supabase
                .from("citas")
                .delete()
                .eq("id", nuevaCita.id)
                .eq("salon_id", perfil.salon_id);

            return {
                exito: false,
                mensaje: `No fue posible completar la reprogramación: ${serviciosError.message}`,
            };
        }

        const ahora = new Date().toISOString();

        const { error: actualizarAnteriorError } =
            await supabase
                .from("citas")
                .update({
                    estado: "REPROGRAMADA",
                    actualizado_por: userId,
                    actualizado_en: ahora,
                })
                .eq("id", citaId)
                .eq("salon_id", perfil.salon_id);

        if (actualizarAnteriorError) {
            return {
                exito: false,
                mensaje:
                    "La nueva cita fue creada, pero no fue posible marcar la anterior como reprogramada.",
                nuevaCitaId: nuevaCita.id,
            };
        }

        await supabase.from("citas_historial").insert([
            {
                salon_id: perfil.salon_id,
                cita_id: citaId,
                usuario_id: userId,
                tipo_evento: "REPROGRAMADA",
                estado_anterior: cita.estado,
                estado_nuevo: "REPROGRAMADA",
                descripcion: `Cita reprogramada. Motivo: ${datos.motivo.trim()}`,
                datos_anteriores: {
                    fecha: cita.fecha,
                    horaInicio: cita.hora_inicio,
                },
                datos_nuevos: {
                    nuevaCitaId: nuevaCita.id,
                    fecha: datos.fecha,
                    horaInicio: datos.horaInicio,
                },
            },
            {
                salon_id: perfil.salon_id,
                cita_id: nuevaCita.id,
                usuario_id: userId,
                tipo_evento: "CREADA",
                estado_nuevo: "PENDIENTE",
                descripcion: `Nueva cita creada por reprogramación. Motivo: ${datos.motivo.trim()}`,
                datos_nuevos: {
                    citaAnteriorId: citaId,
                    fecha: datos.fecha,
                    horaInicio: datos.horaInicio,
                },
            },
        ]);

        revalidatePath("/agenda", "page");
        revalidatePath(`/agenda/${citaId}`, "page");
        revalidatePath(`/agenda/${nuevaCita.id}`, "page");

        return {
            exito: true,
            mensaje: "Cita reprogramada correctamente.",
            nuevaCitaId: nuevaCita.id,
        };
    } catch (error) {
        console.error("Error reprogramando cita:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al reprogramar la cita.",
        };
    }
}

function mensajeEstado(estado: EstadoCita) {
    const mensajes: Record<EstadoCita, string> = {
        PENDIENTE: "La cita quedó pendiente.",
        CONFIRMADA: "Cita confirmada correctamente.",
        EN_ESPERA:
            "El cliente fue colocado en espera.",
        EN_PROCESO:
            "El servicio fue iniciado correctamente.",
        FINALIZADA:
            "La cita fue finalizada correctamente.",
        CANCELADA:
            "La cita fue cancelada correctamente.",
        NO_ASISTIO:
            "La cita fue marcada como no asistió.",
        REPROGRAMADA:
            "La cita fue reprogramada correctamente.",
    };

    return mensajes[estado];
}