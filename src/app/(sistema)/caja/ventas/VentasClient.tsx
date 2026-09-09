"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    CircleDollarSign,
    CreditCard,
    Eye,
    Filter,
    ReceiptText,
    Search,
    Store,
    WalletCards,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SucursalVenta = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type VentaHistorial = {
    id: string;
    codigo_venta: string | null;
    tipo_venta: string;
    subtotal: number;
    descuento: number;
    impuestos: number;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    estado_pago: string;
    estado: string;
    fecha_venta: string;
    cliente_id: string | null;
    cita_id: string | null;
    sucursal_id: string;

    clientes: {
        nombre_completo: string;
        codigo_cliente: string | null;
        telefono: string | null;
        whatsapp: string | null;
    } | null;

    sucursales: {
        nombre: string;
    } | null;

    venta_pagos: {
        id: string;
        metodo_pago: string;
        monto: number;
        monto_comision_pos: number;
        monto_neto: number | null;
        terminales_pos: {
            nombre: string;
            banco: string | null;
        } | null;
    }[];
};

type TipoVentaFiltro =
    | ""
    | "CITA"
    | "DIRECTA";

type EstadoPagoFiltro =
    | ""
    | "PAGADA"
    | "PARCIAL"
    | "PENDIENTE"
    | "ANULADA";

export default function VentasClient({
    ventas,
    sucursales,
    simboloMoneda,
}: {
    ventas: VentaHistorial[];
    sucursales: SucursalVenta[];
    simboloMoneda: string;
}) {
    const [busqueda, setBusqueda] =
        useState("");
    const [sucursalId, setSucursalId] =
        useState("");
    const [tipoVenta, setTipoVenta] =
        useState<TipoVentaFiltro>("");
    const [estadoPago, setEstadoPago] =
        useState<EstadoPagoFiltro>("");
    const [fechaDesde, setFechaDesde] =
        useState("");
    const [fechaHasta, setFechaHasta] =
        useState("");

    const ventasFiltradas = useMemo(() => {
        const texto =
            busqueda.trim().toLowerCase();

        return ventas.filter((venta) => {
            const coincideTexto =
                !texto ||
                venta.codigo_venta
                    ?.toLowerCase()
                    .includes(texto) ||
                venta.clientes?.nombre_completo
                    .toLowerCase()
                    .includes(texto) ||
                venta.clientes?.codigo_cliente
                    ?.toLowerCase()
                    .includes(texto) ||
                venta.clientes?.telefono
                    ?.toLowerCase()
                    .includes(texto) ||
                venta.clientes?.whatsapp
                    ?.toLowerCase()
                    .includes(texto);

            const coincideSucursal =
                !sucursalId ||
                venta.sucursal_id === sucursalId;

            const coincideTipo =
                !tipoVenta ||
                venta.tipo_venta === tipoVenta;

            const coincideEstadoPago =
                !estadoPago ||
                venta.estado_pago === estadoPago;

            const fecha =
                venta.fecha_venta.slice(0, 10);

            const coincideFechaDesde =
                !fechaDesde ||
                fecha >= fechaDesde;

            const coincideFechaHasta =
                !fechaHasta ||
                fecha <= fechaHasta;

            return (
                coincideTexto &&
                coincideSucursal &&
                coincideTipo &&
                coincideEstadoPago &&
                coincideFechaDesde &&
                coincideFechaHasta
            );
        });
    }, [
        busqueda,
        estadoPago,
        fechaDesde,
        fechaHasta,
        sucursalId,
        tipoVenta,
        ventas,
    ]);

    const resumen = useMemo(() => {
        return ventasFiltradas.reduce(
            (acumulado, venta) => {
                if (venta.estado === "ANULADA") {
                    return acumulado;
                }

                const comisionPos =
                    venta.venta_pagos.reduce(
                        (total, pago) =>
                            total +
                            Number(
                                pago.monto_comision_pos ||
                                0,
                            ),
                        0,
                    );

                return {
                    totalVentas:
                        acumulado.totalVentas + 1,
                    montoVendido:
                        acumulado.montoVendido +
                        Number(venta.total),
                    montoPagado:
                        acumulado.montoPagado +
                        Number(
                            venta.monto_pagado,
                        ),
                    saldoPendiente:
                        acumulado.saldoPendiente +
                        Number(
                            venta.saldo_pendiente,
                        ),
                    comisionPos:
                        acumulado.comisionPos +
                        comisionPos,
                };
            },
            {
                totalVentas: 0,
                montoVendido: 0,
                montoPagado: 0,
                saldoPendiente: 0,
                comisionPos: 0,
            },
        );
    }, [ventasFiltradas]);

    const hayFiltros =
        Boolean(busqueda) ||
        Boolean(sucursalId) ||
        Boolean(tipoVenta) ||
        Boolean(estadoPago) ||
        Boolean(fechaDesde) ||
        Boolean(fechaHasta);

    function limpiarFiltros() {
        setBusqueda("");
        setSucursalId("");
        setTipoVenta("");
        setEstadoPago("");
        setFechaDesde("");
        setFechaHasta("");
    }

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link
                            href="/caja"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a Caja
                        </Link>

                        <div className="mt-5 flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <ReceiptText className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Caja y ventas
                                </p>

                                <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                                    Historial de ventas
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Consulta cobros de citas,
                                    ventas directas, pagos y
                                    saldos pendientes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <TarjetaResumen
                    titulo="Ventas"
                    valor={String(
                        resumen.totalVentas,
                    )}
                    icono={ReceiptText}
                />

                <TarjetaResumen
                    titulo="Total vendido"
                    valor={dinero(
                        resumen.montoVendido,
                    )}
                    icono={CircleDollarSign}
                />

                <TarjetaResumen
                    titulo="Pagado"
                    valor={dinero(
                        resumen.montoPagado,
                    )}
                    icono={WalletCards}
                />

                <TarjetaResumen
                    titulo="Saldo pendiente"
                    valor={dinero(
                        resumen.saldoPendiente,
                    )}
                    icono={CreditCard}
                />

                <TarjetaResumen
                    titulo="Comisión POS"
                    valor={dinero(
                        resumen.comisionPos,
                    )}
                    icono={CreditCard}
                />
            </section>

            <section className="rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-[#24302C]">
                                Filtros
                            </h2>
                            <p className="mt-1 text-sm text-[#6B756F]">
                                Encuentra ventas por cliente,
                                fecha, sucursal o estado.
                            </p>
                        </div>

                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#EEF2EF] px-3 text-xs font-bold text-[#52605A]"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 sm:p-6">
                    <div className="relative sm:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder="Cliente, código o teléfono..."
                            className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83]"
                        />
                    </div>

                    <CampoSelect
                        valor={sucursalId}
                        cambiar={setSucursalId}
                        opciones={[
                            {
                                valor: "",
                                texto:
                                    "Todas las sucursales",
                            },
                            ...sucursales.map(
                                (sucursal) => ({
                                    valor: sucursal.id,
                                    texto:
                                        sucursal.nombre,
                                }),
                            ),
                        ]}
                        icono={Store}
                    />

                    <CampoSelect
                        valor={tipoVenta}
                        cambiar={(valor) =>
                            setTipoVenta(
                                valor as TipoVentaFiltro,
                            )
                        }
                        opciones={[
                            {
                                valor: "",
                                texto:
                                    "Todos los tipos",
                            },
                            {
                                valor: "CITA",
                                texto:
                                    "Cobro de cita",
                            },
                            {
                                valor: "DIRECTA",
                                texto:
                                    "Venta directa",
                            },
                        ]}
                        icono={Filter}
                    />

                    <CampoSelect
                        valor={estadoPago}
                        cambiar={(valor) =>
                            setEstadoPago(
                                valor as EstadoPagoFiltro,
                            )
                        }
                        opciones={[
                            {
                                valor: "",
                                texto:
                                    "Todos los estados",
                            },
                            {
                                valor: "PAGADA",
                                texto: "Pagada",
                            },
                            {
                                valor: "PARCIAL",
                                texto: "Parcial",
                            },
                            {
                                valor: "PENDIENTE",
                                texto: "Pendiente",
                            },
                            {
                                valor: "ANULADA",
                                texto: "Anulada",
                            },
                        ]}
                        icono={CreditCard}
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <label>
                            <span className="mb-1 block text-[10px] font-bold uppercase text-[#829089]">
                                Desde
                            </span>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(event) =>
                                    setFechaDesde(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-9 w-full rounded-lg border border-[#D4DAD6] px-2 text-xs"
                            />
                        </label>

                        <label>
                            <span className="mb-1 block text-[10px] font-bold uppercase text-[#829089]">
                                Hasta
                            </span>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(event) =>
                                    setFechaHasta(
                                        event.target
                                            .value,
                                    )
                                }
                                className="h-9 w-full rounded-lg border border-[#D4DAD6] px-2 text-xs"
                            />
                        </label>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                <header className="flex items-center justify-between gap-4 border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div>
                        <h2 className="font-bold text-[#24302C]">
                            Ventas registradas
                        </h2>

                        <p className="mt-1 text-sm text-[#6B756F]">
                            {ventasFiltradas.length} resultado
                            {ventasFiltradas.length === 1
                                ? ""
                                : "s"}
                        </p>
                    </div>
                </header>

                {ventasFiltradas.length === 0 ? (
                    <EstadoVacio />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full min-w-[1100px]">
                                <thead className="bg-[#FBFCFA] text-left text-xs uppercase text-[#76817B]">
                                    <tr>
                                        <Th>
                                            Fecha
                                        </Th>
                                        <Th>
                                            Venta
                                        </Th>
                                        <Th>
                                            Cliente
                                        </Th>
                                        <Th>
                                            Tipo
                                        </Th>
                                        <Th>
                                            Pagos
                                        </Th>
                                        <Th>
                                            Total
                                        </Th>
                                        <Th>
                                            Pagado
                                        </Th>
                                        <Th>
                                            Saldo
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
                                    {ventasFiltradas.map(
                                        (venta) => (
                                            <FilaVenta
                                                key={
                                                    venta.id
                                                }
                                                venta={
                                                    venta
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

                        <div className="space-y-3 p-4 lg:hidden">
                            {ventasFiltradas.map(
                                (venta) => (
                                    <TarjetaVenta
                                        key={venta.id}
                                        venta={venta}
                                        dinero={dinero}
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

function FilaVenta({
    venta,
    dinero,
}: {
    venta: VentaHistorial;
    dinero: (valor: number) => string;
}) {
    const metodos = obtenerMetodos(venta);

    return (
        <tr className="text-sm text-[#33413B] hover:bg-[#FBFCFA]">
            <Td>
                <p className="font-semibold">
                    {formatearFecha(
                        venta.fecha_venta,
                    )}
                </p>
                <p className="mt-1 text-xs text-[#829089]">
                    {formatearHora(
                        venta.fecha_venta,
                    )}
                </p>
            </Td>

            <Td>
                <p className="font-bold">
                    {venta.codigo_venta ??
                        "Sin código"}
                </p>
                <p className="mt-1 text-xs text-[#829089]">
                    {venta.sucursales?.nombre ??
                        "Sin sucursal"}
                </p>
            </Td>

            <Td>
                <p className="font-semibold">
                    {venta.clientes
                        ?.nombre_completo ??
                        "Consumidor final"}
                </p>
            </Td>

            <Td>
                <EtiquetaTipo
                    tipo={venta.tipo_venta}
                />
            </Td>

            <Td>
                <div className="flex max-w-[210px] flex-wrap gap-1.5">
                    {metodos.map(
                        (metodo) => (
                            <span
                                key={metodo}
                                className="rounded-full bg-[#EEF2EF] px-2 py-1 text-[10px] font-bold text-[#52605A]"
                            >
                                {metodo}
                            </span>
                        ),
                    )}
                </div>
            </Td>

            <Td>
                <strong>
                    {dinero(venta.total)}
                </strong>
            </Td>

            <Td>
                {dinero(
                    venta.monto_pagado,
                )}
            </Td>

            <Td>
                <span
                    className={
                        Number(
                            venta.saldo_pendiente,
                        ) > 0
                            ? "font-bold text-[#A25E5E]"
                            : "text-[#52605A]"
                    }
                >
                    {dinero(
                        venta.saldo_pendiente,
                    )}
                </span>
            </Td>

            <Td>
                <EstadoPago
                    estado={
                        venta.estado === "ANULADA"
                            ? "ANULADA"
                            : venta.estado_pago
                    }
                />
            </Td>

            <Td>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/caja/ventas/${venta.id}`}
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#26332F] px-3 text-xs font-bold text-white transition hover:bg-[#33413B]"
                    >
                        <Eye className="h-4 w-4" />
                        Detalle
                    </Link>

                    {venta.estado !== "ANULADA" && (
                        <Link
                            href={`/caja/recibos/${venta.id}`}
                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#DCE7E2] px-3 text-xs font-bold text-[#43524B] transition hover:bg-[#CFE0D8]"
                        >
                            <ReceiptText className="h-4 w-4" />
                            Recibo
                        </Link>
                    )}
                </div>
            </Td>
        </tr>
    );
}

function TarjetaVenta({
    venta,
    dinero,
}: {
    venta: VentaHistorial;
    dinero: (valor: number) => string;
}) {
    const metodos = obtenerMetodos(venta);

    return (
        <article className="rounded-2xl border border-[#E3E7E4] p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-bold text-[#24302C]">
                        {venta.codigo_venta ??
                            "Sin código"}
                    </p>

                    <p className="mt-1 text-xs text-[#76817B]">
                        {formatearFecha(
                            venta.fecha_venta,
                        )}{" "}
                        ·{" "}
                        {formatearHora(
                            venta.fecha_venta,
                        )}
                    </p>
                </div>

                <EstadoPago
                    estado={
                        venta.estado === "ANULADA"
                            ? "ANULADA"
                            : venta.estado_pago
                    }
                />
            </div>

            <p className="mt-4 font-semibold text-[#33413B]">
                {venta.clientes
                    ?.nombre_completo ??
                    "Consumidor final"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
                <EtiquetaTipo
                    tipo={venta.tipo_venta}
                />

                {metodos.map((metodo) => (
                    <span
                        key={metodo}
                        className="rounded-full bg-[#EEF2EF] px-2.5 py-1 text-[10px] font-bold text-[#52605A]"
                    >
                        {metodo}
                    </span>
                ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniDato
                    titulo="Total"
                    valor={dinero(
                        venta.total,
                    )}
                />
                <MiniDato
                    titulo="Pagado"
                    valor={dinero(
                        venta.monto_pagado,
                    )}
                />
                <MiniDato
                    titulo="Saldo"
                    valor={dinero(
                        venta.saldo_pendiente,
                    )}
                />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                    href={`/caja/ventas/${venta.id}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#26332F] text-sm font-bold text-white"
                >
                    <Eye className="h-4 w-4" />
                    Detalle
                </Link>

                {venta.estado !== "ANULADA" ? (
                    <Link
                        href={`/caja/recibos/${venta.id}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#DCE7E2] text-sm font-bold text-[#43524B]"
                    >
                        <ReceiptText className="h-4 w-4" />
                        Recibo
                    </Link>
                ) : (
                    <div className="inline-flex h-10 items-center justify-center rounded-xl bg-[#EFE7E1] text-xs font-bold text-[#8B6754]">
                        Anulada
                    </div>
                )}
            </div>
        </article>
    );
}

function obtenerMetodos(
    venta: VentaHistorial,
) {
    const metodos = venta.venta_pagos.map(
        (pago) => {
            if (
                pago.metodo_pago ===
                "TARJETA" &&
                pago.terminales_pos?.nombre
            ) {
                return `Tarjeta · ${pago.terminales_pos.nombre}`;
            }

            return formatearTexto(
                pago.metodo_pago,
            );
        },
    );

    return [...new Set(metodos)];
}

function EstadoPago({
    estado,
}: {
    estado: string;
}) {
    const estilos: Record<
        string,
        string
    > = {
        PAGADA:
            "bg-[#E3EEE8] text-[#527865]",
        PARCIAL:
            "bg-[#FAF0DC] text-[#9A742D]",
        PENDIENTE:
            "bg-[#F8E5E5] text-[#A25E5E]",
        ANULADA:
            "bg-[#EFE7E1] text-[#8B6754]",
    };

    return (
        <span
            className={[
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                estilos[estado] ??
                "bg-[#EEF2EF] text-[#6B756F]",
            ].join(" ")}
        >
            {formatearTexto(estado)}
        </span>
    );
}

function EtiquetaTipo({
    tipo,
}: {
    tipo: string;
}) {
    return (
        <span className="inline-flex rounded-full bg-[#E8EDF4] px-2.5 py-1 text-[10px] font-bold text-[#5C6F88]">
            {tipo === "CITA"
                ? "Cita"
                : tipo === "DIRECTA"
                    ? "Directa"
                    : formatearTexto(tipo)}
        </span>
    );
}

function CampoSelect({
    valor,
    cambiar,
    opciones,
    icono: Icono,
}: {
    valor: string;
    cambiar: (valor: string) => void;
    opciones: {
        valor: string;
        texto: string;
    }[];
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="relative">
            <Icono className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

            <select
                value={valor}
                onChange={(event) =>
                    cambiar(
                        event.target.value,
                    )
                }
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm"
            >
                {opciones.map(
                    (opcion) => (
                        <option
                            key={
                                opcion.valor ||
                                opcion.texto
                            }
                            value={
                                opcion.valor
                            }
                        >
                            {opcion.texto}
                        </option>
                    ),
                )}
            </select>
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
        <article className="rounded-3xl border border-[#E3E7E4] bg-white p-5 shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-[#6B756F]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-xl font-bold text-[#24302C]">
                        {valor}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
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
        <div className="rounded-xl bg-[#FBFCFA] p-3">
            <p className="text-[10px] font-bold uppercase text-[#829089]">
                {titulo}
            </p>
            <p className="mt-1 text-xs font-bold text-[#33413B]">
                {valor}
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
        <th className="px-4 py-3 font-bold">
            {children}
        </th>
    );
}

function Td({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <td className="px-4 py-4 align-top">
            {children}
        </td>
    );
}

function EstadoVacio() {
    return (
        <div className="p-12 text-center">
            <ReceiptText className="mx-auto h-9 w-9 text-[#829089]" />
            <h3 className="mt-4 font-bold text-[#24302C]">
                No hay ventas para mostrar
            </h3>
            <p className="mt-2 text-sm text-[#6B756F]">
                Ajusta los filtros o registra
                una nueva venta.
            </p>
        </div>
    );
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
    ).format(new Date(fecha));
}

function formatearHora(
    fecha: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            hour: "numeric",
            minute: "2-digit",
            timeZone:
                "America/Managua",
        },
    ).format(new Date(fecha));
}

function formatearTexto(
    valor: string,
) {
    return valor
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letra) =>
            letra.toUpperCase(),
        );
}