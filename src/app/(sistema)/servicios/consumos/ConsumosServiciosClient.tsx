"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Boxes,
    CalendarDays,
    ClipboardList,
    Filter,
    PackageMinus,
    Search,
    Store,
    UserRound,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

export type SucursalConsumo = {
    id: string;
    nombre: string;
};

export type ConsumoServicioListado = {
    id: string;

    sucursalId: string;
    sucursalNombre: string;

    productoId: string;
    productoCodigo: string;
    productoNombre: string;
    unidadMedida: string;

    citaId: string | null;
    codigoCita: string;
    fechaCita: string | null;
    clienteNombre: string;

    cantidad: number;
    cantidadAnterior: number;
    cantidadNueva: number;

    concepto: string | null;
    observaciones: string | null;

    fechaMovimiento: string;
};

type FiltroFecha =
    | "TODOS"
    | "HOY"
    | "7_DIAS"
    | "30_DIAS";

export default function ConsumosServiciosClient({
    consumosIniciales,
    sucursales,
}: {
    consumosIniciales: ConsumoServicioListado[];
    sucursales: SucursalConsumo[];
}) {
    const [busqueda, setBusqueda] =
        useState("");

    const [
        sucursalId,
        setSucursalId,
    ] = useState("");

    const [
        filtroFecha,
        setFiltroFecha,
    ] = useState<FiltroFecha>("30_DIAS");

    const consumosFiltrados =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            const ahora =
                new Date();

            return consumosIniciales.filter(
                (consumo) => {
                    const coincideBusqueda =
                        !texto ||
                        consumo.productoNombre
                            .toLowerCase()
                            .includes(texto) ||
                        consumo.productoCodigo
                            .toLowerCase()
                            .includes(texto) ||
                        consumo.codigoCita
                            .toLowerCase()
                            .includes(texto) ||
                        consumo.clienteNombre
                            .toLowerCase()
                            .includes(texto);

                    const coincideSucursal =
                        !sucursalId ||
                        consumo.sucursalId ===
                        sucursalId;

                    const fecha =
                        new Date(
                            consumo.fechaMovimiento,
                        );

                    let coincideFecha = true;

                    if (
                        filtroFecha === "HOY"
                    ) {
                        coincideFecha =
                            fecha.toDateString() ===
                            ahora.toDateString();
                    }

                    if (
                        filtroFecha === "7_DIAS"
                    ) {
                        const limite =
                            new Date(ahora);

                        limite.setDate(
                            limite.getDate() -
                            7,
                        );

                        coincideFecha =
                            fecha >= limite;
                    }

                    if (
                        filtroFecha === "30_DIAS"
                    ) {
                        const limite =
                            new Date(ahora);

                        limite.setDate(
                            limite.getDate() -
                            30,
                        );

                        coincideFecha =
                            fecha >= limite;
                    }

                    return (
                        coincideBusqueda &&
                        coincideSucursal &&
                        coincideFecha
                    );
                },
            );
        }, [
            busqueda,
            consumosIniciales,
            filtroFecha,
            sucursalId,
        ]);

    const resumen = useMemo(() => {
        const productos =
            new Set(
                consumosFiltrados.map(
                    (consumo) =>
                        consumo.productoId,
                ),
            ).size;

        const citas =
            new Set(
                consumosFiltrados
                    .map(
                        (consumo) =>
                            consumo.citaId,
                    )
                    .filter(Boolean),
            ).size;

        const cantidadTotal =
            consumosFiltrados.reduce(
                (
                    total,
                    consumo,
                ) =>
                    total +
                    consumo.cantidad,
                0,
            );

        return {
            movimientos:
                consumosFiltrados.length,
            productos,
            citas,
            cantidadTotal,
        };
    }, [consumosFiltrados]);

    return (
        <div className="space-y-6">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link
                            href="/servicios"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#B9C8C1] transition hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a Servicios
                        </Link>

                        <div className="mt-5 flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                                <PackageMinus className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Inventario por servicios
                                </p>

                                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                    Consumos
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Revisa los productos y
                                    materiales descontados
                                    automáticamente al
                                    finalizar citas.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B9C8C1]">
                            Movimientos visibles
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {resumen.movimientos}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaResumen
                    titulo="Consumos"
                    valor={String(
                        resumen.movimientos,
                    )}
                    icono={PackageMinus}
                />

                <TarjetaResumen
                    titulo="Productos"
                    valor={String(
                        resumen.productos,
                    )}
                    icono={Boxes}
                />

                <TarjetaResumen
                    titulo="Citas"
                    valor={String(
                        resumen.citas,
                    )}
                    icono={CalendarDays}
                />

                <TarjetaResumen
                    titulo="Cantidad descontada"
                    valor={formatearCantidad(
                        resumen.cantidadTotal,
                    )}
                    icono={ClipboardList}
                />
            </section>

            <section className="salon-panel border border-border bg-white">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-foreground tracking-tight">
                                Historial de consumo
                            </h2>

                            <p className="mt-1 text-sm text-text-secondary">
                                Cada registro corresponde
                                a un descuento automático
                                generado por una cita.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="relative min-w-0">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                                <input
                                    value={busqueda}
                                    onChange={(
                                        event,
                                    ) =>
                                        setBusqueda(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Producto, cita o cliente..."
                                    className="salon-control w-full border border-border-strong bg-white pl-11 pr-4 outline-none focus:border-primary"
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
                                    className="salon-control w-full border border-border-strong bg-white pl-11 pr-4"
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
                                        filtroFecha
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setFiltroFecha(
                                            event
                                                .target
                                                .value as FiltroFecha,
                                        )
                                    }
                                    className="salon-control w-full border border-border-strong bg-white pl-11 pr-4"
                                >
                                    <option value="HOY">
                                        Hoy
                                    </option>
                                    <option value="7_DIAS">
                                        Últimos 7 días
                                    </option>
                                    <option value="30_DIAS">
                                        Últimos 30 días
                                    </option>
                                    <option value="TODOS">
                                        Todo
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-5 sm:p-6">
                    {consumosFiltrados.length ===
                        0 ? (
                        <div className="rounded-2xl border border-dashed border-border-strong bg-[#FBFCFA] p-12 text-center">
                            <PackageMinus className="mx-auto h-9 w-9 text-[#829089]" />

                            <h3 className="mt-4 font-bold text-foreground tracking-tight">
                                No hay consumos
                            </h3>

                            <p className="mt-2 text-sm text-text-secondary">
                                No encontramos movimientos
                                con los filtros actuales.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="salon-table w-full min-w-[1000px]">
                                    <thead>
                                        <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-wide text-[#829089]">
                                            <th className="pb-3 pr-4">
                                                Producto
                                            </th>
                                            <th className="px-4 pb-3">
                                                Cita / cliente
                                            </th>
                                            <th className="px-4 pb-3">
                                                Sucursal
                                            </th>
                                            <th className="px-4 pb-3 text-right">
                                                Consumo
                                            </th>
                                            <th className="px-4 pb-3 text-right">
                                                Stock
                                            </th>
                                            <th className="pl-4 pb-3 text-right">
                                                Fecha
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[#EDF1EE]">
                                        {consumosFiltrados.map(
                                            (
                                                consumo,
                                            ) => (
                                                <tr
                                                    key={
                                                        consumo.id
                                                    }
                                                    className="text-sm"
                                                >
                                                    <td className="py-4 pr-4">
                                                        <p className="font-bold text-foreground">
                                                            {
                                                                consumo.productoNombre
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-[#76817B]">
                                                            {
                                                                consumo.productoCodigo
                                                            }
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <p className="font-semibold text-[#33413B]">
                                                            {
                                                                consumo.codigoCita
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-[#76817B]">
                                                            {
                                                                consumo.clienteNombre
                                                            }
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {
                                                            consumo.sucursalNombre
                                                        }
                                                    </td>

                                                    <td className="px-4 py-4 text-right font-bold text-[#A25E5E]">
                                                        -
                                                        {formatearCantidad(
                                                            consumo.cantidad,
                                                        )}{" "}
                                                        {
                                                            consumo.unidadMedida
                                                        }
                                                    </td>

                                                    <td className="px-4 py-4 text-right">
                                                        <span className="text-[#76817B]">
                                                            {formatearCantidad(
                                                                consumo.cantidadAnterior,
                                                            )}
                                                        </span>
                                                        {" → "}
                                                        <strong className="text-[#33413B]">
                                                            {formatearCantidad(
                                                                consumo.cantidadNueva,
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td className="pl-4 py-4 text-right text-xs text-[#76817B]">
                                                        {formatearFechaHora(
                                                            consumo.fechaMovimiento,
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="grid gap-3 lg:hidden">
                                {consumosFiltrados.map(
                                    (consumo) => (
                                        <article
                                            key={
                                                consumo.id
                                            }
                                            className="rounded-2xl border border-border bg-[#FBFCFA] p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-bold text-foreground">
                                                        {
                                                            consumo.productoNombre
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs text-[#76817B]">
                                                        {
                                                            consumo.productoCodigo
                                                        }
                                                    </p>
                                                </div>

                                                <span className="rounded-full bg-[#F8E5E5] px-2.5 py-1 text-xs font-bold text-[#A25E5E]">
                                                    -
                                                    {formatearCantidad(
                                                        consumo.cantidad,
                                                    )}{" "}
                                                    {
                                                        consumo.unidadMedida
                                                    }
                                                </span>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                                <MiniDato
                                                    icono={
                                                        CalendarDays
                                                    }
                                                    titulo="Cita"
                                                    valor={
                                                        consumo.codigoCita
                                                    }
                                                />

                                                <MiniDato
                                                    icono={
                                                        UserRound
                                                    }
                                                    titulo="Cliente"
                                                    valor={
                                                        consumo.clienteNombre
                                                    }
                                                />

                                                <MiniDato
                                                    icono={
                                                        Store
                                                    }
                                                    titulo="Sucursal"
                                                    valor={
                                                        consumo.sucursalNombre
                                                    }
                                                />

                                                <MiniDato
                                                    icono={
                                                        Boxes
                                                    }
                                                    titulo="Stock"
                                                    valor={`${formatearCantidad(
                                                        consumo.cantidadAnterior,
                                                    )} → ${formatearCantidad(
                                                        consumo.cantidadNueva,
                                                    )}`}
                                                />
                                            </div>

                                            <p className="mt-4 text-xs text-[#76817B]">
                                                {formatearFechaHora(
                                                    consumo.fechaMovimiento,
                                                )}
                                            </p>
                                        </article>
                                    ),
                                )}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

function TarjetaResumen({
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
    icono: Icono,
    titulo,
    valor,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl bg-white p-3">
            <div className="flex items-center gap-1.5 text-[#76817B]">
                <Icono className="h-3.5 w-3.5" />

                <span className="font-semibold">
                    {titulo}
                </span>
            </div>

            <p className="mt-1 truncate font-bold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function formatearCantidad(
    valor: number,
) {
    return Number(
        valor,
    ).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
        },
    );
}

function formatearFechaHora(
    fecha: string,
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
        new Date(fecha),
    );
}