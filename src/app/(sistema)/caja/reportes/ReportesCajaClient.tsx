"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    CalendarDays,
    CircleDollarSign,
    CreditCard,
    Filter,
    Landmark,
    ReceiptText,
    Store,
    TrendingDown,
    TrendingUp,
    WalletCards,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SucursalReporte = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type VentaReporte = {
    id: string;
    codigo_venta: string | null;
    tipo_venta: string;
    sucursal_id: string;
    subtotal: number;
    descuento: number;
    impuestos: number;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    estado_pago: string;
    estado: string;
    fecha_venta: string;

    clientes: {
        nombre_completo: string;
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
        estado: string;
        terminales_pos: {
            nombre: string;
            banco: string | null;
        } | null;
    }[];
};

export type MovimientoReporte = {
    id: string;
    sucursal_id: string;
    tipo: string;
    naturaleza: string;
    metodo_pago: string | null;
    concepto: string;
    monto: number;
    fecha_movimiento: string;
    venta_id: string | null;
    sucursales: {
        nombre: string;
    } | null;
};

export default function ReportesCajaClient({
    ventas,
    movimientos,
    sucursales,
    simboloMoneda,
}: {
    ventas: VentaReporte[];
    movimientos: MovimientoReporte[];
    sucursales: SucursalReporte[];
    simboloMoneda: string;
}) {
    const hoy = new Date();
    const primerDiaMes = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1,
    )
        .toISOString()
        .slice(0, 10);

    const hoyTexto = hoy.toISOString().slice(0, 10);

    const [fechaDesde, setFechaDesde] =
        useState(primerDiaMes);
    const [fechaHasta, setFechaHasta] =
        useState(hoyTexto);
    const [sucursalId, setSucursalId] =
        useState("");

    const ventasFiltradas = useMemo(
        () =>
            ventas.filter((venta) => {
                const fecha =
                    venta.fecha_venta.slice(0, 10);

                return (
                    venta.estado === "ACTIVA" &&
                    (!fechaDesde ||
                        fecha >= fechaDesde) &&
                    (!fechaHasta ||
                        fecha <= fechaHasta) &&
                    (!sucursalId ||
                        venta.sucursal_id ===
                        sucursalId)
                );
            }),
        [
            fechaDesde,
            fechaHasta,
            sucursalId,
            ventas,
        ],
    );

    const movimientosFiltrados = useMemo(
        () =>
            movimientos.filter(
                (movimiento) => {
                    const fecha =
                        movimiento.fecha_movimiento.slice(
                            0,
                            10,
                        );

                    return (
                        (!fechaDesde ||
                            fecha >=
                            fechaDesde) &&
                        (!fechaHasta ||
                            fecha <=
                            fechaHasta) &&
                        (!sucursalId ||
                            movimiento.sucursal_id ===
                            sucursalId)
                    );
                },
            ),
        [
            fechaDesde,
            fechaHasta,
            movimientos,
            sucursalId,
        ],
    );

    const resumen = useMemo(() => {
        const totalVentas =
            ventasFiltradas.reduce(
                (total, venta) =>
                    total +
                    Number(venta.total),
                0,
            );

        const totalCobrado =
            ventasFiltradas.reduce(
                (total, venta) =>
                    total +
                    Number(
                        venta.monto_pagado,
                    ),
                0,
            );

        const saldoPendiente =
            ventasFiltradas.reduce(
                (total, venta) =>
                    total +
                    Number(
                        venta.saldo_pendiente,
                    ),
                0,
            );

        const descuentos =
            ventasFiltradas.reduce(
                (total, venta) =>
                    total +
                    Number(
                        venta.descuento,
                    ),
                0,
            );

        const comisionesPos =
            ventasFiltradas.reduce(
                (totalVenta, venta) =>
                    totalVenta +
                    venta.venta_pagos
                        .filter(
                            (pago) =>
                                pago.estado ===
                                "APLICADO" &&
                                pago.metodo_pago ===
                                "TARJETA",
                        )
                        .reduce(
                            (totalPago, pago) =>
                                totalPago +
                                Number(
                                    pago.monto_comision_pos ||
                                    0,
                                ),
                            0,
                        ),
                0,
            );

        const ingresosManuales =
            movimientosFiltrados
                .filter(
                    (movimiento) =>
                        movimiento.tipo ===
                        "INGRESO" &&
                        movimiento.naturaleza ===
                        "ENTRADA",
                )
                .reduce(
                    (total, movimiento) =>
                        total +
                        Number(
                            movimiento.monto,
                        ),
                    0,
                );

        const gastosOperativos =
            movimientosFiltrados
                .filter(
                    (movimiento) =>
                        movimiento.tipo ===
                        "EGRESO" &&
                        movimiento.naturaleza ===
                        "SALIDA" &&
                        !esComisionPos(
                            movimiento,
                        ),
                )
                .reduce(
                    (total, movimiento) =>
                        total +
                        Number(
                            movimiento.monto,
                        ),
                    0,
                );

        const resultadoOperativo =
            totalCobrado +
            ingresosManuales -
            gastosOperativos -
            comisionesPos;

        return {
            cantidadVentas:
                ventasFiltradas.length,
            totalVentas,
            totalCobrado,
            saldoPendiente,
            descuentos,
            comisionesPos,
            ingresosManuales,
            gastosOperativos,
            resultadoOperativo,
        };
    }, [
        movimientosFiltrados,
        ventasFiltradas,
    ]);

    const ventasPorMetodo = useMemo(() => {
        const acumulado: Record<
            string,
            number
        > = {};

        for (const venta of ventasFiltradas) {
            for (const pago of venta.venta_pagos) {
                if (
                    pago.estado !== "APLICADO"
                ) {
                    continue;
                }

                acumulado[
                    pago.metodo_pago
                ] =
                    (acumulado[
                        pago.metodo_pago
                    ] ?? 0) +
                    Number(pago.monto);
            }
        }

        return Object.entries(acumulado)
            .map(([metodo, total]) => ({
                metodo,
                total,
            }))
            .sort(
                (a, b) =>
                    b.total - a.total,
            );
    }, [ventasFiltradas]);

    const gastos = useMemo(
        () =>
            movimientosFiltrados.filter(
                (movimiento) =>
                    movimiento.tipo ===
                    "EGRESO" &&
                    movimiento.naturaleza ===
                    "SALIDA" &&
                    !esComisionPos(
                        movimiento,
                    ),
            ),
        [movimientosFiltrados],
    );

    const comisiones = useMemo(() => {
        const resultado: {
            ventaId: string;
            codigoVenta: string;
            fecha: string;
            terminal: string;
            montoPago: number;
            comision: number;
            neto: number;
        }[] = [];

        for (const venta of ventasFiltradas) {
            for (const pago of venta.venta_pagos) {
                if (
                    pago.estado !== "APLICADO" ||
                    pago.metodo_pago !==
                    "TARJETA" ||
                    Number(
                        pago.monto_comision_pos,
                    ) <= 0
                ) {
                    continue;
                }

                resultado.push({
                    ventaId: venta.id,
                    codigoVenta:
                        venta.codigo_venta ??
                        "Sin código",
                    fecha: venta.fecha_venta,
                    terminal:
                        pago.terminales_pos
                            ?.nombre ??
                        "POS",
                    montoPago: Number(
                        pago.monto,
                    ),
                    comision: Number(
                        pago.monto_comision_pos,
                    ),
                    neto: Number(
                        pago.monto_neto ??
                        Number(
                            pago.monto,
                        ) -
                        Number(
                            pago.monto_comision_pos,
                        ),
                    ),
                });
            }
        }

        return resultado;
    }, [ventasFiltradas]);

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function limpiarFiltros() {
        setFechaDesde("");
        setFechaHasta("");
        setSucursalId("");
    }

    return (
        <div className="space-y-6">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/caja"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Caja
                    </Link>

                    <div className="mt-5 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                            <TrendingUp className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Finanzas
                            </p>

                            <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                Reportes financieros
                            </h1>

                            <p className="mt-3 max-w-2xl text-[#CFD9D4]">
                                Analiza ventas, ingresos,
                                gastos y comisiones POS sin
                                contar el fondo inicial de caja
                                como ingreso del negocio.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="salon-panel border border-border bg-white p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <CampoFecha
                        titulo="Desde"
                        valor={fechaDesde}
                        cambiar={setFechaDesde}
                    />

                    <CampoFecha
                        titulo="Hasta"
                        valor={fechaHasta}
                        cambiar={setFechaHasta}
                    />

                    <div className="relative">
                        <Store className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                        <select
                            value={sucursalId}
                            onChange={(event) =>
                                setSucursalId(
                                    event.target.value,
                                )
                            }
                            className="salon-control w-full border border-border-strong bg-white pl-11 pr-4"
                        >
                            <option value="">
                                Todas las sucursales
                            </option>

                            {sucursales.map(
                                (sucursal) => (
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

                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="salon-action inline-flex items-center justify-center gap-2 bg-surface-soft px-4 text-[#52605A]"
                    >
                        <X className="h-4 w-4" />
                        Limpiar filtros
                    </button>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Resumen
                    titulo="Ventas"
                    valor={dinero(
                        resumen.totalVentas,
                    )}
                    subtitulo={`${resumen.cantidadVentas} venta${resumen.cantidadVentas ===
                            1
                            ? ""
                            : "s"
                        }`}
                    icono={CircleDollarSign}
                />

                <Resumen
                    titulo="Cobrado"
                    valor={dinero(
                        resumen.totalCobrado,
                    )}
                    subtitulo="Pagos aplicados"
                    icono={WalletCards}
                />

                <Resumen
                    titulo="Gastos"
                    valor={dinero(
                        resumen.gastosOperativos,
                    )}
                    subtitulo="Sin comisiones POS"
                    icono={TrendingDown}
                />

                <Resumen
                    titulo="Comisiones POS"
                    valor={dinero(
                        resumen.comisionesPos,
                    )}
                    subtitulo="Costo bancario"
                    icono={CreditCard}
                />

                <Resumen
                    titulo="Ingresos manuales"
                    valor={dinero(
                        resumen.ingresosManuales,
                    )}
                    subtitulo="Entradas adicionales"
                    icono={Banknote}
                />

                <Resumen
                    titulo="Saldo pendiente"
                    valor={dinero(
                        resumen.saldoPendiente,
                    )}
                    subtitulo="Por cobrar"
                    icono={ReceiptText}
                />

                <Resumen
                    titulo="Descuentos"
                    valor={dinero(
                        resumen.descuentos,
                    )}
                    subtitulo="Aplicados a ventas"
                    icono={Filter}
                />

                <Resumen
                    titulo="Resultado operativo"
                    valor={dinero(
                        resumen.resultadoOperativo,
                    )}
                    subtitulo="Cobrado + ingresos - gastos - POS"
                    icono={Landmark}
                />
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
                <Seccion titulo="Cobros por método">
                    {ventasPorMetodo.length ===
                        0 ? (
                        <Vacio texto="No hay pagos en el período." />
                    ) : (
                        <div className="space-y-3">
                            {ventasPorMetodo.map(
                                (item) => (
                                    <div
                                        key={
                                            item.metodo
                                        }
                                        className="flex items-center justify-between rounded-2xl bg-[#FBFCFA] p-4"
                                    >
                                        <span className="font-semibold text-[#33413B]">
                                            {formatearTexto(
                                                item.metodo,
                                            )}
                                        </span>

                                        <strong className="text-foreground">
                                            {dinero(
                                                item.total,
                                            )}
                                        </strong>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </Seccion>

                <Seccion titulo="Resumen del período">
                    <div className="space-y-3">
                        <Fila
                            titulo="Ventas brutas"
                            valor={dinero(
                                resumen.totalVentas,
                            )}
                        />
                        <Fila
                            titulo="Cobrado"
                            valor={dinero(
                                resumen.totalCobrado,
                            )}
                        />
                        <Fila
                            titulo="Ingresos manuales"
                            valor={dinero(
                                resumen.ingresosManuales,
                            )}
                        />
                        <Fila
                            titulo="Gastos"
                            valor={`- ${dinero(
                                resumen.gastosOperativos,
                            )}`}
                        />
                        <Fila
                            titulo="Comisiones POS"
                            valor={`- ${dinero(
                                resumen.comisionesPos,
                            )}`}
                        />

                        <div className="border-t border-[#DDE3DF] pt-3">
                            <Fila
                                titulo="Resultado operativo"
                                valor={dinero(
                                    resumen.resultadoOperativo,
                                )}
                                destacado
                            />
                        </div>
                    </div>
                </Seccion>
            </div>

            <Seccion titulo="Comisiones POS">
                {comisiones.length === 0 ? (
                    <Vacio texto="No hay comisiones POS en el período." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="salon-table w-full min-w-[850px]">
                            <thead className="bg-[#FBFCFA] text-left text-xs uppercase text-[#76817B]">
                                <tr>
                                    <Th>Fecha</Th>
                                    <Th>Venta</Th>
                                    <Th>Terminal</Th>
                                    <Th>Pago</Th>
                                    <Th>Comisión</Th>
                                    <Th>Neto POS</Th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#E8ECE9]">
                                {comisiones.map(
                                    (item) => (
                                        <tr
                                            key={`${item.ventaId}-${item.terminal}-${item.comision}`}
                                            className="text-sm text-[#33413B]"
                                        >
                                            <Td>
                                                {formatearFecha(
                                                    item.fecha,
                                                )}
                                            </Td>
                                            <Td>
                                                <Link
                                                    href={`/caja/ventas/${item.ventaId}`}
                                                    className="font-bold text-primary-strong hover:underline"
                                                >
                                                    {
                                                        item.codigoVenta
                                                    }
                                                </Link>
                                            </Td>
                                            <Td>
                                                {
                                                    item.terminal
                                                }
                                            </Td>
                                            <Td>
                                                {dinero(
                                                    item.montoPago,
                                                )}
                                            </Td>
                                            <Td>
                                                {dinero(
                                                    item.comision,
                                                )}
                                            </Td>
                                            <Td>
                                                <strong>
                                                    {dinero(
                                                        item.neto,
                                                    )}
                                                </strong>
                                            </Td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Seccion>

            <Seccion titulo="Gastos registrados">
                {gastos.length === 0 ? (
                    <Vacio texto="No hay gastos registrados en el período." />
                ) : (
                    <div className="divide-y divide-[#E8ECE9]">
                        {gastos.map(
                            (gasto) => (
                                <div
                                    key={gasto.id}
                                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-semibold text-[#33413B]">
                                            {
                                                gasto.concepto
                                            }
                                        </p>
                                        <p className="mt-1 text-xs text-[#829089]">
                                            {gasto
                                                .sucursales
                                                ?.nombre ??
                                                "Sucursal"}{" "}
                                            ·{" "}
                                            {formatearFecha(
                                                gasto.fecha_movimiento,
                                            )}
                                        </p>
                                    </div>

                                    <strong className="text-[#A25E5E]">
                                        -{" "}
                                        {dinero(
                                            gasto.monto,
                                        )}
                                    </strong>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </Seccion>
        </div>
    );
}

function esComisionPos(
    movimiento: MovimientoReporte,
) {
    const concepto =
        movimiento.concepto
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                "",
            );

    return concepto.includes(
        "comision pos",
    );
}

function CampoFecha({
    titulo,
    valor,
    cambiar,
}: {
    titulo: string;
    valor: string;
    cambiar: (valor: string) => void;
}) {
    return (
        <label>
            <span className="mb-1 block text-xs font-bold uppercase text-[#829089]">
                {titulo}
            </span>
            <input
                type="date"
                value={valor}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="salon-control w-full border border-border-strong px-3"
            />
        </label>
    );
}

function Resumen({
    titulo,
    valor,
    subtitulo,
    icono: Icono,
}: {
    titulo: string;
    valor: string;
    subtitulo: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-text-secondary">
                        {titulo}
                    </p>
                    <p className="mt-3 text-xl font-bold text-foreground">
                        {valor}
                    </p>
                    <p className="mt-1 text-xs text-[#829089]">
                        {subtitulo}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function Seccion({
    titulo,
    children,
}: {
    titulo: string;
    children: React.ReactNode;
}) {
    return (
        <section className="salon-panel overflow-hidden border border-border bg-white">
            <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                <h2 className="font-bold text-foreground tracking-tight">
                    {titulo}
                </h2>
            </header>

            <div className="p-5 sm:p-6">
                {children}
            </div>
        </section>
    );
}

function Fila({
    titulo,
    valor,
    destacado = false,
}: {
    titulo: string;
    valor: string;
    destacado?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span
                className={
                    destacado
                        ? "font-bold text-foreground"
                        : "text-sm text-text-secondary"
                }
            >
                {titulo}
            </span>

            <strong
                className={
                    destacado
                        ? "text-xl text-foreground"
                        : "text-sm text-[#33413B]"
                }
            >
                {valor}
            </strong>
        </div>
    );
}

function Vacio({
    texto,
}: {
    texto: string;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-border-strong bg-[#FBFCFA] p-8 text-center text-sm text-text-secondary">
            {texto}
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