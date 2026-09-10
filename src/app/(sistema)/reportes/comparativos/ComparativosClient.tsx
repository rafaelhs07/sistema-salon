"use client";

import Link from "next/link";
import {
    ArrowLeft,
    ArrowRightLeft,
    CalendarDays,
    CircleDollarSign,
    ShoppingBag,
    TrendingDown,
    TrendingUp,
    Truck,
    Users,
    WalletCards,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import BotonExportarExcel from "@/components/reportes/BotonExportarExcel";

import {
    exportarComparativoExcel,
} from "./exportarComparativoExcel";

export type VentaComparativa = {
    id: string;
    cliente_id: string | null;
    fecha_venta: string;
    total: number;
    monto_pagado: number;
    estado: string;
};

export type MovimientoComparativo = {
    id: string;
    fecha_movimiento: string;
    tipo:
    | "INGRESO"
    | "GASTO";
    monto: number;
    estado: string;
};

export type CitaComparativa = {
    id: string;
    cliente_id: string;
    fecha: string;
    estado: string;
    total: number;
};

export type CompraComparativa = {
    id: string;
    fecha_compra: string;
    total: number;
    estado: string;
};

type ResumenPeriodo = {
    ventasCantidad: number;
    ventasMonto: number;
    cobrado: number;
    ingresos: number;
    gastos: number;
    utilidad: number;
    citas: number;
    citasFinalizadas: number;
    comprasCantidad: number;
    comprasMonto: number;
    clientesActivos: number;
};

type ComparacionMetrica = {
    clave: string;
    titulo: string;
    valorA: number;
    valorB: number;
    diferencia: number;
    porcentaje: number | null;
    formato:
    | "moneda"
    | "numero";
};

function fechaISO(
    fecha: Date,
) {
    return [
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
}

export default function ComparativosClient({
    simboloMoneda,
    ventas,
    movimientos,
    citas,
    compras,
}: {
    simboloMoneda: string;
    ventas: VentaComparativa[];
    movimientos: MovimientoComparativo[];
    citas: CitaComparativa[];
    compras: CompraComparativa[];
}) {
    const hoy =
        new Date();

    const inicioMesActual =
        new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            1,
        );

    const finMesAnterior =
        new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            0,
        );

    const inicioMesAnterior =
        new Date(
            finMesAnterior.getFullYear(),
            finMesAnterior.getMonth(),
            1,
        );

    const [
        desdeA,
        setDesdeA,
    ] = useState(
        fechaISO(
            inicioMesActual,
        ),
    );

    const [
        hastaA,
        setHastaA,
    ] = useState(
        fechaISO(
            hoy,
        ),
    );

    const [
        desdeB,
        setDesdeB,
    ] = useState(
        fechaISO(
            inicioMesAnterior,
        ),
    );

    const [
        hastaB,
        setHastaB,
    ] = useState(
        fechaISO(
            finMesAnterior,
        ),
    );

    const [
        exportando,
        setExportando,
    ] = useState(false);

    const periodoA =
        useMemo(
            () =>
                calcularResumen(
                    desdeA,
                    hastaA,
                    ventas,
                    movimientos,
                    citas,
                    compras,
                ),
            [
                desdeA,
                hastaA,
                ventas,
                movimientos,
                citas,
                compras,
            ],
        );

    const periodoB =
        useMemo(
            () =>
                calcularResumen(
                    desdeB,
                    hastaB,
                    ventas,
                    movimientos,
                    citas,
                    compras,
                ),
            [
                desdeB,
                hastaB,
                ventas,
                movimientos,
                citas,
                compras,
            ],
        );

    const comparaciones =
        useMemo<ComparacionMetrica[]>(
            () => [
                crearComparacion(
                    "ventas_monto",
                    "Ventas",
                    periodoA.ventasMonto,
                    periodoB.ventasMonto,
                    "moneda",
                ),
                crearComparacion(
                    "ingresos",
                    "Ingresos",
                    periodoA.ingresos,
                    periodoB.ingresos,
                    "moneda",
                ),
                crearComparacion(
                    "gastos",
                    "Gastos",
                    periodoA.gastos,
                    periodoB.gastos,
                    "moneda",
                ),
                crearComparacion(
                    "utilidad",
                    "Utilidad",
                    periodoA.utilidad,
                    periodoB.utilidad,
                    "moneda",
                ),
                crearComparacion(
                    "citas",
                    "Citas",
                    periodoA.citas,
                    periodoB.citas,
                    "numero",
                ),
                crearComparacion(
                    "compras",
                    "Compras",
                    periodoA.comprasMonto,
                    periodoB.comprasMonto,
                    "moneda",
                ),
                crearComparacion(
                    "clientes",
                    "Clientes con actividad",
                    periodoA.clientesActivos,
                    periodoB.clientesActivos,
                    "numero",
                ),
            ],
            [
                periodoA,
                periodoB,
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
            await exportarComparativoExcel(
                {
                    simboloMoneda,
                    desdeA,
                    hastaA,
                    desdeB,
                    hastaB,
                    periodoA,
                    periodoB,
                    comparaciones,
                },
            );
        } catch (error) {
            console.error(
                "Error exportando comparativo:",
                error,
            );

            window.alert(
                "No fue posible generar el Excel comparativo.",
            );
        } finally {
            setExportando(
                false,
            );
        }
    }

    function usarMesAnterior() {
        setDesdeA(
            fechaISO(
                inicioMesActual,
            ),
        );
        setHastaA(
            fechaISO(
                hoy,
            ),
        );
        setDesdeB(
            fechaISO(
                inicioMesAnterior,
            ),
        );
        setHastaB(
            fechaISO(
                finMesAnterior,
            ),
        );
    }

    function usarAnioAnterior() {
        setDesdeA(
            `${hoy.getFullYear()}-01-01`,
        );
        setHastaA(
            fechaISO(
                hoy,
            ),
        );
        setDesdeB(
            `${hoy.getFullYear() - 1}-01-01`,
        );
        setHastaB(
            `${hoy.getFullYear() - 1}-${String(
                hoy.getMonth() +
                1,
            ).padStart(
                2,
                "0",
            )}-${String(
                hoy.getDate(),
            ).padStart(
                2,
                "0",
            )}`,
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
                                <ArrowRightLeft className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Evolución del negocio
                                </p>

                                <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                    Comparativo entre periodos
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Compara dos rangos de fechas y detecta cómo cambian
                                    ventas, finanzas, citas, compras y clientes.
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

            <section className="salon-panel border border-border bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-sidebar tracking-tight">
                            Periodos a comparar
                        </h2>

                        <p className="mt-1 text-sm text-[#72827A]">
                            Puedes usar comparaciones rápidas o definir tus propias fechas.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={
                                usarMesAnterior
                            }
                            className="salon-action border border-border px-4 text-[#52605A] transition hover:bg-surface-soft"
                        >
                            Mes actual vs anterior
                        </button>

                        <button
                            type="button"
                            onClick={
                                usarAnioAnterior
                            }
                            className="salon-action border border-border px-4 text-[#52605A] transition hover:bg-surface-soft"
                        >
                            Año actual vs anterior
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-2">
                    <PeriodoSelector
                        titulo="Periodo A"
                        descripcion="Periodo principal"
                        desde={
                            desdeA
                        }
                        hasta={
                            hastaA
                        }
                        cambiarDesde={
                            setDesdeA
                        }
                        cambiarHasta={
                            setHastaA
                        }
                    />

                    <PeriodoSelector
                        titulo="Periodo B"
                        descripcion="Periodo de comparación"
                        desde={
                            desdeB
                        }
                        hasta={
                            hastaB
                        }
                        cambiarDesde={
                            setDesdeB
                        }
                        cambiarHasta={
                            setHastaB
                        }
                    />
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiPeriodo
                    titulo="Ventas"
                    icono={ShoppingBag}
                    valorA={moneda(
                        periodoA.ventasMonto,
                        simboloMoneda,
                    )}
                    valorB={moneda(
                        periodoB.ventasMonto,
                        simboloMoneda,
                    )}
                    diferencia={comparaciones[0]}
                />

                <KpiPeriodo
                    titulo="Utilidad"
                    icono={CircleDollarSign}
                    valorA={moneda(
                        periodoA.utilidad,
                        simboloMoneda,
                    )}
                    valorB={moneda(
                        periodoB.utilidad,
                        simboloMoneda,
                    )}
                    diferencia={comparaciones[3]}
                />

                <KpiPeriodo
                    titulo="Citas"
                    icono={CalendarDays}
                    valorA={String(
                        periodoA.citas,
                    )}
                    valorB={String(
                        periodoB.citas,
                    )}
                    diferencia={comparaciones[4]}
                />

                <KpiPeriodo
                    titulo="Clientes activos"
                    icono={Users}
                    valorA={String(
                        periodoA.clientesActivos,
                    )}
                    valorB={String(
                        periodoB.clientesActivos,
                    )}
                    diferencia={comparaciones[6]}
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <ResumenPeriodoCard
                    titulo="Periodo A"
                    desde={
                        desdeA
                    }
                    hasta={
                        hastaA
                    }
                    resumen={
                        periodoA
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />

                <ResumenPeriodoCard
                    titulo="Periodo B"
                    desde={
                        desdeB
                    }
                    hasta={
                        hastaB
                    }
                    resumen={
                        periodoB
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />
            </section>

            <section className="salon-panel overflow-hidden border border-border bg-white">
                <div className="border-b border-[#E7EEEA] px-5 py-4 sm:px-6">
                    <h2 className="font-bold text-sidebar tracking-tight">
                        Diferencias entre periodos
                    </h2>

                    <p className="mt-1 text-xs text-[#74837C]">
                        Un porcentaje positivo significa que el Periodo A supera al Periodo B.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="salon-table min-w-[900px] w-full">
                        <thead className="bg-[#F7FAF8]">
                            <tr>
                                <Th>Indicador</Th>
                                <Th derecha>Periodo A</Th>
                                <Th derecha>Periodo B</Th>
                                <Th derecha>Diferencia</Th>
                                <Th derecha>Variación</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EDF3EF]">
                            {comparaciones.map(
                                (
                                    item,
                                ) => (
                                    <tr
                                        key={
                                            item.clave
                                        }
                                    >
                                        <Td>
                                            <span className="font-bold text-[#33413B]">
                                                {
                                                    item.titulo
                                                }
                                            </span>
                                        </Td>

                                        <Td derecha>
                                            {formatearValor(
                                                item.valorA,
                                                item.formato,
                                                simboloMoneda,
                                            )}
                                        </Td>

                                        <Td derecha>
                                            {formatearValor(
                                                item.valorB,
                                                item.formato,
                                                simboloMoneda,
                                            )}
                                        </Td>

                                        <Td derecha>
                                            <span
                                                className={
                                                    item.diferencia >=
                                                        0
                                                        ? "font-bold text-[#4F7564]"
                                                        : "font-bold text-[#9A6470]"
                                                }
                                            >
                                                {item.diferencia >=
                                                    0
                                                    ? "+"
                                                    : ""}
                                                {formatearValor(
                                                    item.diferencia,
                                                    item.formato,
                                                    simboloMoneda,
                                                )}
                                            </span>
                                        </Td>

                                        <Td derecha>
                                            <Variacion
                                                item={
                                                    item
                                                }
                                            />
                                        </Td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function PeriodoSelector({
    titulo,
    descripcion,
    desde,
    hasta,
    cambiarDesde,
    cambiarHasta,
}: {
    titulo: string;
    descripcion: string;
    desde: string;
    hasta: string;
    cambiarDesde: (
        valor: string,
    ) => void;
    cambiarHasta: (
        valor: string,
    ) => void;
}) {
    return (
        <div className="rounded-2xl bg-[#F7FAF8] p-4">
            <div>
                <p className="font-bold text-sidebar">
                    {titulo}
                </p>

                <p className="mt-1 text-xs text-[#7D8A84]">
                    {descripcion}
                </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#66756E]">
                    Desde

                    <input
                        type="date"
                        value={
                            desde
                        }
                        onChange={(
                            event,
                        ) =>
                            cambiarDesde(
                                event
                                    .target
                                    .value,
                            )
                        }
                        className="salon-control mt-1 w-full border border-border bg-white px-3 outline-none focus:border-primary"
                    />
                </label>

                <label className="text-xs font-semibold text-[#66756E]">
                    Hasta

                    <input
                        type="date"
                        value={
                            hasta
                        }
                        onChange={(
                            event,
                        ) =>
                            cambiarHasta(
                                event
                                    .target
                                    .value,
                            )
                        }
                        className="salon-control mt-1 w-full border border-border bg-white px-3 outline-none focus:border-primary"
                    />
                </label>
            </div>
        </div>
    );
}

function KpiPeriodo({
    titulo,
    icono: Icono,
    valorA,
    valorB,
    diferencia,
}: {
    titulo: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    valorA: string;
    valorB: string;
    diferencia: ComparacionMetrica;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#71817A]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-xl font-bold text-sidebar">
                        {valorA}
                    </p>

                    <p className="mt-1 text-xs text-[#87938D]">
                        Periodo B:{" "}
                        {valorB}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-soft text-[#587064]">
                    <Icono className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-4">
                <Variacion
                    item={
                        diferencia
                    }
                />
            </div>
        </article>
    );
}

function ResumenPeriodoCard({
    titulo,
    desde,
    hasta,
    resumen,
    simboloMoneda,
}: {
    titulo: string;
    desde: string;
    hasta: string;
    resumen: ResumenPeriodo;
    simboloMoneda: string;
}) {
    const datos = [
        {
            titulo:
                "Ventas",
            valor: moneda(
                resumen.ventasMonto,
                simboloMoneda,
            ),
            icono:
                ShoppingBag,
        },
        {
            titulo:
                "Ingresos",
            valor: moneda(
                resumen.ingresos,
                simboloMoneda,
            ),
            icono:
                TrendingUp,
        },
        {
            titulo:
                "Gastos",
            valor: moneda(
                resumen.gastos,
                simboloMoneda,
            ),
            icono:
                TrendingDown,
        },
        {
            titulo:
                "Utilidad",
            valor: moneda(
                resumen.utilidad,
                simboloMoneda,
            ),
            icono:
                WalletCards,
        },
        {
            titulo:
                "Citas",
            valor: String(
                resumen.citas,
            ),
            icono:
                CalendarDays,
        },
        {
            titulo:
                "Compras",
            valor: moneda(
                resumen.comprasMonto,
                simboloMoneda,
            ),
            icono:
                Truck,
        },
    ];

    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-sidebar tracking-tight">
                        {titulo}
                    </h2>

                    <p className="mt-1 text-sm text-[#72827A]">
                        {desde} al{" "}
                        {hasta}
                    </p>
                </div>

                <p className="text-xs font-bold text-[#71817A]">
                    {
                        resumen.clientesActivos
                    }{" "}
                    clientes activos
                </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {datos.map(
                    (
                        item,
                    ) => {
                        const Icono =
                            item.icono;

                        return (
                            <div
                                key={
                                    item.titulo
                                }
                                className="flex items-center justify-between rounded-2xl bg-[#F7FAF8] px-4 py-3"
                            >
                                <div>
                                    <p className="text-xs font-semibold text-[#7B8982]">
                                        {
                                            item.titulo
                                        }
                                    </p>

                                    <p className="mt-1 font-bold text-sidebar">
                                        {
                                            item.valor
                                        }
                                    </p>
                                </div>

                                <Icono className="h-4 w-4 text-[#789087]" />
                            </div>
                        );
                    },
                )}
            </div>
        </article>
    );
}

function Variacion({
    item,
}: {
    item: ComparacionMetrica;
}) {
    if (
        item.porcentaje ===
        null
    ) {
        return (
            <span className="inline-flex rounded-full bg-[#EEF1EF] px-2.5 py-1 text-xs font-bold text-[#66756E]">
                Sin base comparable
            </span>
        );
    }

    const positivo =
        item.porcentaje >=
        0;

    return (
        <span
            className={[
                "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
                positivo
                    ? "bg-[#E3EEE8] text-[#4F7564]"
                    : "bg-[#F5E8EB] text-[#9A6470]",
            ].join(
                " ",
            )}
        >
            {positivo
                ? "+"
                : ""}
            {item.porcentaje.toFixed(
                1,
            )}
            %
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

function calcularResumen(
    desde: string,
    hasta: string,
    ventas: VentaComparativa[],
    movimientos: MovimientoComparativo[],
    citas: CitaComparativa[],
    compras: CompraComparativa[],
): ResumenPeriodo {
    const ventasPeriodo =
        ventas.filter(
            (
                venta,
            ) => {
                const fecha =
                    venta.fecha_venta.slice(
                        0,
                        10,
                    );

                return (
                    venta.estado ===
                    "ACTIVA" &&
                    (!desde ||
                        fecha >=
                        desde) &&
                    (!hasta ||
                        fecha <=
                        hasta)
                );
            },
        );

    const movimientosPeriodo =
        movimientos.filter(
            (
                movimiento,
            ) => {
                const fecha =
                    movimiento.fecha_movimiento.slice(
                        0,
                        10,
                    );

                return (
                    movimiento.estado ===
                    "APLICADO" &&
                    (!desde ||
                        fecha >=
                        desde) &&
                    (!hasta ||
                        fecha <=
                        hasta)
                );
            },
        );

    const citasPeriodo =
        citas.filter(
            (
                cita,
            ) =>
                (!desde ||
                    cita.fecha >=
                    desde) &&
                (!hasta ||
                    cita.fecha <=
                    hasta),
        );

    const comprasPeriodo =
        compras.filter(
            (
                compra,
            ) => {
                const fecha =
                    compra.fecha_compra.slice(
                        0,
                        10,
                    );

                return (
                    compra.estado ===
                    "CONFIRMADA" &&
                    (!desde ||
                        fecha >=
                        desde) &&
                    (!hasta ||
                        fecha <=
                        hasta)
                );
            },
        );

    const ingresos =
        movimientosPeriodo
            .filter(
                (
                    movimiento,
                ) =>
                    movimiento.tipo ===
                    "INGRESO",
            )
            .reduce(
                (
                    total,
                    movimiento,
                ) =>
                    total +
                    Number(
                        movimiento.monto,
                    ),
                0,
            );

    const gastos =
        movimientosPeriodo
            .filter(
                (
                    movimiento,
                ) =>
                    movimiento.tipo ===
                    "GASTO",
            )
            .reduce(
                (
                    total,
                    movimiento,
                ) =>
                    total +
                    Number(
                        movimiento.monto,
                    ),
                0,
            );

    const clientes =
        new Set<string>();

    ventasPeriodo.forEach(
        (
            venta,
        ) => {
            if (
                venta.cliente_id
            ) {
                clientes.add(
                    venta.cliente_id,
                );
            }
        },
    );

    citasPeriodo.forEach(
        (
            cita,
        ) => {
            if (
                cita.cliente_id
            ) {
                clientes.add(
                    cita.cliente_id,
                );
            }
        },
    );

    return {
        ventasCantidad:
            ventasPeriodo.length,

        ventasMonto:
            ventasPeriodo.reduce(
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

        cobrado:
            ventasPeriodo.reduce(
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

        ingresos,
        gastos,
        utilidad:
            ingresos -
            gastos,

        citas:
            citasPeriodo.length,

        citasFinalizadas:
            citasPeriodo.filter(
                (
                    cita,
                ) =>
                    cita.estado ===
                    "FINALIZADA",
            ).length,

        comprasCantidad:
            comprasPeriodo.length,

        comprasMonto:
            comprasPeriodo.reduce(
                (
                    total,
                    compra,
                ) =>
                    total +
                    Number(
                        compra.total,
                    ),
                0,
            ),

        clientesActivos:
            clientes.size,
    };
}

function crearComparacion(
    clave: string,
    titulo: string,
    valorA: number,
    valorB: number,
    formato:
        | "moneda"
        | "numero",
): ComparacionMetrica {
    const diferencia =
        valorA -
        valorB;

    const porcentaje =
        valorB ===
            0
            ? null
            : (
                diferencia /
                Math.abs(
                    valorB,
                )
            ) *
            100;

    return {
        clave,
        titulo,
        valorA,
        valorB,
        diferencia,
        porcentaje,
        formato,
    };
}

function formatearValor(
    valor: number,
    formato:
        | "moneda"
        | "numero",
    simboloMoneda: string,
) {
    return formato ===
        "moneda"
        ? moneda(
            valor,
            simboloMoneda,
        )
        : Number(
            valor,
        ).toLocaleString(
            "es-NI",
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
