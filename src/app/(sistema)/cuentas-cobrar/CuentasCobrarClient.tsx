"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Eye,
    Filter,
    History,
    ReceiptText,
    Search,
    Sparkles,
    Store,
    UserRound,
    WalletCards,
    X,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

export type SucursalCuenta = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type CuentaCobrarListado = {
    id: string;
    codigo_cuenta: string;
    sucursal_id: string;
    cliente_id: string;
    venta_id: string | null;
    cita_id: string | null;
    monto_original: number;
    monto_abonado: number;
    saldo_pendiente: number;
    fecha_origen: string;
    fecha_vencimiento: string | null;
    estado: string;
    observaciones: string | null;

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
        tipo_venta: string;
        total: number;
        estado: string;
        estado_pago: string;
        fecha_venta: string;
    } | null;
};

type EstadoFiltro =
    | ""
    | "PENDIENTE"
    | "PARCIAL"
    | "VENCIDA"
    | "PAGADA"
    | "ANULADA";

const filtrosEstado: Array<{
    valor: EstadoFiltro;
    texto: string;
}> = [
        {
            valor: "",
            texto: "Todas",
        },
        {
            valor: "PENDIENTE",
            texto: "Pendientes",
        },
        {
            valor: "PARCIAL",
            texto: "Parciales",
        },
        {
            valor: "VENCIDA",
            texto: "Vencidas",
        },
        {
            valor: "PAGADA",
            texto: "Pagadas",
        },
    ];

export default function CuentasCobrarClient({
    cuentas,
    sucursales,
    simboloMoneda,
}: {
    cuentas: CuentaCobrarListado[];
    sucursales: SucursalCuenta[];
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
        useState<EstadoFiltro>(
            "",
        );

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
                            cuenta.clientes?.telefono
                                ?.toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            cuenta.clientes?.whatsapp
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
                                estadoCuentaActual(
                                    cuenta,
                                ) ===
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
                        acumulado,
                        cuenta,
                    ) => {
                        const estadoActual =
                            estadoCuentaActual(
                                cuenta,
                            );

                        if (
                            estadoActual ===
                            "ANULADA"
                        ) {
                            return acumulado;
                        }

                        return {
                            totalCuentas:
                                acumulado.totalCuentas +
                                1,
                            deudaOriginal:
                                acumulado.deudaOriginal +
                                Number(
                                    cuenta.monto_original,
                                ),
                            abonado:
                                acumulado.abonado +
                                Number(
                                    cuenta.monto_abonado,
                                ),
                            pendiente:
                                acumulado.pendiente +
                                Number(
                                    cuenta.saldo_pendiente,
                                ),
                            vencido:
                                acumulado.vencido +
                                (
                                    estadoActual ===
                                        "VENCIDA"
                                        ? Number(
                                            cuenta.saldo_pendiente,
                                        )
                                        : 0
                                ),
                        };
                    },
                    {
                        totalCuentas:
                            0,
                        deudaOriginal:
                            0,
                        abonado:
                            0,
                        pendiente:
                            0,
                        vencido:
                            0,
                    },
                );
            },
            [
                cuentasFiltradas,
            ],
        );

    const porcentajeRecuperado =
        resumen.deudaOriginal >
            0
            ? Math.min(
                100,
                Math.round(
                    (
                        resumen.abonado /
                        resumen.deudaOriginal
                    ) *
                    100,
                ),
            )
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

    return (
        <div className="space-y-6 pb-10">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8 lg:p-9">
                <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-secondary/12 blur-3xl" />

                <div className="relative">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <Link
                                href="/inicio"
                                className="inline-flex items-center gap-2 text-sm font-bold text-[#C7D4CE] transition hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver a Inicio
                            </Link>

                            <div className="mt-6 flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                                    <WalletCards className="h-7 w-7" />
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.15em] text-[#AFC2B9]">
                                        Finanzas
                                    </p>

                                    <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                        Cuentas por cobrar
                                    </h1>

                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CFD9D4] sm:text-base">
                                        Controla saldos pendientes, vencimientos y abonos sin perder de vista quién debe y cuánto falta por recuperar.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/cuentas-cobrar/abonos"
                                className="salon-action inline-flex items-center justify-center gap-2 border border-white/15 bg-white/[0.08] px-4 text-white transition hover:bg-white/[0.13]"
                            >
                                <History className="h-4 w-4" />
                                Historial de abonos
                            </Link>

                            <Link
                                href="/cuentas-cobrar/reportes"
                                className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-4 text-sidebar transition hover:bg-white"
                            >
                                <BarChart3 className="h-4 w-4" />
                                Reportes
                            </Link>
                        </div>
                    </div>

                    <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <HeroResumen
                            titulo="Pendiente"
                            valor={dinero(
                                resumen.pendiente,
                            )}
                            descripcion="Saldo aún por recuperar"
                            icono={
                                WalletCards
                            }
                        />

                        <HeroResumen
                            titulo="Recuperado"
                            valor={dinero(
                                resumen.abonado,
                            )}
                            descripcion={`${porcentajeRecuperado}% de la deuda`}
                            icono={
                                CheckCircle2
                            }
                        />

                        <HeroResumen
                            titulo="Vencido"
                            valor={dinero(
                                resumen.vencido,
                            )}
                            descripcion="Requiere atención"
                            icono={
                                AlertTriangle
                            }
                            alerta
                        />

                        <HeroResumen
                            titulo="Cuentas"
                            valor={String(
                                resumen.totalCuentas,
                            )}
                            descripcion="Registros visibles"
                            icono={
                                ReceiptText
                            }
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Recuperación de cartera
                            </p>

                            <h2 className="mt-1 text-lg font-black text-foreground tracking-tight">
                                Progreso de cobro
                            </h2>

                            <p className="mt-1 text-sm text-[#74817B]">
                                Qué parte de la deuda original ya fue abonada.
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-3xl font-black text-sidebar">
                                {
                                    porcentajeRecuperado
                                }
                                %
                            </p>
                            <p className="text-xs font-bold text-[#829089]">
                                recuperado
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E6ECE8]">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                                width:
                                    `${porcentajeRecuperado}%`,
                            }}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <MiniResumen
                            titulo="Original"
                            valor={dinero(
                                resumen.deudaOriginal,
                            )}
                        />

                        <MiniResumen
                            titulo="Abonado"
                            valor={dinero(
                                resumen.abonado,
                            )}
                        />

                        <MiniResumen
                            titulo="Pendiente"
                            valor={dinero(
                                resumen.pendiente,
                            )}
                            destacado
                        />
                    </div>
                </div>

                <div className="rounded-[28px] border border-[#E6DADC] bg-[#FFF9FA] p-5 shadow-[0_10px_28px_rgba(36,48,44,0.04)] sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1E3E5] text-[#9A6267]">
                            <AlertTriangle className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#A37A7E]">
                                Atención
                            </p>

                            <h2 className="mt-1 text-lg font-black text-[#553C41] tracking-tight">
                                Cartera vencida
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-[#8A666B]">
                                Estas cuentas deberían priorizarse en seguimiento.
                            </p>
                        </div>
                    </div>

                    <p className="mt-5 text-3xl font-black text-[#9A6267]">
                        {dinero(
                            resumen.vencido,
                        )}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            setEstado(
                                "VENCIDA",
                            )
                        }
                        className="salon-action mt-4 inline-flex items-center justify-center gap-2 bg-[#9A6267] px-4 text-white"
                    >
                        Ver vencidas
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </section>

            <section className="salon-panel overflow-hidden border border-border bg-white">
                <div className="border-b border-[#E8ECE9] bg-[#FBFCFA] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Consulta
                            </p>

                            <h2 className="mt-1 text-lg font-black text-foreground tracking-tight">
                                Buscar cuentas
                            </h2>
                        </div>

                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={
                                    limpiarFiltros
                                }
                                className="salon-action inline-flex items-center justify-center gap-2 border border-border-strong bg-white px-4 text-[#52605A]"
                            >
                                <X className="h-4 w-4" />
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_220px_220px]">
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
                                        event.target.value,
                                    )
                                }
                                placeholder="Buscar cliente, teléfono, cuenta o venta..."
                                className="salon-control w-full border border-border-strong bg-white pl-11 pr-4 font-semibold outline-none transition focus:border-primary focus:shadow-[0_0_0_4px_rgba(111,143,131,0.08)]"
                            />
                        </div>

                        <Select
                            valor={
                                sucursalId
                            }
                            cambiar={
                                setSucursalId
                            }
                            opciones={[
                                {
                                    valor:
                                        "",
                                    texto:
                                        "Todas las sucursales",
                                },
                                ...sucursales.map(
                                    (
                                        sucursal,
                                    ) => ({
                                        valor:
                                            sucursal.id,
                                        texto:
                                            sucursal.nombre,
                                    }),
                                ),
                            ]}
                            icono={
                                Store
                            }
                        />

                        <div className="grid grid-cols-2 gap-2">
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

                <div className="border-b border-[#E8ECE9] px-4 py-3 sm:px-6">
                    <div className="flex gap-2 overflow-x-auto">
                        {filtrosEstado.map(
                            (
                                filtro,
                            ) => {
                                const activo =
                                    estado ===
                                    filtro.valor;

                                const cantidad =
                                    contarPorEstado(
                                        cuentas,
                                        filtro.valor,
                                    );

                                return (
                                    <button
                                        key={
                                            filtro.valor ||
                                            "TODAS"
                                        }
                                        type="button"
                                        onClick={() =>
                                            setEstado(
                                                filtro.valor,
                                            )
                                        }
                                        className={[
                                            "inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-black transition",
                                            activo
                                                ? "bg-sidebar text-white"
                                                : "bg-[#F2F5F3] text-[#617068] hover:bg-[#E7ECE9]",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        {
                                            filtro.texto
                                        }

                                        <span
                                            className={[
                                                "rounded-full px-2 py-0.5 text-[9px]",
                                                activo
                                                    ? "bg-white/15 text-white"
                                                    : "bg-white text-text-secondary",
                                            ].join(
                                                " ",
                                            )}
                                        >
                                            {
                                                cantidad
                                            }
                                        </span>
                                    </button>
                                );
                            },
                        )}
                    </div>
                </div>
            </section>

            <section className="salon-panel overflow-hidden border border-border bg-white">
                <header className="flex flex-col gap-3 border-b border-[#E8ECE9] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                            Cartera
                        </p>

                        <h2 className="mt-1 text-xl font-black text-foreground tracking-tight">
                            Saldos registrados
                        </h2>

                        <p className="mt-1 text-sm text-text-secondary">
                            {cuentasFiltradas.length} resultado
                            {cuentasFiltradas.length ===
                                1
                                ? ""
                                : "s"}
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-2xl bg-[#F5F8F6] px-4 py-2 text-xs font-bold text-[#607069]">
                        <Filter className="h-4 w-4" />
                        {estado
                            ? formatearTexto(
                                estado,
                            )
                            : "Todas las cuentas"}
                    </div>
                </header>

                {cuentasFiltradas.length ===
                    0 ? (
                    <EstadoVacio />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto xl:block">
                            <table className="salon-table w-full min-w-[1180px]">
                                <thead className="bg-[#FBFCFA] text-left text-xs uppercase tracking-[0.1em] text-[#76817B]">
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
                                            Progreso
                                        </Th>
                                        <Th>
                                            Saldo
                                        </Th>
                                        <Th>
                                            Vencimiento
                                        </Th>
                                        <Th>
                                            Estado
                                        </Th>
                                        <Th>
                                            Acción
                                        </Th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#E8ECE9]">
                                    {cuentasFiltradas.map(
                                        (
                                            cuenta,
                                        ) => (
                                            <FilaCuenta
                                                key={
                                                    cuenta.id
                                                }
                                                cuenta={
                                                    cuenta
                                                }
                                                dinero={
                                                    dinero
                                                }
                                            />
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:hidden sm:p-5">
                            {cuentasFiltradas.map(
                                (
                                    cuenta,
                                ) => (
                                    <TarjetaCuenta
                                        key={
                                            cuenta.id
                                        }
                                        cuenta={
                                            cuenta
                                        }
                                        dinero={
                                            dinero
                                        }
                                    />
                                ),
                            )}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

function FilaCuenta({
    cuenta,
    dinero,
}: {
    cuenta: CuentaCobrarListado;
    dinero: (
        valor: number,
    ) => string;
}) {
    const estadoActual =
        estadoCuentaActual(
            cuenta,
        );

    const porcentaje =
        Number(
            cuenta.monto_original,
        ) >
            0
            ? Math.min(
                100,
                Math.round(
                    (
                        Number(
                            cuenta.monto_abonado,
                        ) /
                        Number(
                            cuenta.monto_original,
                        )
                    ) *
                    100,
                ),
            )
            : 0;

    return (
        <tr className="text-sm text-[#33413B] transition hover:bg-[#FBFCFA]">
            <Td>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-primary-strong">
                        <UserRound className="h-4 w-4" />
                    </div>

                    <div>
                        <p className="font-black text-foreground">
                            {cuenta.clientes
                                ?.nombre_completo ??
                                "Cliente"}
                        </p>

                        <p className="mt-1 text-xs text-[#829089]">
                            {cuenta.clientes
                                ?.telefono ??
                                cuenta.clientes
                                    ?.codigo_cliente ??
                                ""}
                        </p>
                    </div>
                </div>
            </Td>

            <Td>
                <p className="font-black text-[#3F4D47]">
                    {
                        cuenta.codigo_cuenta
                    }
                </p>

                <p className="mt-1 text-xs text-[#829089]">
                    {formatearFecha(
                        cuenta.fecha_origen,
                    )}
                </p>
            </Td>

            <Td>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4F7F5] px-3 py-1.5 text-xs font-bold text-[#607069]">
                    <Store className="h-3.5 w-3.5" />
                    {cuenta.sucursales
                        ?.nombre ??
                        "Sucursal"}
                </span>
            </Td>

            <Td>
                <div className="min-w-[180px]">
                    <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold text-[#5F6E67]">
                            {dinero(
                                cuenta.monto_abonado,
                            )}
                        </span>

                        <span className="font-black text-primary-strong">
                            {
                                porcentaje
                            }
                            %
                        </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7ECE9]">
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{
                                width:
                                    `${porcentaje}%`,
                            }}
                        />
                    </div>
                </div>
            </Td>

            <Td>
                <p
                    className={[
                        "text-base font-black",
                        Number(
                            cuenta.saldo_pendiente,
                        ) >
                            0
                            ? "text-[#9A6267]"
                            : "text-[#527865]",
                    ].join(
                        " ",
                    )}
                >
                    {dinero(
                        cuenta.saldo_pendiente,
                    )}
                </p>
            </Td>

            <Td>
                <div className="flex items-center gap-2 text-xs font-bold text-[#68766F]">
                    <CalendarDays className="h-4 w-4 text-[#829089]" />

                    {cuenta.fecha_vencimiento
                        ? formatearFechaSimple(
                            cuenta.fecha_vencimiento,
                        )
                        : "Sin fecha"}
                </div>
            </Td>

            <Td>
                <EstadoCuenta
                    estado={
                        estadoActual
                    }
                />
            </Td>

            <Td>
                <Link
                    href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                    className="salon-action inline-flex items-center gap-2 bg-sidebar px-4 text-white transition hover:bg-sidebar-hover"
                >
                    <Eye className="h-4 w-4" />
                    Ver cuenta
                </Link>
            </Td>
        </tr>
    );
}

function TarjetaCuenta({
    cuenta,
    dinero,
}: {
    cuenta: CuentaCobrarListado;
    dinero: (
        valor: number,
    ) => string;
}) {
    const estadoActual =
        estadoCuentaActual(
            cuenta,
        );

    const porcentaje =
        Number(
            cuenta.monto_original,
        ) >
            0
            ? Math.min(
                100,
                Math.round(
                    (
                        Number(
                            cuenta.monto_abonado,
                        ) /
                        Number(
                            cuenta.monto_original,
                        )
                    ) *
                    100,
                ),
            )
            : 0;

    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-primary-strong">
                        <UserRound className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate font-black text-foreground">
                            {cuenta.clientes
                                ?.nombre_completo ??
                                "Cliente"}
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#74817B]">
                            {
                                cuenta.codigo_cuenta
                            }
                        </p>
                    </div>
                </div>

                <EstadoCuenta
                    estado={
                        estadoActual
                    }
                />
            </div>

            <div className="mt-5 rounded-2xl bg-[#F8FAF8] p-4">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#87958D]">
                            Saldo pendiente
                        </p>

                        <p className="mt-1 text-2xl font-black text-[#9A6267]">
                            {dinero(
                                cuenta.saldo_pendiente,
                            )}
                        </p>
                    </div>

                    <p className="text-sm font-black text-primary-strong">
                        {
                            porcentaje
                        }
                        %
                    </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E2E8E4]">
                    <div
                        className="h-full rounded-full bg-primary"
                        style={{
                            width:
                                `${porcentaje}%`,
                        }}
                    />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniDato
                    titulo="Deuda original"
                    valor={dinero(
                        cuenta.monto_original,
                    )}
                />

                <MiniDato
                    titulo="Abonado"
                    valor={dinero(
                        cuenta.monto_abonado,
                    )}
                />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-[#75817B]">
                <span className="inline-flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5" />
                    {cuenta.sucursales
                        ?.nombre ??
                        "Sucursal"}
                </span>

                <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {cuenta.fecha_vencimiento
                        ? formatearFechaSimple(
                            cuenta.fecha_vencimiento,
                        )
                        : "Sin fecha"}
                </span>
            </div>

            <Link
                href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                className="salon-action mt-5 inline-flex w-full items-center justify-center gap-2 bg-sidebar text-white transition hover:bg-sidebar-hover"
            >
                <Eye className="h-4 w-4" />
                Abrir estado de cuenta
            </Link>
        </article>
    );
}

function HeroResumen({
    titulo,
    valor,
    descripcion,
    icono: Icono,
    alerta = false,
}: {
    titulo: string;
    valor: string;
    descripcion: string;
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
                    ? "border-[#D6A9AE]/20 bg-secondary/10"
                    : "border-white/10 bg-white/[0.06]",
            ].join(
                " ",
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#AEC0B7]">
                    {
                        titulo
                    }
                </p>

                <Icono className="h-4 w-4 text-primary-soft" />
            </div>

            <p className="mt-3 truncate text-xl font-black text-white">
                {
                    valor
                }
            </p>

            <p className="mt-1 text-xs text-[#BFCFC7]">
                {
                    descripcion
                }
            </p>
        </div>
    );
}

function MiniResumen({
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
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#87958D]">
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

function Select({
    valor,
    cambiar,
    opciones,
    icono: Icono,
}: {
    valor: string;
    cambiar: (
        valor: string,
    ) => void;
    opciones: Array<{
        valor: string;
        texto: string;
    }>;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="relative">
            <Icono className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

            <select
                value={
                    valor
                }
                onChange={(
                    event,
                ) =>
                    cambiar(
                        event.target.value,
                    )
                }
                className="salon-control w-full border border-border-strong bg-white pl-11 pr-4 font-semibold text-[#33413B]"
            >
                {opciones.map(
                    (
                        opcion,
                    ) => (
                        <option
                            key={
                                opcion.valor ||
                                opcion.texto
                            }
                            value={
                                opcion.valor
                            }
                        >
                            {
                                opcion.texto
                            }
                        </option>
                    ),
                )}
            </select>
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
            <span className="mb-1 block text-xs font-black uppercase tracking-[0.1em] text-[#829089]">
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
                        event.target.value,
                    )
                }
                className="salon-control w-full border border-border-strong px-2 font-semibold"
            />
        </label>
    );
}

function EstadoCuenta({
    estado,
}: {
    estado: string;
}) {
    const estilos: Record<
        string,
        string
    > = {
        PENDIENTE:
            "bg-[#F8E5E5] text-[#A25E5E]",
        PARCIAL:
            "bg-[#FAF0DC] text-[#9A742D]",
        PAGADA:
            "bg-[#E3EEE8] text-[#527865]",
        VENCIDA:
            "bg-[#F0DEDE] text-[#934A4A]",
        ANULADA:
            "bg-[#EFE7E1] text-[#8B6754]",
    };

    return (
        <span
            className={[
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase",
                estilos[
                estado
                ] ??
                "bg-surface-soft text-text-secondary",
            ].join(
                " ",
            )}
        >
            {formatearTexto(
                estado,
            )}
        </span>
    );
}

function MiniDato({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-2xl bg-[#FBFCFA] p-3">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#829089]">
                {
                    titulo
                }
            </p>

            <p className="mt-1 text-xs font-black text-[#33413B]">
                {
                    valor
                }
            </p>
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

function EstadoVacio() {
    return (
        <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft text-primary-strong">
                <WalletCards className="h-7 w-7" />
            </div>

            <h3 className="mt-4 font-black text-foreground tracking-tight">
                No hay cuentas por cobrar
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">
                Las ventas con saldo pendiente aparecerán aquí automáticamente.
            </p>
        </div>
    );
}

function contarPorEstado(
    cuentas: CuentaCobrarListado[],
    estado: EstadoFiltro,
) {
    if (
        !estado
    ) {
        return cuentas.filter(
            (
                cuenta,
            ) =>
                estadoCuentaActual(
                    cuenta,
                ) !==
                "ANULADA",
        ).length;
    }

    return cuentas.filter(
        (
            cuenta,
        ) =>
            estadoCuentaActual(
                cuenta,
            ) ===
            estado,
    ).length;
}

function estadoCuentaActual(
    cuenta: CuentaCobrarListado,
) {
    if (
        cuenta.estado ===
        "ANULADA" ||
        cuenta.estado ===
        "PAGADA"
    ) {
        return cuenta.estado;
    }

    if (
        cuenta.fecha_vencimiento &&
        cuenta.fecha_vencimiento <
        new Date()
            .toISOString()
            .slice(
                0,
                10,
            ) &&
        Number(
            cuenta.saldo_pendiente,
        ) >
        0
    ) {
        return "VENCIDA";
    }

    return cuenta.estado;
}

function formatearFecha(
    fecha: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            day:
                "2-digit",
            month:
                "short",
            year:
                "numeric",
            timeZone:
                "America/Managua",
        },
    ).format(
        new Date(
            fecha,
        ),
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

function formatearTexto(
    valor: string,
) {
    return valor
        .toLowerCase()
        .replaceAll(
            "_",
            " ",
        )
        .replace(
            /^\w/,
            (
                letra,
            ) =>
                letra.toUpperCase(),
        );
}
