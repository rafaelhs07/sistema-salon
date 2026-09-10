"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    CheckCircle2,
    CircleDollarSign,
    Filter,
    Search,
    Store,
    TrendingUp,
    UserRound,
    WalletCards,
    X,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

export type SucursalReporte = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type CuentaReporte = {
    id: string;
    codigo_cuenta: string;
    sucursal_id: string;
    cliente_id: string;
    venta_id: string | null;
    monto_original: number;
    monto_abonado: number;
    saldo_pendiente: number;
    fecha_origen: string;
    fecha_vencimiento: string | null;
    estado: string;

    clientes: {
        id: string;
        codigo_cliente: string | null;
        nombre_completo: string;
        telefono: string | null;
        whatsapp: string | null;
    } | null;

    sucursales: {
        nombre: string;
    } | null;

    ventas: {
        codigo_venta: string | null;
    } | null;
};

export default function ReporteCuentasCobrarClient({
    cuentas,
    sucursales,
    simboloMoneda,
}: {
    cuentas: CuentaReporte[];
    sucursales: SucursalReporte[];
    simboloMoneda: string;
}) {
    const [
        busqueda,
        setBusqueda,
    ] =
        useState("");

    const [
        sucursalId,
        setSucursalId,
    ] =
        useState("");

    const [
        estado,
        setEstado,
    ] =
        useState("");

    const [
        fechaDesde,
        setFechaDesde,
    ] =
        useState("");

    const [
        fechaHasta,
        setFechaHasta,
    ] =
        useState("");

    const cuentasFiltradas =
        useMemo(
            () => {
                const texto =
                    busqueda
                        .trim()
                        .toLowerCase();

                return cuentas.filter(
                    (
                        cuenta,
                    ) => {
                        const fecha =
                            cuenta.fecha_origen.slice(
                                0,
                                10,
                            );

                        const coincideTexto =
                            !texto ||
                            cuenta.codigo_cuenta
                                .toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            cuenta.clientes?.nombre_completo
                                .toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            cuenta.clientes?.codigo_cliente
                                ?.toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            cuenta.ventas?.codigo_venta
                                ?.toLowerCase()
                                .includes(
                                    texto,
                                );

                        return (
                            coincideTexto &&
                            (
                                !sucursalId ||
                                cuenta.sucursal_id ===
                                sucursalId
                            ) &&
                            (
                                !estado ||
                                cuenta.estado ===
                                estado
                            ) &&
                            (
                                !fechaDesde ||
                                fecha >=
                                fechaDesde
                            ) &&
                            (
                                !fechaHasta ||
                                fecha <=
                                fechaHasta
                            )
                        );
                    },
                );
            },
            [
                busqueda,
                cuentas,
                estado,
                fechaDesde,
                fechaHasta,
                sucursalId,
            ],
        );

    const resumen =
        useMemo(
            () => {
                return cuentasFiltradas.reduce(
                    (
                        acc,
                        cuenta,
                    ) => {
                        if (
                            cuenta.estado ===
                            "ANULADA"
                        ) {
                            return acc;
                        }

                        const saldo =
                            Number(
                                cuenta.saldo_pendiente ||
                                0,
                            );

                        const original =
                            Number(
                                cuenta.monto_original ||
                                0,
                            );

                        const abonado =
                            Number(
                                cuenta.monto_abonado ||
                                0,
                            );

                        return {
                            cantidad:
                                acc.cantidad +
                                1,
                            original:
                                acc.original +
                                original,
                            abonado:
                                acc.abonado +
                                abonado,
                            pendiente:
                                acc.pendiente +
                                saldo,
                            vencido:
                                acc.vencido +
                                (
                                    cuenta.estado ===
                                        "VENCIDA"
                                        ? saldo
                                        : 0
                                ),
                            pagadas:
                                acc.pagadas +
                                (
                                    cuenta.estado ===
                                        "PAGADA"
                                        ? 1
                                        : 0
                                ),
                            vencidas:
                                acc.vencidas +
                                (
                                    cuenta.estado ===
                                        "VENCIDA"
                                        ? 1
                                        : 0
                                ),
                        };
                    },
                    {
                        cantidad:
                            0,
                        original:
                            0,
                        abonado:
                            0,
                        pendiente:
                            0,
                        vencido:
                            0,
                        pagadas:
                            0,
                        vencidas:
                            0,
                    },
                );
            },
            [
                cuentasFiltradas,
            ],
        );

    const clientesAgrupados =
        useMemo(
            () => {
                const mapa =
                    new Map<
                        string,
                        {
                            clienteId:
                            string;
                            nombre:
                            string;
                            codigo:
                            string | null;
                            saldo:
                            number;
                            cuentas:
                            number;
                            vencido:
                            number;
                        }
                    >();

                for (
                    const cuenta of
                    cuentasFiltradas
                ) {
                    if (
                        cuenta.estado ===
                        "ANULADA" ||
                        Number(
                            cuenta.saldo_pendiente,
                        ) <=
                        0
                    ) {
                        continue;
                    }

                    const actual =
                        mapa.get(
                            cuenta.cliente_id,
                        ) ?? {
                            clienteId:
                                cuenta.cliente_id,
                            nombre:
                                cuenta.clientes
                                    ?.nombre_completo ??
                                "Cliente",
                            codigo:
                                cuenta.clientes
                                    ?.codigo_cliente ??
                                null,
                            saldo:
                                0,
                            cuentas:
                                0,
                            vencido:
                                0,
                        };

                    actual.saldo +=
                        Number(
                            cuenta.saldo_pendiente,
                        );

                    actual.cuentas +=
                        1;

                    if (
                        cuenta.estado ===
                        "VENCIDA"
                    ) {
                        actual.vencido +=
                            Number(
                                cuenta.saldo_pendiente,
                            );
                    }

                    mapa.set(
                        cuenta.cliente_id,
                        actual,
                    );
                }

                return Array.from(
                    mapa.values(),
                ).sort(
                    (
                        a,
                        b,
                    ) =>
                        b.saldo -
                        a.saldo,
                );
            },
            [
                cuentasFiltradas,
            ],
        );

    const cuentasVencidas =
        useMemo(
            () =>
                cuentasFiltradas
                    .filter(
                        (
                            cuenta,
                        ) =>
                            cuenta.estado ===
                            "VENCIDA" &&
                            Number(
                                cuenta.saldo_pendiente,
                            ) >
                            0,
                    )
                    .sort(
                        (
                            a,
                            b,
                        ) => {
                            const fa =
                                a.fecha_vencimiento ??
                                "9999-12-31";

                            const fb =
                                b.fecha_vencimiento ??
                                "9999-12-31";

                            return fa.localeCompare(
                                fb,
                            );
                        },
                    ),
            [
                cuentasFiltradas,
            ],
        );

    const porcentajeRecuperado =
        resumen.original >
            0
            ? (
                resumen.abonado /
                resumen.original
            ) *
            100
            : 0;

    const hayFiltros =
        Boolean(
            busqueda,
        ) ||
        Boolean(
            sucursalId,
        ) ||
        Boolean(
            estado,
        ) ||
        Boolean(
            fechaDesde,
        ) ||
        Boolean(
            fechaHasta,
        );

    function dinero(
        valor: number,
    ) {
        return `${simboloMoneda} ${Number(
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

    function limpiarFiltros() {
        setBusqueda(
            "",
        );
        setSucursalId(
            "",
        );
        setEstado(
            "",
        );
        setFechaDesde(
            "",
        );
        setFechaHasta(
            "",
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <section className="relative overflow-hidden rounded-[36px] bg-[#26332F] p-6 text-white shadow-[0_24px_70px_rgba(36,48,44,0.18)] sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#6F8F83]/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#C79AA1]/12 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/cuentas-cobrar"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Cuentas por cobrar
                    </Link>

                    <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <BarChart3 className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#AFC2B9]">
                                    Análisis financiero
                                </p>

                                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                    Reporte de cuentas por cobrar
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CFD9D4] sm:text-base">
                                    Analiza recuperación de cartera, saldos pendientes y clientes con mayor deuda.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[570px]">
                            <HeroDato
                                titulo="Pendiente"
                                valor={dinero(
                                    resumen.pendiente,
                                )}
                                icono={
                                    WalletCards
                                }
                            />

                            <HeroDato
                                titulo="Vencido"
                                valor={dinero(
                                    resumen.vencido,
                                )}
                                icono={
                                    AlertTriangle
                                }
                                alerta
                            />

                            <HeroDato
                                titulo="Recuperación"
                                valor={`${porcentajeRecuperado.toLocaleString(
                                    "es-NI",
                                    {
                                        maximumFractionDigits:
                                            1,
                                    },
                                )}%`}
                                icono={
                                    TrendingUp
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="rounded-[28px] border border-[#E1E7E3] bg-white p-5 shadow-[0_10px_28px_rgba(36,48,44,0.05)] sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Recuperación de cartera
                            </p>

                            <h2 className="mt-1 text-xl font-black text-[#24302C]">
                                Rendimiento de cobro
                            </h2>

                            <p className="mt-1 text-sm text-[#74817B]">
                                Proporción recuperada de la deuda original dentro del filtro actual.
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-3xl font-black text-[#26332F]">
                                {porcentajeRecuperado.toLocaleString(
                                    "es-NI",
                                    {
                                        maximumFractionDigits:
                                            1,
                                    },
                                )}
                                %
                            </p>

                            <p className="text-xs font-bold text-[#829089]">
                                recuperado
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E6ECE8]">
                        <div
                            className="h-full rounded-full bg-[#6F8F83] transition-all"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        porcentajeRecuperado,
                                    ),
                                )}%`,
                            }}
                        />
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                        <MiniDato
                            titulo="Deuda original"
                            valor={dinero(
                                resumen.original,
                            )}
                        />

                        <MiniDato
                            titulo="Recuperado"
                            valor={dinero(
                                resumen.abonado,
                            )}
                        />

                        <MiniDato
                            titulo="Pendiente"
                            valor={dinero(
                                resumen.pendiente,
                            )}
                            destacado
                        />
                    </div>
                </div>

                <div className="rounded-[28px] border border-[#E4E9E6] bg-[#F8FAF8] p-5 shadow-[0_10px_28px_rgba(36,48,44,0.04)] sm:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                        Indicadores
                    </p>

                    <h2 className="mt-1 text-lg font-black text-[#24302C]">
                        Resumen del filtro
                    </h2>

                    <div className="mt-5 space-y-3">
                        <Indicador
                            titulo="Cuentas analizadas"
                            valor={String(
                                resumen.cantidad,
                            )}
                        />

                        <Indicador
                            titulo="Cuentas pagadas"
                            valor={String(
                                resumen.pagadas,
                            )}
                            positivo
                        />

                        <Indicador
                            titulo="Cuentas vencidas"
                            valor={String(
                                resumen.vencidas,
                            )}
                            alerta
                        />
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-[#E1E7E3] bg-white shadow-[0_10px_28px_rgba(36,48,44,0.05)]">
                <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Filtros
                            </p>

                            <h2 className="mt-1 text-lg font-black text-[#24302C]">
                                Personaliza el reporte
                            </h2>
                        </div>

                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={
                                    limpiarFiltros
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE3DF] bg-white px-4 text-xs font-black text-[#52605A]"
                            >
                                <X className="h-4 w-4" />
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid gap-3 p-5 lg:grid-cols-[minmax(0,1.3fr)_220px_190px] sm:p-6">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

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
                            placeholder="Buscar cliente, cuenta o venta..."
                            className="h-12 w-full rounded-2xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#6F8F83]"
                        />
                    </div>

                    <div className="relative">
                        <Store className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                        <select
                            value={
                                sucursalId
                            }
                            onChange={(
                                event,
                            ) =>
                                setSucursalId(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            className="h-12 w-full rounded-2xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm font-semibold"
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
                        </select>
                    </div>

                    <div className="relative">
                        <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                        <select
                            value={
                                estado
                            }
                            onChange={(
                                event,
                            ) =>
                                setEstado(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            className="h-12 w-full rounded-2xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm font-semibold"
                        >
                            <option value="">
                                Todos
                            </option>
                            <option value="PENDIENTE">
                                Pendiente
                            </option>
                            <option value="PARCIAL">
                                Parcial
                            </option>
                            <option value="VENCIDA">
                                Vencida
                            </option>
                            <option value="PAGADA">
                                Pagada
                            </option>
                            <option value="ANULADA">
                                Anulada
                            </option>
                        </select>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Fecha
                                titulo="Desde"
                                valor={
                                    fechaDesde
                                }
                                cambiar={
                                    setFechaDesde
                                }
                            />

                            <Fecha
                                titulo="Hasta"
                                valor={
                                    fechaHasta
                                }
                                cambiar={
                                    setFechaHasta
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
                <section className="overflow-hidden rounded-[28px] border border-[#E1E7E3] bg-white shadow-[0_10px_28px_rgba(36,48,44,0.05)]">
                    <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                            Prioridad
                        </p>

                        <h2 className="mt-1 text-lg font-black text-[#24302C]">
                            Clientes con mayor saldo
                        </h2>

                        <p className="mt-1 text-xs text-[#829089]">
                            Ordenados de mayor a menor deuda pendiente.
                        </p>
                    </header>

                    <div className="p-5 sm:p-6">
                        {clientesAgrupados.length ===
                            0 ? (
                            <Vacio texto="No hay clientes con saldo pendiente." />
                        ) : (
                            <div className="space-y-3">
                                {clientesAgrupados
                                    .slice(
                                        0,
                                        10,
                                    )
                                    .map(
                                        (
                                            cliente,
                                            index,
                                        ) => (
                                            <Link
                                                key={
                                                    cliente.clienteId
                                                }
                                                href={`/cuentas-cobrar/${cliente.clienteId}`}
                                                className="group flex items-center justify-between gap-4 rounded-[20px] border border-[#E6EBE8] bg-[#FBFCFA] p-4 transition hover:border-[#C9D5CF] hover:bg-white hover:shadow-[0_7px_20px_rgba(36,48,44,0.05)]"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-sm font-black text-[#527064]">
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate font-black text-[#24302C]">
                                                            {
                                                                cliente.nombre
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs font-semibold text-[#829089]">
                                                            {
                                                                cliente.cuentas
                                                            }{" "}
                                                            cuenta
                                                            {cliente.cuentas ===
                                                                1
                                                                ? ""
                                                                : "s"}
                                                            {cliente.vencido >
                                                                0
                                                                ? ` · Vencido ${dinero(
                                                                    cliente.vencido,
                                                                )}`
                                                                : ""}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="font-black text-[#9A6267]">
                                                        {dinero(
                                                            cliente.saldo,
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-[10px] font-bold uppercase text-[#87958D]">
                                                        pendiente
                                                    </p>
                                                </div>
                                            </Link>
                                        ),
                                    )}
                            </div>
                        )}
                    </div>
                </section>

                <section className="overflow-hidden rounded-[28px] border border-[#E6DADC] bg-[#FFF9FA] shadow-[0_10px_28px_rgba(36,48,44,0.04)]">
                    <header className="border-b border-[#EADFE1] px-5 py-4 sm:px-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A37A7E]">
                            Riesgo
                        </p>

                        <h2 className="mt-1 text-lg font-black text-[#553C41]">
                            Cartera vencida
                        </h2>

                        <p className="mt-1 text-xs text-[#927075]">
                            Cuentas que requieren seguimiento prioritario.
                        </p>
                    </header>

                    <div className="p-5 sm:p-6">
                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#A37A7E]">
                                Saldo vencido
                            </p>

                            <p className="mt-2 text-3xl font-black text-[#9A6267]">
                                {dinero(
                                    resumen.vencido,
                                )}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#8A666B]">
                                {
                                    resumen.vencidas
                                }{" "}
                                cuenta
                                {resumen.vencidas ===
                                    1
                                    ? ""
                                    : "s"}{" "}
                                vencida
                                {resumen.vencidas ===
                                    1
                                    ? ""
                                    : "s"}
                            </p>
                        </div>

                        <div className="mt-4 space-y-3">
                            {cuentasVencidas.length ===
                                0 ? (
                                <Vacio texto="No hay cuentas vencidas en el filtro seleccionado." />
                            ) : (
                                cuentasVencidas
                                    .slice(
                                        0,
                                        5,
                                    )
                                    .map(
                                        (
                                            cuenta,
                                        ) => (
                                            <Link
                                                key={
                                                    cuenta.id
                                                }
                                                href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                                                className="flex items-center justify-between gap-3 rounded-2xl border border-[#EADFE1] bg-white p-3 transition hover:border-[#D7BCC0]"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-black text-[#4C373B]">
                                                        {cuenta.clientes
                                                            ?.nombre_completo ??
                                                            "Cliente"}
                                                    </p>

                                                    <p className="mt-1 text-[10px] font-bold text-[#9B7A7E]">
                                                        {cuenta.fecha_vencimiento
                                                            ? formatearFechaSimple(
                                                                cuenta.fecha_vencimiento,
                                                            )
                                                            : "Sin fecha"}
                                                    </p>
                                                </div>

                                                <strong className="text-sm text-[#9A6267]">
                                                    {dinero(
                                                        cuenta.saldo_pendiente,
                                                    )}
                                                </strong>
                                            </Link>
                                        ),
                                    )
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-[30px] border border-[#E1E7E3] bg-white shadow-[0_10px_28px_rgba(36,48,44,0.05)]">
                <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                        Detalle
                    </p>

                    <h2 className="mt-1 text-lg font-black text-[#24302C]">
                        Cuentas vencidas
                    </h2>

                    <p className="mt-1 text-xs text-[#829089]">
                        {cuentasVencidas.length} resultado
                        {cuentasVencidas.length ===
                            1
                            ? ""
                            : "s"}
                    </p>
                </header>

                {cuentasVencidas.length ===
                    0 ? (
                    <div className="p-5 sm:p-6">
                        <Vacio texto="No hay cuentas vencidas en el filtro seleccionado." />
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full min-w-[950px]">
                                <thead className="bg-[#FBFCFA] text-left text-[10px] uppercase tracking-[0.1em] text-[#76817B]">
                                    <tr>
                                        <Th>
                                            Cliente
                                        </Th>
                                        <Th>
                                            Cuenta
                                        </Th>
                                        <Th>
                                            Sucursal
                                        </Th>
                                        <Th>
                                            Vencimiento
                                        </Th>
                                        <Th>
                                            Deuda
                                        </Th>
                                        <Th>
                                            Abonado
                                        </Th>
                                        <Th>
                                            Saldo
                                        </Th>
                                        <Th>
                                            Acción
                                        </Th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#E8ECE9]">
                                    {cuentasVencidas.map(
                                        (
                                            cuenta,
                                        ) => (
                                            <tr
                                                key={
                                                    cuenta.id
                                                }
                                                className="text-sm text-[#33413B] transition hover:bg-[#FBFCFA]"
                                            >
                                                <Td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1E3E5] text-[#9A6267]">
                                                            <UserRound className="h-4 w-4" />
                                                        </div>

                                                        <p className="font-black text-[#24302C]">
                                                            {cuenta.clientes
                                                                ?.nombre_completo ??
                                                                "Cliente"}
                                                        </p>
                                                    </div>
                                                </Td>

                                                <Td>
                                                    {
                                                        cuenta.codigo_cuenta
                                                    }
                                                </Td>

                                                <Td>
                                                    {cuenta.sucursales
                                                        ?.nombre ??
                                                        "Sucursal"}
                                                </Td>

                                                <Td>
                                                    {cuenta.fecha_vencimiento
                                                        ? formatearFechaSimple(
                                                            cuenta.fecha_vencimiento,
                                                        )
                                                        : "Sin fecha"}
                                                </Td>

                                                <Td>
                                                    {dinero(
                                                        cuenta.monto_original,
                                                    )}
                                                </Td>

                                                <Td>
                                                    {dinero(
                                                        cuenta.monto_abonado,
                                                    )}
                                                </Td>

                                                <Td>
                                                    <strong className="text-[#9A6267]">
                                                        {dinero(
                                                            cuenta.saldo_pendiente,
                                                        )}
                                                    </strong>
                                                </Td>

                                                <Td>
                                                    <Link
                                                        href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                                                        className="inline-flex h-9 items-center rounded-xl bg-[#26332F] px-3 text-xs font-black text-white"
                                                    >
                                                        Estado de cuenta
                                                    </Link>
                                                </Td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
                            {cuentasVencidas.map(
                                (
                                    cuenta,
                                ) => (
                                    <Link
                                        key={
                                            cuenta.id
                                        }
                                        href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                                        className="rounded-[22px] border border-[#E6DADC] bg-[#FFF9FA] p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-black text-[#4C373B]">
                                                    {cuenta.clientes
                                                        ?.nombre_completo ??
                                                        "Cliente"}
                                                </p>

                                                <p className="mt-1 text-xs text-[#927075]">
                                                    {
                                                        cuenta.codigo_cuenta
                                                    }{" "}
                                                    ·{" "}
                                                    {cuenta.sucursales
                                                        ?.nombre ??
                                                        "Sucursal"}
                                                </p>
                                            </div>

                                            <AlertTriangle className="h-5 w-5 shrink-0 text-[#9A6267]" />
                                        </div>

                                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.1em] text-[#A37A7E]">
                                            Saldo vencido
                                        </p>

                                        <p className="mt-1 text-xl font-black text-[#9A6267]">
                                            {dinero(
                                                cuenta.saldo_pendiente,
                                            )}
                                        </p>
                                    </Link>
                                ),
                            )}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

function HeroDato({
    titulo,
    valor,
    icono: Icono,
    alerta = false,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    alerta?: boolean;
}) {
    return (
        <div
            className={[
                "rounded-2xl border p-4 backdrop-blur-sm",
                alerta
                    ? "border-[#D6A9AE]/20 bg-[#C79AA1]/10"
                    : "border-white/10 bg-white/[0.06]",
            ].join(
                " ",
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#AEC0B7]">
                    {
                        titulo
                    }
                </p>

                <Icono className="h-4 w-4 text-[#DCE7E2]" />
            </div>

            <p className="mt-2 truncate text-lg font-black text-white">
                {
                    valor
                }
            </p>
        </div>
    );
}

function MiniDato({
    titulo,
    valor,
    destacado = false,
}: {
    titulo: string;
    valor: string;
    destacado?: boolean;
}) {
    return (
        <div className="rounded-2xl bg-[#F7F9F7] p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#87958D]">
                {
                    titulo
                }
            </p>

            <p
                className={[
                    "mt-1 text-sm font-black",
                    destacado
                        ? "text-[#9A6267]"
                        : "text-[#33413B]",
                ].join(
                    " ",
                )}
            >
                {
                    valor
                }
            </p>
        </div>
    );
}

function Indicador({
    titulo,
    valor,
    positivo = false,
    alerta = false,
}: {
    titulo: string;
    valor: string;
    positivo?: boolean;
    alerta?: boolean;
}) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-[#E5EAE7] bg-white p-4">
            <span className="text-sm font-semibold text-[#6B756F]">
                {
                    titulo
                }
            </span>

            <strong
                className={[
                    "text-lg",
                    alerta
                        ? "text-[#9A6267]"
                        : positivo
                            ? "text-[#527865]"
                            : "text-[#24302C]",
                ].join(
                    " ",
                )}
            >
                {
                    valor
                }
            </strong>
        </div>
    );
}

function Fecha({
    titulo,
    valor,
    cambiar,
}: {
    titulo: string;
    valor: string;
    cambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <label>
            <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.1em] text-[#829089]">
                {
                    titulo
                }
            </span>

            <input
                type="date"
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
                className="h-11 w-full rounded-xl border border-[#D4DAD6] px-3 text-sm font-semibold"
            />
        </label>
    );
}

function Vacio({
    texto,
}: {
    texto: string;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-8 text-center text-sm text-[#6B756F]">
            {
                texto
            }
        </div>
    );
}

function Th({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="px-4 py-3 font-black">
            {
                children
            }
        </th>
    );
}

function Td({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <td className="px-4 py-4 align-middle">
            {
                children
            }
        </td>
    );
}

function formatearFechaSimple(
    fecha: string,
) {
    const [
        anio,
        mes,
        dia,
    ] =
        fecha.split(
            "-",
        );

    return `${dia}/${mes}/${anio}`;
}
