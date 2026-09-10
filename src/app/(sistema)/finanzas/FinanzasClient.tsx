"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Building2,
    CalendarDays,
    CalendarRange,
    CreditCard,
    Filter,
    History,
    Landmark,
    LayoutDashboard,
    PlusCircle,
    ReceiptText,
    Tags,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";

export type SucursalFinanciera = {
    id: string;
    nombre: string;
    es_principal?: boolean;
    estado?: string;
};

export type MovimientoFinancieroListado = {
    id: string;
    sucursal_id: string | null;
    categoria_id: string | null;
    tipo: "INGRESO" | "GASTO";
    origen:
    | "VENTA"
    | "PAGO_PROVEEDOR"
    | "COMISION_POS"
    | "MOVIMIENTO_CAJA"
    | "MANUAL"
    | "AJUSTE"
    | "OTRO";
    metodo_pago:
    | "EFECTIVO"
    | "TARJETA"
    | "TRANSFERENCIA"
    | "DEPOSITO"
    | "CHEQUE"
    | "CREDITO"
    | "OTRO"
    | null;
    concepto: string;
    descripcion: string | null;
    monto: number;
    referencia: string | null;
    fecha_movimiento: string;
    estado: "APLICADO" | "ANULADO";
    categorias_financieras: {
        nombre: string;
    } | null;
    sucursales: {
        nombre: string;
    } | null;
};

type Props = {
    simboloMoneda: string;
    sucursales: SucursalFinanciera[];
    sucursalInicialId: string;
    movimientos: MovimientoFinancieroListado[];
};

type PeriodoFiltro =
    | "MES_ACTUAL"
    | "ULTIMOS_30"
    | "ULTIMOS_90"
    | "ULTIMOS_180";

type ResumenCategoria = {
    nombre: string;
    total: number;
};

type ResumenMes = {
    clave: string;
    etiqueta: string;
    ingresos: number;
    gastos: number;
};

const etiquetasPeriodo: Record<PeriodoFiltro, string> = {
    MES_ACTUAL: "Mes actual",
    ULTIMOS_30: "Últimos 30 días",
    ULTIMOS_90: "Últimos 90 días",
    ULTIMOS_180: "Últimos 6 meses",
};

export default function FinanzasClient({
    simboloMoneda,
    sucursales,
    sucursalInicialId,
    movimientos,
}: Props) {
    const [sucursalId, setSucursalId] = useState(
        sucursalInicialId || "TODAS",
    );
    const [periodo, setPeriodo] =
        useState<PeriodoFiltro>("MES_ACTUAL");

    const movimientosFiltrados = useMemo(() => {
        const desde = obtenerFechaDesdePeriodo(periodo);

        return movimientos.filter((movimiento) => {
            const fechaMovimiento = new Date(
                movimiento.fecha_movimiento,
            );

            const cumplePeriodo =
                fechaMovimiento >= desde;

            const cumpleSucursal =
                sucursalId === "TODAS"
                    ? true
                    : movimiento.sucursal_id ===
                    sucursalId;

            return cumplePeriodo && cumpleSucursal;
        });
    }, [movimientos, periodo, sucursalId]);

    const resumen = useMemo(() => {
        let ingresos = 0;
        let gastos = 0;

        for (const movimiento of movimientosFiltrados) {
            if (movimiento.tipo === "INGRESO") {
                ingresos += Number(movimiento.monto ?? 0);
            } else {
                gastos += Number(movimiento.monto ?? 0);
            }
        }

        return {
            ingresos,
            gastos,
            balance: ingresos - gastos,
            movimientos: movimientosFiltrados.length,
        };
    }, [movimientosFiltrados]);

    const categoriasIngreso = useMemo(
        () =>
            resumirPorCategoria(
                movimientosFiltrados.filter(
                    (movimiento) =>
                        movimiento.tipo === "INGRESO",
                ),
            ),
        [movimientosFiltrados],
    );

    const categoriasGasto = useMemo(
        () =>
            resumirPorCategoria(
                movimientosFiltrados.filter(
                    (movimiento) =>
                        movimiento.tipo === "GASTO",
                ),
            ),
        [movimientosFiltrados],
    );

    const graficoMensual = useMemo(
        () =>
            construirResumenMensual(
                movimientos,
                sucursalId,
            ),
        [movimientos, sucursalId],
    );

    const recientes = useMemo(
        () => movimientosFiltrados.slice(0, 10),
        [movimientosFiltrados],
    );

    const mejorCategoriaIngreso =
        categoriasIngreso[0]?.nombre ?? "Sin datos";

    const mejorCategoriaGasto =
        categoriasGasto[0]?.nombre ?? "Sin datos";

    return (
        <div className="space-y-6 pb-8">
            <section className="salon-hero relative overflow-hidden border border-border bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-secondary/15 blur-3xl" />

                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-primary-soft">
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            Panel financiero
                        </div>

                        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                            Ingresos y gastos del salón
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CFD9D4] sm:text-base">
                            Una vista clara para entender cómo va el negocio,
                            cuánto está ingresando, cuánto está saliendo
                            y cuál es el balance real por periodo y por sucursal.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3 text-xs text-[#D7E1DC]">
                            <ChipInfo
                                icono={CalendarDays}
                                texto={etiquetasPeriodo[periodo]}
                            />
                            <ChipInfo
                                icono={Building2}
                                texto={
                                    sucursalId === "TODAS"
                                        ? "Todas las sucursales"
                                        : sucursales.find(
                                            (item) =>
                                                item.id ===
                                                sucursalId,
                                        )?.nombre ??
                                        "Sucursal"
                                }
                            />
                            <ChipInfo
                                icono={BarChart3}
                                texto={`${resumen.movimientos} movimientos analizados`}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 xl:w-[380px]">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Link
                                href="/finanzas/ingresos/nuevo"
                                className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-5 text-sidebar transition hover:bg-white"
                            >
                                <PlusCircle className="h-5 w-5" />
                                Registrar ingreso
                            </Link>

                            <Link
                                href="/finanzas/gastos/nuevo"
                                className="salon-action inline-flex items-center justify-center gap-2 border border-white/15 bg-white/10 px-5 text-white transition hover:bg-white/15"
                            >
                                <ArrowDownRight className="h-5 w-5" />
                                Registrar gasto
                            </Link>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <Link
                                href="/finanzas/resumen"
                                className="salon-action inline-flex items-center justify-center gap-2 bg-white px-4 text-sidebar transition hover:bg-surface-soft"
                            >
                                <CalendarRange className="h-4 w-4" />
                                Resumen
                            </Link>

                            <Link
                                href="/finanzas/historial"
                                className="salon-action inline-flex items-center justify-center gap-2 border border-white/10 bg-white/[0.07] px-4 font-semibold text-[#E5ECE8] transition hover:bg-white/10"
                            >
                                <History className="h-4 w-4" />
                                Historial
                            </Link>

                            <Link
                                href="/finanzas/categorias"
                                className="salon-action inline-flex items-center justify-center gap-2 border border-white/10 bg-white/[0.07] px-4 font-semibold text-[#E5ECE8] transition hover:bg-white/10"
                            >
                                <Tags className="h-4 w-4" />
                                Categorías
                            </Link>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <ResumenHero
                                titulo="Mayor ingreso"
                                valor={mejorCategoriaIngreso}
                                icono={TrendingUp}
                            />
                            <ResumenHero
                                titulo="Mayor gasto"
                                valor={mejorCategoriaGasto}
                                icono={TrendingDown}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="salon-panel border border-border bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-sidebar tracking-tight">
                            Filtros de visualización
                        </h2>
                        <p className="mt-1 text-sm text-[#6B7A73]">
                            Cambia el periodo o filtra por sucursal para revisar los datos.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <label className="min-w-[220px]">
                            <span className="mb-1.5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A8D84]">
                                <Filter className="h-3.5 w-3.5" />
                                Periodo
                            </span>

                            <select
                                value={periodo}
                                onChange={(event) =>
                                    setPeriodo(
                                        event.target
                                            .value as PeriodoFiltro,
                                    )
                                }
                                className="salon-control w-full border border-border bg-[#F7FAF8] px-4 font-medium text-[#33413B] outline-none transition focus:border-primary focus:bg-white"
                            >
                                <option value="MES_ACTUAL">
                                    Mes actual
                                </option>
                                <option value="ULTIMOS_30">
                                    Últimos 30 días
                                </option>
                                <option value="ULTIMOS_90">
                                    Últimos 90 días
                                </option>
                                <option value="ULTIMOS_180">
                                    Últimos 6 meses
                                </option>
                            </select>
                        </label>

                        <label className="min-w-[240px]">
                            <span className="mb-1.5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7A8D84]">
                                <Building2 className="h-3.5 w-3.5" />
                                Sucursal
                            </span>

                            <select
                                value={sucursalId}
                                onChange={(event) =>
                                    setSucursalId(
                                        event.target.value,
                                    )
                                }
                                className="salon-control w-full border border-border bg-[#F7FAF8] px-4 font-medium text-[#33413B] outline-none transition focus:border-primary focus:bg-white"
                            >
                                <option value="TODAS">
                                    Todas las sucursales
                                </option>

                                {sucursales.map((sucursal) => (
                                    <option
                                        key={sucursal.id}
                                        value={sucursal.id}
                                    >
                                        {sucursal.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TarjetaIndicador
                    titulo="Ingresos"
                    valor={formatearMoneda(
                        resumen.ingresos,
                        simboloMoneda,
                    )}
                    subtitulo="Entradas registradas en el periodo"
                    icono={ArrowUpRight}
                    tono="ingreso"
                />

                <TarjetaIndicador
                    titulo="Gastos"
                    valor={formatearMoneda(
                        resumen.gastos,
                        simboloMoneda,
                    )}
                    subtitulo="Salidas registradas en el periodo"
                    icono={ArrowDownRight}
                    tono="gasto"
                />

                <TarjetaIndicador
                    titulo="Balance"
                    valor={formatearMoneda(
                        resumen.balance,
                        simboloMoneda,
                    )}
                    subtitulo={
                        resumen.balance >= 0
                            ? "Resultado favorable"
                            : "Resultado negativo"
                    }
                    icono={Wallet}
                    tono={
                        resumen.balance >= 0
                            ? "ingreso"
                            : "gasto"
                    }
                />

                <TarjetaIndicador
                    titulo="Movimientos"
                    valor={String(resumen.movimientos)}
                    subtitulo="Registros aplicados"
                    icono={ReceiptText}
                    tono="neutral"
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <div className="salon-panel border border-border bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-sidebar tracking-tight">
                                Tendencia de los últimos 6 meses
                            </h2>
                            <p className="mt-1 text-sm text-[#72827A]">
                                Compara ingresos y gastos mes a mes.
                            </p>
                        </div>

                        <div className="hidden items-center gap-3 text-xs font-semibold text-[#6B7A73] sm:flex">
                            <Leyenda color="bg-[#6F8F83]" texto="Ingresos" />
                            <Leyenda color="bg-[#C79AA1]" texto="Gastos" />
                        </div>
                    </div>

                    <div className="mt-6">
                        <GraficoMensual
                            data={graficoMensual}
                            simboloMoneda={simboloMoneda}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <PanelCategorias
                        titulo="Top categorías de ingreso"
                        categorias={categoriasIngreso}
                        simboloMoneda={simboloMoneda}
                        tono="ingreso"
                    />

                    <PanelCategorias
                        titulo="Top categorías de gasto"
                        categorias={categoriasGasto}
                        simboloMoneda={simboloMoneda}
                        tono="gasto"
                    />
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                <div className="salon-panel border border-border bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-sidebar tracking-tight">
                                Movimientos recientes
                            </h2>
                            <p className="mt-1 text-sm text-[#72827A]">
                                Últimos registros aplicados según el filtro seleccionado.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-[#F3F7F5] px-3 py-2 text-xs font-medium text-[#5D6C65]">
                            {recientes.length} visibles
                        </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-[#E7EEEA]">
                        <div className="overflow-x-auto">
                            <table className="salon-table min-w-full divide-y divide-[#E7EEEA]">
                                <thead className="bg-[#F7FAF8]">
                                    <tr>
                                        <EncabezadoTabla>
                                            Fecha
                                        </EncabezadoTabla>
                                        <EncabezadoTabla>
                                            Concepto
                                        </EncabezadoTabla>
                                        <EncabezadoTabla>
                                            Categoría
                                        </EncabezadoTabla>
                                        <EncabezadoTabla>
                                            Sucursal
                                        </EncabezadoTabla>
                                        <EncabezadoTabla alineacion="right">
                                            Monto
                                        </EncabezadoTabla>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#EDF3EF] bg-white">
                                    {recientes.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-5 py-10 text-center text-sm text-[#7A8A82]"
                                            >
                                                No hay movimientos financieros en este filtro.
                                            </td>
                                        </tr>
                                    ) : (
                                        recientes.map(
                                            (movimiento) => (
                                                <tr
                                                    key={
                                                        movimiento.id
                                                    }
                                                    className="hover:bg-[#FAFCFB]"
                                                >
                                                    <CeldaTabla>
                                                        {formatearFecha(
                                                            movimiento.fecha_movimiento,
                                                        )}
                                                    </CeldaTabla>

                                                    <CeldaTabla>
                                                        <div>
                                                            <p className="font-semibold text-[#33413B]">
                                                                {
                                                                    movimiento.concepto
                                                                }
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-[#74837C]">
                                                                {formatearOrigen(
                                                                    movimiento.origen,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </CeldaTabla>

                                                    <CeldaTabla>
                                                        <span className="inline-flex rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-[#55675F]">
                                                            {movimiento
                                                                .categorias_financieras
                                                                ?.nombre ??
                                                                "Sin categoría"}
                                                        </span>
                                                    </CeldaTabla>

                                                    <CeldaTabla>
                                                        {movimiento
                                                            .sucursales
                                                            ?.nombre ??
                                                            "Sin sucursal"}
                                                    </CeldaTabla>

                                                    <CeldaTabla alineacion="right">
                                                        <span
                                                            className={
                                                                movimiento.tipo ===
                                                                    "INGRESO"
                                                                    ? "font-bold text-[#3C6E5A]"
                                                                    : "font-bold text-[#A26673]"
                                                            }
                                                        >
                                                            {movimiento.tipo ===
                                                                "INGRESO"
                                                                ? "+"
                                                                : "-"}{" "}
                                                            {formatearMoneda(
                                                                movimiento.monto,
                                                                simboloMoneda,
                                                            )}
                                                        </span>
                                                    </CeldaTabla>
                                                </tr>
                                            ),
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <PanelAcceso
                        icono={Landmark}
                        titulo="Vista lista para crecer"
                        descripcion="Esta base financiera ya quedó preparada para conectar ingresos manuales, gastos manuales, ventas, POS y pagos a proveedores."
                    />

                    <PanelAcceso
                        icono={CreditCard}
                        titulo="Comisiones y medios de pago"
                        descripcion="Más adelante verás con claridad qué parte de los ingresos entró en efectivo, tarjeta o transferencia y cuánto te cuestan las comisiones POS."
                    />

                    <PanelAcceso
                        icono={BarChart3}
                        titulo="Reportes más entendibles"
                        descripcion="Este panel servirá como resumen rápido antes de entrar al historial, categorías, comparativos y utilidades mensuales."
                    />
                </div>
            </section>
        </div>
    );
}

function TarjetaIndicador({
    titulo,
    valor,
    subtitulo,
    icono: Icono,
    tono,
}: {
    titulo: string;
    valor: string;
    subtitulo: string;
    icono: React.ComponentType<{ className?: string }>;
    tono: "ingreso" | "gasto" | "neutral";
}) {
    const estilos =
        tono === "ingreso"
            ? {
                icono: "bg-[#E6F1EC] text-[#3E705C]",
                borde: "border-[#DCEDE4]",
            }
            : tono === "gasto"
                ? {
                    icono: "bg-[#F5E9EB] text-[#A46674]",
                    borde: "border-[#F0DADF]",
                }
                : {
                    icono: "bg-[#EEF4F0] text-[#52655D]",
                    borde: "border-[#DCE5E0]",
                };

    return (
        <article
            className={`rounded-[26px] border ${estilos.borde} bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-[#708078]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-sidebar">
                        {valor}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#7A8A82]">
                        {subtitulo}
                    </p>
                </div>

                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${estilos.icono}`}
                >
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function PanelCategorias({
    titulo,
    categorias,
    simboloMoneda,
    tono,
}: {
    titulo: string;
    categorias: ResumenCategoria[];
    simboloMoneda: string;
    tono: "ingreso" | "gasto";
}) {
    const maximo = Math.max(
        ...categorias.map((item) => item.total),
        1,
    );

    return (
        <article className="salon-panel border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-sidebar tracking-tight">
                {titulo}
            </h2>

            <div className="mt-5 space-y-4">
                {categorias.length === 0 ? (
                    <p className="rounded-2xl bg-[#F7FAF8] px-4 py-5 text-sm text-[#708078]">
                        No hay datos suficientes para mostrar categorías.
                    </p>
                ) : (
                    categorias.map((categoria) => {
                        const porcentaje =
                            (categoria.total / maximo) * 100;

                        return (
                            <div
                                key={categoria.nombre}
                                className="space-y-2"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-[#33413B]">
                                        {categoria.nombre}
                                    </p>
                                    <p className="text-sm font-bold text-sidebar">
                                        {formatearMoneda(
                                            categoria.total,
                                            simboloMoneda,
                                        )}
                                    </p>
                                </div>

                                <div className="h-2.5 overflow-hidden rounded-full bg-surface-soft">
                                    <div
                                        className={`h-full rounded-full ${tono === "ingreso"
                                                ? "bg-primary"
                                                : "bg-secondary"
                                            }`}
                                        style={{
                                            width: `${porcentaje}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </article>
    );
}

function GraficoMensual({
    data,
    simboloMoneda,
}: {
    data: ResumenMes[];
    simboloMoneda: string;
}) {
    const maximo = Math.max(
        ...data.flatMap((item) => [
            item.ingresos,
            item.gastos,
        ]),
        1,
    );

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-6 gap-3">
                {data.map((item) => {
                    const alturaIngresos =
                        (item.ingresos / maximo) * 180;
                    const alturaGastos =
                        (item.gastos / maximo) * 180;

                    return (
                        <div
                            key={item.clave}
                            className="flex min-w-0 flex-col items-center"
                        >
                            <div className="flex h-[220px] w-full items-end justify-center gap-2 rounded-2xl bg-[#F7FAF8] px-2 py-3">
                                <div className="flex w-5 flex-col items-center">
                                    <div
                                        title={`Ingresos: ${formatearMoneda(item.ingresos, simboloMoneda)}`}
                                        className="w-full rounded-t-xl bg-primary"
                                        style={{
                                            height: `${Math.max(
                                                alturaIngresos,
                                                6,
                                            )}px`,
                                        }}
                                    />
                                </div>

                                <div className="flex w-5 flex-col items-center">
                                    <div
                                        title={`Gastos: ${formatearMoneda(item.gastos, simboloMoneda)}`}
                                        className="w-full rounded-t-xl bg-secondary"
                                        style={{
                                            height: `${Math.max(
                                                alturaGastos,
                                                6,
                                            )}px`,
                                        }}
                                    />
                                </div>
                            </div>

                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#6E7E76]">
                                {item.etiqueta}
                            </p>

                            <p className="mt-1 text-center text-xs text-[#84928B]">
                                {formatearMoneda(
                                    item.ingresos -
                                    item.gastos,
                                    simboloMoneda,
                                )}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PanelAcceso({
    icono: Icono,
    titulo,
    descripcion,
}: {
    icono: React.ComponentType<{ className?: string }>;
    titulo: string;
    descripcion: string;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft text-[#52655D]">
                <Icono className="h-5 w-5" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-sidebar tracking-tight">
                {titulo}
            </h3>

            <p className="mt-2 text-sm leading-7 text-[#71817A]">
                {descripcion}
            </p>
        </article>
    );
}

function ResumenHero({
    titulo,
    valor,
    icono: Icono,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-primary-soft">
                <Icono className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    {titulo}
                </p>
            </div>

            <p className="mt-3 text-sm font-bold text-white">
                {valor}
            </p>
        </div>
    );
}

function ChipInfo({
    icono: Icono,
    texto,
}: {
    icono: React.ComponentType<{ className?: string }>;
    texto: string;
}) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
            <Icono className="h-3.5 w-3.5" />
            {texto}
        </span>
    );
}

function Leyenda({
    color,
    texto,
}: {
    color: string;
    texto: string;
}) {
    return (
        <div className="inline-flex items-center gap-2">
            <span
                className={`h-2.5 w-2.5 rounded-full ${color}`}
            />
            {texto}
        </div>
    );
}

function EncabezadoTabla({
    children,
    alineacion = "left",
}: {
    children: React.ReactNode;
    alineacion?: "left" | "right";
}) {
    return (
        <th
            className={`px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#789087] ${alineacion === "right"
                    ? "text-right"
                    : "text-left"
                }`}
        >
            {children}
        </th>
    );
}

function CeldaTabla({
    children,
    alineacion = "left",
}: {
    children: React.ReactNode;
    alineacion?: "left" | "right";
}) {
    return (
        <td
            className={`px-5 py-4 text-sm text-[#495B53] ${alineacion === "right"
                    ? "text-right"
                    : "text-left"
                }`}
        >
            {children}
        </td>
    );
}

function obtenerFechaDesdePeriodo(periodo: PeriodoFiltro) {
    const ahora = new Date();

    if (periodo === "MES_ACTUAL") {
        return new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            1,
        );
    }

    if (periodo === "ULTIMOS_30") {
        return new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate() - 30,
        );
    }

    if (periodo === "ULTIMOS_90") {
        return new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate() - 90,
        );
    }

    return new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() - 180,
    );
}

function resumirPorCategoria(
    movimientos: MovimientoFinancieroListado[],
) {
    const mapa = new Map<string, number>();

    for (const movimiento of movimientos) {
        const nombre =
            movimiento.categorias_financieras?.nombre ??
            "Sin categoría";

        mapa.set(
            nombre,
            (mapa.get(nombre) ?? 0) +
            Number(movimiento.monto ?? 0),
        );
    }

    return Array.from(mapa.entries())
        .map(([nombre, total]) => ({
            nombre,
            total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
}

function construirResumenMensual(
    movimientos: MovimientoFinancieroListado[],
    sucursalId: string,
) {
    const hoy = new Date();
    const meses: ResumenMes[] = [];

    for (let i = 5; i >= 0; i--) {
        const fecha = new Date(
            hoy.getFullYear(),
            hoy.getMonth() - i,
            1,
        );

        const clave = `${fecha.getFullYear()}-${String(
            fecha.getMonth() + 1,
        ).padStart(2, "0")}`;

        meses.push({
            clave,
            etiqueta: fecha.toLocaleDateString("es-NI", {
                month: "short",
            }),
            ingresos: 0,
            gastos: 0,
        });
    }

    const mapa = new Map(
        meses.map((mes) => [mes.clave, mes]),
    );

    for (const movimiento of movimientos) {
        if (
            sucursalId !== "TODAS" &&
            movimiento.sucursal_id !== sucursalId
        ) {
            continue;
        }

        const fecha = new Date(
            movimiento.fecha_movimiento,
        );

        const clave = `${fecha.getFullYear()}-${String(
            fecha.getMonth() + 1,
        ).padStart(2, "0")}`;

        const mes = mapa.get(clave);

        if (!mes) {
            continue;
        }

        if (movimiento.tipo === "INGRESO") {
            mes.ingresos += Number(
                movimiento.monto ?? 0,
            );
        } else {
            mes.gastos += Number(
                movimiento.monto ?? 0,
            );
        }
    }

    return meses;
}

function formatearMoneda(
    valor: number,
    simboloMoneda: string,
) {
    return `${simboloMoneda} ${Number(
        valor ?? 0,
    ).toLocaleString("es-NI", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatearFecha(valor: string) {
    const fecha = new Date(valor);

    return fecha.toLocaleDateString("es-NI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatearOrigen(
    origen: MovimientoFinancieroListado["origen"],
) {
    switch (origen) {
        case "VENTA":
            return "Venta";
        case "PAGO_PROVEEDOR":
            return "Pago a proveedor";
        case "COMISION_POS":
            return "Comisión POS";
        case "MOVIMIENTO_CAJA":
            return "Movimiento de caja";
        case "MANUAL":
            return "Registro manual";
        case "AJUSTE":
            return "Ajuste";
        default:
            return "Otro";
    }
}