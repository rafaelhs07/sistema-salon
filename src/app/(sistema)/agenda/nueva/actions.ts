"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ServicioCitaEntrada = {
    servicioId: string;
    trabajadorId: string;
    precio: number;
    duracionMinutos: number;
    descuento: number;
    notas: string;
};

export type DatosNuevaCita = {
    clienteId: string;
    sucursalId: string;
    fecha: string;
    horaInicio: string;
    origen: "SALON" | "TELEFONO" | "WHATSAPP" | "REDES_SOCIALES" | "WEB" | "OTRO";
    notas: string;
    notasInternas: string;
    servicios: ServicioCitaEntrada[];
};

export type ResultadoCita = {
    exito: boolean;
    mensaje: string;
    citaId?: string;
};

function horaAMinutos(hora: string) {
    const [h, m] = hora.slice(0, 5).split(":").map(Number);
    return h * 60 + m;
}

function minutosAHora(total: number) {
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function seSuperponen(a1: number, a2: number, b1: number, b2: number) {
    return a1 < b2 && a2 > b1;
}

async function obtenerContexto() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { supabase, perfil: null, userId: null, error: "Tu sesión ha vencido." };
    }

    const { data: perfil } = await supabase
        .from("usuarios_perfiles")
        .select("salon_id, sucursal_id, rol, estado")
        .eq("id", user.id)
        .single();

    if (!perfil || perfil.estado !== "ACTIVO") {
        return { supabase, perfil: null, userId: user.id, error: "No fue posible verificar tu perfil." };
    }

    return { supabase, perfil, userId: user.id, error: null };
}

async function validarDisponibilidad({
    supabase,
    salonId,
    trabajadorId,
    fecha,
    horaInicio,
    horaFin,
}: {
    supabase: Awaited<ReturnType<typeof createClient>>;
    salonId: string;
    trabajadorId: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
}) {
    const diaSemana = new Date(`${fecha}T00:00:00`).getDay();
    const inicio = horaAMinutos(horaInicio);
    const fin = horaAMinutos(horaFin);

    const { data: horario, error: horarioError } = await supabase
        .from("horarios_trabajadores")
        .select("trabaja, hora_inicio, hora_fin, hora_descanso_inicio, hora_descanso_fin")
        .eq("salon_id", salonId)
        .eq("trabajador_id", trabajadorId)
        .eq("dia_semana", diaSemana)
        .maybeSingle();

    if (horarioError) return `No fue posible consultar el horario: ${horarioError.message}`;
    if (!horario || !horario.trabaja) return "El trabajador no labora ese día.";

    const jornadaInicio = horaAMinutos(horario.hora_inicio);
    const jornadaFin = horaAMinutos(horario.hora_fin);

    if (inicio < jornadaInicio || fin > jornadaFin) {
        return "El servicio queda fuera del horario laboral.";
    }

    if (horario.hora_descanso_inicio && horario.hora_descanso_fin) {
        const descansoInicio = horaAMinutos(horario.hora_descanso_inicio);
        const descansoFin = horaAMinutos(horario.hora_descanso_fin);
        if (seSuperponen(inicio, fin, descansoInicio, descansoFin)) {
            return "El horario coincide con el descanso del trabajador.";
        }
    }

    const { data: bloqueos } = await supabase
        .from("bloqueos_agenda")
        .select("titulo, hora_inicio, hora_fin, todo_el_dia")
        .eq("salon_id", salonId)
        .eq("estado", "ACTIVO")
        .or(`trabajador_id.eq.${trabajadorId},trabajador_id.is.null`)
        .lte("fecha_inicio", fecha)
        .gte("fecha_fin", fecha);

    for (const bloqueo of bloqueos ?? []) {
        if (bloqueo.todo_el_dia) return `Agenda bloqueada: ${bloqueo.titulo}.`;
        if (bloqueo.hora_inicio && bloqueo.hora_fin) {
            if (seSuperponen(inicio, fin, horaAMinutos(bloqueo.hora_inicio), horaAMinutos(bloqueo.hora_fin))) {
                return `Coincide con el bloqueo: ${bloqueo.titulo}.`;
            }
        }
    }

    const { data: ocupadas, error: ocupadasError } = await supabase
        .from("cita_servicios")
        .select("hora_inicio, hora_fin, citas!inner(fecha, estado)")
        .eq("salon_id", salonId)
        .eq("trabajador_id", trabajadorId)
        .eq("citas.fecha", fecha);

    if (ocupadasError) return `No fue posible revisar citas existentes: ${ocupadasError.message}`;

    for (const fila of ocupadas ?? []) {
        const cita = Array.isArray(fila.citas) ? fila.citas[0] : fila.citas;
        if (!cita || ["CANCELADA", "REPROGRAMADA", "NO_ASISTIO"].includes(cita.estado)) continue;
        if (seSuperponen(inicio, fin, horaAMinutos(fila.hora_inicio), horaAMinutos(fila.hora_fin))) {
            return "El trabajador ya tiene otra cita durante ese horario.";
        }
    }

    return null;
}

export async function crearCita(datos: DatosNuevaCita): Promise<ResultadoCita> {
    try {
        if (!datos.clienteId || !datos.sucursalId || !datos.fecha || !datos.horaInicio) {
            return { exito: false, mensaje: "Completa cliente, sucursal, fecha y hora." };
        }

        if (datos.servicios.length === 0) {
            return { exito: false, mensaje: "Agrega al menos un servicio." };
        }

        const contexto = await obtenerContexto();
        if (contexto.error || !contexto.perfil || !contexto.userId) {
            return { exito: false, mensaje: contexto.error ?? "No fue posible verificar tu sesión." };
        }

        const { supabase, perfil, userId } = contexto;

        const { data: cliente } = await supabase
            .from("clientes")
            .select("id")
            .eq("id", datos.clienteId)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .single();

        if (!cliente) return { exito: false, mensaje: "El cliente no es válido o está inactivo." };

        let cursor = horaAMinutos(datos.horaInicio);
        let subtotal = 0;
        let descuentoTotal = 0;
        let anticipo = 0;
        let requiereAnticipo = false;
        const filas: Record<string, unknown>[] = [];

        for (let i = 0; i < datos.servicios.length; i += 1) {
            const entrada = datos.servicios[i];

            const { data: servicio } = await supabase
                .from("servicios")
                .select("id, nombre, estado, permite_citas, requiere_anticipo, monto_anticipo, tipo_comision_general, comision_general")
                .eq("id", entrada.servicioId)
                .eq("salon_id", perfil.salon_id)
                .single();

            const { data: trabajador } = await supabase
                .from("trabajadores")
                .select("id, nombre_completo, estado, permite_citas, tipo_comision, comision_general")
                .eq("id", entrada.trabajadorId)
                .eq("salon_id", perfil.salon_id)
                .single();

            const { data: relacion } = await supabase
                .from("trabajador_servicios")
                .select("usa_comision_especial, tipo_comision_especial, comision_especial, estado")
                .eq("servicio_id", entrada.servicioId)
                .eq("trabajador_id", entrada.trabajadorId)
                .eq("salon_id", perfil.salon_id)
                .eq("estado", "ACTIVO")
                .maybeSingle();

            if (!servicio || servicio.estado !== "ACTIVO" || !servicio.permite_citas) {
                return { exito: false, mensaje: "Uno de los servicios no está disponible para citas." };
            }

            if (!trabajador || trabajador.estado !== "ACTIVO" || !trabajador.permite_citas) {
                return { exito: false, mensaje: "Uno de los trabajadores no está disponible para citas." };
            }

            if (!relacion) {
                return { exito: false, mensaje: `${trabajador.nombre_completo} no está autorizado para ${servicio.nombre}.` };
            }

            if (entrada.precio < 0 || entrada.descuento < 0 || entrada.descuento > entrada.precio || entrada.duracionMinutos < 5) {
                return { exito: false, mensaje: "Existe un servicio con precio, descuento o duración inválida." };
            }

            const inicio = cursor;
            const fin = cursor + entrada.duracionMinutos;

            const errorDisponibilidad = await validarDisponibilidad({
                supabase,
                salonId: perfil.salon_id,
                trabajadorId: entrada.trabajadorId,
                fecha: datos.fecha,
                horaInicio: minutosAHora(inicio),
                horaFin: minutosAHora(fin),
            });

            if (errorDisponibilidad) {
                return { exito: false, mensaje: `${trabajador.nombre_completo}: ${errorDisponibilidad}` };
            }

            let tipoComision = trabajador.tipo_comision;
            let valorComision = Number(trabajador.comision_general ?? 0);

            if (servicio.tipo_comision_general !== "USAR_TRABAJADOR") {
                tipoComision = servicio.tipo_comision_general;
                valorComision = tipoComision === "SIN_COMISION" ? 0 : Number(servicio.comision_general ?? 0);
            }

            if (relacion.usa_comision_especial && relacion.tipo_comision_especial) {
                tipoComision = relacion.tipo_comision_especial;
                valorComision = tipoComision === "SIN_COMISION" ? 0 : Number(relacion.comision_especial ?? 0);
            }

            const totalServicio = entrada.precio - entrada.descuento;
            const montoComision = tipoComision === "PORCENTAJE"
                ? Number(((totalServicio * valorComision) / 100).toFixed(2))
                : tipoComision === "MONTO_FIJO"
                    ? valorComision
                    : 0;

            filas.push({
                salon_id: perfil.salon_id,
                servicio_id: entrada.servicioId,
                trabajador_id: entrada.trabajadorId,
                nombre_servicio: servicio.nombre,
                precio_unitario: entrada.precio,
                descuento: entrada.descuento,
                total: totalServicio,
                duracion_minutos: entrada.duracionMinutos,
                hora_inicio: minutosAHora(inicio),
                hora_fin: minutosAHora(fin),
                orden: i + 1,
                estado: "PENDIENTE",
                tipo_comision: tipoComision,
                valor_comision: valorComision,
                monto_comision_calculado: montoComision,
                notas: entrada.notas.trim() || null,
                actualizado_en: new Date().toISOString(),
            });

            subtotal += entrada.precio;
            descuentoTotal += entrada.descuento;
            if (servicio.requiere_anticipo) {
                requiereAnticipo = true;
                anticipo += Number(servicio.monto_anticipo ?? 0);
            }
            cursor = fin;
        }

        const total = subtotal - descuentoTotal;

        const { data: cita, error: citaError } = await supabase
            .from("citas")
            .insert({
                salon_id: perfil.salon_id,
                sucursal_id: datos.sucursalId,
                cliente_id: datos.clienteId,
                fecha: datos.fecha,
                hora_inicio: datos.horaInicio,
                hora_fin: minutosAHora(cursor),
                duracion_total_minutos: cursor - horaAMinutos(datos.horaInicio),
                subtotal,
                descuento: descuentoTotal,
                total,
                requiere_anticipo: requiereAnticipo,
                monto_anticipo_requerido: Math.min(anticipo, total),
                monto_anticipo_pagado: 0,
                estado: "PENDIENTE",
                origen: datos.origen,
                notas: datos.notas.trim() || null,
                notas_internas: datos.notasInternas.trim() || null,
                creado_por: userId,
                actualizado_por: userId,
                actualizado_en: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (citaError || !cita) {
            return { exito: false, mensaje: citaError ? `No fue posible crear la cita: ${citaError.message}` : "No fue posible obtener la cita creada." };
        }

        const { error: serviciosError } = await supabase
            .from("cita_servicios")
            .insert(filas.map((fila) => ({ ...fila, cita_id: cita.id })));

        if (serviciosError) {
            await supabase.from("citas").delete().eq("id", cita.id).eq("salon_id", perfil.salon_id);
            return { exito: false, mensaje: `La cita no pudo completarse: ${serviciosError.message}` };
        }

        await supabase.from("citas_historial").insert({
            salon_id: perfil.salon_id,
            cita_id: cita.id,
            usuario_id: userId,
            tipo_evento: "CREADA",
            estado_nuevo: "PENDIENTE",
            descripcion: "Cita creada desde el formulario de agenda.",
            datos_nuevos: { fecha: datos.fecha, horaInicio: datos.horaInicio, total },
        });

        revalidatePath("/agenda");
        revalidatePath(`/clientes/${datos.clienteId}`);

        return { exito: true, mensaje: "Cita creada correctamente.", citaId: cita.id };
    } catch (error) {
        console.error("Error creando cita:", error);
        return { exito: false, mensaje: "Ocurrió un error inesperado al crear la cita." };
    }
}