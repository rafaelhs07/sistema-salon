"use client";

import Link from "next/link";
import {
    CalendarDays,
    CalendarRange,
    CheckCircle2,
    ChevronLeft,
    CircleDollarSign,
    ChevronRight,
    Clock3,
    Eye,
    Filter,
    Grid3X3,
    List,
    LoaderCircle,
    MapPin,
    MoreVertical,
    Play,
    Plus,
    RefreshCw,
    Search,
    TimerReset,
    UserRound,
    UserX,
    UsersRound,
    X,
    XCircle,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    cargarAgenda,
    type BloqueoAgenda,
    type CitaAgenda,
} from "./actions";
import {
    cambiarEstadoCita,
    type EstadoCita,
} from "./[id]/actions";

export type SucursalAgenda = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type TrabajadorAgenda = {
    id: string;
    nombre_completo: string;
    color_calendario: string;
};

type VistaAgenda = "DIA" | "SEMANA" | "MES";

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

type MenuContextual = {
    cita: CitaAgenda;
    x: number;
    y: number;
} | null;

export default function AgendaClient({
    citasIniciales,
    bloqueosIniciales,
    sucursales,
    trabajadores,
    sucursalInicialId,
    rangoInicial,
}: {
    citasIniciales: CitaAgenda[];
    bloqueosIniciales: BloqueoAgenda[];
    sucursales: SucursalAgenda[];
    trabajadores: TrabajadorAgenda[];
    sucursalInicialId: string;
    rangoInicial: {
        desde: string;
        hasta: string;
    };
}) {
    const router = useRouter();

    const [vista, setVista] =
        useState<VistaAgenda>("SEMANA");
    const [fechaActual, setFechaActual] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [sucursalId, setSucursalId] =
        useState(sucursalInicialId);
    const [trabajadorId, setTrabajadorId] =
        useState("");
    const [busqueda, setBusqueda] = useState("");
    const [citas, setCitas] = useState(citasIniciales);
    const [bloqueos, setBloqueos] =
        useState(bloqueosIniciales);
    const [rangoCargado, setRangoCargado] =
        useState(rangoInicial);
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [menuContextual, setMenuContextual] =
        useState<MenuContextual>(null);
    const [cargando, iniciarCarga] = useTransition();
    const [actualizandoEstado, iniciarActualizacionEstado] =
        useTransition();

    const rangoVista = useMemo(
        () => obtenerRangoVista(fechaActual, vista),
        [fechaActual, vista],
    );

    const citasVisibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return citas.filter((cita) => {
            const estaOculta =
                cita.estado === "CANCELADA" ||
                cita.estado === "REPROGRAMADA";

            if (estaOculta) {
                return false;
            }

            const dentroRango =
                cita.fecha >= rangoVista.desde &&
                cita.fecha <= rangoVista.hasta;

            const coincideBusqueda =
                !texto ||
                cita.codigo_cita
                    ?.toLowerCase()
                    .includes(texto) ||
                cita.clientes?.nombre_completo
                    .toLowerCase()
                    .includes(texto) ||
                cita.cita_servicios.some((servicio) =>
                    servicio.nombre_servicio
                        .toLowerCase()
                        .includes(texto),
                );

            return dentroRango && coincideBusqueda;
        });
    }, [busqueda, citas, rangoVista]);

    const bloqueosVisibles = useMemo(
        () =>
            bloqueos.filter(
                (bloqueo) =>
                    bloqueo.fecha_inicio <= rangoVista.hasta &&
                    bloqueo.fecha_fin >= rangoVista.desde,
            ),
        [bloqueos, rangoVista],
    );

    useEffect(() => {
        function cerrarMenu() {
            setMenuContextual(null);
        }

        function cerrarConEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setMenuContextual(null);
            }
        }

        window.addEventListener("click", cerrarMenu);
        window.addEventListener("scroll", cerrarMenu, true);
        window.addEventListener("keydown", cerrarConEscape);

        return () => {
            window.removeEventListener("click", cerrarMenu);
            window.removeEventListener("scroll", cerrarMenu, true);
            window.removeEventListener("keydown", cerrarConEscape);
        };
    }, []);

    function abrirMenuContextual(
        event: React.MouseEvent,
        cita: CitaAgenda,
    ) {
        event.preventDefault();
        event.stopPropagation();

        const anchoMenu = 260;
        const altoEstimado = 340;
        const margen = 12;

        const x = Math.min(
            event.clientX,
            window.innerWidth - anchoMenu - margen,
        );

        const y = Math.min(
            event.clientY,
            window.innerHeight - altoEstimado - margen,
        );

        setMenuContextual({
            cita,
            x: Math.max(margen, x),
            y: Math.max(margen, y),
        });
    }

    function ejecutarAccionRapida(
        cita: CitaAgenda,
        nuevoEstado: EstadoCita,
    ) {
        setMenuContextual(null);
        setMensaje(null);

        let motivo: string | undefined;

        if (nuevoEstado === "CANCELADA") {
            motivo =
                window.prompt(
                    "Escribe el motivo de la cancelación:",
                )?.trim() || undefined;

            if (!motivo || motivo.length < 3) {
                setMensaje({
                    tipo: "ERROR",
                    texto:
                        "La cancelación requiere un motivo de al menos 3 caracteres.",
                });
                return;
            }
        }

        iniciarActualizacionEstado(async () => {
            const resultado = await cambiarEstadoCita(
                cita.id,
                nuevoEstado,
                motivo,
            );

            setMensaje({
                tipo: resultado.exito ? "EXITO" : "ERROR",
                texto: resultado.mensaje,
            });

            if (!resultado.exito) {
                return;
            }

            if (
                nuevoEstado === "CANCELADA" ||
                nuevoEstado === "REPROGRAMADA"
            ) {
                setCitas((actuales) =>
                    actuales.filter(
                        (item) => item.id !== cita.id,
                    ),
                );
                return;
            }

            setCitas((actuales) =>
                actuales.map((item) =>
                    item.id === cita.id
                        ? {
                            ...item,
                            estado: nuevoEstado,
                            tiene_venta_activa:
                                item.tiene_venta_activa,
                            tiene_caja_abierta:
                                item.tiene_caja_abierta,
                        }
                        : item,
                ),
            );
        });
    }

    function navegar(direccion: -1 | 1) {
        const fecha = new Date(`${fechaActual}T00:00:00`);

        if (vista === "DIA") {
            fecha.setDate(fecha.getDate() + direccion);
        } else if (vista === "SEMANA") {
            fecha.setDate(fecha.getDate() + direccion * 7);
        } else {
            fecha.setMonth(fecha.getMonth() + direccion);
        }

        const nuevaFecha = fecha.toISOString().slice(0, 10);
        setFechaActual(nuevaFecha);

        const nuevoRango = obtenerRangoVista(
            nuevaFecha,
            vista,
        );

        if (
            nuevoRango.desde < rangoCargado.desde ||
            nuevoRango.hasta > rangoCargado.hasta
        ) {
            cargarDatos(
                ampliarRango(nuevoRango.desde, nuevoRango.hasta),
                sucursalId,
                trabajadorId,
            );
        }
    }

    function irHoy() {
        const hoy = new Date().toISOString().slice(0, 10);
        setFechaActual(hoy);

        if (
            hoy < rangoCargado.desde ||
            hoy > rangoCargado.hasta
        ) {
            const rango = ampliarRango(hoy, hoy);
            cargarDatos(rango, sucursalId, trabajadorId);
        }
    }

    function cambiarVista(nuevaVista: VistaAgenda) {
        setVista(nuevaVista);

        const rango = obtenerRangoVista(
            fechaActual,
            nuevaVista,
        );

        if (
            rango.desde < rangoCargado.desde ||
            rango.hasta > rangoCargado.hasta
        ) {
            cargarDatos(
                ampliarRango(rango.desde, rango.hasta),
                sucursalId,
                trabajadorId,
            );
        }
    }

    function cambiarSucursal(valor: string) {
        setSucursalId(valor);

        cargarDatos(
            ampliarRango(
                rangoVista.desde,
                rangoVista.hasta,
            ),
            valor,
            trabajadorId,
        );
    }

    function cambiarTrabajador(valor: string) {
        setTrabajadorId(valor);

        cargarDatos(
            ampliarRango(
                rangoVista.desde,
                rangoVista.hasta,
            ),
            sucursalId,
            valor,
        );
    }

    function cargarDatos(
        rango: {
            desde: string;
            hasta: string;
        },
        nuevaSucursalId: string,
        nuevoTrabajadorId: string,
    ) {
        setMensaje(null);

        iniciarCarga(async () => {
            const resultado = await cargarAgenda({
                fechaDesde: rango.desde,
                fechaHasta: rango.hasta,
                sucursalId:
                    nuevaSucursalId || undefined,
                trabajadorId:
                    nuevoTrabajadorId || undefined,
            });

            if (!resultado.exito) {
                setMensaje({
                    tipo: "ERROR",
                    texto: resultado.mensaje,
                });
                return;
            }

            setCitas(resultado.citas);
            setBloqueos(resultado.bloqueos);
            setRangoCargado(rango);
        });
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                            <CalendarDays className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Organización diaria
                            </p>
                            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                                Agenda
                            </h1>
                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Consulta citas, trabajadores y bloqueos desde
                                una vista diaria, semanal o mensual.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/agenda/nueva"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#DCE7E2] px-5 font-bold text-[#26332F] transition hover:bg-white"
                    >
                        <Plus className="h-5 w-5" />
                        Nueva cita
                    </Link>
                </div>
            </section>

            {mensaje && (
                <div className="flex items-start gap-3 rounded-2xl border border-[#EBCBCB] bg-[#F8E5E5] px-4 py-4 text-[#985858]">
                    <XCircle className="h-5 w-5 shrink-0" />
                    <p className="min-w-0 flex-1 text-sm font-semibold">
                        {mensaje.texto}
                    </p>
                    <button
                        type="button"
                        onClick={() => setMensaje(null)}
                        aria-label="Cerrar mensaje"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}

            <section className="rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                <header className="border-b border-[#E8ECE9] p-4 sm:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navegar(-1)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE3DF] bg-white text-[#52605A] hover:bg-[#EEF2EF]"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>

                            <button
                                type="button"
                                onClick={irHoy}
                                className="h-10 rounded-xl bg-[#EEF2EF] px-4 text-sm font-bold text-[#43524B]"
                            >
                                Hoy
                            </button>

                            <button
                                type="button"
                                onClick={() => navegar(1)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE3DF] bg-white text-[#52605A] hover:bg-[#EEF2EF]"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>

                            <h2 className="ml-1 text-lg font-bold text-[#24302C] sm:text-xl">
                                {tituloRango(fechaActual, vista)}
                            </h2>

                            {cargando && (
                                <LoaderCircle className="h-5 w-5 animate-spin text-[#6F8F83]" />
                            )}
                        </div>

                        <div className="flex rounded-xl bg-[#EEF2EF] p-1">
                            <BotonVista
                                texto="Día"
                                icono={List}
                                activa={vista === "DIA"}
                                cambiar={() => cambiarVista("DIA")}
                            />
                            <BotonVista
                                texto="Semana"
                                icono={CalendarRange}
                                activa={vista === "SEMANA"}
                                cambiar={() => cambiarVista("SEMANA")}
                            />
                            <BotonVista
                                texto="Mes"
                                icono={Grid3X3}
                                activa={vista === "MES"}
                                cambiar={() => cambiarVista("MES")}
                            />
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                            <input
                                value={busqueda}
                                onChange={(event) =>
                                    setBusqueda(event.target.value)
                                }
                                placeholder="Cliente, servicio o código..."
                                className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83]"
                            />
                        </div>

                        <div className="relative">
                            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                            <select
                                value={sucursalId}
                                onChange={(event) =>
                                    cambiarSucursal(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm"
                            >
                                <option value="">Todas las sucursales</option>
                                {sucursales.map((sucursal) => (
                                    <option
                                        key={sucursal.id}
                                        value={sucursal.id}
                                    >
                                        {sucursal.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <UsersRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                            <select
                                value={trabajadorId}
                                onChange={(event) =>
                                    cambiarTrabajador(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm"
                            >
                                <option value="">Todos los trabajadores</option>
                                {trabajadores.map((trabajador) => (
                                    <option
                                        key={trabajador.id}
                                        value={trabajador.id}
                                    >
                                        {trabajador.nombre_completo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl bg-[#FBFCFA] px-4 text-sm text-[#6B756F]">
                            <Filter className="h-4 w-4" />
                            {citasVisibles.length} cita
                            {citasVisibles.length === 1 ? "" : "s"}
                        </div>
                    </div>

                    <LeyendaEstados />
                </header>

                <div className="p-4 sm:p-5">
                    {vista === "DIA" && (
                        <VistaDia
                            fecha={fechaActual}
                            citas={citasVisibles}
                            bloqueos={bloqueosVisibles}
                            abrirMenu={abrirMenuContextual}
                        />
                    )}

                    {vista === "SEMANA" && (
                        <VistaSemana
                            fecha={fechaActual}
                            citas={citasVisibles}
                            bloqueos={bloqueosVisibles}
                            abrirMenu={abrirMenuContextual}
                        />
                    )}

                    {vista === "MES" && (
                        <VistaMes
                            fecha={fechaActual}
                            citas={citasVisibles}
                            bloqueos={bloqueosVisibles}
                            seleccionarFecha={(fecha) => {
                                setFechaActual(fecha);
                                setVista("DIA");
                            }}
                            abrirMenu={abrirMenuContextual}
                        />
                    )}
                </div>
            </section>

            {menuContextual && (
                <MenuEstadoCita
                    menu={menuContextual}
                    procesando={actualizandoEstado}
                    cerrar={() => setMenuContextual(null)}
                    verDetalle={() =>
                        router.push(
                            `/agenda/${menuContextual.cita.id}`,
                        )
                    }
                    reprogramar={() =>
                        router.push(
                            `/agenda/${menuContextual.cita.id}`,
                        )
                    }
                    cobrarCita={() =>
                        router.push(
                            `/caja/cobrar?citaId=${menuContextual.cita.id}`,
                        )
                    }
                    cambiarEstado={(estado) =>
                        ejecutarAccionRapida(
                            menuContextual.cita,
                            estado,
                        )
                    }
                />
            )}
        </div>
    );
}

function VistaDia({
    fecha,
    citas,
    bloqueos,
    abrirMenu,
}: {
    fecha: string;
    citas: CitaAgenda[];
    bloqueos: BloqueoAgenda[];
    abrirMenu: (
        event: React.MouseEvent,
        cita: CitaAgenda,
    ) => void;
}) {
    const citasDia = citas.filter(
        (cita) => cita.fecha === fecha,
    );

    const bloqueosDia = bloqueos.filter(
        (bloqueo) =>
            bloqueo.fecha_inicio <= fecha &&
            bloqueo.fecha_fin >= fecha,
    );

    return (
        <div className="space-y-4">
            {bloqueosDia.map((bloqueo) => (
                <TarjetaBloqueo
                    key={bloqueo.id}
                    bloqueo={bloqueo}
                />
            ))}

            {citasDia.length === 0 ? (
                <EstadoVacio texto="No hay citas para este día." />
            ) : (
                citasDia.map((cita) => (
                    <TarjetaCita
                        key={cita.id}
                        cita={cita}
                        abrirMenu={abrirMenu}
                    />
                ))
            )}
        </div>
    );
}

function VistaSemana({
    fecha,
    citas,
    bloqueos,
    abrirMenu,
}: {
    fecha: string;
    citas: CitaAgenda[];
    bloqueos: BloqueoAgenda[];
    abrirMenu: (
        event: React.MouseEvent,
        cita: CitaAgenda,
    ) => void;
}) {
    const dias = obtenerDiasSemana(fecha);

    return (
        <div className="overflow-x-auto">
            <div className="grid min-w-[1120px] grid-cols-7 gap-3">
                {dias.map((dia) => {
                    const fechaDia = dia.toISOString().slice(0, 10);
                    const citasDia = citas.filter(
                        (cita) => cita.fecha === fechaDia,
                    );
                    const bloqueosDia = bloqueos.filter(
                        (bloqueo) =>
                            bloqueo.fecha_inicio <= fechaDia &&
                            bloqueo.fecha_fin >= fechaDia,
                    );

                    return (
                        <section
                            key={fechaDia}
                            className="min-h-[560px] rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA]"
                        >
                            <header
                                className={[
                                    "border-b border-[#E3E7E4] p-3 text-center",
                                    fechaDia ===
                                        new Date().toISOString().slice(0, 10)
                                        ? "bg-[#DCE7E2]"
                                        : "bg-white",
                                ].join(" ")}
                            >
                                <p className="text-xs font-bold uppercase text-[#6B756F]">
                                    {new Intl.DateTimeFormat("es-NI", {
                                        weekday: "short",
                                    }).format(dia)}
                                </p>
                                <p className="mt-1 text-lg font-bold text-[#24302C]">
                                    {dia.getDate()}
                                </p>
                            </header>

                            <div className="space-y-2 p-2">
                                {bloqueosDia.map((bloqueo) => (
                                    <TarjetaBloqueoCompacta
                                        key={bloqueo.id}
                                        bloqueo={bloqueo}
                                    />
                                ))}

                                {citasDia.map((cita) => (
                                    <TarjetaCitaCompacta
                                        key={cita.id}
                                        cita={cita}
                                        abrirMenu={abrirMenu}
                                    />
                                ))}

                                {citasDia.length === 0 &&
                                    bloqueosDia.length === 0 && (
                                        <p className="py-8 text-center text-xs text-[#98A19D]">
                                            Sin eventos
                                        </p>
                                    )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

function VistaMes({
    fecha,
    citas,
    bloqueos,
    seleccionarFecha,
    abrirMenu,
}: {
    fecha: string;
    citas: CitaAgenda[];
    bloqueos: BloqueoAgenda[];
    seleccionarFecha: (fecha: string) => void;
    abrirMenu: (
        event: React.MouseEvent,
        cita: CitaAgenda,
    ) => void;
}) {
    const dias = obtenerCuadriculaMes(fecha);

    return (
        <div className="overflow-x-auto">
            <div className="grid min-w-[980px] grid-cols-7 gap-px overflow-hidden rounded-2xl border border-[#E3E7E4] bg-[#E3E7E4]">
                {[
                    "Lun",
                    "Mar",
                    "Mié",
                    "Jue",
                    "Vie",
                    "Sáb",
                    "Dom",
                ].map((dia) => (
                    <div
                        key={dia}
                        className="bg-[#EEF2EF] p-3 text-center text-xs font-bold uppercase text-[#52605A]"
                    >
                        {dia}
                    </div>
                ))}

                {dias.map(({ fechaDia, perteneceMes }) => {
                    const citasDia = citas.filter(
                        (cita) => cita.fecha === fechaDia,
                    );
                    const bloqueosDia = bloqueos.filter(
                        (bloqueo) =>
                            bloqueo.fecha_inicio <= fechaDia &&
                            bloqueo.fecha_fin >= fechaDia,
                    );

                    return (
                        <button
                            key={fechaDia}
                            type="button"
                            onClick={() =>
                                seleccionarFecha(fechaDia)
                            }
                            className={[
                                "min-h-32 bg-white p-2 text-left transition hover:bg-[#F4F7F5]",
                                perteneceMes ? "" : "opacity-45",
                            ].join(" ")}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={[
                                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                                        fechaDia ===
                                            new Date()
                                                .toISOString()
                                                .slice(0, 10)
                                            ? "bg-[#6F8F83] text-white"
                                            : "text-[#33413B]",
                                    ].join(" ")}
                                >
                                    {Number(fechaDia.slice(8, 10))}
                                </span>

                                {(citasDia.length > 0 ||
                                    bloqueosDia.length > 0) && (
                                        <span className="text-[10px] font-semibold text-[#76817B]">
                                            {citasDia.length +
                                                bloqueosDia.length}
                                        </span>
                                    )}
                            </div>

                            <div className="mt-2 space-y-1">
                                {citasDia.slice(0, 3).map((cita) => (
                                    <div
                                        key={cita.id}
                                        onContextMenu={(event) =>
                                            abrirMenu(event, cita)
                                        }
                                        title={`${formatearEstado(cita.estado)} · ${cita.clientes?.nombre_completo ?? "Cliente"}`}
                                        className="truncate rounded-md px-2 py-1 text-[10px] font-semibold text-white"
                                        style={{
                                            backgroundColor:
                                                obtenerColorCita(cita),
                                        }}
                                    >
                                        {formatearHora(cita.hora_inicio)}{" "}
                                        {cita.clientes?.nombre_completo}
                                    </div>
                                ))}

                                {bloqueosDia.slice(0, 1).map((bloqueo) => (
                                    <div
                                        key={bloqueo.id}
                                        className="truncate rounded-md bg-[#929A96] px-2 py-1 text-[10px] font-semibold text-white"
                                    >
                                        {bloqueo.titulo}
                                    </div>
                                ))}

                                {citasDia.length + bloqueosDia.length >
                                    4 && (
                                        <p className="px-1 text-[10px] font-semibold text-[#6B756F]">
                                            +
                                            {citasDia.length +
                                                bloqueosDia.length -
                                                4}{" "}
                                            más
                                        </p>
                                    )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function TarjetaCita({
    cita,
    abrirMenu,
}: {
    cita: CitaAgenda;
    abrirMenu: (
        event: React.MouseEvent,
        cita: CitaAgenda,
    ) => void;
}) {
    return (
        <Link
            href={`/agenda/${cita.id}`}
            onContextMenu={(event) =>
                abrirMenu(event, cita)
            }
            className="relative block overflow-hidden rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] transition hover:-translate-y-0.5 hover:border-[#C8D9D1] hover:shadow-lg"
        >
            <div className="flex">
                <div
                    className="w-1.5 shrink-0"
                    style={{
                        backgroundColor: obtenerColorCita(cita),
                    }}
                />

                <div className="flex-1 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-[#24302C]">
                                    {cita.clientes?.nombre_completo ??
                                        "Cliente"}
                                </p>
                                <EstadoCita estado={cita.estado} />
                            </div>

                            <p className="mt-2 text-sm font-semibold text-[#6F8F83]">
                                {formatearHora(cita.hora_inicio)} –{" "}
                                {formatearHora(cita.hora_fin)}
                            </p>

                            <p className="mt-2 text-sm text-[#6B756F]">
                                {cita.cita_servicios
                                    .map(
                                        (servicio) =>
                                            servicio.nombre_servicio,
                                    )
                                    .join(", ")}
                            </p>
                        </div>

                        <div className="text-sm text-[#6B756F]">
                            <p>
                                {cita.sucursales?.nombre ??
                                    "Sin sucursal"}
                            </p>
                            <p className="mt-1 font-semibold text-[#33413B]">
                                {cita.codigo_cita ?? "Sin código"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {cita.cita_servicios.map((servicio) => (
                            <span
                                key={servicio.id}
                                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#52605A]"
                            >
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{
                                        backgroundColor:
                                            servicio.trabajadores
                                                ?.color_calendario ??
                                            "#6F8F83",
                                    }}
                                />
                                {servicio.trabajadores
                                    ?.nombre_completo ?? "Sin trabajador"}
                            </span>
                        ))}
                    </div>

                    <button
                        type="button"
                        aria-label="Acciones de la cita"
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            abrirMenu(event, cita);
                        }}
                        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-[#52605A] shadow-sm transition hover:bg-white"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </Link>
    );
}

function TarjetaCitaCompacta({
    cita,
    abrirMenu,
}: {
    cita: CitaAgenda;
    abrirMenu: (
        event: React.MouseEvent,
        cita: CitaAgenda,
    ) => void;
}) {
    return (
        <Link
            href={`/agenda/${cita.id}`}
            onContextMenu={(event) =>
                abrirMenu(event, cita)
            }
            className="relative block rounded-xl p-2.5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{
                backgroundColor: obtenerColorCita(cita),
            }}
        >
            <p className="text-[10px] font-bold">
                {cita.hora_inicio.slice(0, 5)} –{" "}
                {cita.hora_fin.slice(0, 5)}
            </p>
            <p className="mt-1 truncate text-xs font-bold">
                {cita.clientes?.nombre_completo}
            </p>
            <p className="mt-1 line-clamp-2 text-[10px] opacity-90">
                {cita.cita_servicios
                    .map((servicio) => servicio.nombre_servicio)
                    .join(", ")}
            </p>

            <span className="mt-2 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                {formatearEstado(cita.estado)}
            </span>

            <button
                type="button"
                aria-label="Acciones de la cita"
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    abrirMenu(event, cita);
                }}
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/15 text-white transition hover:bg-black/25"
            >
                <MoreVertical className="h-3.5 w-3.5" />
            </button>
        </Link>
    );
}


function MenuEstadoCita({
    menu,
    procesando,
    cerrar,
    verDetalle,
    reprogramar,
    cobrarCita,
    cambiarEstado,
}: {
    menu: Exclude<MenuContextual, null>;
    procesando: boolean;
    cerrar: () => void;
    verDetalle: () => void;
    reprogramar: () => void;
    cobrarCita: () => void;
    cambiarEstado: (estado: EstadoCita) => void;
}) {
    const estado = menu.cita.estado as EstadoCita;

    const acciones: {
        texto: string;
        icono: React.ComponentType<{ className?: string }>;
        estado?: EstadoCita;
        accion?: () => void;
        peligro?: boolean;
        deshabilitada?: boolean;
    }[] = [
            {
                texto: "Ver detalle",
                icono: Eye,
                accion: verDetalle,
            },
        ];

    if (estado === "PENDIENTE") {
        acciones.push(
            {
                texto: "Confirmar",
                icono: CheckCircle2,
                estado: "CONFIRMADA",
            },
            {
                texto: "Poner en espera",
                icono: TimerReset,
                estado: "EN_ESPERA",
            },
        );
    }

    if (
        estado === "CONFIRMADA" ||
        estado === "EN_ESPERA"
    ) {
        acciones.push({
            texto: "Iniciar atención",
            icono: Play,
            estado: "EN_PROCESO",
        });
    }

    if (estado === "CONFIRMADA") {
        acciones.push({
            texto: "Poner en espera",
            icono: TimerReset,
            estado: "EN_ESPERA",
        });
    }

    if (estado === "EN_PROCESO") {
        acciones.push({
            texto: "Finalizar",
            icono: CheckCircle2,
            estado: "FINALIZADA",
        });
    }

    if (
        estado === "FINALIZADA" &&
        !menu.cita.tiene_venta_activa &&
        menu.cita.tiene_caja_abierta
    ) {
        acciones.push({
            texto: "Cobrar cita",
            icono: CircleDollarSign,
            accion: cobrarCita,
        });
    }

    if (
        estado === "FINALIZADA" &&
        menu.cita.tiene_venta_activa
    ) {
        acciones.push({
            texto: "Cita ya cobrada",
            icono: CheckCircle2,
            accion: () => undefined,
            deshabilitada: true,
        });
    }

    if (
        estado === "FINALIZADA" &&
        !menu.cita.tiene_venta_activa &&
        !menu.cita.tiene_caja_abierta
    ) {
        acciones.push({
            texto: "Abre caja para cobrar",
            icono: CircleDollarSign,
            accion: () => undefined,
            deshabilitada: true,
        });
    }

    if (
        ["PENDIENTE", "CONFIRMADA", "EN_ESPERA"].includes(
            estado,
        )
    ) {
        acciones.push({
            texto: "Marcar no asistió",
            icono: UserX,
            estado: "NO_ASISTIO",
        });
    }

    if (
        ![
            "FINALIZADA",
            "CANCELADA",
            "NO_ASISTIO",
            "REPROGRAMADA",
        ].includes(estado)
    ) {
        acciones.push(
            {
                texto: "Reprogramar",
                icono: RefreshCw,
                accion: reprogramar,
            },
            {
                texto: "Cancelar",
                icono: XCircle,
                estado: "CANCELADA",
                peligro: true,
            },
        );
    }

    return (
        <div
            role="menu"
            aria-label="Acciones de la cita"
            onClick={(event) => event.stopPropagation()}
            className="fixed z-[120] w-64 overflow-hidden rounded-2xl border border-[#DCE3DF] bg-white p-2 shadow-[0_20px_55px_rgba(36,48,44,0.24)]"
            style={{
                left: menu.x,
                top: menu.y,
            }}
        >
            <div className="border-b border-[#E8ECE9] px-3 py-2.5">
                <p className="truncate text-sm font-bold text-[#24302C]">
                    {menu.cita.clientes?.nombre_completo ??
                        "Cliente"}
                </p>
                <p className="mt-1 text-xs text-[#6B756F]">
                    {formatearHora(menu.cita.hora_inicio)} –{" "}
                    {formatearHora(menu.cita.hora_fin)} ·{" "}
                    {formatearEstado(menu.cita.estado)}
                </p>
            </div>

            <div className="mt-1">
                {acciones.map((accion, indice) => {
                    const Icono = accion.icono;

                    return (
                        <button
                            key={`${accion.texto}-${indice}`}
                            type="button"
                            role="menuitem"
                            disabled={
                                procesando ||
                                accion.deshabilitada
                            }
                            onClick={() => {
                                if (accion.estado) {
                                    cambiarEstado(accion.estado);
                                    return;
                                }

                                accion.accion?.();
                                cerrar();
                            }}
                            className={[
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                                accion.peligro
                                    ? "text-[#A25E5E] hover:bg-[#F8E5E5]"
                                    : "text-[#43524B] hover:bg-[#EEF2EF]",
                            ].join(" ")}
                        >
                            {procesando ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <Icono className="h-4 w-4" />
                            )}
                            {accion.texto}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function TarjetaBloqueo({
    bloqueo,
}: {
    bloqueo: BloqueoAgenda;
}) {
    return (
        <article className="rounded-2xl border border-[#D8DEDA] bg-[#EEF2EF] p-4">
            <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#6B756F]" />
                <div>
                    <p className="font-bold text-[#33413B]">
                        {bloqueo.titulo}
                    </p>
                    <p className="mt-1 text-sm text-[#6B756F]">
                        {bloqueo.todo_el_dia
                            ? "Todo el día"
                            : `${formatearHora(bloqueo.hora_inicio ?? "00:00")} – ${formatearHora(bloqueo.hora_fin ?? "00:00")}`}
                    </p>
                </div>
            </div>
        </article>
    );
}

function TarjetaBloqueoCompacta({
    bloqueo,
}: {
    bloqueo: BloqueoAgenda;
}) {
    return (
        <article className="rounded-xl bg-[#929A96] p-2.5 text-white">
            <p className="truncate text-[10px] font-bold">
                {bloqueo.todo_el_dia
                    ? "Todo el día"
                    : `${formatearHora(bloqueo.hora_inicio ?? "00:00")} – ${formatearHora(bloqueo.hora_fin ?? "00:00")}`}
            </p>
            <p className="mt-1 truncate text-xs font-semibold">
                {bloqueo.titulo}
            </p>
        </article>
    );
}

function EstadoCita({ estado }: { estado: string }) {
    const estilos: Record<string, string> = {
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
            className={[
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                estilos[estado] ??
                "bg-[#EEF2EF] text-[#6B756F]",
            ].join(" ")}
        >
            {formatearEstado(estado)}
        </span>
    );
}

function BotonVista({
    texto,
    icono: Icono,
    activa,
    cambiar,
}: {
    texto: string;
    icono: React.ComponentType<{ className?: string }>;
    activa: boolean;
    cambiar: () => void;
}) {
    return (
        <button
            type="button"
            onClick={cambiar}
            className={[
                "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition",
                activa
                    ? "bg-white text-[#33413B] shadow-sm"
                    : "text-[#6B756F]",
            ].join(" ")}
        >
            <Icono className="h-4 w-4" />
            {texto}
        </button>
    );
}

function EstadoVacio({ texto }: { texto: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-12 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-[#829089]" />
            <p className="mt-3 text-sm text-[#6B756F]">
                {texto}
            </p>
        </div>
    );
}

function formatearHora(hora: string) {
    const [hora24, minuto = "00"] = hora.slice(0, 5).split(":").map(Number);
    const periodo = hora24 >= 12 ? "p. m." : "a. m.";
    const hora12 = hora24 % 12 || 12;

    return `${hora12}:${String(minuto).padStart(2, "0")} ${periodo}`;
}

function obtenerColorCita(cita: CitaAgenda) {
    const coloresPorEstado: Record<string, string> = {
        PENDIENTE: "#B8892F",
        CONFIRMADA: "#5B8A72",
        EN_ESPERA: "#657C9A",
        EN_PROCESO: "#766090",
        FINALIZADA: "#4F7465",
        NO_ASISTIO: "#936C58",
        CANCELADA: "#A25E5E",
        REPROGRAMADA: "#7A827E",
    };

    return coloresPorEstado[cita.estado] ?? "#6F8F83";
}

function formatearEstado(estado: string) {
    return estado
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letra) => letra.toUpperCase());
}

function LeyendaEstados() {
    const estados = [
        ["PENDIENTE", "Pendiente"],
        ["CONFIRMADA", "Confirmada"],
        ["EN_ESPERA", "En espera"],
        ["EN_PROCESO", "En proceso"],
        ["FINALIZADA", "Finalizada"],
        ["NO_ASISTIO", "No asistió"],
    ];

    return (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#E8ECE9] pt-4">
            <span className="text-xs font-bold uppercase tracking-wide text-[#829089]">
                Estados:
            </span>

            {estados.map(([estado, texto]) => (
                <span
                    key={estado}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#52605A]"
                >
                    <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                            backgroundColor: obtenerColorCita({
                                estado,
                                cita_servicios: [],
                            } as CitaAgenda),
                        }}
                    />
                    {texto}
                </span>
            ))}
        </div>
    );
}

function obtenerRangoVista(
    fecha: string,
    vista: VistaAgenda,
) {
    const base = new Date(`${fecha}T00:00:00`);

    if (vista === "DIA") {
        return {
            desde: fecha,
            hasta: fecha,
        };
    }

    if (vista === "SEMANA") {
        const dias = obtenerDiasSemana(fecha);

        return {
            desde: dias[0].toISOString().slice(0, 10),
            hasta: dias[6].toISOString().slice(0, 10),
        };
    }

    const primero = new Date(
        base.getFullYear(),
        base.getMonth(),
        1,
    );
    const ultimo = new Date(
        base.getFullYear(),
        base.getMonth() + 1,
        0,
    );

    return {
        desde: primero.toISOString().slice(0, 10),
        hasta: ultimo.toISOString().slice(0, 10),
    };
}

function ampliarRango(desde: string, hasta: string) {
    const fechaDesde = new Date(`${desde}T00:00:00`);
    const fechaHasta = new Date(`${hasta}T00:00:00`);

    fechaDesde.setDate(fechaDesde.getDate() - 35);
    fechaHasta.setDate(fechaHasta.getDate() + 65);

    return {
        desde: fechaDesde.toISOString().slice(0, 10),
        hasta: fechaHasta.toISOString().slice(0, 10),
    };
}

function obtenerDiasSemana(fecha: string) {
    const base = new Date(`${fecha}T00:00:00`);
    const dia = base.getDay();
    const diferencia = dia === 0 ? -6 : 1 - dia;

    const lunes = new Date(base);
    lunes.setDate(base.getDate() + diferencia);

    return Array.from({ length: 7 }, (_, indice) => {
        const fechaDia = new Date(lunes);
        fechaDia.setDate(lunes.getDate() + indice);
        return fechaDia;
    });
}

function obtenerCuadriculaMes(fecha: string) {
    const base = new Date(`${fecha}T00:00:00`);
    const primeroMes = new Date(
        base.getFullYear(),
        base.getMonth(),
        1,
    );
    const ultimoMes = new Date(
        base.getFullYear(),
        base.getMonth() + 1,
        0,
    );

    const diaPrimero = primeroMes.getDay();
    const desplazamiento =
        diaPrimero === 0 ? 6 : diaPrimero - 1;

    const inicio = new Date(primeroMes);
    inicio.setDate(primeroMes.getDate() - desplazamiento);

    const dias: {
        fechaDia: string;
        perteneceMes: boolean;
    }[] = [];

    for (let indice = 0; indice < 42; indice += 1) {
        const dia = new Date(inicio);
        dia.setDate(inicio.getDate() + indice);

        dias.push({
            fechaDia: dia.toISOString().slice(0, 10),
            perteneceMes:
                dia.getMonth() === base.getMonth() &&
                dia.getFullYear() === base.getFullYear(),
        });
    }

    return dias;
}

function tituloRango(
    fecha: string,
    vista: VistaAgenda,
) {
    const base = new Date(`${fecha}T00:00:00`);

    if (vista === "DIA") {
        return new Intl.DateTimeFormat("es-NI", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).format(base);
    }

    if (vista === "MES") {
        return new Intl.DateTimeFormat("es-NI", {
            month: "long",
            year: "numeric",
        }).format(base);
    }

    const dias = obtenerDiasSemana(fecha);
    const desde = dias[0];
    const hasta = dias[6];

    return `${desde.getDate()} ${new Intl.DateTimeFormat(
        "es-NI",
        {
            month: "short",
        },
    ).format(desde)} – ${hasta.getDate()} ${new Intl.DateTimeFormat(
        "es-NI",
        {
            month: "short",
            year: "numeric",
        },
    ).format(hasta)}`;
}