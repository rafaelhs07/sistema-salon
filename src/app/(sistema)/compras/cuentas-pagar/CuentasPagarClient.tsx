"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    ReceiptText,
    Search,
    Truck,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

export type CuentaPagarListado = {
    id: string;

    proveedorId: string;
    proveedorNombre: string;
    proveedorCodigo: string;

    compraId: string;
    codigoCompra: string;
    numeroFactura:
    | string
    | null;

    condicionPago: string;

    montoOriginal: number;
    totalAbonado: number;
    saldoPendiente: number;

    fechaOrigen: string;

    fechaVencimiento:
    | string
    | null;

    estado: string;

    observaciones:
    | string
    | null;

    creadoEn: string;
};

type FiltroEstado =
    | "TODAS"
    | "PENDIENTE"
    | "PARCIAL"
    | "VENCIDA"
    | "PAGADA";

export default function CuentasPagarClient({
    cuentasIniciales,
}: {
    cuentasIniciales: CuentaPagarListado[];
}) {
    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        filtroEstado,
        setFiltroEstado,
    ] = useState<FiltroEstado>(
        "TODAS",
    );

    const cuentasFiltradas =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            return cuentasIniciales.filter(
                (
                    cuenta,
                ) => {
                    const coincideBusqueda =
                        !texto ||
                        cuenta.proveedorNombre
                            .toLowerCase()
                            .includes(texto) ||
                        cuenta.proveedorCodigo
                            .toLowerCase()
                            .includes(texto) ||
                        cuenta.codigoCompra
                            .toLowerCase()
                            .includes(texto) ||
                        cuenta.numeroFactura
                            ?.toLowerCase()
                            .includes(texto);

                    const coincideEstado =
                        filtroEstado ===
                        "TODAS" ||
                        cuenta.estado ===
                        filtroEstado;

                    return (
                        coincideBusqueda &&
                        coincideEstado
                    );
                },
            );
        }, [
            busqueda,
            cuentasIniciales,
            filtroEstado,
        ]);

    const resumen =
        useMemo(() => {
            const abiertas =
                cuentasIniciales.filter(
                    (
                        cuenta,
                    ) =>
                        [
                            "PENDIENTE",
                            "PARCIAL",
                            "VENCIDA",
                        ].includes(
                            cuenta.estado,
                        ),
                );

            const saldo =
                abiertas.reduce(
                    (
                        total,
                        cuenta,
                    ) =>
                        total +
                        cuenta.saldoPendiente,
                    0,
                );

            const vencidas =
                cuentasIniciales.filter(
                    (
                        cuenta,
                    ) =>
                        cuenta.estado ===
                        "VENCIDA",
                );

            const saldoVencido =
                vencidas.reduce(
                    (
                        total,
                        cuenta,
                    ) =>
                        total +
                        cuenta.saldoPendiente,
                    0,
                );

            return {
                abiertas:
                    abiertas.length,

                saldo,

                vencidas:
                    vencidas.length,

                saldoVencido,
            };
        }, [
            cuentasIniciales,
        ]);

    return (
        <div className="space-y-6">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <Link
                    href="/compras"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#B9C8C1]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Compras
                </Link>

                <div className="mt-5 flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                        <CircleDollarSign className="h-7 w-7" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-[#B9C8C1]">
                            Proveedores y obligaciones
                        </p>

                        <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                            Cuentas por pagar
                        </h1>

                        <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                            Controla compras a crédito, saldos pendientes y fechas de vencimiento.
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ResumenCard
                    titulo="Cuentas abiertas"
                    valor={
                        resumen.abiertas
                    }
                    icono={
                        ReceiptText
                    }
                />

                <ResumenCard
                    titulo="Saldo pendiente"
                    valor={formatearDinero(
                        resumen.saldo,
                    )}
                    icono={
                        CircleDollarSign
                    }
                />

                <ResumenCard
                    titulo="Vencidas"
                    valor={
                        resumen.vencidas
                    }
                    icono={
                        AlertTriangle
                    }
                />

                <ResumenCard
                    titulo="Saldo vencido"
                    valor={formatearDinero(
                        resumen.saldoVencido,
                    )}
                    icono={
                        CalendarClock
                    }
                />
            </section>

            <section className="salon-panel border border-border bg-white">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">
                                Obligaciones con proveedores
                            </h2>

                            <p className="mt-1 text-sm text-text-secondary">
                                Las cuentas se crean al confirmar compras a crédito o mixtas.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="relative sm:min-w-72">
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
                                    placeholder="Proveedor, compra o factura..."
                                    className="salon-control w-full border border-border-strong bg-white pl-11 pr-4 outline-none focus:border-primary"
                                />
                            </div>

                            <select
                                value={
                                    filtroEstado
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setFiltroEstado(
                                        event
                                            .target
                                            .value as FiltroEstado,
                                    )
                                }
                                className="salon-control border border-border-strong bg-white px-4"
                            >
                                <option value="TODAS">
                                    Todos los estados
                                </option>

                                <option value="PENDIENTE">
                                    Pendientes
                                </option>

                                <option value="PARCIAL">
                                    Parciales
                                </option>

                                <option value="VENCIDA">
                                    Vencidas
                                </option>

                                <option value="PAGADA">
                                    Pagadas
                                </option>
                            </select>
                        </div>
                    </div>
                </header>

                <div className="p-5 sm:p-6">
                    {cuentasFiltradas.length ===
                        0 ? (
                        <div className="rounded-2xl border border-dashed border-border-strong bg-[#FBFCFA] p-12 text-center">
                            <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />

                            <h3 className="mt-4 font-bold text-foreground tracking-tight">
                                No hay cuentas por pagar
                            </h3>

                            <p className="mt-2 text-sm text-text-secondary">
                                Las compras confirmadas a crédito aparecerán aquí.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cuentasFiltradas.map(
                                (
                                    cuenta,
                                ) => (
                                    <Link
                                        key={
                                            cuenta.id
                                        }
                                        href={`/compras/cuentas-pagar/${cuenta.id}`}
                                        className="block rounded-2xl border border-border bg-[#FBFCFA] p-4 transition hover:border-[#CAD7D1] hover:bg-white sm:p-5"
                                    >
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-bold text-foreground">
                                                        {
                                                            cuenta.proveedorNombre
                                                        }
                                                    </p>

                                                    <EstadoCuenta
                                                        estado={
                                                            cuenta.estado
                                                        }
                                                    />
                                                </div>

                                                <p className="mt-1 text-xs text-[#76817B]">
                                                    {cuenta.codigoCompra}
                                                    {cuenta.numeroFactura
                                                        ? ` · Factura ${cuenta.numeroFactura}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-4 xl:min-w-[700px]">
                                                <MiniDato
                                                    titulo="Original"
                                                    valor={formatearDinero(
                                                        cuenta.montoOriginal,
                                                    )}
                                                    icono={
                                                        ReceiptText
                                                    }
                                                />

                                                <MiniDato
                                                    titulo="Abonado"
                                                    valor={formatearDinero(
                                                        cuenta.totalAbonado,
                                                    )}
                                                    icono={
                                                        CircleDollarSign
                                                    }
                                                />

                                                <MiniDato
                                                    titulo="Pendiente"
                                                    valor={formatearDinero(
                                                        cuenta.saldoPendiente,
                                                    )}
                                                    icono={
                                                        Clock3
                                                    }
                                                />

                                                <MiniDato
                                                    titulo="Vencimiento"
                                                    valor={
                                                        cuenta.fechaVencimiento
                                                            ? formatearFecha(
                                                                cuenta.fechaVencimiento,
                                                            )
                                                            : "Sin fecha"
                                                    }
                                                    icono={
                                                        CalendarClock
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </Link>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function ResumenCard({
    titulo,
    valor,
    icono: Icono,
}: {
    titulo: string;
    valor:
    | string
    | number;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-text-secondary">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold text-foreground">
                        {valor}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function MiniDato({
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
        <div className="rounded-xl bg-white p-3">
            <div className="flex items-center gap-1.5 text-[#7B8781]">
                <Icono className="h-3.5 w-3.5" />

                <span className="text-xs font-bold uppercase tracking-wide">
                    {titulo}
                </span>
            </div>

            <p className="mt-1 truncate text-sm font-bold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function EstadoCuenta({
    estado,
}: {
    estado: string;
}) {
    const clase =
        estado === "PAGADA"
            ? "bg-[#E3EEE8] text-[#527865]"
            : estado === "VENCIDA"
                ? "bg-[#F8E5E5] text-[#A25E5E]"
                : estado === "PARCIAL"
                    ? "bg-[#E8EDF4] text-[#5C6F88]"
                    : "bg-[#FFF1CC] text-[#8A6A22]";

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${clase}`}
        >
            {estado}
        </span>
    );
}

function formatearDinero(
    valor: number,
) {
    return `C$ ${Number(
        valor,
    ).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    )}`;
}

function formatearFecha(
    fecha: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone:
                "America/Managua",
        },
    ).format(
        new Date(
            `${fecha}T12:00:00`,
        ),
    );
}