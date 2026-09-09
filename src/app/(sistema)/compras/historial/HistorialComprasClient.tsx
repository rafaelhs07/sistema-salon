"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    CircleDollarSign,
    Filter,
    PackageCheck,
    ReceiptText,
    Search,
    Store,
    Truck,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

export type ProveedorFiltro = {
    id: string;
    nombre: string;
};

export type SucursalFiltro = {
    id: string;
    nombre: string;
};

export type CompraHistorial = {
    id: string;

    codigoCompra: string;

    numeroFactura:
    | string
    | null;

    fechaCompra: string;

    condicionPago: string;

    total: number;
    montoPagado: number;
    saldoPendiente: number;

    estadoPago: string;
    estado: string;

    proveedorId: string;
    proveedorNombre: string;

    sucursalId: string;
    sucursalNombre: string;
};

type EstadoFiltro =
    | "TODAS"
    | "BORRADOR"
    | "CONFIRMADA"
    | "ANULADA";

export default function HistorialComprasClient({
    comprasIniciales,
    proveedores,
    sucursales,
}: {
    comprasIniciales: CompraHistorial[];
    proveedores: ProveedorFiltro[];
    sucursales: SucursalFiltro[];
}) {
    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        proveedorId,
        setProveedorId,
    ] = useState("");

    const [
        sucursalId,
        setSucursalId,
    ] = useState("");

    const [
        estado,
        setEstado,
    ] =
        useState<EstadoFiltro>(
            "TODAS",
        );

    const comprasFiltradas =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            return comprasIniciales.filter(
                (compra) => {
                    const coincideTexto =
                        !texto ||
                        compra.codigoCompra
                            .toLowerCase()
                            .includes(texto) ||
                        compra.numeroFactura
                            ?.toLowerCase()
                            .includes(texto) ||
                        compra.proveedorNombre
                            .toLowerCase()
                            .includes(texto);

                    const coincideProveedor =
                        !proveedorId ||
                        compra.proveedorId ===
                        proveedorId;

                    const coincideSucursal =
                        !sucursalId ||
                        compra.sucursalId ===
                        sucursalId;

                    const coincideEstado =
                        estado ===
                        "TODAS" ||
                        compra.estado ===
                        estado;

                    return (
                        coincideTexto &&
                        coincideProveedor &&
                        coincideSucursal &&
                        coincideEstado
                    );
                },
            );
        }, [
            busqueda,
            comprasIniciales,
            estado,
            proveedorId,
            sucursalId,
        ]);

    const resumen =
        useMemo(() => {
            const confirmadas =
                comprasFiltradas.filter(
                    (compra) =>
                        compra.estado ===
                        "CONFIRMADA",
                );

            return {
                compras:
                    comprasFiltradas.length,

                confirmadas:
                    confirmadas.length,

                total:
                    confirmadas.reduce(
                        (
                            suma,
                            compra,
                        ) =>
                            suma +
                            compra.total,
                        0,
                    ),

                pendiente:
                    confirmadas.reduce(
                        (
                            suma,
                            compra,
                        ) =>
                            suma +
                            compra.saldoPendiente,
                        0,
                    ),
            };
        }, [
            comprasFiltradas,
        ]);

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[32px] bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <Link
                    href="/compras"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#B9C8C1]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Compras
                </Link>

                <div className="mt-5 flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                        <ReceiptText className="h-7 w-7" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-[#B9C8C1]">
                            Registro de abastecimiento
                        </p>

                        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                            Historial de compras
                        </h1>

                        <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                            Consulta compras pendientes de confirmar,
                            confirmadas, anuladas y saldos pendientes.
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ResumenCard
                    titulo="Compras visibles"
                    valor={String(
                        resumen.compras,
                    )}
                    icono={
                        ReceiptText
                    }
                />

                <ResumenCard
                    titulo="Confirmadas"
                    valor={String(
                        resumen.confirmadas,
                    )}
                    icono={
                        PackageCheck
                    }
                />

                <ResumenCard
                    titulo="Total confirmado"
                    valor={dinero(
                        resumen.total,
                    )}
                    icono={
                        CircleDollarSign
                    }
                />

                <ResumenCard
                    titulo="Saldo pendiente"
                    valor={dinero(
                        resumen.pendiente,
                    )}
                    icono={
                        CalendarDays
                    }
                />
            </section>

            <section className="rounded-[30px] border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                                placeholder="Compra, factura o proveedor..."
                                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83]"
                            />
                        </div>

                        <select
                            value={
                                proveedorId
                            }
                            onChange={(
                                event,
                            ) =>
                                setProveedorId(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            className="h-11 rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
                        >
                            <option value="">
                                Todos los proveedores
                            </option>

                            {proveedores.map(
                                (
                                    proveedor,
                                ) => (
                                    <option
                                        key={
                                            proveedor.id
                                        }
                                        value={
                                            proveedor.id
                                        }
                                    >
                                        {
                                            proveedor.nombre
                                        }
                                    </option>
                                ),
                            )}
                        </select>

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
                            className="h-11 rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
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
                                            .value as EstadoFiltro,
                                    )
                                }
                                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm"
                            >
                                <option value="TODAS">
                                    Todos los estados
                                </option>

                                <option value="BORRADOR">
                                    Pendientes de confirmar
                                </option>

                                <option value="CONFIRMADA">
                                    Confirmadas
                                </option>

                                <option value="ANULADA">
                                    Anuladas
                                </option>
                            </select>
                        </div>
                    </div>
                </header>

                <div className="p-5 sm:p-6">
                    {comprasFiltradas.length ===
                        0 ? (
                        <div className="rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-12 text-center">
                            <ReceiptText className="mx-auto h-9 w-9 text-[#829089]" />

                            <h3 className="mt-4 font-bold text-[#24302C]">
                                No hay compras
                            </h3>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {comprasFiltradas.map(
                                (
                                    compra,
                                ) => (
                                    <Link
                                        key={
                                            compra.id
                                        }
                                        href={`/compras/${compra.id}`}
                                        className="block rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4 transition hover:border-[#CAD7D1] hover:bg-white sm:p-5"
                                    >
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-bold text-[#24302C]">
                                                        {
                                                            compra.codigoCompra
                                                        }
                                                    </p>

                                                    <EstadoCompra
                                                        estado={
                                                            compra.estado
                                                        }
                                                    />
                                                </div>

                                                <p className="mt-1 text-sm font-semibold text-[#52605A]">
                                                    {
                                                        compra.proveedorNombre
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-[#76817B]">
                                                    {
                                                        compra.sucursalNombre
                                                    }
                                                    {compra.numeroFactura
                                                        ? ` · Factura ${compra.numeroFactura}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-4 xl:min-w-[720px]">
                                                <MiniDato
                                                    titulo="Fecha"
                                                    valor={fechaHora(
                                                        compra.fechaCompra,
                                                    )}
                                                    icono={
                                                        CalendarDays
                                                    }
                                                />

                                                <MiniDato
                                                    titulo="Condición"
                                                    valor={condicion(
                                                        compra.condicionPago,
                                                    )}
                                                    icono={
                                                        ReceiptText
                                                    }
                                                />

                                                <MiniDato
                                                    titulo="Total"
                                                    valor={dinero(
                                                        compra.total,
                                                    )}
                                                    icono={
                                                        CircleDollarSign
                                                    }
                                                />

                                                <MiniDato
                                                    titulo="Saldo"
                                                    valor={dinero(
                                                        compra.saldoPendiente,
                                                    )}
                                                    icono={
                                                        Truck
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
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <article className="rounded-3xl border border-[#E3E7E4] bg-white p-5">
            <p className="text-sm text-[#6B756F]">
                {titulo}
            </p>

            <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-2xl font-bold text-[#24302C]">
                    {valor}
                </p>

                <Icono className="h-5 w-5 text-[#527064]" />
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

                <span className="text-[10px] font-bold uppercase tracking-wide">
                    {titulo}
                </span>
            </div>

            <p className="mt-1 truncate text-sm font-bold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function EstadoCompra({
    estado,
}: {
    estado: string;
}) {
    const clase =
        estado === "CONFIRMADA"
            ? "bg-[#E3EEE8] text-[#527865]"
            : estado === "ANULADA"
                ? "bg-[#F8E5E5] text-[#A25E5E]"
                : "bg-[#FFF1CC] text-[#8A6A22]";

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${clase}`}
        >
            {estado === "BORRADOR"
                ? "PENDIENTE DE CONFIRMAR"
                : estado}
        </span>
    );
}

const dinero = (
    valor: number,
) =>
    `C$ ${Number(
        valor,
    ).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    )}`;

const fechaHora = (
    valor: string,
) =>
    new Intl.DateTimeFormat(
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
        new Date(valor),
    );

const condicion = (
    valor: string,
) =>
({
    CONTADO:
        "Contado",
    CREDITO:
        "Crédito",
    MIXTA:
        "Mixta",
}[valor] ??
    valor);