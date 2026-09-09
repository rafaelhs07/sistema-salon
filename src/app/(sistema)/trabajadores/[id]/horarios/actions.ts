"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type DiaHorario = {
    diaSemana: number;
    trabaja: boolean;
    horaInicio: string;
    horaFin: string;
    tieneDescanso: boolean;
    horaDescansoInicio: string;
    horaDescansoFin: string;
};

export type ResultadoHorario = {
    exito: boolean;
    mensaje: string;
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
            error: "No fue posible verificar tu perfil.",
        };
    }

    if (perfil.estado !== "ACTIVO") {
        return {
            supabase,
            perfil: null,
            error: "Tu usuario se encuentra inactivo.",
        };
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(perfil.rol)) {
        return {
            supabase,
            perfil: null,
            error: "No tienes permisos para modificar horarios.",
        };
    }

    return {
        supabase,
        perfil,
        error: null,
    };
}

function validarHorario(
    horarios: DiaHorario[],
): ResultadoHorario | null {
    if (horarios.length !== 7) {
        return {
            exito: false,
            mensaje:
                "La configuración debe contener los siete días de la semana.",
        };
    }

    const diasRecibidos = new Set(
        horarios.map((horario) => horario.diaSemana),
    );

    if (diasRecibidos.size !== 7) {
        return {
            exito: false,
            mensaje: "Existen días duplicados en el horario.",
        };
    }

    for (const horario of horarios) {
        if (
            horario.diaSemana < 0 ||
            horario.diaSemana > 6
        ) {
            return {
                exito: false,
                mensaje: "Existe un día de la semana inválido.",
            };
        }

        if (!horario.trabaja) {
            continue;
        }

        if (!horario.horaInicio || !horario.horaFin) {
            return {
                exito: false,
                mensaje:
                    "Todos los días laborales deben tener hora de entrada y salida.",
            };
        }

        if (horario.horaInicio >= horario.horaFin) {
            return {
                exito: false,
                mensaje:
                    "La hora de salida debe ser posterior a la hora de entrada.",
            };
        }

        if (horario.tieneDescanso) {
            if (
                !horario.horaDescansoInicio ||
                !horario.horaDescansoFin
            ) {
                return {
                    exito: false,
                    mensaje:
                        "Completa la hora de inicio y final del descanso.",
                };
            }

            if (
                horario.horaDescansoInicio >=
                horario.horaDescansoFin
            ) {
                return {
                    exito: false,
                    mensaje:
                        "La hora final del descanso debe ser posterior a su inicio.",
                };
            }

            if (
                horario.horaDescansoInicio <
                horario.horaInicio ||
                horario.horaDescansoFin > horario.horaFin
            ) {
                return {
                    exito: false,
                    mensaje:
                        "El descanso debe estar dentro del horario laboral.",
                };
            }
        }
    }

    return null;
}

export async function guardarHorariosTrabajador(
    trabajadorId: string,
    horarios: DiaHorario[],
): Promise<ResultadoHorario> {
    try {
        if (!trabajadorId) {
            return {
                exito: false,
                mensaje: "No se recibió el trabajador.",
            };
        }

        const validacion = validarHorario(horarios);

        if (validacion) {
            return validacion;
        }

        const contexto =
            await obtenerContextoAdministrador();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar los permisos.",
            };
        }

        const { supabase, perfil } = contexto;

        const { data: trabajador, error: trabajadorError } =
            await supabase
                .from("trabajadores")
                .select("id, salon_id, sucursal_id")
                .eq("id", trabajadorId)
                .eq("salon_id", perfil.salon_id)
                .single();

        if (trabajadorError || !trabajador) {
            return {
                exito: false,
                mensaje:
                    "El trabajador no existe o no pertenece a tu salón.",
            };
        }

        const filas = horarios.map((horario) => ({
            salon_id: perfil.salon_id,
            sucursal_id: trabajador.sucursal_id,
            trabajador_id: trabajadorId,
            dia_semana: horario.diaSemana,
            trabaja: horario.trabaja,

            hora_inicio: horario.trabaja
                ? horario.horaInicio
                : null,

            hora_fin: horario.trabaja
                ? horario.horaFin
                : null,

            hora_descanso_inicio:
                horario.trabaja && horario.tieneDescanso
                    ? horario.horaDescansoInicio
                    : null,

            hora_descanso_fin:
                horario.trabaja && horario.tieneDescanso
                    ? horario.horaDescansoFin
                    : null,

            actualizado_en: new Date().toISOString(),
        }));

        const { error } = await supabase
            .from("horarios_trabajadores")
            .upsert(filas, {
                onConflict: "trabajador_id,dia_semana",
            });

        if (error) {
            console.error(
                "Error guardando horarios:",
                error,
            );

            return {
                exito: false,
                mensaje: `No fue posible guardar los horarios: ${error.message}`,
            };
        }

        revalidatePath(
            `/trabajadores/${trabajadorId}/horarios`,
        );

        revalidatePath("/trabajadores");

        return {
            exito: true,
            mensaje: "Horario guardado correctamente.",
        };
    } catch (error) {
        console.error(
            "Error inesperado guardando horarios:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al guardar el horario.",
        };
    }
}