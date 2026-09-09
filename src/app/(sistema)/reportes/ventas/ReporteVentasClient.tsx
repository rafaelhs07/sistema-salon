"use client";

import Link from "next/link";
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    CreditCard,
    Filter,
    ReceiptText,
    Search,
    Store,
    TrendingUp,
    WalletCards,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import BotonExportarExcel from "@/components/reportes/BotonExportarExcel";

import {
    exportarReporteVentasExcel,
} from "./exportarReporteVentasExcel";

export type SucursalReporteVentas = {
    id: string;
    nombre: string;
};

type PagoVentaReporte = {
    id: string;
    metodo_pago: string;
    monto: number;
    estado: string;
    fecha_pago: string;
};

export type VentaReporte = {
    id: string;
    sucursal_id: string | null;
    codigo_venta: string;
    tipo_venta: string;
    subtotal: number;
    descuento: number;
    impuestos: number;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    cambio_entregado: number;
    estado_pago: string;
    estado: string;
    fecha_venta: string;
    sucursales: {
        nombre: string;
    } | null;
    venta_pagos: PagoVentaReporte[];
};

type FiltroTipo =
    | "TODOS"
    | "CITA"
    | "DIRECTA"
    | "PRODUCTOS"
    | "MIXTA";

type FiltroPago =
    | "TODOS"
    | "PENDIENTE"
    | "PARCIAL"
    | "PAGADA"
    | "ANULADA";

export default function ReporteVentasClient({
    simboloMoneda,
    ventas,
    sucursales,
}: {
    simboloMoneda: string;
    ventas: VentaReporte[];
    sucursales: SucursalReporteVentas[];
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
        tipoVenta,
        setTipoVenta,
    ] =
        useState<FiltroTipo>(
            "TODOS",
        );

    const [
        estadoPago,
        setEstadoPago,
    ] =
        useState<FiltroPago>(
            "TODOS",
        );

    const [
        metodoPago,
        setMetodoPago,
    ] = useState("");

    const [
        exportando,
        setExportando,
    ] = useState(false);

    const metodosDisponibles =
        useMemo(
            () =>
                Array.from(
                    new Set(
                        ventas.flatMap(
                            (venta) =>
                                venta.venta_pagos
                                    .filter(
                                        (pago) =>
                                            pago.estado ===
                                            "APLICADO",
                                    )
                                    .map(
                                        (pago) =>
                                            pago.metodo_pago,
                                    ),
                        ),
                    ),
                ).sort(),
            [ventas],
        );

    const ventasFiltradas =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            const desde =
                fechaDesde
                    ? new Date(
                        `${fechaDesde}T00:00:00`,
                    )
                    : null;

            const hasta =
                fechaHasta
                    ? new Date(
                        `${fechaHasta}T23:59:59`,
                    )
                    : null;

            return ventas.filter(
                (venta) => {
                    const fecha =
                        new Date(
                            venta.fecha_venta,
                        );

                    const coincideBusqueda =
                        !texto ||
                        venta.codigo_venta
                            .toLowerCase()
                            .includes(
                                texto,
                            );

                    const coincideDesde =
                        !desde ||
                        fecha >=
                        desde;

                    const coincideHasta =
                        !hasta ||
                        fecha <=
                        hasta;

                    const coincideSucursal =
                        !sucursalId ||
                        venta.sucursal_id ===
                        sucursalId;

                    const coincideTipo =
                        tipoVenta ===
                        "TODOS" ||
                        venta.tipo_venta ===
                        tipoVenta;

                    const coincideEstadoPago =
                        estadoPago ===
                        "TODOS" ||
                        venta.estado_pago ===
                        estadoPago;

                    const coincideMetodo =
                        !metodoPago ||
                        venta.venta_pagos.some(
                            (
                                pago,
                            ) =>
                                pago.estado ===
                                "APLICADO" &&
                                pago.metodo_pago ===
                                metodoPago,
                        );

                    return (
                        coincideBusqueda &&
                        coincideDesde &&
                        coincideHasta &&
                        coincideSucursal &&
                        coincideTipo &&
                        coincideEstadoPago &&
                        coincideMetodo
                    );
                },
            );
        }, [
            busqueda,
            fechaDesde,
            fechaHasta,
            sucursalId,
            tipoVenta,
            estadoPago,
            metodoPago,
            ventas,
        ]);

    const resumen =
        useMemo(() => {
            const activas =
                ventasFiltradas.filter(
                    (venta) =>
                        venta.estado ===
                        "ACTIVA",
                );

            const totalVendido =
                activas.reduce(
                    (
                        total,
                        venta,
                    ) =>
                        total +
                        Number(
                            venta.total,
                        ),
                    0,
                );

            const cobrado =
                activas.reduce(
                    (
                        total,
                        venta,
                    ) =>
                        total +
                        Number(
                            venta.monto_pagado,
                        ),
                    0,
                );

            const pendiente =
                activas.reduce(
                    (
                        total,
                        venta,
                    ) =>
                        total +
                        Number(
                            venta.saldo_pendiente,
                        ),
                    0,
                );

            const ticketPromedio =
                activas.length >
                    0
                    ? totalVendido /
                    activas.length
                    : 0;

            return {
                cantidad:
                    activas.length,
                totalVendido,
                cobrado,
                pendiente,
                ticketPromedio,
            };
        }, [
            ventasFiltradas,
        ]);

    const porTipo =
        useMemo(
            () =>
                resumirPorTipo(
                    ventasFiltradas,
                ),
            [
                ventasFiltradas,
            ],
        );

    const porMetodo =
        useMemo(
            () =>
                resumirPorMetodo(
                    ventasFiltradas,
                ),
            [
                ventasFiltradas,
            ],
        );

    const porDia =
        useMemo(
            () =>
                resumirPorDia(
                    ventasFiltradas,
                ),
            [
                ventasFiltradas,
            ],
        );

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
        setTipoVenta(
            "TODOS",
        );
        setEstadoPago(
            "TODOS",
        );
        setMetodoPago("");
    }

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
            await exportarReporteVentasExcel(
                {
                    simboloMoneda,

                    fechaDesde,
                    fechaHasta,

                    nombreSucursal,

                    tipoVenta:
                        tipoVenta ===
                            "TODOS"
                            ? "Todos los tipos"
                            : formatearTipo(
                                tipoVenta,
                            ),

                    estadoPago:
                        estadoPago ===
                            "TODOS"
                            ? "Todos los estados"
                            : estadoPago,

                    metodoPago:
                        metodoPago
                            ? formatearMetodo(
                                metodoPago,
                            )
                            : "Todos los métodos",

                    cantidad:
                        resumen.cantidad,

                    totalVendido:
                        resumen.totalVendido,

                    cobrado:
                        resumen.cobrado,

                    pendiente:
                        resumen.pendiente,

                    ticketPromedio:
                        resumen.ticketPromedio,

                    ventas:
                        ventasFiltradas,

                    porTipo,
                    porMetodo,
                    porDia,
                },
            );
        } catch (error) {
            console.error(
                "Error exportando reporte de ventas:",
                error,
            );

            window.alert(
                "No fue posible generar el archivo Excel.",
            );
        } finally {
            setExportando(
                false,
            );
        }
    }

    return (
        <div className="space-y-6 pb-8">
            <section className="relative overflow-hidden rounded-[32px] bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#6F8F83]/25 blur-3xl" />

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
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <BarChart3 className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Rendimiento comercial
                                </p>

                                <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                    Reporte de ventas
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Analiza cuánto se vendió, cuánto se cobró,
                                    qué quedó pendiente y cómo se distribuyen las ventas.
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
                    titulo="Ventas"
                    valor={String(
                        resumen.cantidad,
                    )}
                    icono={ReceiptText}
                />

                <Kpi
                    titulo="Total vendido"
                    valor={moneda(
                        resumen.totalVendido,
                        simboloMoneda,
                    )}
                    icono={TrendingUp}
                />

                <Kpi
                    titulo="Cobrado"
                    valor={moneda(
                        resumen.cobrado,
                        simboloMoneda,
                    )}
                    icono={ArrowUpRight}
                />

                <Kpi
                    titulo="Pendiente"
                    valor={moneda(
                        resumen.pendiente,
                        simboloMoneda,
                    )}
                    icono={ArrowDownRight}
                />

                <Kpi
                    titulo="Ticket promedio"
                    valor={moneda(
                        resumen.ticketPromedio,
                        simboloMoneda,
                    )}
                    icono={WalletCards}
                />
            </section>

            <section className="rounded-[30px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)] sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#26332F]">
                            Filtros del reporte
                        </h2>

                        <p className="mt-1 text-sm text-[#72827A]">
                            Ajusta el periodo y segmenta las ventas.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="h-10 rounded-xl border border-[#DCE5E0] px-4 text-sm font-bold text-[#52605A] transition hover:bg-[#EEF2EF]"
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
                            placeholder="Buscar por código de venta..."
                            className="h-11 w-full rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83] focus:bg-white"
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
                        className="h-11 rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] px-3 text-sm outline-none focus:border-[#6F8F83]"
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
                        className="h-11 rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] px-3 text-sm outline-none focus:border-[#6F8F83]"
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
                            tipoVenta
                        }
                        cambiar={(
                            valor,
                        ) =>
                            setTipoVenta(
                                valor as FiltroTipo,
                            )
                        }
                    >
                        <option value="TODOS">
                            Todos los tipos
                        </option>
                        <option value="CITA">
                            Cita
                        </option>
                        <option value="DIRECTA">
                            Venta directa
                        </option>
                        <option value="PRODUCTOS">
                            Productos
                        </option>
                        <option value="MIXTA">
                            Mixta
                        </option>
                    </Select>

                    <Select
                        valor={
                            estadoPago
                        }
                        cambiar={(
                            valor,
                        ) =>
                            setEstadoPago(
                                valor as FiltroPago,
                            )
                        }
                    >
                        <option value="TODOS">
                            Todos los estados
                        </option>
                        <option value="PAGADA">
                            Pagada
                        </option>
                        <option value="PARCIAL">
                            Parcial
                        </option>
                        <option value="PENDIENTE">
                            Pendiente
                        </option>
                        <option value="ANULADA">
                            Anulada
                        </option>
                    </Select>

                    <Select
                        valor={
                            metodoPago
                        }
                        cambiar={
                            setMetodoPago
                        }
                    >
                        <option value="">
                            Todos los métodos
                        </option>

                        {metodosDisponibles.map(
                            (
                                metodo,
                            ) => (
                                <option
                                    key={
                                        metodo
                                    }
                                    value={
                                        metodo
                                    }
                                >
                                    {formatearMetodo(
                                        metodo,
                                    )}
                                </option>
                            ),
                        )}
                    </Select>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                <GraficoRanking
                    titulo="Ventas por tipo"
                    descripcion="Monto vendido por modalidad."
                    datos={
                        porTipo
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />

                <GraficoRanking
                    titulo="Cobros por método"
                    descripcion="Distribución de pagos aplicados."
                    datos={
                        porMetodo
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />

                <GraficoDiario
                    datos={
                        porDia
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />
            </section>

            <section className="overflow-hidden rounded-[30px] border border-[#DCE5E0] bg-white shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
                <div className="flex items-center justify-between border-b border-[#E7EEEA] px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="font-bold text-[#26332F]">
                            Detalle de ventas
                        </h2>

                        <p className="mt-1 text-xs text-[#74837C]">
                            {ventasFiltradas.length} registros encontrados
                        </p>
                    </div>

                    <Filter className="h-5 w-5 text-[#71817A]" />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1180px] w-full">
                        <thead className="bg-[#F7FAF8]">
                            <tr>
                                <Th>Fecha</Th>
                                <Th>Código</Th>
                                <Th>Tipo</Th>
                                <Th>Sucursal</Th>
                                <Th>Pago</Th>
                                <Th>Método</Th>
                                <Th derecha>Total</Th>
                                <Th derecha>Cobrado</Th>
                                <Th derecha>Pendiente</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EDF3EF]">
                            {ventasFiltradas.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            9
                                        }
                                        className="px-6 py-14 text-center text-sm text-[#74837C]"
                                    >
                                        No hay ventas con los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                ventasFiltradas.map(
                                    (
                                        venta,
                                    ) => (
                                        <tr
                                            key={
                                                venta.id
                                            }
                                            className="transition hover:bg-[#FAFCFB]"
                                        >
                                            <Td>
                                                {fecha(
                                                    venta.fecha_venta,
                                                )}
                                            </Td>

                                            <Td>
                                                <span className="font-bold text-[#33413B]">
                                                    {
                                                        venta.codigo_venta
                                                    }
                                                </span>
                                            </Td>

                                            <Td>
                                                {formatearTipo(
                                                    venta.tipo_venta,
                                                )}
                                            </Td>

                                            <Td>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Store className="h-3.5 w-3.5 text-[#7F8E87]" />
                                                    {venta
                                                        .sucursales
                                                        ?.nombre ??
                                                        "Sin sucursal"}
                                                </span>
                                            </Td>

                                            <Td>
                                                <EstadoPago
                                                    estado={
                                                        venta.estado_pago
                                                    }
                                                />
                                            </Td>

                                            <Td>
                                                {metodosVenta(
                                                    venta,
                                                )}
                                            </Td>

                                            <Td derecha>
                                                {moneda(
                                                    Number(
                                                        venta.total,
                                                    ),
                                                    simboloMoneda,
                                                )}
                                            </Td>

                                            <Td derecha>
                                                <span className="font-bold text-[#4F7564]">
                                                    {moneda(
                                                        Number(
                                                            venta.monto_pagado,
                                                        ),
                                                        simboloMoneda,
                                                    )}
                                                </span>
                                            </Td>

                                            <Td derecha>
                                                <span className="font-bold text-[#9A6470]">
                                                    {moneda(
                                                        Number(
                                                            venta.saldo_pendiente,
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
        <article className="rounded-[26px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.07)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#71817A]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-[#26332F]">
                        {valor}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4F0] text-[#587064]">
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
            className="h-11 rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] px-3 text-sm font-medium text-[#43524B] outline-none focus:border-[#6F8F83] focus:bg-white"
        >
            {children}
        </select>
    );
}

function GraficoRanking({
    titulo,
    descripcion,
    datos,
    simboloMoneda,
}: {
    titulo: string;
    descripcion: string;
    datos: {
        nombre: string;
        total: number;
        porcentaje: number;
    }[];
    simboloMoneda: string;
}) {
    return (
        <article className="rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
            <h2 className="text-lg font-bold text-[#26332F]">
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
                    datos.map(
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
                                            {dato.porcentaje.toFixed(
                                                1,
                                            )}
                                            %
                                        </p>
                                    </div>

                                    <p className="text-sm font-bold text-[#26332F]">
                                        {moneda(
                                            dato.total,
                                            simboloMoneda,
                                        )}
                                    </p>
                                </div>

                                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EEF2EF]">
                                    <div
                                        className="h-full rounded-full bg-[#6F8F83]"
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

function GraficoDiario({
    datos,
    simboloMoneda,
}: {
    datos: {
        fecha: string;
        etiqueta: string;
        total: number;
    }[];
    simboloMoneda: string;
}) {
    const maximo =
        Math.max(
            ...datos.map(
                (dato) =>
                    dato.total,
            ),
            1,
        );

    return (
        <article className="rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
            <h2 className="text-lg font-bold text-[#26332F]">
                Comportamiento diario
            </h2>

            <p className="mt-1 text-sm text-[#72827A]">
                Total vendido por día.
            </p>

            <div className="mt-6 overflow-x-auto">
                <div className="flex min-h-[210px] min-w-[400px] items-end gap-2 rounded-2xl bg-[#F7FAF8] px-3 py-4">
                    {datos.length ===
                        0 ? (
                        <p className="m-auto text-sm text-[#74837C]">
                            Sin datos en el periodo.
                        </p>
                    ) : (
                        datos.map(
                            (
                                dato,
                            ) => {
                                const altura =
                                    Math.max(
                                        (
                                            dato.total /
                                            maximo
                                        ) *
                                        160,
                                        4,
                                    );

                                return (
                                    <div
                                        key={
                                            dato.fecha
                                        }
                                        className="flex min-w-[22px] flex-1 flex-col items-center justify-end"
                                    >
                                        <div
                                            title={`${dato.etiqueta}: ${moneda(
                                                dato.total,
                                                simboloMoneda,
                                            )}`}
                                            className="w-full max-w-[22px] rounded-t-md bg-[#6F8F83]"
                                            style={{
                                                height: `${altura}px`,
                                            }}
                                        />

                                        <span className="mt-2 text-[9px] font-semibold text-[#71817A]">
                                            {
                                                dato.etiqueta
                                            }
                                        </span>
                                    </div>
                                );
                            },
                        )
                    )}
                </div>
            </div>
        </article>
    );
}

function EstadoPago({
    estado,
}: {
    estado: string;
}) {
    const clase =
        estado ===
            "PAGADA"
            ? "bg-[#E3EEE8] text-[#4F7564]"
            : estado ===
                "PARCIAL"
                ? "bg-[#FFF4D8] text-[#8A6A28]"
                : estado ===
                    "ANULADA"
                    ? "bg-[#F5E8EB] text-[#9A6470]"
                    : "bg-[#EEF1EF] text-[#66756E]";

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${clase}`}
        >
            {estado}
        </span>
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

function resumirPorTipo(
    ventas: VentaReporte[],
) {
    const mapa =
        new Map<
            string,
            number
        >();

    ventas
        .filter(
            (venta) =>
                venta.estado ===
                "ACTIVA",
        )
        .forEach(
            (venta) => {
                const nombre =
                    formatearTipo(
                        venta.tipo_venta,
                    );

                mapa.set(
                    nombre,
                    (
                        mapa.get(
                            nombre,
                        ) ??
                        0
                    ) +
                    Number(
                        venta.total,
                    ),
                );
            },
        );

    return construirRanking(
        mapa,
    );
}

function resumirPorMetodo(
    ventas: VentaReporte[],
) {
    const mapa =
        new Map<
            string,
            number
        >();

    ventas.forEach(
        (venta) => {
            venta.venta_pagos
                .filter(
                    (pago) =>
                        pago.estado ===
                        "APLICADO",
                )
                .forEach(
                    (pago) => {
                        const nombre =
                            formatearMetodo(
                                pago.metodo_pago,
                            );

                        mapa.set(
                            nombre,
                            (
                                mapa.get(
                                    nombre,
                                ) ??
                                0
                            ) +
                            Number(
                                pago.monto,
                            ),
                        );
                    },
                );
        },
    );

    return construirRanking(
        mapa,
    );
}

function construirRanking(
    mapa: Map<
        string,
        number
    >,
) {
    const total =
        Array.from(
            mapa.values(),
        ).reduce(
            (
                suma,
                valor,
            ) =>
                suma +
                valor,
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
                total: valor,
                porcentaje:
                    total >
                        0
                        ? (
                            valor /
                            total
                        ) *
                        100
                        : 0,
            }),
        )
        .sort(
            (a, b) =>
                b.total -
                a.total,
        );
}

function resumirPorDia(
    ventas: VentaReporte[],
) {
    const mapa =
        new Map<
            string,
            number
        >();

    ventas
        .filter(
            (venta) =>
                venta.estado ===
                "ACTIVA",
        )
        .forEach(
            (venta) => {
                const fecha =
                    new Date(
                        venta.fecha_venta,
                    );

                const clave =
                    [
                        fecha.getFullYear(),
                        String(
                            fecha.getMonth() +
                            1,
                        ).padStart(
                            2,
                            "0",
                        ),
                        String(
                            fecha.getDate(),
                        ).padStart(
                            2,
                            "0",
                        ),
                    ].join(
                        "-",
                    );

                mapa.set(
                    clave,
                    (
                        mapa.get(
                            clave,
                        ) ??
                        0
                    ) +
                    Number(
                        venta.total,
                    ),
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
                total,
            ]) => ({
                fecha,
                etiqueta:
                    fecha.slice(
                        8,
                        10,
                    ),
                total,
            }),
        );
}

function metodosVenta(
    venta: VentaReporte,
) {
    const metodos =
        Array.from(
            new Set(
                venta.venta_pagos
                    .filter(
                        (pago) =>
                            pago.estado ===
                            "APLICADO",
                    )
                    .map(
                        (pago) =>
                            formatearMetodo(
                                pago.metodo_pago,
                            ),
                    ),
            ),
        );

    return metodos.length >
        0
        ? metodos.join(
            " + ",
        )
        : "—";
}

function formatearTipo(
    valor: string,
) {
    return (
        {
            CITA: "Cita",
            DIRECTA:
                "Venta directa",
            PRODUCTOS:
                "Productos",
            MIXTA:
                "Mixta",
        }[valor] ??
        valor
    );
}

function formatearMetodo(
    valor: string,
) {
    return (
        {
            EFECTIVO:
                "Efectivo",
            TARJETA:
                "Tarjeta",
            TRANSFERENCIA:
                "Transferencia",
            DEPOSITO:
                "Depósito",
            CHEQUE:
                "Cheque",
            CREDITO:
                "Crédito",
            OTRO:
                "Otro",
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

function fecha(
    valor: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone:
                "America/Managua",
        },
    ).format(
        new Date(
            valor,
        ),
    );
}
