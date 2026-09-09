import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import HorariosClient, {
    type HorarioListado,
} from "./HorariosClient";

type TrabajadorConsulta = {
    id: string;
    nombre_completo: string;
    color_calendario: string;
    estado: string;
    permite_citas: boolean;
    sucursales: {
        nombre: string;
    } | null;
};

type ConfiguracionConsulta = {
    hora_apertura: string;
    hora_cierre: string;
};

export default async function HorariosTrabajadorPage({
    params,
}: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;

    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        redirect("/login");
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
        redirect("/login");
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(perfil.rol)) {
        redirect("/inicio");
    }

    const [
        resultadoTrabajador,
        resultadoHorarios,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("trabajadores")
            .select(`
        id,
        nombre_completo,
        color_calendario,
        estado,
        permite_citas,
        sucursales (
          nombre
        )
      `)
            .eq("id", id)
            .eq("salon_id", perfil.salon_id)
            .single(),

        supabase
            .from("horarios_trabajadores")
            .select(`
        id,
        dia_semana,
        trabaja,
        hora_inicio,
        hora_fin,
        hora_descanso_inicio,
        hora_descanso_fin
      `)
            .eq("trabajador_id", id)
            .eq("salon_id", perfil.salon_id)
            .order("dia_semana", {
                ascending: true,
            }),

        supabase
            .from("configuracion_salon")
            .select("hora_apertura, hora_cierre")
            .eq("salon_id", perfil.salon_id)
            .single(),
    ]);

    if (
        resultadoTrabajador.error ||
        !resultadoTrabajador.data
    ) {
        notFound();
    }

    if (resultadoHorarios.error) {
        console.error(
            "Error cargando horarios:",
            resultadoHorarios.error,
        );
    }

    const trabajador =
        resultadoTrabajador.data as unknown as TrabajadorConsulta;

    const configuracion =
        resultadoConfiguracion.data as ConfiguracionConsulta | null;

    const horaApertura = normalizarHora(
        configuracion?.hora_apertura ?? "08:00",
    );

    const horaCierre = normalizarHora(
        configuracion?.hora_cierre ?? "18:00",
    );

    const horariosIniciales = construirSemanaCompleta(
        (resultadoHorarios.data ??
            []) as HorarioListado[],
        horaApertura,
        horaCierre,
    );

    return (
        <div className="mx-auto max-w-7xl">
            <HorariosClient
                trabajador={{
                    id: trabajador.id,
                    nombreCompleto: trabajador.nombre_completo,
                    colorCalendario:
                        trabajador.color_calendario,
                    estado: trabajador.estado,
                    permiteCitas: trabajador.permite_citas,
                    sucursalNombre:
                        trabajador.sucursales?.nombre ??
                        "Sin sucursal",
                }}
                horariosIniciales={horariosIniciales}
                horaAperturaSalon={horaApertura}
                horaCierreSalon={horaCierre}
            />
        </div>
    );
}

function normalizarHora(hora: string) {
    return hora.slice(0, 5);
}

function construirSemanaCompleta(
    horarios: HorarioListado[],
    horaApertura: string,
    horaCierre: string,
): HorarioListado[] {
    return Array.from(
        {
            length: 7,
        },
        (_, diaSemana) => {
            const existente = horarios.find(
                (horario) =>
                    horario.dia_semana === diaSemana,
            );

            if (existente) {
                return {
                    ...existente,
                    hora_inicio: existente.hora_inicio
                        ? normalizarHora(existente.hora_inicio)
                        : "",
                    hora_fin: existente.hora_fin
                        ? normalizarHora(existente.hora_fin)
                        : "",
                    hora_descanso_inicio:
                        existente.hora_descanso_inicio
                            ? normalizarHora(
                                existente.hora_descanso_inicio,
                            )
                            : "",
                    hora_descanso_fin:
                        existente.hora_descanso_fin
                            ? normalizarHora(
                                existente.hora_descanso_fin,
                            )
                            : "",
                };
            }

            return {
                id: null,
                dia_semana: diaSemana,
                trabaja: diaSemana !== 0,
                hora_inicio:
                    diaSemana === 0 ? "" : horaApertura,
                hora_fin:
                    diaSemana === 0 ? "" : horaCierre,
                hora_descanso_inicio: "",
                hora_descanso_fin: "",
            };
        },
    );
}