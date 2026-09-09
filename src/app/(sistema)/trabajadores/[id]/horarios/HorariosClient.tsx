"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    Clock3,
    Coffee,
    Copy,
    Info,
    LoaderCircle,
    RotateCcw,
    Save,
    UserRound,
    X,
    XCircle,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";

import {
    guardarHorariosTrabajador,
    type DiaHorario,
} from "./actions";

export type HorarioListado = {
    id: string | null;
    dia_semana: number;
    trabaja: boolean;
    hora_inicio: string | null;
    hora_fin: string | null;
    hora_descanso_inicio: string | null;
    hora_descanso_fin: string | null;
};

type TrabajadorHorario = {
    id: string;
    nombreCompleto: string;
    colorCalendario: string;
    estado: string;
    permiteCitas: boolean;
    sucursalNombre: string;
};

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

type HorariosClientProps = {
    trabajador: TrabajadorHorario;
    horariosIniciales: HorarioListado[];
    horaAperturaSalon: string;
    horaCierreSalon: string;
};

const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
];

export default function HorariosClient({
    trabajador,
    horariosIniciales,
    horaAperturaSalon,
    horaCierreSalon,
}: HorariosClientProps) {
    const [horarios, setHorarios] = useState<DiaHorario[]>(
        () => transformarHorarios(horariosIniciales),
    );

    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [guardando, iniciarGuardado] =
        useTransition();

    const horariosOriginales = useMemo(
        () => transformarHorarios(horariosIniciales),
        [horariosIniciales],
    );

    const hayCambios =
        JSON.stringify(horarios) !==
        JSON.stringify(horariosOriginales);

    const resumen = useMemo(() => {
        const diasLaborales = horarios.filter(
            (horario) => horario.trabaja,
        ).length;

        const minutosSemanales = horarios.reduce(
            (total, horario) => {
                if (
                    !horario.trabaja ||
                    !horario.horaInicio ||
                    !horario.horaFin
                ) {
                    return total;
                }

                let minutos =
                    convertirAMinutos(horario.horaFin) -
                    convertirAMinutos(horario.horaInicio);

                if (
                    horario.tieneDescanso &&
                    horario.horaDescansoInicio &&
                    horario.horaDescansoFin
                ) {
                    minutos -=
                        convertirAMinutos(
                            horario.horaDescansoFin,
                        ) -
                        convertirAMinutos(
                            horario.horaDescansoInicio,
                        );
                }

                return total + Math.max(minutos, 0);
            },
            0,
        );

        return {
            diasLaborales,
            horasSemanales: minutosSemanales / 60,
        };
    }, [horarios]);

    function actualizarDia(
        diaSemana: number,
        cambios: Partial<DiaHorario>,
    ) {
        setHorarios((actuales) =>
            actuales.map((horario) =>
                horario.diaSemana === diaSemana
                    ? {
                        ...horario,
                        ...cambios,
                    }
                    : horario,
            ),
        );

        setMensaje(null);
    }

    function cambiarDiaLaboral(
        diaSemana: number,
        trabaja: boolean,
    ) {
        actualizarDia(diaSemana, {
            trabaja,

            horaInicio: trabaja
                ? horaAperturaSalon
                : "",

            horaFin: trabaja
                ? horaCierreSalon
                : "",

            tieneDescanso: false,
            horaDescansoInicio: "",
            horaDescansoFin: "",
        });
    }

    function copiarHorario(
        horarioOrigen: DiaHorario,
    ) {
        setHorarios((actuales) =>
            actuales.map((horario) => {
                if (
                    horario.diaSemana ===
                    horarioOrigen.diaSemana
                ) {
                    return horario;
                }

                if (!horario.trabaja) {
                    return horario;
                }

                return {
                    ...horario,
                    horaInicio: horarioOrigen.horaInicio,
                    horaFin: horarioOrigen.horaFin,
                    tieneDescanso:
                        horarioOrigen.tieneDescanso,
                    horaDescansoInicio:
                        horarioOrigen.horaDescansoInicio,
                    horaDescansoFin:
                        horarioOrigen.horaDescansoFin,
                };
            }),
        );

        setMensaje({
            tipo: "EXITO",
            texto:
                "El horario fue copiado a los demás días laborales.",
        });
    }

    function restaurarHorarios() {
        setHorarios(horariosOriginales);
        setMensaje(null);
    }

    function guardar() {
        setMensaje(null);

        iniciarGuardado(async () => {
            const resultado =
                await guardarHorariosTrabajador(
                    trabajador.id,
                    horarios,
                );

            setMensaje({
                tipo: resultado.exito ? "EXITO" : "ERROR",
                texto: resultado.mensaje,
            });
        });
    }

    return (
        <div className= "space-y-6" >
        <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8" >
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-[#C79AA1]/15 blur-3xl" />

                    <div className="relative" >
                        <Link
            href="/trabajadores"
    className = "inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
        >
        <ArrowLeft className="h-4 w-4" />
            Volver a trabajadores
                </Link>

                < div className = "mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between" >
                    <div className="flex items-start gap-4" >
                        <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
    style = {{
        backgroundColor:
        trabajador.colorCalendario,
                }
}
              >
    <CalendarClock className="h-7 w-7" />
        </div>

        < div >
        <p className="text-sm font-semibold text-[#B9C8C1]" >
            Horario semanal
                </p>

                < h1 className = "mt-1 text-3xl font-bold tracking-tight sm:text-4xl" >
                    { trabajador.nombreCompleto }
                    </h1>

                    < p className = "mt-3 text-[#CFD9D4]" >
                        { trabajador.sucursalNombre }
                        </p>
                        </div>
                        </div>

                        < div className = "grid gap-3 sm:grid-cols-2" >
                            <ResumenSuperior
                titulo="Días laborales"
valor = {`${resumen.diasLaborales} días`}
              />

    < ResumenSuperior
titulo = "Horas semanales"
valor = {`${formatearHoras(
    resumen.horasSemanales,
)} h`}
              />
    </div>
    </div>
    </div>
    </section>

{
    !trabajador.permiteCitas && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#E6D7B9] bg-[#FAF0DC] p-4 text-[#8A672A]" >
            <Info className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                <p className="font-semibold" >
                    Este trabajador no recibe citas
                        </p>

                        < p className = "mt-1 text-sm leading-6" >
                            Puedes configurar su horario, pero no aparecerá
              disponible en la agenda hasta activar la opción
              “Puede recibir citas”.
    </p>
        </div>
        </div>
      )
}

{
    mensaje && (
        <MensajeEstado
          mensaje={ mensaje }
    cerrar = {() => setMensaje(null)
}
        />
      )}

<section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]" >
    <header className="flex flex-col gap-4 border-b border-[#E8ECE9] bg-[#FBFCFA] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between" >
        <div>
        <h2 className="text-xl font-bold text-[#24302C]" >
            Jornada semanal
                </h2>

                < p className = "mt-1 text-sm leading-6 text-[#6B756F]" >
                    Activa los días laborales y define las horas de
entrada, salida y descanso.
            </p>
    </div>

    < div className = "rounded-xl bg-[#EEF2EF] px-4 py-3 text-sm text-[#52605A]" >
        Horario general del salón: { " " }
<strong>
    { formatearHora(horaAperturaSalon) } –{ " " }
{ formatearHora(horaCierreSalon) }
</strong>
    </div>
    </header>

    < div className = "divide-y divide-[#E8ECE9]" >
    {
        horarios.map((horario) => (
            <FilaHorario
              key= { horario.diaSemana }
              horario = { horario }
              actualizar = {(cambios) =>
            actualizarDia(
                horario.diaSemana,
                cambios,
            )
              }
cambiarDiaLaboral = {(trabaja) =>
cambiarDiaLaboral(
    horario.diaSemana,
    trabaja,
)
              }
copiar = {() => copiarHorario(horario)}
            />
          ))}
</div>
    </section>

    < div className = "sticky bottom-4 z-20 rounded-2xl border border-[#DCE3DF] bg-white/95 p-4 shadow-[0_14px_40px_rgba(36,48,44,0.12)] backdrop-blur-xl" >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" >
            <div className="flex items-start gap-3" >
                <div
              className={
    [
        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        hayCambios
            ? "bg-[#FAF0DC] text-[#A77C2D]"
            : "bg-[#E3EEE8] text-[#527865]",
    ].join(" ")
}
            >
    <Clock3 className="h-5 w-5" />
        </div>

        < div >
        <p className="text-sm font-semibold text-[#33413B]" >
        {
            hayCambios
            ? "Tienes cambios sin guardar"
                : "El horario está actualizado"
        }
            </p>

            < p className = "mt-1 text-xs text-[#76817B]" >
                Los cambios se aplicarán en la agenda.
              </p>
                    </div>
                    </div>

                    < div className = "flex flex-col-reverse gap-3 sm:flex-row" >
                        <button
              type="button"
onClick = { restaurarHorarios }
disabled = {!hayCambios || guardando}
className = "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE3DF] bg-[#EEF2EF] px-5 text-sm font-bold text-[#43524B] transition hover:bg-[#E3EAE6] disabled:cursor-not-allowed disabled:opacity-50"
    >
    <RotateCcw className="h-4 w-4" />
        Descartar cambios
            </button>

            < button
type = "button"
onClick = { guardar }
disabled = {!hayCambios || guardando}
className = "inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-xl bg-[#6F8F83] px-5 text-sm font-bold text-white transition hover:bg-[#5E7D71] disabled:cursor-not-allowed disabled:bg-[#AAB9B3]"
    >
{
    guardando?(
                <>
    <LoaderCircle className="h-5 w-5 animate-spin" />
        Guardando...
</>
              ) : (
    <>
    <Save className= "h-5 w-5" />
    Guardar horario
        </>
              )}
</button>
    </div>
    </div>
    </div>
    </div>
  );
}

function FilaHorario({
    horario,
    actualizar,
    cambiarDiaLaboral,
    copiar,
}: {
    horario: DiaHorario;
    actualizar: (
        cambios: Partial<DiaHorario>,
    ) => void;
    cambiarDiaLaboral: (trabaja: boolean) => void;
    copiar: () => void;
}) {
    return (
        <article
      className= {
            [
            "p-5 transition sm:p-6",
            horario.trabaja
                ? "bg-white"
                : "bg-[#F7F8F6]",
      ].join(" ")
        }
        >
        <div className="grid gap-5 xl:grid-cols-[180px_1fr_auto] xl:items-start" >
            <div className="flex items-center justify-between gap-4 xl:block" >
                <div>
                <p className="font-bold text-[#24302C]" >
                    { diasSemana[horario.diaSemana]}
                    </p>

                    < p className = "mt-1 text-xs text-[#76817B]" >
                    {
                        horario.trabaja
                            ? "Día laboral"
                            : "Día libre"
                    }
                        </p>
                        </div>

                        < InterruptorDia
    activo = { horario.trabaja }
    cambiar = { cambiarDiaLaboral }
        />
        </div>

    {
        horario.trabaja ? (
            <div className= "space-y-4" >
            <div className="grid gap-4 sm:grid-cols-2" >
                <CampoHora
                etiqueta="Hora de entrada"
        valor = { horario.horaInicio }
        cambiar = {(valor) =>
        actualizar({
            horaInicio: valor,
        })
    }
              />

        < CampoHora
    etiqueta = "Hora de salida"
    valor = { horario.horaFin }
    cambiar = {(valor) =>
    actualizar({
        horaFin: valor,
    })
}
              />
    </div>

    < div className = "rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4" >
        <div className="flex items-center justify-between gap-4" >
            <div className="flex items-center gap-3" >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2EF] text-[#607169]" >
                    <Coffee className="h-4 w-4" />
                        </div>

                        < div >
                        <p className="text-sm font-semibold text-[#33413B]" >
                            Tiempo de descanso
                                </p>

                                < p className = "mt-0.5 text-xs text-[#76817B]" >
                                    Opcional
                                    </p>
                                    </div>
                                    </div>

                                    < InterruptorDia
activo = { horario.tieneDescanso }
cambiar = {(activo) =>
actualizar({
    tieneDescanso: activo,
    horaDescansoInicio: activo
        ? horario.horaDescansoInicio ||
        "12:00"
        : "",
    horaDescansoFin: activo
        ? horario.horaDescansoFin ||
        "13:00"
        : "",
})
                  }
                />
    </div>

{
    horario.tieneDescanso && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2" >
            <CampoHora
                    etiqueta="Inicio del descanso"
    valor = {
        horario.horaDescansoInicio
    }
    cambiar = {(valor) =>
    actualizar({
        horaDescansoInicio: valor,
    })
}
                  />

    < CampoHora
etiqueta = "Final del descanso"
valor = { horario.horaDescansoFin }
cambiar = {(valor) =>
actualizar({
    horaDescansoFin: valor,
})
                    }
                  />
    </div>
              )}
</div>
    </div>
        ) : (
    <div className= "flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-[#D8DEDA] bg-[#FBFCFA] px-5 text-center" >
    <p className="text-sm text-[#7C8781]" >
        El trabajador no estará disponible para citas
              durante este día.
            </p>
    </div>
        )}

<button
          type="button"
onClick = { copiar }
disabled = {!horario.trabaja}
title = "Copiar este horario a los demás días laborales"
className = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE3DF] bg-white px-4 text-xs font-bold text-[#52605A] transition hover:bg-[#EEF2EF] disabled:cursor-not-allowed disabled:opacity-40"
    >
    <Copy className="h-4 w-4" />
        Copiar
        </button>
        </div>
        </article>
  );
}

function CampoHora({
    etiqueta,
    valor,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    cambiar: (valor: string) => void;
}) {
    return (
        <div>
        <label className= "mb-2 block text-xs font-bold uppercase tracking-wide text-[#718079]" >
        { etiqueta }
        </label>

        < div className = "relative" >
            <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                <input
          type="time"
    value = { valor }
    required
    onChange = {(event) =>
    cambiar(event.target.value)
}
className = "h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm font-semibold text-[#24302C] outline-none transition focus:border-[#6F8F83] focus:ring-4 focus:ring-[#6F8F83]/15"
    />
    </div>
    </div>
  );
}

function InterruptorDia({
    activo,
    cambiar,
}: {
    activo: boolean;
    cambiar: (activo: boolean) => void;
}) {
    return (
        <label className= "cursor-pointer" >
        <input
        type="checkbox"
    checked = { activo }
    onChange = {(event) =>
    cambiar(event.target.checked)
}
className = "sr-only"
    />

    <span
        className={
    [
        "relative block h-7 w-12 rounded-full transition-colors",
        activo ? "bg-[#6F8F83]" : "bg-[#CCD3CF]",
    ].join(" ")
}
      >
    <span
          className={
    [
        "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
        activo ? "translate-x-6" : "translate-x-1",
    ].join(" ")
}
        />
    </span>
    </label>
  );
}

function ResumenSuperior({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className= "min-w-40 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm" >
        <p className="text-xs font-semibold text-[#B9C8C1]" >
            { titulo }
            </p>

            < p className = "mt-2 text-xl font-bold text-white" >
                { valor }
                </p>
                </div>
  );
}

function MensajeEstado({
    mensaje,
    cerrar,
}: {
    mensaje: Exclude<Mensaje, null>;
    cerrar: () => void;
}) {
    return (
        <div
      className= {
            [
            "flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-sm",
            mensaje.tipo === "EXITO"
                ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
      ].join(" ")
        }
        >
        {
            mensaje.tipo === "EXITO" ? (
                <CheckCircle2 className= "mt-0.5 h-5 w-5 shrink-0" />
      ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
      )
}

<p className="min-w-0 flex-1 text-sm font-semibold" >
    { mensaje.texto }
    </p>

    < button
type = "button"
onClick = { cerrar }
aria-label="Cerrar mensaje"
    >
    <X className="h-5 w-5" />
        </button>
        </div>
  );
}

function transformarHorarios(
    horarios: HorarioListado[],
): DiaHorario[] {
    return horarios.map((horario) => ({
        diaSemana: horario.dia_semana,
        trabaja: horario.trabaja,
        horaInicio: horario.hora_inicio ?? "",
        horaFin: horario.hora_fin ?? "",
        tieneDescanso: Boolean(
            horario.hora_descanso_inicio &&
            horario.hora_descanso_fin,
        ),
        horaDescansoInicio:
            horario.hora_descanso_inicio ?? "",
        horaDescansoFin:
            horario.hora_descanso_fin ?? "",
    }));
}

function convertirAMinutos(hora: string) {
    const [horas, minutos] = hora
        .split(":")
        .map(Number);

    return horas * 60 + minutos;
}

function formatearHoras(valor: number) {
    return valor.toLocaleString("es-NI", {
        minimumFractionDigits:
            Number.isInteger(valor) ? 0 : 1,
        maximumFractionDigits: 1,
    });
}

function formatearHora(hora: string) {
    const [horas, minutos] = hora
        .split(":")
        .map(Number);

    const fecha = new Date();
    fecha.setHours(horas, minutos, 0, 0);

    return new Intl.DateTimeFormat("es-NI", {
        hour: "numeric",
        minute: "2-digit",
    }).format(fecha);
}