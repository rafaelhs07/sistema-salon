"use client";

import Link from "next/link";
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    BarChart3,
    Building2,
    CalendarDays,
    CircleDollarSign,
    Download,
    LoaderCircle,
    PieChart,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import {
    exportarResumenFinancieroExcel,
} from "./exportarResumenExcel";

export type SucursalResumen = {
    id: string;
    nombre: string;
    es_principal?: boolean;
};

export type MovimientoResumen = {
    id: string;
    sucursal_id: string | null;
    categoria_id: string | null;
    tipo:
    | "INGRESO"
    | "GASTO";
    origen: string;
    metodo_pago: string | null;
    concepto: string;
    monto: number;
    fecha_movimiento: string;
    estado:
    | "APLICADO"
    | "ANULADO";
    categorias_financieras: {
        nombre: string;
    } | null;
    sucursales: {
        nombre: string;
    } | null;
};

type ResumenMes = {
    clave: string;
    etiqueta: string;
    ingresos: number;
    gastos: number;
    utilidad: number;
};

type CategoriaResumen = {
    nombre: string;
    total: number;
    porcentaje: number;
};

type DiaResumen = {
    dia: number;
    ingresos: number;
    gastos: number;
    utilidad: number;
};

const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

export default function ResumenFinancieroClient({
    simboloMoneda,
    movimientos,
    sucursales,
    sucursalInicialId,
}: {
    simboloMoneda: string;
    movimientos: MovimientoResumen[];
    sucursales: SucursalResumen[];
    sucursalInicialId: string;
}) {
    const hoy =
        new Date();

    const [
        mesSeleccionado,
        setMesSeleccionado,
    ] = useState(
        hoy.getMonth(),
    );

    const [
        anioSeleccionado,
        setAnioSeleccionado,
    ] = useState(
        hoy.getFullYear(),
    );

    const [
        sucursalId,
        setSucursalId,
    ] = useState(
        sucursalInicialId ||
        "TODAS",
    );

    const [
        exportando,
        setExportando,
    ] = useState(false);

    const aniosDisponibles =
        useMemo(() => {
            const conjunto =
                new Set<number>();

            movimientos.forEach(
                (movimiento) => {
                    conjunto.add(
                        new Date(
                            movimiento.fecha_movimiento,
                        ).getFullYear(),
                    );
                },
            );

            conjunto.add(
                hoy.getFullYear(),
            );

            return Array.from(
                conjunto,
            ).sort(
                (a, b) =>
                    b - a,
            );
        }, [
            movimientos,
            hoy,
        ]);

    const movimientosSucursal =
        useMemo(
            () =>
                movimientos.filter(
                    (movimiento) =>
                        sucursalId ===
                        "TODAS" ||
                        movimiento.sucursal_id ===
                        sucursalId,
                ),
            [
                movimientos,
                sucursalId,
            ],
        );

    const movimientosMes =
        useMemo(
            () =>
                movimientosSucursal.filter(
                    (
                        movimiento,
                    ) => {
                        const fecha =
                            new Date(
                                movimiento.fecha_movimiento,
                            );

                        return (
                            fecha.getFullYear() ===
                            anioSeleccionado &&
                            fecha.getMonth() ===
                            mesSeleccionado
                        );
                    },
                ),
            [
                movimientosSucursal,
                anioSeleccionado,
                mesSeleccionado,
            ],
        );

    const fechaAnterior =
        new Date(
            anioSeleccionado,
            mesSeleccionado - 1,
            1,
        );

    const movimientosMesAnterior =
        useMemo(
            () =>
                movimientosSucursal.filter(
                    (
                        movimiento,
                    ) => {
                        const fecha =
                            new Date(
                                movimiento.fecha_movimiento,
                            );

                        return (
                            fecha.getFullYear() ===
                            fechaAnterior.getFullYear() &&
                            fecha.getMonth() ===
                            fechaAnterior.getMonth()
                        );
                    },
                ),
            [
                movimientosSucursal,
                fechaAnterior,
            ],
        );

    const resumenActual =
        useMemo(
            () =>
                calcularResumen(
                    movimientosMes,
                ),
            [
                movimientosMes,
            ],
        );

    const resumenAnterior =
        useMemo(
            () =>
                calcularResumen(
                    movimientosMesAnterior,
                ),
            [
                movimientosMesAnterior,
            ],
        );

    const margen =
        resumenActual.ingresos >
            0
            ? (
                resumenActual.utilidad /
                resumenActual.ingresos
            ) *
            100
            : 0;

    const margenAnterior =
        resumenAnterior.ingresos >
            0
            ? (
                resumenAnterior.utilidad /
                resumenAnterior.ingresos
            ) *
            100
            : 0;

    const variacionIngresos =
        porcentajeCambio(
            resumenActual.ingresos,
            resumenAnterior.ingresos,
        );

    const variacionGastos =
        porcentajeCambio(
            resumenActual.gastos,
            resumenAnterior.gastos,
        );

    const variacionUtilidad =
        porcentajeCambio(
            resumenActual.utilidad,
            resumenAnterior.utilidad,
        );

    const variacionMargen =
        margen -
        margenAnterior;

    const tendencia12Meses =
        useMemo(
            () =>
                construirTendencia12Meses(
                    movimientosSucursal,
                    anioSeleccionado,
                    mesSeleccionado,
                ),
            [
                movimientosSucursal,
                anioSeleccionado,
                mesSeleccionado,
            ],
        );

    const categoriasGasto =
        useMemo(
            () =>
                resumirCategorias(
                    movimientosMes.filter(
                        (
                            movimiento,
                        ) =>
                            movimiento.tipo ===
                            "GASTO",
                    ),
                ),
            [
                movimientosMes,
            ],
        );

    const categoriasIngreso =
        useMemo(
            () =>
                resumirCategorias(
                    movimientosMes.filter(
                        (
                            movimiento,
                        ) =>
                            movimiento.tipo ===
                            "INGRESO",
                    ),
                ),
            [
                movimientosMes,
            ],
        );

    const dias =
        useMemo(
            () =>
                construirResumenDiario(
                    movimientosMes,
                    anioSeleccionado,
                    mesSeleccionado,
                ),
            [
                movimientosMes,
                anioSeleccionado,
                mesSeleccionado,
            ],
        );

    const origenes =
        useMemo(
            () =>
                resumirOrigenes(
                    movimientosMes,
                ),
            [
                movimientosMes,
            ],
        );

    const nombreSucursal =
        sucursalId ===
            "TODAS"
            ? "Todas las sucursales"
            : sucursales.find(
                (
                    sucursal,
                ) =>
                    sucursal.id ===
                    sucursalId,
            )?.nombre ??
            "Sucursal";

    async function exportarExcel() {
        if (exportando) {
            return;
        }

        setExportando(true);

        try {
            await exportarResumenFinancieroExcel({
                simboloMoneda,
                nombreSucursal,
                mesNombre:
                    meses[
                    mesSeleccionado
                    ],
                mesNumero:
                    mesSeleccionado +
                    1,
                anio:
                    anioSeleccionado,

                ingresos:
                    resumenActual.ingresos,

                gastos:
                    resumenActual.gastos,

                utilidad:
                    resumenActual.utilidad,

                margen,

                movimientos:
                    movimientosMes,

                tendencia12Meses,

                categoriasIngreso,

                categoriasGasto,

                dias,
            });
        } catch (error) {
            console.error(
                "Error exportando resumen financiero:",
                error,
            );

            window.alert(
                "No fue posible generar el Excel. Intenta nuevamente.",
            );
        } finally {
            setExportando(false);
        }
    }

    return (
        <div className="space-y-6 pb-8">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-secondary/15 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/finanzas"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Finanzas
                    </Link>

                    <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                                    <BarChart3 className="h-7 w-7" />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-[#B9C8C1]">
                                        Análisis financiero
                                    </p>

                                    <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                        Resumen mensual y utilidad
                                    </h1>

                                    <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                        Analiza ingresos, gastos, utilidad y margen
                                        para entender cómo se está comportando el negocio.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 xl:w-[620px]">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <SelectorHero
                                    icono={CalendarDays}
                                    etiqueta="Mes"
                                >
                                    <select
                                        value={
                                            mesSeleccionado
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setMesSeleccionado(
                                                Number(
                                                    event
                                                        .target
                                                        .value,
                                                ),
                                            )
                                        }
                                        className="w-full bg-transparent text-sm font-bold text-white outline-none"
                                    >
                                        {meses.map(
                                            (
                                                mes,
                                                indice,
                                            ) => (
                                                <option
                                                    key={
                                                        mes
                                                    }
                                                    value={
                                                        indice
                                                    }
                                                    className="text-sidebar"
                                                >
                                                    {
                                                        mes
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </SelectorHero>

                                <SelectorHero
                                    icono={CalendarDays}
                                    etiqueta="Año"
                                >
                                    <select
                                        value={
                                            anioSeleccionado
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setAnioSeleccionado(
                                                Number(
                                                    event
                                                        .target
                                                        .value,
                                                ),
                                            )
                                        }
                                        className="w-full bg-transparent text-sm font-bold text-white outline-none"
                                    >
                                        {aniosDisponibles.map(
                                            (
                                                anio,
                                            ) => (
                                                <option
                                                    key={
                                                        anio
                                                    }
                                                    value={
                                                        anio
                                                    }
                                                    className="text-sidebar"
                                                >
                                                    {
                                                        anio
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </SelectorHero>

                                <SelectorHero
                                    icono={Building2}
                                    etiqueta="Sucursal"
                                >
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
                                        className="w-full bg-transparent text-sm font-bold text-white outline-none"
                                    >
                                        <option
                                            value="TODAS"
                                            className="text-sidebar"
                                        >
                                            Todas
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
                                                    className="text-sidebar"
                                                >
                                                    {
                                                        sucursal.nombre
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </SelectorHero>
                            </div>

                            <button
                                type="button"
                                onClick={exportarExcel}
                                disabled={exportando}
                                className="salon-action inline-flex w-full items-center justify-center gap-2 bg-primary-soft px-5 text-sidebar shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {exportando ? (
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Download className="h-5 w-5" />
                                )}

                                {exportando
                                    ? "Generando Excel..."
                                    : "Exportar estado financiero a Excel"}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    titulo="Ingresos"
                    valor={moneda(
                        resumenActual.ingresos,
                        simboloMoneda,
                    )}
                    icono={ArrowUpRight}
                    tono="positivo"
                    variacion={variacionIngresos}
                    comparacion="vs. mes anterior"
                />

                <KpiCard
                    titulo="Gastos"
                    valor={moneda(
                        resumenActual.gastos,
                        simboloMoneda,
                    )}
                    icono={ArrowDownRight}
                    tono="negativo"
                    variacion={variacionGastos}
                    comparacion="vs. mes anterior"
                    invertirLectura
                />

                <KpiCard
                    titulo="Utilidad"
                    valor={moneda(
                        resumenActual.utilidad,
                        simboloMoneda,
                    )}
                    icono={
                        resumenActual.utilidad >=
                            0
                            ? TrendingUp
                            : TrendingDown
                    }
                    tono={
                        resumenActual.utilidad >=
                            0
                            ? "positivo"
                            : "negativo"
                    }
                    variacion={variacionUtilidad}
                    comparacion="vs. mes anterior"
                />

                <KpiCard
                    titulo="Margen"
                    valor={`${margen.toFixed(
                        1,
                    )}%`}
                    icono={PieChart}
                    tono={
                        margen >= 0
                            ? "positivo"
                            : "negativo"
                    }
                    variacion={variacionMargen}
                    comparacion="puntos vs. mes anterior"
                    esPuntos
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-sidebar tracking-tight">
                                Evolución de 12 meses
                            </h2>

                            <p className="mt-1 text-sm text-[#72827A]">
                                Ingresos, gastos y utilidad hasta{" "}
                                {
                                    meses[
                                    mesSeleccionado
                                    ]
                                }{" "}
                                {anioSeleccionado}.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs font-semibold text-text-secondary">
                            <Leyenda
                                clase="bg-[#6F8F83]"
                                texto="Ingresos"
                            />
                            <Leyenda
                                clase="bg-[#C79AA1]"
                                texto="Gastos"
                            />
                        </div>
                    </div>

                    <div className="mt-7">
                        <Grafico12Meses
                            datos={
                                tendencia12Meses
                            }
                            simboloMoneda={
                                simboloMoneda
                            }
                        />
                    </div>
                </article>

                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-sidebar tracking-tight">
                                Resultado del mes
                            </h2>

                            <p className="mt-1 text-sm text-[#72827A]">
                                {
                                    meses[
                                    mesSeleccionado
                                    ]
                                }{" "}
                                {anioSeleccionado}
                            </p>
                        </div>

                        <div
                            className={[
                                "flex h-12 w-12 items-center justify-center rounded-2xl",
                                resumenActual.utilidad >=
                                    0
                                    ? "bg-[#E5F0EB] text-[#4E7563]"
                                    : "bg-[#F5E8EB] text-[#9A6470]",
                            ].join(
                                " ",
                            )}
                        >
                            <Wallet className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-7 rounded-[24px] bg-sidebar p-5 text-white">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B9C8C1]">
                            Utilidad neta registrada
                        </p>

                        <p className="mt-3 text-3xl font-bold">
                            {moneda(
                                resumenActual.utilidad,
                                simboloMoneda,
                            )}
                        </p>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-primary-soft"
                                style={{
                                    width: `${Math.min(
                                        Math.max(
                                            margen,
                                            0,
                                        ),
                                        100,
                                    )}%`,
                                }}
                            />
                        </div>

                        <p className="mt-2 text-xs text-[#C9D5CF]">
                            Margen del{" "}
                            {margen.toFixed(
                                1,
                            )}
                            % sobre ingresos.
                        </p>
                    </div>

                    <div className="mt-5 space-y-3">
                        <FilaResumen
                            etiqueta="Ingresos"
                            valor={moneda(
                                resumenActual.ingresos,
                                simboloMoneda,
                            )}
                        />

                        <FilaResumen
                            etiqueta="Gastos"
                            valor={moneda(
                                resumenActual.gastos,
                                simboloMoneda,
                            )}
                        />

                        <FilaResumen
                            etiqueta="Movimientos"
                            valor={String(
                                movimientosMes.length,
                            )}
                        />

                        <FilaResumen
                            etiqueta="Sucursal"
                            valor={
                                nombreSucursal
                            }
                        />
                    </div>
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div>
                        <h2 className="text-xl font-bold text-sidebar tracking-tight">
                            Flujo diario del mes
                        </h2>

                        <p className="mt-1 text-sm text-[#72827A]">
                            Observa en qué días se concentra el movimiento.
                        </p>
                    </div>

                    <div className="mt-7">
                        <GraficoDiario
                            datos={dias}
                        />
                    </div>
                </article>

                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-sidebar tracking-tight">
                        Principales gastos
                    </h2>

                    <p className="mt-1 text-sm text-[#72827A]">
                        Categorías que más consumieron dinero este mes.
                    </p>

                    <div className="mt-6">
                        <RankingCategorias
                            datos={
                                categoriasGasto
                            }
                            simboloMoneda={
                                simboloMoneda
                            }
                            tipo="GASTO"
                        />
                    </div>
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-sidebar tracking-tight">
                        Fuentes de ingreso
                    </h2>

                    <p className="mt-1 text-sm text-[#72827A]">
                        Categorías que generaron entradas durante el mes.
                    </p>

                    <div className="mt-6">
                        <RankingCategorias
                            datos={
                                categoriasIngreso
                            }
                            simboloMoneda={
                                simboloMoneda
                            }
                            tipo="INGRESO"
                        />
                    </div>
                </article>

                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-sidebar tracking-tight">
                        Origen de los movimientos
                    </h2>

                    <p className="mt-1 text-sm text-[#72827A]">
                        De dónde provienen los registros financieros del mes.
                    </p>

                    <div className="mt-6 space-y-3">
                        {origenes.length ===
                            0 ? (
                            <EstadoVacio />
                        ) : (
                            origenes.map(
                                (
                                    origen,
                                ) => (
                                    <div
                                        key={
                                            origen.nombre
                                        }
                                        className="flex items-center justify-between gap-4 rounded-2xl border border-[#E6ECE8] bg-[#FBFCFA] px-4 py-3"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-[#33413B]">
                                                {
                                                    origen.nombre
                                                }
                                            </p>

                                            <p className="mt-0.5 text-xs text-[#7A8982]">
                                                {
                                                    origen.cantidad
                                                }{" "}
                                                movimiento
                                                {origen.cantidad ===
                                                    1
                                                    ? ""
                                                    : "s"}
                                            </p>
                                        </div>

                                        <p className="text-sm font-bold text-sidebar">
                                            {moneda(
                                                origen.total,
                                                simboloMoneda,
                                            )}
                                        </p>
                                    </div>
                                ),
                            )
                        )}
                    </div>
                </article>
            </section>
        </div>
    );
}

function KpiCard({
    titulo,
    valor,
    icono: Icono,
    tono,
    variacion,
    comparacion,
    invertirLectura = false,
    esPuntos = false,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    tono:
    | "positivo"
    | "negativo";
    variacion: number | null;
    comparacion: string;
    invertirLectura?: boolean;
    esPuntos?: boolean;
}) {
    const variacionPositiva =
        variacion !== null &&
        variacion >= 0;

    const favorable =
        invertirLectura
            ? !variacionPositiva
            : variacionPositiva;

    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-[#71817A]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-sidebar">
                        {valor}
                    </p>
                </div>

                <div
                    className={[
                        "flex h-12 w-12 items-center justify-center rounded-2xl",
                        tono ===
                            "positivo"
                            ? "bg-[#E5F0EB] text-[#4F7564]"
                            : "bg-[#F5E8EB] text-[#9C6471]",
                    ].join(
                        " ",
                    )}
                >
                    <Icono className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-5 border-t border-[#EDF1EE] pt-4">
                {variacion ===
                    null ? (
                    <p className="text-xs font-medium text-[#87938D]">
                        Sin base suficiente para comparar
                    </p>
                ) : (
                    <div className="flex items-center gap-2">
                        <span
                            className={[
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                                favorable
                                    ? "bg-[#E5F0EB] text-[#4F7564]"
                                    : "bg-[#F5E8EB] text-[#9C6471]",
                            ].join(
                                " ",
                            )}
                        >
                            {variacion >=
                                0 ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                            ) : (
                                <TrendingDown className="h-3.5 w-3.5" />
                            )}

                            {variacion >
                                0
                                ? "+"
                                : ""}
                            {variacion.toFixed(
                                1,
                            )}
                            {esPuntos
                                ? " pts"
                                : "%"}
                        </span>

                        <span className="text-xs text-[#87938D]">
                            {
                                comparacion
                            }
                        </span>
                    </div>
                )}
            </div>
        </article>
    );
}

function SelectorHero({
    icono: Icono,
    etiqueta,
    children,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    etiqueta: string;
    children: React.ReactNode;
}) {
    return (
        <label className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur-sm">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#B9C8C1]">
                <Icono className="h-3.5 w-3.5" />
                {etiqueta}
            </span>

            {children}
        </label>
    );
}

function Grafico12Meses({
    datos,
    simboloMoneda,
}: {
    datos: ResumenMes[];
    simboloMoneda: string;
}) {
    const maximo =
        Math.max(
            ...datos.flatMap(
                (item) => [
                    item.ingresos,
                    item.gastos,
                ],
            ),
            1,
        );

    return (
        <div className="overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-12 gap-2">
                {datos.map(
                    (item) => {
                        const alturaIngreso =
                            Math.max(
                                (
                                    item.ingresos /
                                    maximo
                                ) *
                                180,
                                item.ingresos >
                                    0
                                    ? 6
                                    : 2,
                            );

                        const alturaGasto =
                            Math.max(
                                (
                                    item.gastos /
                                    maximo
                                ) *
                                180,
                                item.gastos >
                                    0
                                    ? 6
                                    : 2,
                            );

                        return (
                            <div
                                key={
                                    item.clave
                                }
                                className="min-w-0"
                            >
                                <div className="flex h-[220px] items-end justify-center gap-1.5 rounded-2xl bg-[#F7FAF8] px-1.5 py-3">
                                    <div
                                        title={`Ingresos: ${moneda(
                                            item.ingresos,
                                            simboloMoneda,
                                        )}`}
                                        className="w-3 rounded-t-lg bg-primary"
                                        style={{
                                            height: `${alturaIngreso}px`,
                                        }}
                                    />

                                    <div
                                        title={`Gastos: ${moneda(
                                            item.gastos,
                                            simboloMoneda,
                                        )}`}
                                        className="w-3 rounded-t-lg bg-secondary"
                                        style={{
                                            height: `${alturaGasto}px`,
                                        }}
                                    />
                                </div>

                                <p className="mt-2 truncate text-center text-xs font-bold uppercase text-[#6F7E77]">
                                    {
                                        item.etiqueta
                                    }
                                </p>

                                <p
                                    className={[
                                        "mt-1 truncate text-center text-[9px] font-semibold",
                                        item.utilidad >=
                                            0
                                            ? "text-[#4F7564]"
                                            : "text-[#9C6471]",
                                    ].join(
                                        " ",
                                    )}
                                >
                                    {item.utilidad >=
                                        0
                                        ? "+"
                                        : ""}
                                    {numeroCorto(
                                        item.utilidad,
                                    )}
                                </p>
                            </div>
                        );
                    },
                )}
            </div>
        </div>
    );
}

function GraficoDiario({
    datos,
}: {
    datos: DiaResumen[];
}) {
    const maximo =
        Math.max(
            ...datos.map(
                (item) =>
                    Math.max(
                        item.ingresos,
                        item.gastos,
                    ),
            ),
            1,
        );

    return (
        <div className="overflow-x-auto">
            <div
                className="grid min-w-[900px] gap-1.5"
                style={{
                    gridTemplateColumns: `repeat(${datos.length}, minmax(20px, 1fr))`,
                }}
            >
                {datos.map(
                    (item) => {
                        const intensidadIngreso =
                            Math.max(
                                (
                                    item.ingresos /
                                    maximo
                                ) *
                                120,
                                item.ingresos >
                                    0
                                    ? 4
                                    : 1,
                            );

                        const intensidadGasto =
                            Math.max(
                                (
                                    item.gastos /
                                    maximo
                                ) *
                                120,
                                item.gastos >
                                    0
                                    ? 4
                                    : 1,
                            );

                        return (
                            <div
                                key={
                                    item.dia
                                }
                                className="flex flex-col items-center"
                            >
                                <div className="flex h-[145px] items-end gap-[2px]">
                                    <div
                                        title={`Día ${item.dia} · Ingresos ${item.ingresos.toFixed(
                                            2,
                                        )}`}
                                        className="w-2 rounded-t bg-primary"
                                        style={{
                                            height: `${intensidadIngreso}px`,
                                        }}
                                    />

                                    <div
                                        title={`Día ${item.dia} · Gastos ${item.gastos.toFixed(
                                            2,
                                        )}`}
                                        className="w-2 rounded-t bg-secondary"
                                        style={{
                                            height: `${intensidadGasto}px`,
                                        }}
                                    />
                                </div>

                                <span className="mt-2 text-xs font-semibold text-[#7B8982]">
                                    {
                                        item.dia
                                    }
                                </span>
                            </div>
                        );
                    },
                )}
            </div>
        </div>
    );
}

function RankingCategorias({
    datos,
    simboloMoneda,
    tipo,
}: {
    datos: CategoriaResumen[];
    simboloMoneda: string;
    tipo:
    | "INGRESO"
    | "GASTO";
}) {
    if (
        datos.length ===
        0
    ) {
        return <EstadoVacio />;
    }

    return (
        <div className="space-y-4">
            {datos
                .slice(
                    0,
                    6,
                )
                .map(
                    (
                        categoria,
                    ) => (
                        <div
                            key={
                                categoria.nombre
                            }
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-[#33413B]">
                                        {
                                            categoria.nombre
                                        }
                                    </p>

                                    <p className="mt-0.5 text-xs text-[#7D8A84]">
                                        {categoria.porcentaje.toFixed(
                                            1,
                                        )}
                                        % del total
                                    </p>
                                </div>

                                <p className="shrink-0 text-sm font-bold text-sidebar">
                                    {moneda(
                                        categoria.total,
                                        simboloMoneda,
                                    )}
                                </p>
                            </div>

                            <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-surface-soft">
                                <div
                                    className={[
                                        "h-full rounded-full",
                                        tipo ===
                                            "INGRESO"
                                            ? "bg-primary"
                                            : "bg-secondary",
                                    ].join(
                                        " ",
                                    )}
                                    style={{
                                        width: `${Math.max(
                                            categoria.porcentaje,
                                            2,
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ),
                )}
        </div>
    );
}

function FilaResumen({
    etiqueta,
    valor,
}: {
    etiqueta: string;
    valor: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F7FAF8] px-4 py-3">
            <span className="text-sm font-medium text-[#71817A]">
                {etiqueta}
            </span>

            <span className="text-right text-sm font-bold text-sidebar">
                {valor}
            </span>
        </div>
    );
}

function Leyenda({
    clase,
    texto,
}: {
    clase: string;
    texto: string;
}) {
    return (
        <span className="inline-flex items-center gap-2">
            <span
                className={`h-2.5 w-2.5 rounded-full ${clase}`}
            />
            {texto}
        </span>
    );
}

function EstadoVacio() {
    return (
        <div className="rounded-2xl bg-[#F7FAF8] px-4 py-8 text-center">
            <CircleDollarSign className="mx-auto h-7 w-7 text-[#98A49E]" />

            <p className="mt-3 text-sm font-semibold text-[#66756E]">
                No hay movimientos en este periodo.
            </p>
        </div>
    );
}

function calcularResumen(
    datos: MovimientoResumen[],
) {
    const ingresos =
        datos
            .filter(
                (item) =>
                    item.tipo ===
                    "INGRESO",
            )
            .reduce(
                (
                    total,
                    item,
                ) =>
                    total +
                    Number(
                        item.monto,
                    ),
                0,
            );

    const gastos =
        datos
            .filter(
                (item) =>
                    item.tipo ===
                    "GASTO",
            )
            .reduce(
                (
                    total,
                    item,
                ) =>
                    total +
                    Number(
                        item.monto,
                    ),
                0,
            );

    return {
        ingresos,
        gastos,
        utilidad:
            ingresos -
            gastos,
    };
}

function porcentajeCambio(
    actual: number,
    anterior: number,
) {
    if (
        anterior ===
        0
    ) {
        if (
            actual ===
            0
        ) {
            return 0;
        }

        return null;
    }

    return (
        (
            actual -
            anterior
        ) /
        Math.abs(
            anterior,
        )
    ) *
        100;
}

function construirTendencia12Meses(
    movimientos: MovimientoResumen[],
    anio: number,
    mes: number,
) {
    const resultado: ResumenMes[] =
        [];

    for (
        let i = 11;
        i >= 0;
        i--
    ) {
        const fecha =
            new Date(
                anio,
                mes - i,
                1,
            );

        const anioMes =
            fecha.getFullYear();

        const mesMes =
            fecha.getMonth();

        const datosMes =
            movimientos.filter(
                (
                    movimiento,
                ) => {
                    const fechaMovimiento =
                        new Date(
                            movimiento.fecha_movimiento,
                        );

                    return (
                        fechaMovimiento.getFullYear() ===
                        anioMes &&
                        fechaMovimiento.getMonth() ===
                        mesMes
                    );
                },
            );

        const resumen =
            calcularResumen(
                datosMes,
            );

        resultado.push({
            clave: `${anioMes}-${String(
                mesMes + 1,
            ).padStart(
                2,
                "0",
            )}`,

            etiqueta:
                new Intl.DateTimeFormat(
                    "es-NI",
                    {
                        month: "short",
                    },
                ).format(
                    fecha,
                ),

            ...resumen,
        });
    }

    return resultado;
}

function resumirCategorias(
    movimientos: MovimientoResumen[],
) {
    const mapa =
        new Map<
            string,
            number
        >();

    movimientos.forEach(
        (movimiento) => {
            const nombre =
                movimiento
                    .categorias_financieras
                    ?.nombre ??
                "Sin categoría";

            mapa.set(
                nombre,
                (
                    mapa.get(
                        nombre,
                    ) ??
                    0
                ) +
                Number(
                    movimiento.monto,
                ),
            );
        },
    );

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

function construirResumenDiario(
    movimientos: MovimientoResumen[],
    anio: number,
    mes: number,
) {
    const cantidadDias =
        new Date(
            anio,
            mes + 1,
            0,
        ).getDate();

    const resultado: DiaResumen[] =
        Array.from(
            {
                length:
                    cantidadDias,
            },
            (
                _,
                indice,
            ) => ({
                dia:
                    indice +
                    1,
                ingresos: 0,
                gastos: 0,
                utilidad: 0,
            }),
        );

    movimientos.forEach(
        (movimiento) => {
            const fecha =
                new Date(
                    movimiento.fecha_movimiento,
                );

            const indice =
                fecha.getDate() -
                1;

            if (
                indice <
                0 ||
                indice >=
                resultado.length
            ) {
                return;
            }

            if (
                movimiento.tipo ===
                "INGRESO"
            ) {
                resultado[
                    indice
                ].ingresos +=
                    Number(
                        movimiento.monto,
                    );
            } else {
                resultado[
                    indice
                ].gastos +=
                    Number(
                        movimiento.monto,
                    );
            }

            resultado[
                indice
            ].utilidad =
                resultado[
                    indice
                ].ingresos -
                resultado[
                    indice
                ].gastos;
        },
    );

    return resultado;
}

function resumirOrigenes(
    movimientos: MovimientoResumen[],
) {
    const mapa =
        new Map<
            string,
            {
                cantidad: number;
                total: number;
            }
        >();

    movimientos.forEach(
        (movimiento) => {
            const nombre =
                formatearOrigen(
                    movimiento.origen,
                );

            const actual =
                mapa.get(
                    nombre,
                ) ?? {
                    cantidad: 0,
                    total: 0,
                };

            actual.cantidad +=
                1;

            actual.total +=
                Number(
                    movimiento.monto,
                );

            mapa.set(
                nombre,
                actual,
            );
        },
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
                ...valor,
            }),
        )
        .sort(
            (a, b) =>
                b.total -
                a.total,
        );
}

function formatearOrigen(
    valor: string,
) {
    return (
        {
            VENTA: "Ventas",
            PAGO_PROVEEDOR:
                "Pagos a proveedores",
            COMISION_POS:
                "Comisiones POS",
            MOVIMIENTO_CAJA:
                "Movimientos de caja",
            MANUAL:
                "Registros manuales",
            AJUSTE:
                "Ajustes",
            OTRO:
                "Otros",
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

function numeroCorto(
    valor: number,
) {
    const absoluto =
        Math.abs(
            valor,
        );

    if (
        absoluto >=
        1_000_000
    ) {
        return `${(
            valor /
            1_000_000
        ).toFixed(
            1,
        )}M`;
    }

    if (
        absoluto >=
        1_000
    ) {
        return `${(
            valor /
            1_000
        ).toFixed(
            1,
        )}K`;
    }

    return valor.toFixed(
        0,
    );
}