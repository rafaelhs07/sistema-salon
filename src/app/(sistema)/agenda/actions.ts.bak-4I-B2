"use server";

import { createClient } from "@/lib/supabase/server";

export type FiltrosAgenda = {
    fechaDesde: string;
    fechaHasta: string;
    sucursalId?: string;
    trabajadorId?: string;
};

export type CitaAgenda = {
    id: string;
    codigo_cita: string | null;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    total: number;
    notas: string | null;
    cliente_id: string;
    sucursal_id: string;

    // Datos calculados para habilitar el cobro desde Agenda.
    tiene_venta_activa: boolean;
    tiene_caja_abierta: boolean;

    clientes: {
        nombre_completo: string;
        telefono: string | null;
        whatsapp: string | null;
    } | null;

    sucursales: {
        nombre: string;
    } | null;

    cita_servicios: {
        id: string;
        nombre_servicio: string;
        trabajador_id: string;
        hora_inicio: string;
        hora_fin: string;
        duracion_minutos: number;
        trabajadores: {
            nombre_completo: string;
            color_calendario: string;
        } | null;
    }[];
};

export type BloqueoAgenda = {
    id: string;
    trabajador_id: string | null;
    titulo: string;
    descripcion: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    hora_inicio: string | null;
    hora_fin: string | null;
    todo_el_dia: boolean;
    tipo: string;
    estado: string;
    trabajadores: {
        nombre_completo: string;
        color_calendario: string;
    } | null;
};

export type ResultadoAgenda = {
    exito: boolean;
    mensaje: string;
    citas: CitaAgenda[];
    bloqueos: BloqueoAgenda[];
};

async function obtenerContexto() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        return {
            supabase,
            perfil: null,
            error: "Tu sesion ha vencido.",
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
            error:
                "No fue posible verificar tu perfil.",
        };
    }

    return {
        supabase,
        perfil,
        error: null,
    };
}

export async function cargarAgenda(
    filtros: FiltrosAgenda,
): Promise<ResultadoAgenda> {
    try {
        const contexto = await obtenerContexto();

        if (
            contexto.error ||
            !contexto.perfil
        ) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar tu sesion.",
                citas: [],
                bloqueos: [],
            };
        }

        const { supabase, perfil } = contexto;

        let consultaCitas = supabase
            .from("citas")
            .select(`
                id,
                codigo_cita,
                fecha,
                hora_inicio,
                hora_fin,
                estado,
                total,
                notas,
                cliente_id,
                sucursal_id,
                clientes (
                    nombre_completo,
                    telefono,
                    whatsapp
                ),
                sucursales (
                    nombre
                ),
                cita_servicios (
                    id,
                    nombre_servicio,
                    trabajador_id,
                    hora_inicio,
                    hora_fin,
                    duracion_minutos,
                    trabajadores (
                        nombre_completo,
                        color_calendario
                    )
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .gte("fecha", filtros.fechaDesde)
            .lte("fecha", filtros.fechaHasta)
            .not(
                "estado",
                "in",
                '("CANCELADA","REPROGRAMADA")',
            )
            .order("fecha", {
                ascending: true,
            })
            .order("hora_inicio", {
                ascending: true,
            });

        if (filtros.sucursalId) {
            consultaCitas = consultaCitas.eq(
                "sucursal_id",
                filtros.sucursalId,
            );
        }

        const {
            data: citas,
            error: citasError,
        } = await consultaCitas;

        if (citasError) {
            return {
                exito: false,
                mensaje: `No fue posible cargar las citas: ${citasError.message}`,
                citas: [],
                bloqueos: [],
            };
        }

        let citasBase =
            (citas ??
                []) as unknown as Omit<
                    CitaAgenda,
                    | "tiene_venta_activa"
                    | "tiene_caja_abierta"
                >[];

        citasBase = citasBase.filter(
            (cita) =>
                ![
                    "CANCELADA",
                    "REPROGRAMADA",
                ].includes(cita.estado),
        );

        if (filtros.trabajadorId) {
            citasBase = citasBase.filter(
                (cita) =>
                    cita.cita_servicios.some(
                        (servicio) =>
                            servicio.trabajador_id ===
                            filtros.trabajadorId,
                    ),
            );
        }

        const idsCitasFinalizadas = citasBase
            .filter(
                (cita) =>
                    cita.estado ===
                    "FINALIZADA",
            )
            .map((cita) => cita.id);

        const sucursalesFinalizadas = [
            ...new Set(
                citasBase
                    .filter(
                        (cita) =>
                            cita.estado ===
                            "FINALIZADA",
                    )
                    .map(
                        (cita) =>
                            cita.sucursal_id,
                    ),
            ),
        ];

        const [
            resultadoVentas,
            resultadoCajas,
        ] = await Promise.all([
            idsCitasFinalizadas.length > 0
                ? supabase
                    .from("ventas")
                    .select("cita_id")
                    .eq(
                        "salon_id",
                        perfil.salon_id,
                    )
                    .eq("estado", "ACTIVA")
                    .in(
                        "cita_id",
                        idsCitasFinalizadas,
                    )
                : Promise.resolve({
                    data: [],
                    error: null,
                }),

            sucursalesFinalizadas.length > 0
                ? supabase
                    .from("cajas_sesiones")
                    .select("sucursal_id")
                    .eq(
                        "salon_id",
                        perfil.salon_id,
                    )
                    .eq("estado", "ABIERTA")
                    .in(
                        "sucursal_id",
                        sucursalesFinalizadas,
                    )
                : Promise.resolve({
                    data: [],
                    error: null,
                }),
        ]);

        if (resultadoVentas.error) {
            console.error(
                "Error comprobando ventas de la agenda:",
                resultadoVentas.error,
            );
        }

        if (resultadoCajas.error) {
            console.error(
                "Error comprobando cajas de la agenda:",
                resultadoCajas.error,
            );
        }

        const citasCobradas = new Set(
            (resultadoVentas.data ?? [])
                .map(
                    (venta) =>
                        venta.cita_id,
                )
                .filter(Boolean),
        );

        const sucursalesConCaja = new Set(
            (resultadoCajas.data ?? [])
                .map(
                    (caja) =>
                        caja.sucursal_id,
                )
                .filter(Boolean),
        );

        const citasFiltradas: CitaAgenda[] =
            citasBase.map((cita) => ({
                ...cita,
                tiene_venta_activa:
                    citasCobradas.has(cita.id),
                tiene_caja_abierta:
                    sucursalesConCaja.has(
                        cita.sucursal_id,
                    ),
            }));

        let consultaBloqueos = supabase
            .from("bloqueos_agenda")
            .select(`
                id,
                trabajador_id,
                titulo,
                descripcion,
                fecha_inicio,
                fecha_fin,
                hora_inicio,
                hora_fin,
                todo_el_dia,
                tipo,
                estado,
                trabajadores (
                    nombre_completo,
                    color_calendario
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .lte(
                "fecha_inicio",
                filtros.fechaHasta,
            )
            .gte(
                "fecha_fin",
                filtros.fechaDesde,
            );

        if (filtros.sucursalId) {
            consultaBloqueos =
                consultaBloqueos.eq(
                    "sucursal_id",
                    filtros.sucursalId,
                );
        }

        if (filtros.trabajadorId) {
            consultaBloqueos =
                consultaBloqueos.or(
                    `trabajador_id.eq.${filtros.trabajadorId},trabajador_id.is.null`,
                );
        }

        const {
            data: bloqueos,
            error: bloqueosError,
        } = await consultaBloqueos;

        if (bloqueosError) {
            return {
                exito: false,
                mensaje: `No fue posible cargar los bloqueos: ${bloqueosError.message}`,
                citas: citasFiltradas,
                bloqueos: [],
            };
        }

        return {
            exito: true,
            mensaje: "",
            citas: citasFiltradas,
            bloqueos:
                (bloqueos ??
                    []) as unknown as BloqueoAgenda[],
        };
    } catch (error) {
        console.error(
            "Error cargando agenda:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrio un error inesperado al cargar la agenda.",
            citas: [],
            bloqueos: [],
        };
    }
}