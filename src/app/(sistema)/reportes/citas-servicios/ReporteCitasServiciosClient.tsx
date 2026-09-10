"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Filter,
    Search,
    Store,
    UserRound,
    UsersRound,
    XCircle,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import BotonExportarExcel from "@/components/reportes/BotonExportarExcel";

import {
    exportarReporteCitasServiciosExcel,
} from "./exportarReporteCitasServiciosExcel";

export type SucursalReporteCitas = {
    id: string;
    nombre: string;
};

export type TrabajadorFiltroReporte = {
    id: string;
    nombre_completo: string;
};

export type CitaReporte = {
    id: string;
    codigo_cita: string | null;
    sucursal_id: string;
    cliente_id: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    duracion_total_minutos: number;
    subtotal: number;
    descuento: number;
    total: number;
    estado: string;
    origen: string;
    clientes: {
        nombre_completo: string;
        codigo_cliente: string | null;
    } | null;
    sucursales: {
        nombre: string;
    } | null;
    cita_servicios: {
        id: string;
        servicio_id: string;
        trabajador_id: string;
        nombre_servicio: string;
        precio_unitario: number;
        descuento: number;
        total: number;
        duracion_minutos: number;
        hora_inicio: string;
        hora_fin: string;
        estado: string;
        trabajadores: {
            id: string;
            nombre_completo: string;
        } | null;
    }[];
};

type ResumenRanking = {
    nombre: string;
    cantidad: number;
    total: number;
    porcentaje: number;
};

export default function ReporteCitasServiciosClient({
    simboloMoneda,
    citas,
    sucursales,
    trabajadores,
}: {
    simboloMoneda: string;
    citas: CitaReporte[];
    sucursales: SucursalReporteCitas[];
    trabajadores: TrabajadorFiltroReporte[];
}) {
    const hoy = new Date();

    const primerDiaMes =
        new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            1,
        )
            .toISOString()
            .slice(0, 10);

    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        fechaDesde,
        setFechaDesde,
    ] = useState(
        primerDiaMes,
    );

    const [
        fechaHasta,
        setFechaHasta,
    ] = useState(
        hoy
            .toISOString()
            .slice(0, 10),
    );

    const [
        sucursalId,
        setSucursalId,
    ] = useState("");

    const [
        trabajadorId,
        setTrabajadorId,
    ] = useState("");

    const [
        estado,
        setEstado,
    ] = useState("");

    const [
        servicio,
        setServicio,
    ] = useState("");

    const [
        exportando,
        setExportando,
    ] = useState(false);

    const serviciosDisponibles =
        useMemo(
            () =>
                Array.from(
                    new Set(
                        citas.flatMap(
                            (cita) =>
                                cita.cita_servicios.map(
                                    (item) =>
                                        item.nombre_servicio,
                                ),
                        ),
                    ),
                ).sort(),
            [citas],
        );

    const estadosDisponibles =
        useMemo(
            () =>
                Array.from(
                    new Set(
                        citas.map(
                            (cita) =>
                                cita.estado,
                        ),
                    ),
                ).sort(),
            [citas],
        );

    const citasFiltradas =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            return citas.filter(
                (cita) => {
                    const coincideTexto =
                        !texto ||
                        cita.codigo_cita
                            ?.toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        cita.clientes
                            ?.nombre_completo
                            .toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        cita.cita_servicios.some(
                            (item) =>
                                item.nombre_servicio
                                    .toLowerCase()
                                    .includes(
                                        texto,
                                    ),
                        );

                    const coincideDesde =
                        !fechaDesde ||
                        cita.fecha >=
                        fechaDesde;

                    const coincideHasta =
                        !fechaHasta ||
                        cita.fecha <=
                        fechaHasta;

                    const coincideSucursal =
                        !sucursalId ||
                        cita.sucursal_id ===
                        sucursalId;

                    const coincideTrabajador =
                        !trabajadorId ||
                        cita.cita_servicios.some(
                            (item) =>
                                item.trabajador_id ===
                                trabajadorId,
                        );

                    const coincideEstado =
                        !estado ||
                        cita.estado ===
                        estado;

                    const coincideServicio =
                        !servicio ||
                        cita.cita_servicios.some(
                            (item) =>
                                item.nombre_servicio ===
                                servicio,
                        );

                    return (
                        coincideTexto &&
                        coincideDesde &&
                        coincideHasta &&
                        coincideSucursal &&
                        coincideTrabajador &&
                        coincideEstado &&
                        coincideServicio
                    );
                },
            );
        }, [
            busqueda,
            fechaDesde,
            fechaHasta,
            sucursalId,
            trabajadorId,
            estado,
            servicio,
            citas,
        ]);

    const serviciosFiltrados =
        useMemo(
            () =>
                citasFiltradas.flatMap(
                    (cita) =>
                        cita.cita_servicios.filter(
                            (item) =>
                                (!trabajadorId ||
                                    item.trabajador_id ===
                                    trabajadorId) &&
                                (!servicio ||
                                    item.nombre_servicio ===
                                    servicio),
                        ),
                ),
            [
                citasFiltradas,
                trabajadorId,
                servicio,
            ],
        );

    const resumen =
        useMemo(() => {
            const finalizadas =
                citasFiltradas.filter(
                    (cita) =>
                        cita.estado ===
                        "FINALIZADA",
                ).length;

            const canceladas =
                citasFiltradas.filter(
                    (cita) =>
                        [
                            "CANCELADA",
                            "NO_ASISTIO",
                        ].includes(
                            cita.estado,
                        ),
                ).length;

            const totalCitas =
                citasFiltradas.reduce(
                    (
                        total,
                        cita,
                    ) =>
                        total +
                        Number(
                            cita.total,
                        ),
                    0,
                );

            return {
                total:
                    citasFiltradas.length,
                finalizadas,
                canceladas,
                servicios:
                    serviciosFiltrados.length,
                valorCitas:
                    totalCitas,
            };
        }, [
            citasFiltradas,
            serviciosFiltrados,
        ]);

    const porEstado =
        useMemo(
            () =>
                rankingCitas(
                    citasFiltradas,
                    (cita) =>
                        formatearEstado(
                            cita.estado,
                        ),
                ),
            [
                citasFiltradas,
            ],
        );

    const porTrabajador =
        useMemo(
            () =>
                rankingServicios(
                    serviciosFiltrados,
                    (item) =>
                        item.trabajadores
                            ?.nombre_completo ??
                        "Sin trabajador",
                ),
            [
                serviciosFiltrados,
            ],
        );

    const porServicio =
        useMemo(
            () =>
                rankingServicios(
                    serviciosFiltrados,
                    (item) =>
                        item.nombre_servicio,
                ),
            [
                serviciosFiltrados,
            ],
        );

    const porDia =
        useMemo(
            () =>
                resumenDiario(
                    citasFiltradas,
                ),
            [
                citasFiltradas,
            ],
        );

    const nombreSucursal =
        sucursalId
            ? sucursales.find(
                (
                    sucursal,
                ) =>
                    sucursal.id ===
                    sucursalId,
            )?.nombre ??
            "Sucursal"
            : "Todas las sucursales";

    async function exportarExcel() {
        if (
            exportando
        ) {
            return;
        }

        setExportando(
            true,
        );

        try {
            await exportarReporteCitasServiciosExcel(
                {
                    simboloMoneda,
                    fechaDesde,
                    fechaHasta,
                    nombreSucursal,

                    trabajador:
                        trabajadorId
                            ? trabajadores.find(
                                (
                                    item,
                                ) =>
                                    item.id ===
                                    trabajadorId,
                            )?.nombre_completo ??
                            "Trabajador"
                            : "Todos los trabajadores",

                    estado:
                        estado
                            ? formatearEstado(
                                estado,
                            )
                            : "Todos los estados",

                    servicio:
                        servicio ||
                        "Todos los servicios",

                    totalCitas:
                        resumen.total,

                    finalizadas:
                        resumen.finalizadas,

                    canceladas:
                        resumen.canceladas,

                    servicios:
                        resumen.servicios,

                    valorCitas:
                        resumen.valorCitas,

                    citas:
                        citasFiltradas,

                    porEstado,
                    porTrabajador,
                    porServicio,
                    porDia,
                },
            );
        } catch (error) {
            console.error(
                "Error exportando reporte de citas y servicios:",
                error,
            );

            window.alert(
                "No fue posible generar el Excel.",
            );
        } finally {
            setExportando(
                false,
            );
        }
    }

    function limpiarFiltros() {
        setBusqueda("");
        setFechaDesde(
            primerDiaMes,
        );
        setFechaHasta(
            hoy
                .toISOString()
                .slice(0, 10),
        );
        setSucursalId("");
        setTrabajadorId("");
        setEstado("");
        setServicio("");
    }

    return (
        <div className="space-y-6 pb-8">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/reportes"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Reportes
                    </Link>

                    <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                                <CalendarDays className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Operación del salón
                                </p>

                                <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                    Reporte de citas y servicios
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Analiza el comportamiento de las citas,
                                    servicios realizados y carga de trabajo del personal.
                                </p>
                            </div>
                        </div>

                        <BotonExportarExcel
                            exportando={exportando}
                            onClick={exportarExcel}
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Kpi
                    titulo="Citas"
                    valor={String(
                        resumen.total,
                    )}
                    icono={CalendarDays}
                />

                <Kpi
                    titulo="Finalizadas"
                    valor={String(
                        resumen.finalizadas,
                    )}
                    icono={CheckCircle2}
                />

                <Kpi
                    titulo="Canceladas / no asistió"
                    valor={String(
                        resumen.canceladas,
                    )}
                    icono={XCircle}
                />

                <Kpi
                    titulo="Servicios"
                    valor={String(
                        resumen.servicios,
                    )}
                    icono={UsersRound}
                />

                <Kpi
                    titulo="Valor de citas"
                    valor={moneda(
                        resumen.valorCitas,
                        simboloMoneda,
                    )}
                    icono={Clock3}
                />
            </section>

            <section className="salon-panel border border-border bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-sidebar tracking-tight">
                            Filtros del reporte
                        </h2>

                        <p className="mt-1 text-sm text-[#72827A]">
                            Filtra por periodo, personal, estado y servicio.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            limpiarFiltros
                        }
                        className="salon-action border border-border px-4 text-[#52605A] transition hover:bg-surface-soft"
                    >
                        Limpiar filtros
                    </button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="relative md:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87948D]" />

                        <input
                            value={
                                busqueda
                            }
                            onChange={(
                                event,
                            ) =>
                                setBusqueda(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Código, cliente o servicio..."
                            className="salon-control w-full border border-border bg-[#F9FBFA] pl-11 pr-4 outline-none focus:border-primary focus:bg-white"
                        />
                    </div>

                    <input
                        type="date"
                        value={
                            fechaDesde
                        }
                        onChange={(
                            event,
                        ) =>
                            setFechaDesde(
                                event
                                    .target
                                    .value,
                            )
                        }
                        className="salon-control border border-border bg-[#F9FBFA] px-3 outline-none focus:border-primary"
                    />

                    <input
                        type="date"
                        value={
                            fechaHasta
                        }
                        onChange={(
                            event,
                        ) =>
                            setFechaHasta(
                                event
                                    .target
                                    .value,
                            )
                        }
                        className="salon-control border border-border bg-[#F9FBFA] px-3 outline-none focus:border-primary"
                    />

                    <Select
                        valor={
                            sucursalId
                        }
                        cambiar={
                            setSucursalId
                        }
                    >
                        <option value="">
                            Todas las sucursales
                        </option>

                        {sucursales.map(
                            (
                                sucursal,
                            ) => (
                                <option
                                    key={
                                        sucursal.id
                                    }
                                    value={
                                        sucursal.id
                                    }
                                >
                                    {
                                        sucursal.nombre
                                    }
                                </option>
                            ),
                        )}
                    </Select>

                    <Select
                        valor={
                            trabajadorId
                        }
                        cambiar={
                            setTrabajadorId
                        }
                    >
                        <option value="">
                            Todos los trabajadores
                        </option>

                        {trabajadores.map(
                            (
                                trabajador,
                            ) => (
                                <option
                                    key={
                                        trabajador.id
                                    }
                                    value={
                                        trabajador.id
                                    }
                                >
                                    {
                                        trabajador.nombre_completo
                                    }
                                </option>
                            ),
                        )}
                    </Select>

                    <Select
                        valor={
                            estado
                        }
                        cambiar={
                            setEstado
                        }
                    >
                        <option value="">
                            Todos los estados
                        </option>

                        {estadosDisponibles.map(
                            (
                                item,
                            ) => (
                                <option
                                    key={
                                        item
                                    }
                                    value={
                                        item
                                    }
                                >
                                    {formatearEstado(
                                        item,
                                    )}
                                </option>
                            ),
                        )}
                    </Select>

                    <Select
                        valor={
                            servicio
                        }
                        cambiar={
                            setServicio
                        }
                    >
                        <option value="">
                            Todos los servicios
                        </option>

                        {serviciosDisponibles.map(
                            (
                                item,
                            ) => (
                                <option
                                    key={
                                        item
                                    }
                                    value={
                                        item
                                    }
                                >
                                    {
                                        item
                                    }
                                </option>
                            ),
                        )}
                    </Select>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                <Ranking
                    titulo="Estados de cita"
                    descripcion="Distribución de citas por estado."
                    datos={
                        porEstado
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                    mostrarMonto={
                        false
                    }
                />

                <Ranking
                    titulo="Servicios más realizados"
                    descripcion="Servicios con mayor frecuencia."
                    datos={
                        porServicio
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />

                <Ranking
                    titulo="Carga por trabajador"
                    descripcion="Servicios registrados por trabajador."
                    datos={
                        porTrabajador
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />
            </section>

            <section className="salon-panel border border-border bg-white p-5">
                <h2 className="text-lg font-bold text-sidebar tracking-tight">
                    Comportamiento diario
                </h2>

                <p className="mt-1 text-sm text-[#72827A]">
                    Cantidad de citas por día en el periodo seleccionado.
                </p>

                <div className="mt-6 overflow-x-auto">
                    <div className="flex min-h-[200px] min-w-[680px] items-end gap-2 rounded-2xl bg-[#F7FAF8] px-4 py-4">
                        {porDia.length ===
                            0 ? (
                            <p className="m-auto text-sm text-[#74837C]">
                                Sin datos en el periodo.
                            </p>
                        ) : (
                            porDia.map(
                                (
                                    item,
                                ) => {
                                    const maximo =
                                        Math.max(
                                            ...porDia.map(
                                                (
                                                    dato,
                                                ) =>
                                                    dato.cantidad,
                                            ),
                                            1,
                                        );

                                    return (
                                        <div
                                            key={
                                                item.fecha
                                            }
                                            className="flex min-w-[24px] flex-1 flex-col items-center justify-end"
                                        >
                                            <div
                                                title={`${item.fecha}: ${item.cantidad} citas`}
                                                className="w-full max-w-[25px] rounded-t-md bg-primary"
                                                style={{
                                                    height: `${Math.max(
                                                        (
                                                            item.cantidad /
                                                            maximo
                                                        ) *
                                                        145,
                                                        5,
                                                    )}px`,
                                                }}
                                            />

                                            <span className="mt-2 text-xs font-semibold text-[#71817A]">
                                                {
                                                    item.etiqueta
                                                }
                                            </span>
                                        </div>
                                    );
                                },
                            )
                        )}
                    </div>
                </div>
            </section>

            <section className="salon-panel overflow-hidden border border-border bg-white">
                <div className="flex items-center justify-between border-b border-[#E7EEEA] px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="font-bold text-sidebar tracking-tight">
                            Detalle de citas
                        </h2>

                        <p className="mt-1 text-xs text-[#74837C]">
                            {citasFiltradas.length} citas encontradas
                        </p>
                    </div>

                    <Filter className="h-5 w-5 text-[#71817A]" />
                </div>

                <div className="overflow-x-auto">
                    <table className="salon-table min-w-[1280px] w-full">
                        <thead className="bg-[#F7FAF8]">
                            <tr>
                                <Th>Fecha</Th>
                                <Th>Código</Th>
                                <Th>Cliente</Th>
                                <Th>Sucursal</Th>
                                <Th>Horario</Th>
                                <Th>Estado</Th>
                                <Th>Servicios</Th>
                                <Th>Trabajador</Th>
                                <Th derecha>Total</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EDF3EF]">
                            {citasFiltradas.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            9
                                        }
                                        className="px-6 py-14 text-center text-sm text-[#74837C]"
                                    >
                                        No hay citas con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                citasFiltradas.map(
                                    (
                                        cita,
                                    ) => (
                                        <tr
                                            key={
                                                cita.id
                                            }
                                            className="transition hover:bg-[#FAFCFB]"
                                        >
                                            <Td>
                                                {fechaCorta(
                                                    cita.fecha,
                                                )}
                                            </Td>

                                            <Td>
                                                <span className="font-bold text-[#33413B]">
                                                    {cita.codigo_cita ??
                                                        "—"}
                                                </span>
                                            </Td>

                                            <Td>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <UserRound className="h-3.5 w-3.5 text-[#7F8E87]" />
                                                    {cita
                                                        .clientes
                                                        ?.nombre_completo ??
                                                        "Sin cliente"}
                                                </span>
                                            </Td>

                                            <Td>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Store className="h-3.5 w-3.5 text-[#7F8E87]" />
                                                    {cita
                                                        .sucursales
                                                        ?.nombre ??
                                                        "Sin sucursal"}
                                                </span>
                                            </Td>

                                            <Td>
                                                {hora12(
                                                    cita.hora_inicio,
                                                )}{" "}
                                                -{" "}
                                                {hora12(
                                                    cita.hora_fin,
                                                )}
                                            </Td>

                                            <Td>
                                                {formatearEstado(
                                                    cita.estado,
                                                )}
                                            </Td>

                                            <Td>
                                                {cita.cita_servicios
                                                    .map(
                                                        (
                                                            item,
                                                        ) =>
                                                            item.nombre_servicio,
                                                    )
                                                    .join(
                                                        ", ",
                                                    )}
                                            </Td>

                                            <Td>
                                                {Array.from(
                                                    new Set(
                                                        cita.cita_servicios.map(
                                                            (
                                                                item,
                                                            ) =>
                                                                item
                                                                    .trabajadores
                                                                    ?.nombre_completo ??
                                                                "Sin trabajador",
                                                        ),
                                                    ),
                                                ).join(
                                                    ", ",
                                                )}
                                            </Td>

                                            <Td derecha>
                                                <span className="font-bold text-sidebar">
                                                    {moneda(
                                                        Number(
                                                            cita.total,
                                                        ),
                                                        simboloMoneda,
                                                    )}
                                                </span>
                                            </Td>
                                        </tr>
                                    ),
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function Kpi({
    titulo,
    valor,
    icono: Icono,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#71817A]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-sidebar">
                        {valor}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-soft text-[#587064]">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function Select({
    valor,
    cambiar,
    children,
}: {
    valor: string;
    cambiar: (
        valor: string,
    ) => void;
    children: React.ReactNode;
}) {
    return (
        <select
            value={
                valor
            }
            onChange={(
                event,
            ) =>
                cambiar(
                    event
                        .target
                        .value,
                )
            }
            className="salon-control border border-border bg-[#F9FBFA] px-3 font-medium text-text-secondary outline-none focus:border-primary focus:bg-white"
        >
            {children}
        </select>
    );
}

function Ranking({
    titulo,
    descripcion,
    datos,
    simboloMoneda,
    mostrarMonto = true,
}: {
    titulo: string;
    descripcion: string;
    datos: ResumenRanking[];
    simboloMoneda: string;
    mostrarMonto?: boolean;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-sidebar tracking-tight">
                {titulo}
            </h2>

            <p className="mt-1 text-sm text-[#72827A]">
                {descripcion}
            </p>

            <div className="mt-6 space-y-4">
                {datos.length ===
                    0 ? (
                    <p className="rounded-2xl bg-[#F7FAF8] px-4 py-8 text-center text-sm text-[#74837C]">
                        Sin datos en el periodo.
                    </p>
                ) : (
                    datos
                        .slice(
                            0,
                            7,
                        )
                        .map(
                            (
                                dato,
                            ) => (
                                <div
                                    key={
                                        dato.nombre
                                    }
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-[#33413B]">
                                                {
                                                    dato.nombre
                                                }
                                            </p>

                                            <p className="mt-0.5 text-xs text-[#7D8A84]">
                                                {
                                                    dato.cantidad
                                                }{" "}
                                                registro
                                                {dato.cantidad ===
                                                    1
                                                    ? ""
                                                    : "s"}{" "}
                                                ·{" "}
                                                {dato.porcentaje.toFixed(
                                                    1,
                                                )}
                                                %
                                            </p>
                                        </div>

                                        {mostrarMonto && (
                                            <p className="text-sm font-bold text-sidebar">
                                                {moneda(
                                                    dato.total,
                                                    simboloMoneda,
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-soft">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{
                                                width: `${Math.max(
                                                    dato.porcentaje,
                                                    2,
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ),
                        )
                )}
            </div>
        </article>
    );
}

function Th({
    children,
    derecha = false,
}: {
    children: React.ReactNode;
    derecha?: boolean;
}) {
    return (
        <th
            className={`px-5 py-3 text-xs font-bold uppercase tracking-[0.13em] text-[#789087] ${derecha
                    ? "text-right"
                    : "text-left"
                }`}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    derecha = false,
}: {
    children: React.ReactNode;
    derecha?: boolean;
}) {
    return (
        <td
            className={`px-5 py-4 text-sm text-[#53645C] ${derecha
                    ? "text-right"
                    : "text-left"
                }`}
        >
            {children}
        </td>
    );
}

function rankingCitas(
    citas: CitaReporte[],
    nombre: (
        cita: CitaReporte,
    ) => string,
) {
    const mapa =
        new Map<
            string,
            {
                cantidad: number;
                total: number;
            }
        >();

    citas.forEach(
        (cita) => {
            const clave =
                nombre(
                    cita,
                );

            const actual =
                mapa.get(
                    clave,
                ) ?? {
                    cantidad: 0,
                    total: 0,
                };

            actual.cantidad +=
                1;

            actual.total +=
                Number(
                    cita.total,
                );

            mapa.set(
                clave,
                actual,
            );
        },
    );

    return normalizarRanking(
        mapa,
    );
}

function rankingServicios(
    servicios: CitaReporte["cita_servicios"],
    nombre: (
        servicio: CitaReporte["cita_servicios"][number],
    ) => string,
) {
    const mapa =
        new Map<
            string,
            {
                cantidad: number;
                total: number;
            }
        >();

    servicios.forEach(
        (
            item,
        ) => {
            const clave =
                nombre(
                    item,
                );

            const actual =
                mapa.get(
                    clave,
                ) ?? {
                    cantidad: 0,
                    total: 0,
                };

            actual.cantidad +=
                1;

            actual.total +=
                Number(
                    item.total,
                );

            mapa.set(
                clave,
                actual,
            );
        },
    );

    return normalizarRanking(
        mapa,
    );
}

function normalizarRanking(
    mapa: Map<
        string,
        {
            cantidad: number;
            total: number;
        }
    >,
): ResumenRanking[] {
    const totalRegistros =
        Array.from(
            mapa.values(),
        ).reduce(
            (
                suma,
                valor,
            ) =>
                suma +
                valor.cantidad,
            0,
        );

    return Array.from(
        mapa.entries(),
    )
        .map(
            ([
                nombre,
                valor,
            ]) => ({
                nombre,
                cantidad:
                    valor.cantidad,
                total:
                    valor.total,
                porcentaje:
                    totalRegistros >
                        0
                        ? (
                            valor.cantidad /
                            totalRegistros
                        ) *
                        100
                        : 0,
            }),
        )
        .sort(
            (a, b) =>
                b.cantidad -
                a.cantidad,
        );
}

function resumenDiario(
    citas: CitaReporte[],
) {
    const mapa =
        new Map<
            string,
            number
        >();

    citas.forEach(
        (cita) => {
            mapa.set(
                cita.fecha,
                (
                    mapa.get(
                        cita.fecha,
                    ) ??
                    0
                ) +
                1,
            );
        },
    );

    return Array.from(
        mapa.entries(),
    )
        .sort(
            ([a], [b]) =>
                a.localeCompare(
                    b,
                ),
        )
        .map(
            ([
                fecha,
                cantidad,
            ]) => ({
                fecha,
                etiqueta:
                    fecha.slice(
                        8,
                        10,
                    ),
                cantidad,
            }),
        );
}

function formatearEstado(
    valor: string,
) {
    return (
        {
            PENDIENTE:
                "Pendiente",
            CONFIRMADA:
                "Confirmada",
            EN_ESPERA:
                "En espera",
            EN_PROCESO:
                "En proceso",
            FINALIZADA:
                "Finalizada",
            CANCELADA:
                "Cancelada",
            NO_ASISTIO:
                "No asistió",
            REPROGRAMADA:
                "Reprogramada",
        }[valor] ??
        valor
    );
}

function moneda(
    valor: number,
    simbolo: string,
) {
    return `${simbolo} ${Number(
        valor,
    ).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits:
                2,
            maximumFractionDigits:
                2,
        },
    )}`;
}

function fechaCorta(
    valor: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        },
    ).format(
        new Date(
            `${valor}T12:00:00`,
        ),
    );
}

function hora12(
    valor: string,
) {
    const [
        hora,
        minuto,
    ] =
        valor.split(
            ":",
        );

    const fecha =
        new Date();

    fecha.setHours(
        Number(
            hora,
        ),
        Number(
            minuto,
        ),
        0,
        0,
    );

    return new Intl.DateTimeFormat(
        "es-NI",
        {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        },
    ).format(
        fecha,
    );
}
