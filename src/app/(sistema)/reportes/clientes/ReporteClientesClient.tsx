"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    Filter,
    Search,
    ShoppingBag,
    UserRound,
    Users,
    WalletCards,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import BotonExportarExcel from "@/components/reportes/BotonExportarExcel";

import {
    exportarReporteClientesExcel,
} from "./exportarReporteClientesExcel";

export type ClienteReporte = {
    id: string;
    codigo_cliente: string | null;
    nombre_completo: string;
    telefono: string | null;
    whatsapp: string | null;
    correo: string | null;
};

export type CitaClienteReporte = {
    id: string;
    cliente_id: string;
    fecha: string;
    estado: string;
    total: number;
};

export type VentaClienteReporte = {
    id: string;
    cliente_id: string | null;
    fecha_venta: string;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    estado: string;
    estado_pago: string;
};

type ClienteAnalizado = ClienteReporte & {
    citas: number;
    citasFinalizadas: number;
    citasCanceladas: number;
    ventas: number;
    totalComprado: number;
    totalPagado: number;
    saldoPendiente: number;
    ultimaActividad: string | null;
};

type RankingCliente = {
    nombre: string;
    codigo: string;
    cantidad: number;
    total: number;
};

export default function ReporteClientesClient({
    simboloMoneda,
    clientes,
    citas,
    ventas,
}: {
    simboloMoneda: string;
    clientes: ClienteReporte[];
    citas: CitaClienteReporte[];
    ventas: VentaClienteReporte[];
}) {
    const hoy =
        new Date();

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
        actividad,
        setActividad,
    ] = useState<
        "TODOS" | "CON_ACTIVIDAD" | "SIN_ACTIVIDAD"
    >("TODOS");

    const [
        saldo,
        setSaldo,
    ] = useState<
        "TODOS" | "CON_SALDO" | "SIN_SALDO"
    >("TODOS");

    const [
        exportando,
        setExportando,
    ] = useState(false);

    const citasPeriodo =
        useMemo(
            () =>
                citas.filter(
                    (cita) =>
                        (!fechaDesde ||
                            cita.fecha >=
                            fechaDesde) &&
                        (!fechaHasta ||
                            cita.fecha <=
                            fechaHasta),
                ),
            [
                citas,
                fechaDesde,
                fechaHasta,
            ],
        );

    const ventasPeriodo =
        useMemo(
            () =>
                ventas.filter(
                    (venta) => {
                        const fecha =
                            venta.fecha_venta.slice(
                                0,
                                10,
                            );

                        return (
                            (!fechaDesde ||
                                fecha >=
                                fechaDesde) &&
                            (!fechaHasta ||
                                fecha <=
                                fechaHasta)
                        );
                    },
                ),
            [
                ventas,
                fechaDesde,
                fechaHasta,
            ],
        );

    const clientesAnalizados =
        useMemo(() => {
            const citasPorCliente =
                new Map<
                    string,
                    CitaClienteReporte[]
                >();

            citasPeriodo.forEach(
                (cita) => {
                    const lista =
                        citasPorCliente.get(
                            cita.cliente_id,
                        ) ?? [];

                    lista.push(
                        cita,
                    );

                    citasPorCliente.set(
                        cita.cliente_id,
                        lista,
                    );
                },
            );

            const ventasPorCliente =
                new Map<
                    string,
                    VentaClienteReporte[]
                >();

            ventasPeriodo
                .filter(
                    (venta) =>
                        Boolean(
                            venta.cliente_id,
                        ),
                )
                .forEach(
                    (venta) => {
                        const clienteId =
                            venta.cliente_id as string;

                        const lista =
                            ventasPorCliente.get(
                                clienteId,
                            ) ?? [];

                        lista.push(
                            venta,
                        );

                        ventasPorCliente.set(
                            clienteId,
                            lista,
                        );
                    },
                );

            return clientes.map(
                (
                    cliente,
                ): ClienteAnalizado => {
                    const citasCliente =
                        citasPorCliente.get(
                            cliente.id,
                        ) ?? [];

                    const ventasCliente =
                        ventasPorCliente.get(
                            cliente.id,
                        ) ?? [];

                    const ventasActivas =
                        ventasCliente.filter(
                            (venta) =>
                                venta.estado ===
                                "ACTIVA",
                        );

                    const fechasActividad =
                        [
                            ...citasCliente.map(
                                (cita) =>
                                    cita.fecha,
                            ),
                            ...ventasCliente.map(
                                (venta) =>
                                    venta.fecha_venta.slice(
                                        0,
                                        10,
                                    ),
                            ),
                        ].sort();

                    return {
                        ...cliente,

                        citas:
                            citasCliente.length,

                        citasFinalizadas:
                            citasCliente.filter(
                                (cita) =>
                                    cita.estado ===
                                    "FINALIZADA",
                            ).length,

                        citasCanceladas:
                            citasCliente.filter(
                                (cita) =>
                                    [
                                        "CANCELADA",
                                        "NO_ASISTIO",
                                    ].includes(
                                        cita.estado,
                                    ),
                            ).length,

                        ventas:
                            ventasActivas.length,

                        totalComprado:
                            ventasActivas.reduce(
                                (
                                    total,
                                    venta,
                                ) =>
                                    total +
                                    Number(
                                        venta.total,
                                    ),
                                0,
                            ),

                        totalPagado:
                            ventasActivas.reduce(
                                (
                                    total,
                                    venta,
                                ) =>
                                    total +
                                    Number(
                                        venta.monto_pagado,
                                    ),
                                0,
                            ),

                        saldoPendiente:
                            ventasActivas.reduce(
                                (
                                    total,
                                    venta,
                                ) =>
                                    total +
                                    Number(
                                        venta.saldo_pendiente,
                                    ),
                                0,
                            ),

                        ultimaActividad:
                            fechasActividad.length >
                                0
                                ? fechasActividad[
                                fechasActividad.length -
                                1
                                ]
                                : null,
                    };
                },
            );
        }, [
            clientes,
            citasPeriodo,
            ventasPeriodo,
        ]);

    const clientesFiltrados =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            return clientesAnalizados.filter(
                (cliente) => {
                    const tieneActividad =
                        cliente.citas >
                        0 ||
                        cliente.ventas >
                        0;

                    const coincideTexto =
                        !texto ||
                        cliente.nombre_completo
                            .toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        cliente.codigo_cliente
                            ?.toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        cliente.telefono
                            ?.toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        cliente.whatsapp
                            ?.toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        cliente.correo
                            ?.toLowerCase()
                            .includes(
                                texto,
                            );

                    const coincideActividad =
                        actividad ===
                        "TODOS" ||
                        (actividad ===
                            "CON_ACTIVIDAD" &&
                            tieneActividad) ||
                        (actividad ===
                            "SIN_ACTIVIDAD" &&
                            !tieneActividad);

                    const coincideSaldo =
                        saldo ===
                        "TODOS" ||
                        (saldo ===
                            "CON_SALDO" &&
                            cliente.saldoPendiente >
                            0) ||
                        (saldo ===
                            "SIN_SALDO" &&
                            cliente.saldoPendiente <=
                            0);

                    return (
                        coincideTexto &&
                        coincideActividad &&
                        coincideSaldo
                    );
                },
            );
        }, [
            clientesAnalizados,
            busqueda,
            actividad,
            saldo,
        ]);

    const resumen =
        useMemo(() => {
            const activos =
                clientesFiltrados.filter(
                    (cliente) =>
                        cliente.citas >
                        0 ||
                        cliente.ventas >
                        0,
                );

            const totalComprado =
                clientesFiltrados.reduce(
                    (
                        total,
                        cliente,
                    ) =>
                        total +
                        cliente.totalComprado,
                    0,
                );

            const totalPagado =
                clientesFiltrados.reduce(
                    (
                        total,
                        cliente,
                    ) =>
                        total +
                        cliente.totalPagado,
                    0,
                );

            const saldoPendiente =
                clientesFiltrados.reduce(
                    (
                        total,
                        cliente,
                    ) =>
                        total +
                        cliente.saldoPendiente,
                    0,
                );

            return {
                clientes:
                    clientesFiltrados.length,

                activos:
                    activos.length,

                citas:
                    clientesFiltrados.reduce(
                        (
                            total,
                            cliente,
                        ) =>
                            total +
                            cliente.citas,
                        0,
                    ),

                ventas:
                    clientesFiltrados.reduce(
                        (
                            total,
                            cliente,
                        ) =>
                            total +
                            cliente.ventas,
                        0,
                    ),

                totalComprado,
                totalPagado,
                saldoPendiente,
            };
        }, [
            clientesFiltrados,
        ]);

    const topCompras =
        useMemo<RankingCliente[]>(
            () =>
                clientesFiltrados
                    .filter(
                        (cliente) =>
                            cliente.totalComprado >
                            0,
                    )
                    .sort(
                        (a, b) =>
                            b.totalComprado -
                            a.totalComprado,
                    )
                    .slice(
                        0,
                        7,
                    )
                    .map(
                        (cliente) => ({
                            nombre:
                                cliente.nombre_completo,

                            codigo:
                                cliente.codigo_cliente ??
                                "—",

                            cantidad:
                                cliente.ventas,

                            total:
                                cliente.totalComprado,
                        }),
                    ),
            [
                clientesFiltrados,
            ],
        );

    const topFrecuencia =
        useMemo<RankingCliente[]>(
            () =>
                clientesFiltrados
                    .filter(
                        (cliente) =>
                            cliente.citas >
                            0,
                    )
                    .sort(
                        (a, b) =>
                            b.citas -
                            a.citas,
                    )
                    .slice(
                        0,
                        7,
                    )
                    .map(
                        (cliente) => ({
                            nombre:
                                cliente.nombre_completo,

                            codigo:
                                cliente.codigo_cliente ??
                                "—",

                            cantidad:
                                cliente.citas,

                            total:
                                cliente.totalComprado,
                        }),
                    ),
            [
                clientesFiltrados,
            ],
        );

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
            await exportarReporteClientesExcel(
                {
                    simboloMoneda,
                    fechaDesde,
                    fechaHasta,

                    filtroActividad:
                        actividad ===
                            "TODOS"
                            ? "Todos"
                            : actividad ===
                                "CON_ACTIVIDAD"
                                ? "Con actividad"
                                : "Sin actividad",

                    filtroSaldo:
                        saldo ===
                            "TODOS"
                            ? "Todos"
                            : saldo ===
                                "CON_SALDO"
                                ? "Con saldo pendiente"
                                : "Sin saldo pendiente",

                    resumen,

                    clientes:
                        clientesFiltrados,

                    topCompras,
                    topFrecuencia,
                },
            );
        } catch (error) {
            console.error(
                "Error exportando reporte de clientes:",
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
        setActividad(
            "TODOS",
        );
        setSaldo(
            "TODOS",
        );
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
                                <Users className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Relación con clientes
                                </p>

                                <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                    Reporte de clientes
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Analiza frecuencia, compras, pagos y saldos
                                    pendientes de los clientes del salón.
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
                    titulo="Clientes"
                    valor={String(
                        resumen.clientes,
                    )}
                    icono={Users}
                />

                <Kpi
                    titulo="Con actividad"
                    valor={String(
                        resumen.activos,
                    )}
                    icono={UserRound}
                />

                <Kpi
                    titulo="Citas"
                    valor={String(
                        resumen.citas,
                    )}
                    icono={CalendarDays}
                />

                <Kpi
                    titulo="Ventas"
                    valor={String(
                        resumen.ventas,
                    )}
                    icono={ShoppingBag}
                />

                <Kpi
                    titulo="Saldo pendiente"
                    valor={moneda(
                        resumen.saldoPendiente,
                        simboloMoneda,
                    )}
                    icono={WalletCards}
                />
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <DatoFinanciero
                    titulo="Total comprado"
                    valor={moneda(
                        resumen.totalComprado,
                        simboloMoneda,
                    )}
                />

                <DatoFinanciero
                    titulo="Total pagado"
                    valor={moneda(
                        resumen.totalPagado,
                        simboloMoneda,
                    )}
                />

                <DatoFinanciero
                    titulo="Por cobrar"
                    valor={moneda(
                        resumen.saldoPendiente,
                        simboloMoneda,
                    )}
                />
            </section>

            <section className="salon-panel border border-border bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-sidebar tracking-tight">
                            Filtros del reporte
                        </h2>

                        <p className="mt-1 text-sm text-[#72827A]">
                            Analiza clientes dentro del periodo seleccionado.
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

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="relative xl:col-span-2">
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
                            placeholder="Nombre, código, teléfono, WhatsApp o correo..."
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
                            actividad
                        }
                        cambiar={(
                            valor,
                        ) =>
                            setActividad(
                                valor as
                                | "TODOS"
                                | "CON_ACTIVIDAD"
                                | "SIN_ACTIVIDAD",
                            )
                        }
                    >
                        <option value="TODOS">
                            Todos los clientes
                        </option>
                        <option value="CON_ACTIVIDAD">
                            Con actividad
                        </option>
                        <option value="SIN_ACTIVIDAD">
                            Sin actividad
                        </option>
                    </Select>

                    <Select
                        valor={
                            saldo
                        }
                        cambiar={(
                            valor,
                        ) =>
                            setSaldo(
                                valor as
                                | "TODOS"
                                | "CON_SALDO"
                                | "SIN_SALDO",
                            )
                        }
                    >
                        <option value="TODOS">
                            Todos los saldos
                        </option>
                        <option value="CON_SALDO">
                            Con saldo pendiente
                        </option>
                        <option value="SIN_SALDO">
                            Sin saldo pendiente
                        </option>
                    </Select>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <RankingClientes
                    titulo="Clientes con mayor compra"
                    descripcion="Ordenados por valor comprado en el periodo."
                    datos={
                        topCompras
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />

                <RankingClientes
                    titulo="Clientes más frecuentes"
                    descripcion="Ordenados por cantidad de citas."
                    datos={
                        topFrecuencia
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                    mostrarCantidad
                />
            </section>

            <section className="salon-panel overflow-hidden border border-border bg-white">
                <div className="flex items-center justify-between border-b border-[#E7EEEA] px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="font-bold text-sidebar tracking-tight">
                            Detalle de clientes
                        </h2>

                        <p className="mt-1 text-xs text-[#74837C]">
                            {clientesFiltrados.length} clientes encontrados
                        </p>
                    </div>

                    <Filter className="h-5 w-5 text-[#71817A]" />
                </div>

                <div className="overflow-x-auto">
                    <table className="salon-table min-w-[1380px] w-full">
                        <thead className="bg-[#F7FAF8]">
                            <tr>
                                <Th>Código</Th>
                                <Th>Cliente</Th>
                                <Th>Teléfono</Th>
                                <Th>WhatsApp</Th>
                                <Th>Correo</Th>
                                <Th derecha>Citas</Th>
                                <Th derecha>Ventas</Th>
                                <Th derecha>Comprado</Th>
                                <Th derecha>Pagado</Th>
                                <Th derecha>Pendiente</Th>
                                <Th>Última actividad</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EDF3EF]">
                            {clientesFiltrados.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            11
                                        }
                                        className="px-6 py-14 text-center text-sm text-[#74837C]"
                                    >
                                        No hay clientes con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                clientesFiltrados.map(
                                    (
                                        cliente,
                                    ) => (
                                        <tr
                                            key={
                                                cliente.id
                                            }
                                            className="transition hover:bg-[#FAFCFB]"
                                        >
                                            <Td>
                                                <span className="font-bold text-[#33413B]">
                                                    {cliente.codigo_cliente ??
                                                        "—"}
                                                </span>
                                            </Td>

                                            <Td>
                                                {
                                                    cliente.nombre_completo
                                                }
                                            </Td>

                                            <Td>
                                                {cliente.telefono ??
                                                    "—"}
                                            </Td>

                                            <Td>
                                                {cliente.whatsapp ??
                                                    "—"}
                                            </Td>

                                            <Td>
                                                {cliente.correo ??
                                                    "—"}
                                            </Td>

                                            <Td derecha>
                                                {
                                                    cliente.citas
                                                }
                                            </Td>

                                            <Td derecha>
                                                {
                                                    cliente.ventas
                                                }
                                            </Td>

                                            <Td derecha>
                                                {moneda(
                                                    cliente.totalComprado,
                                                    simboloMoneda,
                                                )}
                                            </Td>

                                            <Td derecha>
                                                <span className="font-bold text-[#4F7564]">
                                                    {moneda(
                                                        cliente.totalPagado,
                                                        simboloMoneda,
                                                    )}
                                                </span>
                                            </Td>

                                            <Td derecha>
                                                <span className="font-bold text-[#9A6470]">
                                                    {moneda(
                                                        cliente.saldoPendiente,
                                                        simboloMoneda,
                                                    )}
                                                </span>
                                            </Td>

                                            <Td>
                                                {cliente.ultimaActividad
                                                    ? fechaCorta(
                                                        cliente.ultimaActividad,
                                                    )
                                                    : "Sin actividad"}
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

function DatoFinanciero({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <article className="rounded-2xl border border-border bg-[#FBFCFA] px-5 py-4">
            <p className="text-xs font-semibold text-[#7B8982]">
                {titulo}
            </p>

            <p className="mt-2 text-xl font-bold text-sidebar">
                {valor}
            </p>
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

function RankingClientes({
    titulo,
    descripcion,
    datos,
    simboloMoneda,
    mostrarCantidad = false,
}: {
    titulo: string;
    descripcion: string;
    datos: RankingCliente[];
    simboloMoneda: string;
    mostrarCantidad?: boolean;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-sidebar tracking-tight">
                {titulo}
            </h2>

            <p className="mt-1 text-sm text-[#72827A]">
                {descripcion}
            </p>

            <div className="mt-6 space-y-3">
                {datos.length ===
                    0 ? (
                    <p className="rounded-2xl bg-[#F7FAF8] px-4 py-8 text-center text-sm text-[#74837C]">
                        Sin datos en el periodo.
                    </p>
                ) : (
                    datos.map(
                        (
                            cliente,
                            indice,
                        ) => (
                            <div
                                key={`${cliente.codigo}-${cliente.nombre}`}
                                className="flex items-center justify-between gap-4 rounded-2xl bg-[#F7FAF8] px-4 py-3"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E4ECE8] text-sm font-bold text-[#52695F]">
                                        {indice +
                                            1}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-[#33413B]">
                                            {
                                                cliente.nombre
                                            }
                                        </p>

                                        <p className="mt-0.5 text-xs text-[#7D8A84]">
                                            {
                                                cliente.codigo
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm font-bold text-sidebar">
                                        {mostrarCantidad
                                            ? `${cliente.cantidad} citas`
                                            : moneda(
                                                cliente.total,
                                                simboloMoneda,
                                            )}
                                    </p>

                                    {mostrarCantidad && (
                                        <p className="mt-0.5 text-xs text-[#7D8A84]">
                                            {moneda(
                                                cliente.total,
                                                simboloMoneda,
                                            )}
                                        </p>
                                    )}
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
