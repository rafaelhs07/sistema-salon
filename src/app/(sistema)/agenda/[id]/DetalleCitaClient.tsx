"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    Ban,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    Clock3,
    History,
    LoaderCircle,
    MapPin,
    MessageSquareText,
    Phone,
    Play,
    RefreshCw,
    TimerReset,
    UserRound,
    UsersRound,
    X,
    XCircle,
} from "lucide-react";
import {
    FormEvent,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    cambiarEstadoCita,
    reprogramarCita,
    type DatosReprogramacion,
    type EstadoCita,
} from "./actions";

export type CitaDetalle = {
    id: string;
    codigo_cita: string | null;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    duracion_total_minutos: number;
    subtotal: number;
    descuento: number;
    total: number;
    requiere_anticipo: boolean;
    monto_anticipo_requerido: number;
    monto_anticipo_pagado: number;
    estado: EstadoCita;
    origen: string;
    notas: string | null;
    notas_internas: string | null;
    motivo_cancelacion: string | null;
    fecha_registro: string;
    clientes: {
        id: string;
        codigo_cliente: string | null;
        nombre_completo: string;
        telefono: string | null;
        whatsapp: string | null;
        correo: string | null;
    } | null;
    sucursales: {
        nombre: string;
    } | null;
    cita_servicios: {
        id: string;
        nombre_servicio: string;
        precio_unitario: number;
        descuento: number;
        total: number;
        duracion_minutos: number;
        hora_inicio: string;
        hora_fin: string;
        estado: string;
        tipo_comision: string;
        valor_comision: number;
        monto_comision_calculado: number;
        notas: string | null;
        trabajadores: {
            id: string;
            nombre_completo: string;
            color_calendario: string;
        } | null;
    }[];
};

export type HistorialCita = {
    id: string;
    tipo_evento: string;
    estado_anterior: string | null;
    estado_nuevo: string | null;
    descripcion: string | null;
    fecha_registro: string;
};

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

export default function DetalleCitaClient({
    cita,
    historial,
}: {
    cita: CitaDetalle;
    historial: HistorialCita[];
}) {
    const router = useRouter();

    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [modalCancelar, setModalCancelar] =
        useState(false);
    const [modalReprogramar, setModalReprogramar] =
        useState(false);
    const [procesando, iniciarTransicion] =
        useTransition();

    function ejecutarEstado(
        estado: EstadoCita,
        motivo?: string,
    ) {
        setMensaje(null);

        iniciarTransicion(async () => {
            const resultado = await cambiarEstadoCita(
                cita.id,
                estado,
                motivo,
            );

            setMensaje({
                tipo: resultado.exito ? "EXITO" : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                setModalCancelar(false);

                if (estado === "CANCELADA") {
                    router.push("/agenda");
                    router.refresh();
                    return;
                }

                router.refresh();
            }
        });
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/agenda"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a la agenda
                    </Link>

                    <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                {cita.codigo_cita ?? "Detalle de cita"}
                            </p>

                            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                {cita.clientes?.nombre_completo ??
                                    "Cliente"}
                            </h1>

                            <p className="mt-3 text-[#CFD9D4]">
                                {formatearFecha(cita.fecha)} ·{" "}
                                {formatearHora(cita.hora_inicio)} –{" "}
                                {formatearHora(cita.hora_fin)}
                            </p>
                        </div>

                        <EstadoCitaBadge estado={cita.estado} />
                    </div>
                </div>
            </section>

            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() => setMensaje(null)}
                />
            )}

            <section className="rounded-3xl border border-[#E3E7E4] bg-white p-5 shadow-[0_8px_24px_rgba(36,48,44,0.05)] sm:p-6">
                <h2 className="text-lg font-bold text-[#24302C]">
                    Acciones de la cita
                </h2>

                <div className="mt-4 flex flex-wrap gap-3">
                    {cita.estado === "PENDIENTE" && (
                        <BotonAccion
                            texto="Confirmar"
                            icono={CheckCircle2}
                            clase="bg-[#E3EEE8] text-[#527865]"
                            deshabilitado={procesando}
                            accion={() =>
                                ejecutarEstado("CONFIRMADA")
                            }
                        />
                    )}

                    {["PENDIENTE", "CONFIRMADA"].includes(
                        cita.estado,
                    ) && (
                            <BotonAccion
                                texto="Poner en espera"
                                icono={TimerReset}
                                clase="bg-[#E8EDF4] text-[#5C6F88]"
                                deshabilitado={procesando}
                                accion={() =>
                                    ejecutarEstado("EN_ESPERA")
                                }
                            />
                        )}

                    {["CONFIRMADA", "EN_ESPERA"].includes(
                        cita.estado,
                    ) && (
                            <BotonAccion
                                texto="Iniciar"
                                icono={Play}
                                clase="bg-[#E9E3F3] text-[#6F5A8A]"
                                deshabilitado={procesando}
                                accion={() =>
                                    ejecutarEstado("EN_PROCESO")
                                }
                            />
                        )}

                    {cita.estado === "EN_PROCESO" && (
                        <BotonAccion
                            texto="Finalizar"
                            icono={CheckCircle2}
                            clase="bg-[#DCE7E2] text-[#43524B]"
                            deshabilitado={procesando}
                            accion={() =>
                                ejecutarEstado("FINALIZADA")
                            }
                        />
                    )}

                    {[
                        "PENDIENTE",
                        "CONFIRMADA",
                        "EN_ESPERA",
                    ].includes(cita.estado) && (
                            <BotonAccion
                                texto="No asistió"
                                icono={UserRound}
                                clase="bg-[#EFE7E1] text-[#8B6754]"
                                deshabilitado={procesando}
                                accion={() =>
                                    ejecutarEstado("NO_ASISTIO")
                                }
                            />
                        )}

                    {![
                        "FINALIZADA",
                        "CANCELADA",
                        "NO_ASISTIO",
                        "REPROGRAMADA",
                    ].includes(cita.estado) && (
                            <>
                                <BotonAccion
                                    texto="Reprogramar"
                                    icono={RefreshCw}
                                    clase="bg-[#EEF2EF] text-[#52605A]"
                                    deshabilitado={procesando}
                                    accion={() =>
                                        setModalReprogramar(true)
                                    }
                                />

                                <BotonAccion
                                    texto="Cancelar"
                                    icono={Ban}
                                    clase="bg-[#F8E5E5] text-[#A25E5E]"
                                    deshabilitado={procesando}
                                    accion={() =>
                                        setModalCancelar(true)
                                    }
                                />
                            </>
                        )}
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
                <div className="space-y-6">
                    <Seccion
                        titulo="Información general"
                        icono={CalendarDays}
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Dato
                                icono={CalendarClock}
                                etiqueta="Fecha"
                                valor={formatearFecha(cita.fecha)}
                            />
                            <Dato
                                icono={Clock3}
                                etiqueta="Horario"
                                valor={`${formatearHora(cita.hora_inicio)} – ${formatearHora(cita.hora_fin)}`}
                            />
                            <Dato
                                icono={MapPin}
                                etiqueta="Sucursal"
                                valor={
                                    cita.sucursales?.nombre ??
                                    "Sin sucursal"
                                }
                            />
                            <Dato
                                icono={CalendarDays}
                                etiqueta="Origen"
                                valor={formatearTexto(cita.origen)}
                            />
                        </div>
                    </Seccion>

                    <Seccion
                        titulo="Servicios"
                        icono={UsersRound}
                    >
                        <div className="space-y-4">
                            {cita.cita_servicios.map(
                                (servicio) => (
                                    <article
                                        key={servicio.id}
                                        className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        servicio.trabajadores
                                                            ?.color_calendario ??
                                                        "#6F8F83",
                                                }}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-[#24302C]">
                                                            {
                                                                servicio.nombre_servicio
                                                            }
                                                        </p>
                                                        <p className="mt-1 text-sm text-[#6B756F]">
                                                            {servicio.trabajadores
                                                                ?.nombre_completo ??
                                                                "Sin trabajador"}
                                                        </p>
                                                    </div>

                                                    <p className="font-bold text-[#33413B]">
                                                        C${" "}
                                                        {Number(
                                                            servicio.total,
                                                        ).toLocaleString("es-NI", {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </p>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#6B756F]">
                                                    <span className="rounded-full bg-white px-3 py-1.5">
                                                        {formatearHora(servicio.hora_inicio)}{" "}
                                                        –{" "}
                                                        {formatearHora(servicio.hora_fin)}
                                                    </span>
                                                    <span className="rounded-full bg-white px-3 py-1.5">
                                                        {
                                                            servicio.duracion_minutos
                                                        }{" "}
                                                        min
                                                    </span>
                                                </div>

                                                {servicio.notas && (
                                                    <p className="mt-3 text-sm text-[#6B756F]">
                                                        {servicio.notas}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ),
                            )}
                        </div>
                    </Seccion>

                    <Seccion
                        titulo="Notas"
                        icono={MessageSquareText}
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <BloqueTexto
                                titulo="Nota para el cliente"
                                texto={
                                    cita.notas ??
                                    "Sin nota para el cliente."
                                }
                            />
                            <BloqueTexto
                                titulo="Nota interna"
                                texto={
                                    cita.notas_internas ??
                                    "Sin nota interna."
                                }
                            />
                        </div>
                    </Seccion>
                </div>

                <div className="space-y-6">
                    <Seccion titulo="Cliente" icono={UserRound}>
                        <p className="font-bold text-[#24302C]">
                            {cita.clientes?.nombre_completo}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#6F8F83]">
                            {cita.clientes?.codigo_cliente ??
                                "Sin código"}
                        </p>

                        <div className="mt-4 space-y-3">
                            <DatoSimple
                                icono={Phone}
                                texto={
                                    cita.clientes?.telefono ||
                                    cita.clientes?.whatsapp ||
                                    "Sin número"
                                }
                            />
                        </div>

                        {cita.clientes?.id && (
                            <Link
                                href={`/clientes/${cita.clientes.id}`}
                                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B]"
                            >
                                Abrir perfil
                            </Link>
                        )}
                    </Seccion>

                    <Seccion
                        titulo="Resumen de cobro"
                        icono={CalendarClock}
                    >
                        <FilaDinero
                            titulo="Subtotal"
                            valor={cita.subtotal}
                        />
                        <FilaDinero
                            titulo="Descuento"
                            valor={cita.descuento}
                        />
                        <FilaDinero
                            titulo="Total"
                            valor={cita.total}
                            destacado
                        />

                        {cita.requiere_anticipo && (
                            <>
                                <div className="my-4 border-t border-[#E3E7E4]" />
                                <FilaDinero
                                    titulo="Anticipo requerido"
                                    valor={
                                        cita.monto_anticipo_requerido
                                    }
                                />
                                <FilaDinero
                                    titulo="Anticipo pagado"
                                    valor={
                                        cita.monto_anticipo_pagado
                                    }
                                />
                            </>
                        )}
                    </Seccion>

                    <Seccion titulo="Historial" icono={History}>
                        <div className="space-y-4">
                            {historial.length === 0 ? (
                                <p className="text-sm text-[#6B756F]">
                                    No hay eventos registrados.
                                </p>
                            ) : (
                                historial.map((evento) => (
                                    <article
                                        key={evento.id}
                                        className="border-l-2 border-[#C8D9D1] pl-4"
                                    >
                                        <p className="text-sm font-bold text-[#33413B]">
                                            {formatearTexto(
                                                evento.tipo_evento,
                                            )}
                                        </p>
                                        <p className="mt-1 text-xs text-[#829089]">
                                            {formatearFechaHora(
                                                evento.fecha_registro,
                                            )}
                                        </p>
                                        {evento.descripcion && (
                                            <p className="mt-2 text-sm leading-5 text-[#6B756F]">
                                                {evento.descripcion}
                                            </p>
                                        )}
                                    </article>
                                ))
                            )}
                        </div>
                    </Seccion>
                </div>
            </div>

            {modalCancelar && (
                <ModalCancelar
                    procesando={procesando}
                    cerrar={() => setModalCancelar(false)}
                    confirmar={(motivo) =>
                        ejecutarEstado("CANCELADA", motivo)
                    }
                />
            )}

            {modalReprogramar && (
                <ModalReprogramar
                    cita={cita}
                    cerrar={() => setModalReprogramar(false)}
                />
            )}
        </div>
    );
}

function ModalCancelar({
    procesando,
    cerrar,
    confirmar,
}: {
    procesando: boolean;
    cerrar: () => void;
    confirmar: (motivo: string) => void;
}) {
    const [motivo, setMotivo] = useState("");

    return (
        <ModalBase
            titulo="Cancelar cita"
            cerrar={cerrar}
        >
            <div className="rounded-2xl border border-[#EBCBCB] bg-[#F8E5E5] p-4 text-[#985858]">
                <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p className="text-sm leading-6">
                        La cita quedará cancelada y el horario volverá
                        a estar disponible.
                    </p>
                </div>
            </div>

            <label className="mt-5 block">
                <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                    Motivo de cancelación
                </span>
                <textarea
                    rows={4}
                    value={motivo}
                    onChange={(event) =>
                        setMotivo(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#D4DAD6] px-4 py-3 outline-none focus:border-[#6F8F83]"
                />
            </label>

            <div className="mt-5 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={cerrar}
                    className="h-10 rounded-xl bg-[#EEF2EF] px-4 text-sm font-bold text-[#52605A]"
                >
                    Volver
                </button>
                <button
                    type="button"
                    disabled={
                        procesando || motivo.trim().length < 3
                    }
                    onClick={() => confirmar(motivo)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#A25E5E] px-4 text-sm font-bold text-white disabled:opacity-50"
                >
                    {procesando && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    )}
                    Cancelar cita
                </button>
            </div>
        </ModalBase>
    );
}

function ModalReprogramar({
    cita,
    cerrar,
}: {
    cita: CitaDetalle;
    cerrar: () => void;
}) {
    const router = useRouter();
    const [datos, setDatos] =
        useState<DatosReprogramacion>({
            fecha: cita.fecha,
            horaInicio: cita.hora_inicio.slice(0, 5),
            motivo: "",
        });
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [procesando, iniciarTransicion] =
        useTransition();

    function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        iniciarTransicion(async () => {
            const resultado = await reprogramarCita(
                cita.id,
                datos,
            );

            if (!resultado.exito) {
                setMensaje({
                    tipo: "ERROR",
                    texto: resultado.mensaje,
                });
                return;
            }

            if (resultado.nuevaCitaId) {
                router.push(
                    `/agenda/${resultado.nuevaCitaId}`,
                );
                router.refresh();
            }
        });
    }

    return (
        <ModalBase
            titulo="Reprogramar cita"
            cerrar={cerrar}
        >
            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() => setMensaje(null)}
                />
            )}

            <form onSubmit={enviar}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                            Nueva fecha
                        </span>
                        <input
                            type="date"
                            value={datos.fecha}
                            required
                            onChange={(event) =>
                                setDatos((actual) => ({
                                    ...actual,
                                    fecha: event.target.value,
                                }))
                            }
                            className="h-11 w-full rounded-xl border border-[#D4DAD6] px-4"
                        />
                    </label>

                    <CampoHora12
                        etiqueta="Nueva hora"
                        valor={datos.horaInicio}
                        cambiar={(horaInicio) =>
                            setDatos((actual) => ({
                                ...actual,
                                horaInicio,
                            }))
                        }
                    />
                </div>

                <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                        Motivo
                    </span>
                    <textarea
                        rows={4}
                        value={datos.motivo}
                        required
                        onChange={(event) =>
                            setDatos((actual) => ({
                                ...actual,
                                motivo: event.target.value,
                            }))
                        }
                        className="w-full rounded-xl border border-[#D4DAD6] px-4 py-3"
                    />
                </label>

                <div className="mt-5 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={cerrar}
                        className="h-10 rounded-xl bg-[#EEF2EF] px-4 text-sm font-bold text-[#52605A]"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={procesando}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6F8F83] px-4 text-sm font-bold text-white disabled:opacity-50"
                    >
                        {procesando ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Reprogramar
                    </button>
                </div>
            </form>
        </ModalBase>
    );
}

function CampoHora12({
    etiqueta,
    valor,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    cambiar: (valor: string) => void;
}) {
    const partes = hora24APartes12(valor);
    const minutos = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

    function actualizar(cambios: Partial<{ hora: number; minuto: string; periodo: "AM" | "PM" }>) {
        const siguiente = {
            ...partes,
            ...cambios,
        };

        cambiar(
            partes12AHora24(
                siguiente.hora,
                siguiente.minuto,
                siguiente.periodo,
            ),
        );
    }

    return (
        <div className="block">
            <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </span>

            <div className="grid grid-cols-[1fr_1fr_0.9fr] gap-2">
                <select
                    value={partes.hora}
                    onChange={(event) =>
                        actualizar({ hora: Number(event.target.value) })
                    }
                    className="h-11 rounded-xl border border-[#D4DAD6] bg-white px-3"
                >
                    {Array.from({ length: 12 }, (_, indice) => indice + 1).map((hora) => (
                        <option key={hora} value={hora}>
                            {hora}
                        </option>
                    ))}
                </select>

                <select
                    value={partes.minuto}
                    onChange={(event) =>
                        actualizar({ minuto: event.target.value })
                    }
                    className="h-11 rounded-xl border border-[#D4DAD6] bg-white px-3"
                >
                    {minutos.map((minuto) => (
                        <option key={minuto} value={minuto}>
                            :{minuto}
                        </option>
                    ))}
                </select>

                <select
                    value={partes.periodo}
                    onChange={(event) =>
                        actualizar({
                            periodo: event.target.value as "AM" | "PM",
                        })
                    }
                    className="h-11 rounded-xl border border-[#D4DAD6] bg-white px-3 font-semibold"
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
        </div>
    );
}

function ModalBase({
    titulo,
    cerrar,
    children,
}: {
    titulo: string;
    cerrar: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#26332F]/45 p-4 backdrop-blur-sm">
            <button
                type="button"
                onClick={cerrar}
                className="absolute inset-0"
                aria-label="Cerrar"
            />
            <section className="relative z-10 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
                <header className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-[#24302C]">
                        {titulo}
                    </h2>
                    <button
                        type="button"
                        onClick={cerrar}
                        className="rounded-xl bg-[#EEF2EF] p-2 text-[#52605A]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>
                <div className="mt-5">{children}</div>
            </section>
        </div>
    );
}

function Seccion({
    titulo,
    icono: Icono,
    children,
}: {
    titulo: string;
    icono: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <header className="flex items-center gap-3 border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-[#24302C]">
                    {titulo}
                </h2>
            </header>
            <div className="p-5">{children}</div>
        </section>
    );
}

function BotonAccion({
    texto,
    icono: Icono,
    clase,
    deshabilitado,
    accion,
}: {
    texto: string;
    icono: React.ComponentType<{ className?: string }>;
    clase: string;
    deshabilitado: boolean;
    accion: () => void;
}) {
    return (
        <button
            type="button"
            onClick={accion}
            disabled={deshabilitado}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${clase}`}
        >
            <Icono className="h-4 w-4" />
            {texto}
        </button>
    );
}

function EstadoCitaBadge({
    estado,
}: {
    estado: EstadoCita;
}) {
    const estilos: Record<EstadoCita, string> = {
        PENDIENTE: "bg-[#FAF0DC] text-[#9A742D]",
        CONFIRMADA: "bg-[#E3EEE8] text-[#527865]",
        EN_ESPERA: "bg-[#E8EDF4] text-[#5C6F88]",
        EN_PROCESO: "bg-[#E9E3F3] text-[#6F5A8A]",
        FINALIZADA: "bg-[#DCE7E2] text-[#43524B]",
        CANCELADA: "bg-[#F8E5E5] text-[#A25E5E]",
        NO_ASISTIO: "bg-[#EFE7E1] text-[#8B6754]",
        REPROGRAMADA: "bg-[#EEF2EF] text-[#6B756F]",
    };

    return (
        <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-bold uppercase ${estilos[estado]}`}
        >
            {formatearTexto(estado)}
        </span>
    );
}

function Dato({
    icono: Icono,
    etiqueta,
    valor,
}: {
    icono: React.ComponentType<{ className?: string }>;
    etiqueta: string;
    valor: string;
}) {
    return (
        <div className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4">
            <div className="flex items-center gap-2 text-[#6F8F83]">
                <Icono className="h-4 w-4" />
                <span className="text-xs font-bold uppercase">
                    {etiqueta}
                </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function DatoSimple({
    icono: Icono,
    texto,
}: {
    icono: React.ComponentType<{ className?: string }>;
    texto: string;
}) {
    return (
        <div className="flex items-center gap-2 text-sm text-[#6B756F]">
            <Icono className="h-4 w-4" />
            {texto}
        </div>
    );
}

function BloqueTexto({
    titulo,
    texto,
}: {
    titulo: string;
    texto: string;
}) {
    return (
        <div className="rounded-2xl bg-[#FBFCFA] p-4">
            <p className="text-xs font-bold uppercase text-[#829089]">
                {titulo}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#52605A]">
                {texto}
            </p>
        </div>
    );
}

function FilaDinero({
    titulo,
    valor,
    destacado = false,
}: {
    titulo: string;
    valor: number;
    destacado?: boolean;
}) {
    return (
        <div className="mt-3 flex items-center justify-between gap-4">
            <span
                className={
                    destacado
                        ? "font-bold text-[#24302C]"
                        : "text-sm text-[#6B756F]"
                }
            >
                {titulo}
            </span>
            <strong
                className={
                    destacado
                        ? "text-xl text-[#24302C]"
                        : "text-sm text-[#33413B]"
                }
            >
                C${" "}
                {Number(valor).toLocaleString("es-NI", {
                    minimumFractionDigits: 2,
                })}
            </strong>
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
            className={[
                "flex items-start gap-3 rounded-2xl border px-4 py-4",
                mensaje.tipo === "EXITO"
                    ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                    : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
            ].join(" ")}
        >
            {mensaje.tipo === "EXITO" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
                <XCircle className="h-5 w-5 shrink-0" />
            )}
            <p className="min-w-0 flex-1 text-sm font-semibold">
                {mensaje.texto}
            </p>
            <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar mensaje"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

function hora24APartes12(hora: string) {
    const [hora24, minuto = "00"] = hora.slice(0, 5).split(":");
    const numeroHora = Number(hora24);

    return {
        hora: numeroHora % 12 || 12,
        minuto,
        periodo: (numeroHora >= 12 ? "PM" : "AM") as "AM" | "PM",
    };
}

function partes12AHora24(
    hora: number,
    minuto: string,
    periodo: "AM" | "PM",
) {
    let hora24 = hora % 12;

    if (periodo === "PM") {
        hora24 += 12;
    }

    return `${String(hora24).padStart(2, "0")}:${minuto}`;
}

function formatearHora(hora: string) {
    const [hora24, minuto = "00"] = hora.slice(0, 5).split(":").map(Number);
    const periodo = hora24 >= 12 ? "p. m." : "a. m.";
    const hora12 = hora24 % 12 || 12;

    return `${hora12}:${String(minuto).padStart(2, "0")} ${periodo}`;
}

function formatearFecha(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(`${fecha}T00:00:00`));
}

function formatearFechaHora(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(fecha));
}

function formatearTexto(valor: string) {
    return valor
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letra) =>
            letra.toUpperCase(),
        );
}