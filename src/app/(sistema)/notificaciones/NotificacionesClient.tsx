"use client";

import Link from "next/link";
import {
    AlertTriangle,
    Archive,
    ArchiveRestore,
    Bell,
    BellRing,
    CalendarClock,
    Check,
    CheckCheck,
    ChevronRight,
    CircleAlert,
    Clock3,
    Info,
    LoaderCircle,
    MailCheck,
    MessageCircle,
    Search,
    SlidersHorizontal,
    Sparkles,
    X,
    XCircle,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
    archivarNotificacion,
    archivarTodasLeidas,
    marcarNotificacionLeida,
    marcarNotificacionNoLeida,
    marcarTodasLeidas,
    restaurarNotificacion,
} from "./actions";

export type NotificacionSistema = {
    id: string;
    usuario_id: string | null;
    cita_id: string | null;
    cliente_id: string | null;
    tipo: string;
    titulo: string;
    mensaje: string;
    prioridad: string;
    enlace: string | null;
    leida: boolean;
    leida_en: string | null;
    archivada: boolean;
    archivada_en: string | null;
    fecha_registro: string;
};

export type RecordatorioCita = {
    id: string;
    cita_id: string;
    cliente_id: string;
    tipo: string;
    canal: string;
    titulo: string;
    mensaje: string;
    fecha_programada: string;
    estado: string;
    intentos: number;
    enviado_en: string | null;
    error_envio: string | null;
    clientes: {
        nombre_completo: string;
        telefono: string | null;
        whatsapp: string | null;
    } | null;
    citas: {
        codigo_cita: string | null;
        fecha: string;
        hora_inicio: string;
        estado: string;
    } | null;
};

type Pestana = "NOTIFICACIONES" | "ATENCION" | "ARCHIVADAS" | "RECORDATORIOS";
type FiltroLectura = "TODAS" | "NO_LEIDAS" | "LEIDAS";
type Categoria =
    | "TODAS"
    | "CITAS"
    | "CLIENTES"
    | "CAJA"
    | "INVENTARIO"
    | "FINANZAS"
    | "COMPRAS"
    | "SISTEMA";

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

type GrupoFecha = {
    titulo: string;
    items: NotificacionSistema[];
};

export default function NotificacionesClient({
    notificacionesIniciales,
    archivadasIniciales,
    recordatoriosIniciales,
    fechaServidor,
}: {
    notificacionesIniciales: NotificacionSistema[];
    archivadasIniciales: NotificacionSistema[];
    recordatoriosIniciales: RecordatorioCita[];
    fechaServidor: string;
}) {
    const router = useRouter();
    const [pestana, setPestana] = useState<Pestana>("NOTIFICACIONES");
    const [busqueda, setBusqueda] = useState("");
    const [filtroLectura, setFiltroLectura] = useState<FiltroLectura>("TODAS");
    const [filtroPrioridad, setFiltroPrioridad] = useState("TODAS");
    const [categoria, setCategoria] = useState<Categoria>("TODAS");
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [procesando, iniciarTransicion] = useTransition();

    const resumen = useMemo(
        () => ({
            total: notificacionesIniciales.length,
            noLeidas: notificacionesIniciales.filter((item) => !item.leida).length,
            requierenAtencion: notificacionesIniciales.filter(
                (item) => !item.leida && requiereAtencion(item),
            ).length,
            urgentes: notificacionesIniciales.filter(
                (item) => !item.leida && item.prioridad === "URGENTE",
            ).length,
            altas: notificacionesIniciales.filter(
                (item) => !item.leida && item.prioridad === "ALTA",
            ).length,
            archivadas: archivadasIniciales.length,
            recordatorios: recordatoriosIniciales.length,
        }),
        [notificacionesIniciales, archivadasIniciales, recordatoriosIniciales],
    );

    const conteoCategorias = useMemo(
        () =>
            categoriasDisponibles.map((item) => ({
                ...item,
                cantidad:
                    item.valor === "TODAS"
                        ? notificacionesIniciales.length
                        : notificacionesIniciales.filter(
                            (notificacion) =>
                                obtenerCategoria(notificacion.tipo) === item.valor,
                        ).length,
            })),
        [notificacionesIniciales],
    );

    const notificacionesFiltradas = useMemo(() => {
        const texto = normalizar(busqueda);

        return notificacionesIniciales.filter((notificacion) => {
            const coincideBusqueda =
                !texto ||
                normalizar(notificacion.titulo).includes(texto) ||
                normalizar(notificacion.mensaje).includes(texto) ||
                normalizar(notificacion.tipo).includes(texto);

            const coincideLectura =
                filtroLectura === "TODAS" ||
                (filtroLectura === "NO_LEIDAS" && !notificacion.leida) ||
                (filtroLectura === "LEIDAS" && notificacion.leida);

            const coincidePrioridad =
                filtroPrioridad === "TODAS" ||
                notificacion.prioridad === filtroPrioridad;

            const coincideCategoria =
                categoria === "TODAS" ||
                obtenerCategoria(notificacion.tipo) === categoria;

            return (
                coincideBusqueda &&
                coincideLectura &&
                coincidePrioridad &&
                coincideCategoria
            );
        });
    }, [
        busqueda,
        filtroLectura,
        filtroPrioridad,
        categoria,
        notificacionesIniciales,
    ]);

    const grupos = useMemo(
        () => agruparPorFecha(notificacionesFiltradas),
        [notificacionesFiltradas],
    );

    const recordatoriosFiltrados = useMemo(() => {
        const texto = normalizar(busqueda);

        return recordatoriosIniciales.filter(
            (recordatorio) =>
                !texto ||
                normalizar(recordatorio.titulo).includes(texto) ||
                normalizar(recordatorio.mensaje).includes(texto) ||
                normalizar(recordatorio.clientes?.nombre_completo ?? "").includes(texto) ||
                normalizar(recordatorio.citas?.codigo_cita ?? "").includes(texto),
        );
    }, [busqueda, recordatoriosIniciales]);

    const atencionTodas = useMemo(
        () =>
            notificacionesIniciales
                .filter((item) => !item.leida && requiereAtencion(item))
                .sort((a, b) => {
                    const prioridadA = a.prioridad === "URGENTE" ? 0 : 1;
                    const prioridadB = b.prioridad === "URGENTE" ? 0 : 1;

                    if (prioridadA !== prioridadB) {
                        return prioridadA - prioridadB;
                    }

                    return (
                        new Date(b.fecha_registro).getTime() -
                        new Date(a.fecha_registro).getTime()
                    );
                }),
        [notificacionesIniciales],
    );

    const atencion = useMemo(
        () => atencionTodas.slice(0, 4),
        [atencionTodas],
    );

    const atencionFiltrada = useMemo(() => {
        const texto = normalizar(busqueda);

        return atencionTodas.filter((notificacion) => {
            const coincideBusqueda =
                !texto ||
                normalizar(notificacion.titulo).includes(texto) ||
                normalizar(notificacion.mensaje).includes(texto) ||
                normalizar(notificacion.tipo).includes(texto);

            const coincideCategoria =
                categoria === "TODAS" ||
                obtenerCategoria(notificacion.tipo) === categoria;

            return coincideBusqueda && coincideCategoria;
        });
    }, [atencionTodas, busqueda, categoria]);

    const archivadasFiltradas = useMemo(() => {
        const texto = normalizar(busqueda);

        return archivadasIniciales.filter((notificacion) => {
            const coincideBusqueda =
                !texto ||
                normalizar(notificacion.titulo).includes(texto) ||
                normalizar(notificacion.mensaje).includes(texto) ||
                normalizar(notificacion.tipo).includes(texto);

            const coincideCategoria =
                categoria === "TODAS" ||
                obtenerCategoria(notificacion.tipo) === categoria;

            return coincideBusqueda && coincideCategoria;
        });
    }, [archivadasIniciales, busqueda, categoria]);

    function ejecutar(
        accion: () => Promise<{
            exito: boolean;
            mensaje: string;
        }>,
    ) {
        setMensaje(null);

        iniciarTransicion(async () => {
            const resultado = await accion();

            setMensaje({
                tipo: resultado.exito ? "EXITO" : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                router.refresh();
            }
        });
    }

    function limpiarFiltros() {
        setBusqueda("");
        setFiltroLectura("TODAS");
        setFiltroPrioridad("TODAS");
        setCategoria("TODAS");
    }

    function abrirRequiereAccion() {
        setPestana("ATENCION");
        setBusqueda("");
        setFiltroLectura("TODAS");
        setFiltroPrioridad("TODAS");
        setCategoria("TODAS");
    }

    return (
        <div className="space-y-6 pb-8">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-secondary/10 blur-3xl" />

                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                            <BellRing className="h-7 w-7" />
                        </div>

                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-primary-soft">
                                <Sparkles className="h-3.5 w-3.5" />
                                Centro de avisos
                            </div>

                            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                                Notificaciones
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Revisa lo que ocurrió, identifica lo pendiente y entra directamente a la acción relacionada.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {resumen.noLeidas > 0 && (
                            <button
                                type="button"
                                disabled={procesando}
                                onClick={() => ejecutar(marcarTodasLeidas)}
                                className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-5 text-sidebar transition hover:bg-white disabled:opacity-60"
                            >
                                {procesando ? (
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                ) : (
                                    <CheckCheck className="h-5 w-5" />
                                )}
                                Marcar todas como leídas
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={procesando}
                            onClick={() => ejecutar(archivarTodasLeidas)}
                            className="salon-action inline-flex items-center justify-center gap-2 border border-white/10 bg-white/5 px-5 text-white transition hover:bg-white/10 disabled:opacity-60"
                        >
                            <Archive className="h-5 w-5" />
                            Archivar leídas
                        </button>
                    </div>
                </div>
            </section>

            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() => setMensaje(null)}
                />
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <TarjetaResumen titulo="Total" valor={resumen.total} detalle="avisos registrados" icono={Bell} />
                <TarjetaResumen titulo="No leídas" valor={resumen.noLeidas} detalle="pendientes de revisar" icono={BellRing} />
                <TarjetaResumen
                    titulo="Requieren atención"
                    valor={resumen.requierenAtencion}
                    detalle="prioridad alta o urgente"
                    icono={CircleAlert}
                    alerta
                    onClick={abrirRequiereAccion}
                />
                <TarjetaResumen
                    titulo="Archivadas"
                    valor={resumen.archivadas}
                    detalle="historial fuera de la bandeja"
                    icono={Archive}
                    onClick={() => {
                        setPestana("ARCHIVADAS");
                        limpiarFiltros();
                    }}
                />
                <TarjetaResumen titulo="Recordatorios" valor={resumen.recordatorios} detalle="seguimiento de citas" icono={CalendarClock} />
            </section>

            {atencion.length > 0 && (
                <section className="rounded-[30px] border border-[#E9D7DA] bg-[#FFF9FA] p-5 shadow-[0_10px_30px_rgba(36,48,44,0.05)] sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3E1E4] text-[#96616B]">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold text-sidebar tracking-tight">Requiere tu atención</h2>
                            <p className="mt-1 text-sm text-[#7B6B6F]">
                                Priorizamos aquí los avisos más importantes que aún no has revisado.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={abrirRequiereAccion}
                            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-[#80545D] shadow-sm transition hover:bg-[#FFF4F5]"
                        >
                            Ver todas
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        {atencion.map((item) => (
                            <Link
                                key={item.id}
                                href={
                                    item.enlace ||
                                    (item.cita_id
                                        ? `/agenda/${item.cita_id}`
                                        : "/notificaciones")
                                }
                                className="group flex items-center gap-4 rounded-2xl border border-[#EBDCDD] bg-white px-4 py-3 transition hover:border-[#DDBFC4]"
                            >
                                <IconoNotificacion prioridad={item.prioridad} tipo={item.tipo} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-[#33413B]">{item.titulo}</p>
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7B7476]">{item.mensaje}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-[#9A868B] transition group-hover:translate-x-0.5" />
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <section className="salon-panel overflow-hidden border border-border bg-white">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex w-fit rounded-2xl bg-surface-soft p-1">
                                <BotonPestana
                                    texto="Notificaciones"
                                    activa={pestana === "NOTIFICACIONES"}
                                    cantidad={resumen.noLeidas}
                                    cambiar={() => setPestana("NOTIFICACIONES")}
                                />
                                <BotonPestana
                                    texto="Requiere acción"
                                    activa={pestana === "ATENCION"}
                                    cantidad={resumen.requierenAtencion}
                                    cambiar={abrirRequiereAccion}
                                    alerta
                                />
                                <BotonPestana
                                    texto="Archivadas"
                                    activa={pestana === "ARCHIVADAS"}
                                    cantidad={resumen.archivadas}
                                    cambiar={() => {
                                        setPestana("ARCHIVADAS");
                                        limpiarFiltros();
                                    }}
                                />
                                <BotonPestana
                                    texto="Recordatorios"
                                    activa={pestana === "RECORDATORIOS"}
                                    cantidad={resumen.recordatorios}
                                    cambiar={() => setPestana("RECORDATORIOS")}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[240px] flex-1">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                                    <input
                                        value={busqueda}
                                        onChange={(event) => setBusqueda(event.target.value)}
                                        placeholder="Buscar por título, mensaje o tipo..."
                                        className="salon-control w-full border border-border-strong bg-[#FAFCFB] pl-11 pr-4 outline-none focus:border-primary focus:bg-white"
                                    />
                                </div>

                                {pestana === "NOTIFICACIONES" && (
                                    <>
                                        <select
                                            value={filtroLectura}
                                            onChange={(event) => setFiltroLectura(event.target.value as FiltroLectura)}
                                            className="salon-control border border-border-strong bg-white px-3 font-medium text-text-secondary"
                                        >
                                            <option value="TODAS">Todas</option>
                                            <option value="NO_LEIDAS">No leídas</option>
                                            <option value="LEIDAS">Leídas</option>
                                        </select>

                                        <select
                                            value={filtroPrioridad}
                                            onChange={(event) => setFiltroPrioridad(event.target.value)}
                                            className="salon-control border border-border-strong bg-white px-3 font-medium text-text-secondary"
                                        >
                                            <option value="TODAS">Toda prioridad</option>
                                            <option value="BAJA">Baja</option>
                                            <option value="NORMAL">Normal</option>
                                            <option value="ALTA">Alta</option>
                                            <option value="URGENTE">Urgente</option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={limpiarFiltros}
                                            className="salon-action inline-flex items-center gap-2 border border-border-strong bg-white px-4 text-[#66756E] transition hover:bg-[#F4F7F5]"
                                        >
                                            <SlidersHorizontal className="h-4 w-4" />
                                            Limpiar
                                        </button>
                                    </>
                                )}

                                {(pestana === "ATENCION" || pestana === "ARCHIVADAS") && (
                                    <button
                                        type="button"
                                        onClick={limpiarFiltros}
                                        className="salon-action inline-flex items-center gap-2 border border-border-strong bg-white px-4 text-[#66756E] transition hover:bg-[#F4F7F5]"
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                        Limpiar
                                    </button>
                                )}
                            </div>
                        </div>

                        {(pestana === "NOTIFICACIONES" || pestana === "ATENCION" || pestana === "ARCHIVADAS") && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {conteoCategorias.map((item) => (
                                    <button
                                        key={item.valor}
                                        type="button"
                                        onClick={() => setCategoria(item.valor)}
                                        className={[
                                            "inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition",
                                            categoria === item.valor
                                                ? "bg-sidebar text-white"
                                                : "bg-[#F2F5F3] text-[#64736C] hover:bg-[#E7EDE9]",
                                        ].join(" ")}
                                    >
                                        {item.nombre}
                                        {item.cantidad > 0 && (
                                            <span
                                                className={[
                                                    "rounded-full px-1.5 py-0.5 text-[10px]",
                                                    categoria === item.valor
                                                        ? "bg-white/15 text-white"
                                                        : "bg-white text-[#66756E]",
                                                ].join(" ")}
                                            >
                                                {item.cantidad}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                <div className="p-5 sm:p-6">
                    {pestana === "NOTIFICACIONES" ? (
                        grupos.length === 0 ? (
                            <EstadoVacio
                                titulo="No hay notificaciones"
                                texto="No encontramos avisos que coincidan con los filtros seleccionados."
                            />
                        ) : (
                            <div className="space-y-7">
                                {grupos.map((grupo) => (
                                    <section key={grupo.titulo}>
                                        <div className="mb-3 flex items-center gap-3">
                                            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#78867F]">
                                                {grupo.titulo}
                                            </h3>
                                            <div className="h-px flex-1 bg-[#E8ECE9]" />
                                        </div>

                                        <div className="space-y-3">
                                            {grupo.items.map((notificacion) => (
                                                <TarjetaNotificacion
                                                    key={notificacion.id}
                                                    notificacion={notificacion}
                                                    procesando={procesando}
                                                    marcar={() =>
                                                        ejecutar(() =>
                                                            notificacion.leida
                                                                ? marcarNotificacionNoLeida(notificacion.id)
                                                                : marcarNotificacionLeida(notificacion.id),
                                                        )
                                                    }
                                                    eliminar={() => {
                                                        const confirmado = window.confirm(
                                                            "¿Deseas archivar esta notificación?",
                                                        );

                                                        if (confirmado) {
                                                            ejecutar(() =>
                                                                archivarNotificacion(notificacion.id),
                                                            );
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )
                    ) : pestana === "ATENCION" ? (
                        <PanelRequiereAccion
                            items={atencionFiltrada}
                            urgentes={resumen.urgentes}
                            altas={resumen.altas}
                            procesando={procesando}
                            ejecutar={ejecutar}
                        />
                    ) : pestana === "ARCHIVADAS" ? (
                        <PanelArchivadas
                            items={archivadasFiltradas}
                            procesando={procesando}
                            ejecutar={ejecutar}
                        />
                    ) : recordatoriosFiltrados.length === 0 ? (
                        <EstadoVacio titulo="No hay recordatorios" texto="No existen recordatorios próximos dentro del rango consultado." />
                    ) : (
                        <div className="space-y-3">
                            {recordatoriosFiltrados.map((recordatorio) => (
                                <TarjetaRecordatorio key={recordatorio.id} recordatorio={recordatorio} fechaServidor={fechaServidor} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}



function PanelArchivadas({
    items,
    procesando,
    ejecutar,
}: {
    items: NotificacionSistema[];
    procesando: boolean;
    ejecutar: (
        accion: () => Promise<{
            exito: boolean;
            mensaje: string;
        }>,
    ) => void;
}) {
    if (items.length === 0) {
        return (
            <div className="rounded-[26px] border border-dashed border-border-strong bg-[#FBFCFA] p-12 text-center">
                <Archive className="mx-auto h-9 w-9 text-[#829089]" />

                <h3 className="mt-4 font-bold text-foreground tracking-tight">
                    No hay notificaciones archivadas
                </h3>

                <p className="mt-2 text-sm text-text-secondary">
                    Los avisos archivados manualmente o por mantenimiento aparecerán aquí.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.map((notificacion) => (
                <article
                    key={notificacion.id}
                    className="rounded-2xl border border-border bg-[#FBFCFA] p-4 sm:p-5"
                >
                    <div className="flex items-start gap-4">
                        <IconoNotificacion
                            prioridad={notificacion.prioridad}
                            tipo={notificacion.tipo}
                        />

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-[#33413B] tracking-tight">
                                    {notificacion.titulo}
                                </h3>

                                <span className="rounded-full bg-[#E8ECE9] px-2 py-0.5 text-xs font-bold uppercase text-[#6F7D76]">
                                    Archivada
                                </span>

                                <PrioridadBadge
                                    prioridad={notificacion.prioridad}
                                />
                            </div>

                            <p className="mt-2 text-sm leading-6 text-text-secondary">
                                {notificacion.mensaje}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8A948F]">
                                <span>
                                    Creada: {formatearFechaHora(notificacion.fecha_registro)}
                                </span>

                                {notificacion.archivada_en && (
                                    <span>
                                        Archivada: {formatearFechaHora(notificacion.archivada_en)}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {notificacion.enlace && (
                                    <Link
                                        href={notificacion.enlace}
                                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary-soft px-4 text-xs font-bold text-text-secondary"
                                    >
                                        Abrir
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Link>
                                )}

                                <button
                                    type="button"
                                    disabled={procesando}
                                    onClick={() =>
                                        ejecutar(() =>
                                            restaurarNotificacion(
                                                notificacion.id,
                                            ),
                                        )
                                    }
                                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-surface-soft px-4 text-xs font-bold text-[#52605A] transition hover:bg-[#E4EAE6] disabled:opacity-50"
                                >
                                    <ArchiveRestore className="h-4 w-4" />
                                    Restaurar
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}

function PanelRequiereAccion({
    items,
    urgentes,
    altas,
    procesando,
    ejecutar,
}: {
    items: NotificacionSistema[];
    urgentes: number;
    altas: number;
    procesando: boolean;
    ejecutar: (
        accion: () => Promise<{
            exito: boolean;
            mensaje: string;
        }>,
    ) => void;
}) {
    if (items.length === 0) {
        return (
            <div className="rounded-[26px] border border-[#D9E4DE] bg-[#F7FAF8] p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E3EEE8] text-[#527865]">
                    <CheckCheck className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-lg font-bold text-sidebar tracking-tight">
                    Todo bajo control
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#74817B]">
                    No hay avisos urgentes o de prioridad alta pendientes con los filtros actuales.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E7C9CE] bg-[#FFF5F6] px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#97616C]">
                        Urgentes
                    </p>

                    <div className="mt-2 flex items-end justify-between gap-4">
                        <p className="text-3xl font-bold text-[#7E4E59]">
                            {urgentes}
                        </p>

                        <AlertTriangle className="h-6 w-6 text-[#A86572]" />
                    </div>

                    <p className="mt-2 text-xs leading-5 text-[#8A6A71]">
                        Requieren revisión inmediata.
                    </p>
                </div>

                <div className="rounded-2xl border border-[#EADDBA] bg-[#FFF9E9] px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#8A6A28]">
                        Prioridad alta
                    </p>

                    <div className="mt-2 flex items-end justify-between gap-4">
                        <p className="text-3xl font-bold text-[#725922]">
                            {altas}
                        </p>

                        <CircleAlert className="h-6 w-6 text-[#9A742D]" />
                    </div>

                    <p className="mt-2 text-xs leading-5 text-[#846F42]">
                        Conviene resolverlas lo antes posible.
                    </p>
                </div>
            </div>

            <div className="rounded-2xl bg-[#F7FAF8] px-4 py-3">
                <p className="text-sm font-bold text-[#33413B]">
                    Qué hacer ahora
                </p>

                <p className="mt-1 text-xs leading-5 text-[#74817B]">
                    Abre cada aviso y resuelve la situación en su módulo correspondiente.
                    Algunas alertas se marcarán automáticamente como resueltas cuando el
                    sistema detecte que la condición desapareció.
                </p>
            </div>

            <div className="space-y-3">
                {items.map((notificacion) => (
                    <TarjetaNotificacion
                        key={notificacion.id}
                        notificacion={notificacion}
                        procesando={procesando}
                        marcar={() =>
                            ejecutar(() =>
                                marcarNotificacionLeida(notificacion.id),
                            )
                        }
                        eliminar={() => {
                            const confirmado = window.confirm(
                                "¿Deseas archivar esta notificación?",
                            );

                            if (confirmado) {
                                ejecutar(() =>
                                    archivarNotificacion(notificacion.id),
                                );
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function TarjetaNotificacion({
    notificacion,
    procesando,
    marcar,
    eliminar,
}: {
    notificacion: NotificacionSistema;
    procesando: boolean;
    marcar: () => void;
    eliminar: () => void;
}) {
    const categoria = obtenerCategoria(notificacion.tipo);

    return (
        <article
            className={[
                "group relative overflow-hidden rounded-2xl border p-4 transition sm:p-5",
                notificacion.leida
                    ? "border-border bg-[#FBFCFA]"
                    : "border-[#C8D9D1] bg-[#F3F7F5] shadow-sm",
            ].join(" ")}
        >
            {!notificacion.leida && <div className="absolute inset-y-0 left-0 w-1 bg-primary" />}

            <div className="flex items-start gap-4">
                <IconoNotificacion prioridad={notificacion.prioridad} tipo={notificacion.tipo} />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-foreground tracking-tight">{notificacion.titulo}</h3>

                        {!notificacion.leida && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold uppercase text-white">
                                Nueva
                            </span>
                        )}

                        <span className="rounded-full bg-surface-soft px-2 py-0.5 text-xs font-bold uppercase text-[#66756E]">
                            {formatearCategoria(categoria)}
                        </span>

                        <PrioridadBadge prioridad={notificacion.prioridad} />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-text-secondary">{notificacion.mensaje}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8A948F]">
                        <span>{tiempoRelativo(notificacion.fecha_registro)}</span>
                        <span>{formatearFechaHora(notificacion.fecha_registro)}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {(notificacion.enlace || notificacion.cita_id) && (
                            <Link
                                href={notificacion.enlace || `/agenda/${notificacion.cita_id}`}
                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary-soft px-4 text-xs font-bold text-text-secondary transition hover:bg-[#CFDED7]"
                            >
                                Abrir
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        )}

                        <button
                            type="button"
                            disabled={procesando}
                            onClick={marcar}
                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-surface-soft px-4 text-xs font-bold text-[#52605A] transition hover:bg-[#E5EBE7] disabled:opacity-50"
                        >
                            {notificacion.leida ? <Bell className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            {notificacion.leida ? "Marcar pendiente" : "Marcar leída"}
                        </button>

                        <button
                            type="button"
                            disabled={procesando}
                            onClick={eliminar}
                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#F8E5E5] px-4 text-xs font-bold text-[#A25E5E] transition hover:bg-[#F4DADB] disabled:opacity-50"
                        >
                            <Archive className="h-4 w-4" />
                            Archivar
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

function TarjetaRecordatorio({
    recordatorio,
    fechaServidor,
}: {
    recordatorio: RecordatorioCita;
    fechaServidor: string;
}) {
    const vencido = recordatorio.fecha_programada <= fechaServidor;

    return (
        <article className="rounded-2xl border border-border bg-[#FBFCFA] p-4 sm:p-5">
            <div className="flex items-start gap-4">
                <div
                    className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                        vencido
                            ? "bg-[#FAF0DC] text-[#9A742D]"
                            : "bg-primary-soft text-primary-strong",
                    ].join(" ")}
                >
                    {recordatorio.canal === "WHATSAPP" ? <MessageCircle className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-foreground tracking-tight">{recordatorio.titulo}</h3>

                        <span
                            className={[
                                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                vencido
                                    ? "bg-[#FAF0DC] text-[#9A742D]"
                                    : "bg-[#E3EEE8] text-[#527865]",
                            ].join(" ")}
                        >
                            {vencido ? "Pendiente ahora" : "Próximo"}
                        </span>

                        {recordatorio.estado === "FALLIDO" && (
                            <span className="rounded-full bg-[#F8E5E5] px-2 py-0.5 text-xs font-bold uppercase text-[#A25E5E]">
                                Fallido
                            </span>
                        )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-text-secondary">{recordatorio.mensaje}</p>

                    <div className="mt-3 grid gap-2 text-xs text-[#76817B] sm:grid-cols-2">
                        <DatoRecordatorio etiqueta="Cliente" valor={recordatorio.clientes?.nombre_completo ?? "Sin cliente"} />
                        <DatoRecordatorio
                            etiqueta="Cita"
                            valor={
                                recordatorio.citas
                                    ? `${formatearFecha(recordatorio.citas.fecha)} · ${formatearHora(recordatorio.citas.hora_inicio)}`
                                    : "Sin información"
                            }
                        />
                        <DatoRecordatorio etiqueta="Programado" valor={formatearFechaHora(recordatorio.fecha_programada)} />
                        <DatoRecordatorio etiqueta="Canal" valor={formatearTexto(recordatorio.canal)} />
                    </div>

                    {recordatorio.error_envio && (
                        <p className="mt-3 rounded-xl bg-[#F8E5E5] p-3 text-xs text-[#985858]">{recordatorio.error_envio}</p>
                    )}

                    <div className="mt-4">
                        <Link
                            href={`/agenda/${recordatorio.cita_id}`}
                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary-soft px-4 text-xs font-bold text-text-secondary"
                        >
                            Ver cita
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}

function DatoRecordatorio({ etiqueta, valor }: { etiqueta: string; valor: string }) {
    return (
        <div className="rounded-xl bg-[#F3F6F4] px-3 py-2">
            <span className="font-semibold text-[#87938D]">{etiqueta}: </span>
            <strong className="text-[#53615B]">{valor}</strong>
        </div>
    );
}

function TarjetaResumen({
    titulo,
    valor,
    detalle,
    icono: Icono,
    alerta = false,
    onClick,
}: {
    titulo: string;
    valor: number;
    detalle: string;
    icono: React.ComponentType<{ className?: string }>;
    alerta?: boolean;
    onClick?: () => void;
}) {
    const contenido = (
        <article
            className={[
                "rounded-[26px] border border-border bg-white p-5 shadow-[0_8px_24px_rgba(36,48,44,0.05)]",
                onClick
                    ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(36,48,44,0.09)]"
                    : "",
            ].join(" ")}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-text-secondary">{titulo}</p>
                    <p className="mt-3 text-3xl font-bold text-foreground">{valor}</p>
                    <p className="mt-1 text-xs text-[#8A958F]">{detalle}</p>
                </div>

                <div
                    className={[
                        "flex h-11 w-11 items-center justify-center rounded-2xl",
                        alerta
                            ? "bg-[#F5E8EB] text-[#9A6470]"
                            : "bg-primary-soft text-primary-strong",
                    ].join(" ")}
                >
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );

    if (!onClick) {
        return contenido;
    }

    return (
        <button type="button" onClick={onClick} className="w-full text-left">
            {contenido}
        </button>
    );
}

function BotonPestana({
    texto,
    activa,
    cantidad,
    cambiar,
    alerta = false,
}: {
    texto: string;
    activa: boolean;
    cantidad: number;
    cambiar: () => void;
    alerta?: boolean;
}) {
    return (
        <button type="button" onClick={cambiar} className={["inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition", activa ? "bg-white text-[#33413B] shadow-sm" : "text-text-secondary"].join(" ")}>
            {texto}
            {cantidad > 0 && (
                <span
                    className={[
                        "rounded-full px-2 py-0.5 text-[10px] text-white",
                        alerta ? "bg-[#A86572]" : "bg-primary",
                    ].join(" ")}
                >
                    {cantidad > 99 ? "99+" : cantidad}
                </span>
            )}
        </button>
    );
}

function IconoNotificacion({ prioridad, tipo }: { prioridad: string; tipo: string }) {
    const clase =
        prioridad === "URGENTE"
            ? "bg-[#F8E5E5] text-[#A25E5E]"
            : prioridad === "ALTA"
                ? "bg-[#FAF0DC] text-[#9A742D]"
                : "bg-[#DCE7E2] text-[#527064]";

    const categoria = obtenerCategoria(tipo);

    const Icono =
        tipo === "CITA_CANCELADA"
            ? XCircle
            : categoria === "CITAS"
                ? CalendarClock
                : categoria === "INVENTARIO"
                    ? AlertTriangle
                    : categoria === "FINANZAS"
                        ? CircleAlert
                        : Info;

    return (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${clase}`}>
            <Icono className="h-5 w-5" />
        </div>
    );
}

function PrioridadBadge({ prioridad }: { prioridad: string }) {
    if (!["ALTA", "URGENTE"].includes(prioridad)) {
        return null;
    }

    return (
        <span className={["rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", prioridad === "URGENTE" ? "bg-[#F8E5E5] text-[#A25E5E]" : "bg-[#FAF0DC] text-[#9A742D]"].join(" ")}>
            {formatearTexto(prioridad)}
        </span>
    );
}

function MensajeEstado({ mensaje, cerrar }: { mensaje: Exclude<Mensaje, null>; cerrar: () => void }) {
    return (
        <div className={["flex items-start gap-3 rounded-2xl border px-4 py-4", mensaje.tipo === "EXITO" ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]" : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]"].join(" ")}>
            {mensaje.tipo === "EXITO" ? <MailCheck className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
            <p className="min-w-0 flex-1 text-sm font-semibold">{mensaje.texto}</p>
            <button type="button" onClick={cerrar} aria-label="Cerrar mensaje"><X className="h-5 w-5" /></button>
        </div>
    );
}

function EstadoVacio({ titulo, texto }: { titulo: string; texto: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-border-strong bg-[#FBFCFA] p-12 text-center">
            <Bell className="mx-auto h-9 w-9 text-[#829089]" />
            <h3 className="mt-4 font-bold text-foreground tracking-tight">{titulo}</h3>
            <p className="mt-2 text-sm text-text-secondary">{texto}</p>
        </div>
    );
}

const categoriasDisponibles: { valor: Categoria; nombre: string }[] = [
    { valor: "TODAS", nombre: "Todas" },
    { valor: "CITAS", nombre: "Citas" },
    { valor: "CLIENTES", nombre: "Clientes" },
    { valor: "CAJA", nombre: "Caja" },
    { valor: "INVENTARIO", nombre: "Inventario" },
    { valor: "FINANZAS", nombre: "Finanzas" },
    { valor: "COMPRAS", nombre: "Compras" },
    { valor: "SISTEMA", nombre: "Sistema" },
];

function obtenerCategoria(tipo: string): Categoria {
    const valor = tipo.toUpperCase();

    if (valor.startsWith("CITA_") || valor.includes("RECORDATORIO")) return "CITAS";
    if (valor.includes("CLIENTE")) return "CLIENTES";
    if (valor.includes("CAJA") || valor.includes("CIERRE") || valor.includes("COBRO")) return "CAJA";
    if (valor.includes("STOCK") || valor.includes("INVENTARIO") || valor.includes("PRODUCTO")) return "INVENTARIO";
    if (valor.includes("FINANZA") || valor.includes("CUENTA_COBRAR") || valor.includes("PAGO") || valor.includes("GASTO") || valor.includes("INGRESO")) return "FINANZAS";
    if (valor.includes("COMPRA") || valor.includes("PROVEEDOR")) return "COMPRAS";

    return "SISTEMA";
}

function formatearCategoria(categoria: Categoria) {
    return {
        TODAS: "Todas",
        CITAS: "Citas",
        CLIENTES: "Clientes",
        CAJA: "Caja",
        INVENTARIO: "Inventario",
        FINANZAS: "Finanzas",
        COMPRAS: "Compras",
        SISTEMA: "Sistema",
    }[categoria];
}

function requiereAtencion(notificacion: NotificacionSistema) {
    return ["ALTA", "URGENTE"].includes(notificacion.prioridad);
}

function agruparPorFecha(notificaciones: NotificacionSistema[]): GrupoFecha[] {
    const grupos = new Map<string, NotificacionSistema[]>();

    for (const item of notificaciones) {
        const clave = etiquetaFecha(item.fecha_registro);
        const lista = grupos.get(clave) ?? [];
        lista.push(item);
        grupos.set(clave, lista);
    }

    const orden = ["Hoy", "Ayer", "Esta semana", "Anteriores"];

    return orden
        .filter((clave) => grupos.has(clave))
        .map((clave) => ({
            titulo: clave,
            items: grupos.get(clave) ?? [],
        }));
}

function etiquetaFecha(fecha: string) {
    const ahora = new Date();
    const item = new Date(fecha);

    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const diaItem = new Date(item.getFullYear(), item.getMonth(), item.getDate());
    const diferenciaDias = Math.round((hoy.getTime() - diaItem.getTime()) / 86400000);

    if (diferenciaDias === 0) return "Hoy";
    if (diferenciaDias === 1) return "Ayer";
    if (diferenciaDias <= 7) return "Esta semana";
    return "Anteriores";
}

function tiempoRelativo(fecha: string) {
    const diferencia = Date.now() - new Date(fecha).getTime();
    const minutos = Math.max(0, Math.floor(diferencia / 60000));

    if (minutos < 1) return "Ahora";
    if (minutos < 60) return `Hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;

    const dias = Math.floor(horas / 24);
    return `Hace ${dias} día${dias === 1 ? "" : "s"}`;
}

function normalizar(valor: string) {
    return valor
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function formatearFechaHora(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Managua",
    }).format(new Date(fecha));
}

function formatearFecha(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Managua",
    }).format(new Date(`${fecha}T12:00:00-06:00`));
}

function formatearHora(hora: string) {
    const [horas, minutos] = hora.slice(0, 5).split(":").map(Number);

    return new Intl.DateTimeFormat("es-NI", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Managua",
    }).format(new Date(Date.UTC(2026, 0, 1, horas + 6, minutos)));
}

function formatearTexto(valor: string) {
    return valor
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letra) => letra.toUpperCase());
}
