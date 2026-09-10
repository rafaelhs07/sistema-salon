"use client";

import Link from "next/link";
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    CircleDollarSign,
    Filter,
    PieChart,
    Search,
    Store,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import BotonExportarExcel from "@/components/reportes/BotonExportarExcel";

import {
    exportarReporteFinancieroExcel,
} from "./exportarReporteFinancieroExcel";

export type CategoriaReporteFinanciero = {
    id: string;
    nombre: string;
    tipo:
    | "INGRESO"
    | "GASTO";
};

export type SucursalReporteFinanciero = {
    id: string;
    nombre: string;
};

export type MovimientoReporteFinanciero = {
    id: string;
    sucursal_id: string | null;
    categoria_id: string | null;
    tipo:
    | "INGRESO"
    | "GASTO";
    origen: string;
    metodo_pago: string | null;
    concepto: string;
    descripcion: string | null;
    monto: number;
    referencia: string | null;
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

type TipoFiltro =
    | "TODOS"
    | "INGRESO"
    | "GASTO";

type EstadoFiltro =
    | "APLICADO"
    | "ANULADO"
    | "TODOS";

export default function ReporteFinancieroClient({
    simboloMoneda,
    movimientos,
    categorias,
    sucursales,
}: {
    simboloMoneda: string;
    movimientos: MovimientoReporteFinanciero[];
    categorias: CategoriaReporteFinanciero[];
    sucursales: SucursalReporteFinanciero[];
}) {
    const hoy = new Date();

    const primerDiaMes =
        new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            1,
        )
            .toISOString()
            .slice(0, 10);

    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        fechaDesde,
        setFechaDesde,
    ] = useState(
        primerDiaMes,
    );

    const [
        fechaHasta,
        setFechaHasta,
    ] = useState(
        hoy
            .toISOString()
            .slice(0, 10),
    );

    const [
        sucursalId,
        setSucursalId,
    ] = useState("");

    const [
        tipo,
        setTipo,
    ] =
        useState<TipoFiltro>(
            "TODOS",
        );

    const [
        estado,
        setEstado,
    ] =
        useState<EstadoFiltro>(
            "APLICADO",
        );

    const [
        categoriaId,
        setCategoriaId,
    ] = useState("");

    const [
        origen,
        setOrigen,
    ] = useState("");

    const [
        metodoPago,
        setMetodoPago,
    ] = useState("");

    const [
        exportando,
        setExportando,
    ] = useState(false);

    const origenes =
        useMemo(
            () =>
                Array.from(
                    new Set(
                        movimientos.map(
                            (movimiento) =>
                                movimiento.origen,
                        ),
                    ),
                ).sort(),
            [movimientos],
        );

    const metodos =
        useMemo(
            () =>
                Array.from(
                    new Set(
                        movimientos
                            .map(
                                (movimiento) =>
                                    movimiento.metodo_pago,
                            )
                            .filter(
                                (
                                    metodo,
                                ): metodo is string =>
                                    Boolean(
                                        metodo,
                                    ),
                            ),
                    ),
                ).sort(),
            [movimientos],
        );

    const movimientosFiltrados =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            const desde =
                fechaDesde
                    ? new Date(
                        `${fechaDesde}T00:00:00`,
                    )
                    : null;

            const hasta =
                fechaHasta
                    ? new Date(
                        `${fechaHasta}T23:59:59`,
                    )
                    : null;

            return movimientos.filter(
                (
                    movimiento,
                ) => {
                    const fecha =
                        new Date(
                            movimiento.fecha_movimiento,
                        );

                    const coincideTexto =
                        !texto ||
                        movimiento.concepto
                            .toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        movimiento.referencia
                            ?.toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        movimiento
                            .categorias_financieras
                            ?.nombre.toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        movimiento
                            .sucursales
                            ?.nombre.toLowerCase()
                            .includes(
                                texto,
                            );

                    const coincideDesde =
                        !desde ||
                        fecha >=
                        desde;

                    const coincideHasta =
                        !hasta ||
                        fecha <=
                        hasta;

                    const coincideSucursal =
                        !sucursalId ||
                        movimiento.sucursal_id ===
                        sucursalId;

                    const coincideTipo =
                        tipo ===
                        "TODOS" ||
                        movimiento.tipo ===
                        tipo;

                    const coincideEstado =
                        estado ===
                        "TODOS" ||
                        movimiento.estado ===
                        estado;

                    const coincideCategoria =
                        !categoriaId ||
                        movimiento.categoria_id ===
                        categoriaId;

                    const coincideOrigen =
                        !origen ||
                        movimiento.origen ===
                        origen;

                    const coincideMetodo =
                        !metodoPago ||
                        movimiento.metodo_pago ===
                        metodoPago;

                    return (
                        coincideTexto &&
                        coincideDesde &&
                        coincideHasta &&
                        coincideSucursal &&
                        coincideTipo &&
                        coincideEstado &&
                        coincideCategoria &&
                        coincideOrigen &&
                        coincideMetodo
                    );
                },
            );
        }, [
            busqueda,
            fechaDesde,
            fechaHasta,
            sucursalId,
            tipo,
            estado,
            categoriaId,
            origen,
            metodoPago,
            movimientos,
        ]);

    const resumen =
        useMemo(() => {
            const aplicados =
                movimientosFiltrados.filter(
                    (movimiento) =>
                        movimiento.estado ===
                        "APLICADO",
                );

            const ingresos =
                aplicados
                    .filter(
                        (movimiento) =>
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
                aplicados
                    .filter(
                        (movimiento) =>
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

            const utilidad =
                ingresos -
                gastos;

            const margen =
                ingresos >
                    0
                    ? (
                        utilidad /
                        ingresos
                    ) *
                    100
                    : 0;

            return {
                ingresos,
                gastos,
                utilidad,
                margen,
                cantidad:
                    movimientosFiltrados.length,
            };
        }, [
            movimientosFiltrados,
        ]);

    const porCategoria =
        useMemo(
            () =>
                resumirCategorias(
                    movimientosFiltrados,
                ),
            [
                movimientosFiltrados,
            ],
        );

    const porOrigen =
        useMemo(
            () =>
                resumirGrupo(
                    movimientosFiltrados,
                    (
                        movimiento,
                    ) =>
                        formatearOrigen(
                            movimiento.origen,
                        ),
                ),
            [
                movimientosFiltrados,
            ],
        );

    const porMetodo =
        useMemo(
            () =>
                resumirGrupo(
                    movimientosFiltrados,
                    (
                        movimiento,
                    ) =>
                        formatearMetodo(
                            movimiento.metodo_pago,
                        ),
                ),
            [
                movimientosFiltrados,
            ],
        );

    const tendencia =
        useMemo(
            () =>
                resumirMensual(
                    movimientosFiltrados,
                ),
            [
                movimientosFiltrados,
            ],
        );

    const nombreSucursal =
        sucursalId
            ? sucursales.find(
                (
                    sucursal,
                ) =>
                    sucursal.id ===
                    sucursalId,
            )?.nombre ??
            "Sucursal"
            : "Todas las sucursales";

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
            await exportarReporteFinancieroExcel(
                {
                    simboloMoneda,
                    fechaDesde,
                    fechaHasta,
                    nombreSucursal,

                    tipo:
                        tipo ===
                            "TODOS"
                            ? "Ingresos y gastos"
                            : tipo ===
                                "INGRESO"
                                ? "Solo ingresos"
                                : "Solo gastos",

                    estado:
                        estado ===
                            "TODOS"
                            ? "Todos"
                            : estado,

                    categoria:
                        categoriaId
                            ? categorias.find(
                                (
                                    categoria,
                                ) =>
                                    categoria.id ===
                                    categoriaId,
                            )?.nombre ??
                            "Categoría"
                            : "Todas las categorías",

                    origen:
                        origen
                            ? formatearOrigen(
                                origen,
                            )
                            : "Todos los orígenes",

                    metodoPago:
                        metodoPago
                            ? formatearMetodo(
                                metodoPago,
                            )
                            : "Todos los métodos",

                    ingresos:
                        resumen.ingresos,

                    gastos:
                        resumen.gastos,

                    utilidad:
                        resumen.utilidad,

                    margen:
                        resumen.margen,

                    cantidad:
                        resumen.cantidad,

                    movimientos:
                        movimientosFiltrados,

                    porCategoria,
                    porOrigen,
                    porMetodo,
                    tendencia,
                },
            );
        } catch (error) {
            console.error(
                "Error exportando reporte financiero:",
                error,
            );

            window.alert(
                "No fue posible generar el Excel del reporte financiero.",
            );
        } finally {
            setExportando(
                false,
            );
        }
    }

    function limpiarFiltros() {
        setBusqueda("");
        setFechaDesde(
            primerDiaMes,
        );
        setFechaHasta(
            hoy
                .toISOString()
                .slice(0, 10),
        );
        setSucursalId("");
        setTipo(
            "TODOS",
        );
        setEstado(
            "APLICADO",
        );
        setCategoriaId("");
        setOrigen("");
        setMetodoPago("");
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
                                <CircleDollarSign className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Estado económico
                                </p>

                                <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                    Reporte financiero
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Analiza ingresos, gastos, utilidad y origen
                                    de todos los movimientos financieros registrados.
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

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Kpi
                    titulo="Ingresos"
                    valor={moneda(
                        resumen.ingresos,
                        simboloMoneda,
                    )}
                    icono={ArrowUpRight}
                    tono="positivo"
                />

                <Kpi
                    titulo="Gastos"
                    valor={moneda(
                        resumen.gastos,
                        simboloMoneda,
                    )}
                    icono={ArrowDownRight}
                    tono="negativo"
                />

                <Kpi
                    titulo="Utilidad"
                    valor={moneda(
                        resumen.utilidad,
                        simboloMoneda,
                    )}
                    icono={
                        resumen.utilidad >=
                            0
                            ? TrendingUp
                            : TrendingDown
                    }
                    tono={
                        resumen.utilidad >=
                            0
                            ? "positivo"
                            : "negativo"
                    }
                />

                <Kpi
                    titulo="Margen"
                    valor={`${resumen.margen.toFixed(
                        1,
                    )}%`}
                    icono={PieChart}
                    tono={
                        resumen.margen >=
                            0
                            ? "positivo"
                            : "negativo"
                    }
                />

                <Kpi
                    titulo="Movimientos"
                    valor={String(
                        resumen.cantidad,
                    )}
                    icono={Wallet}
                    tono="neutral"
                />
            </section>

            <section className="salon-panel border border-border bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-sidebar tracking-tight">
                            Filtros financieros
                        </h2>

                        <p className="mt-1 text-sm text-[#72827A]">
                            Combina filtros para construir el reporte que necesitas.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            limpiarFiltros
                        }
                        className="salon-action border border-border px-4 text-[#52605A] transition hover:bg-surface-soft"
                    >
                        Limpiar filtros
                    </button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="relative md:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87948D]" />

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
                            placeholder="Concepto, referencia, categoría o sucursal..."
                            className="salon-control w-full border border-border bg-[#F9FBFA] pl-11 pr-4 outline-none focus:border-primary focus:bg-white"
                        />
                    </div>

                    <input
                        type="date"
                        value={
                            fechaDesde
                        }
                        onChange={(
                            event,
                        ) =>
                            setFechaDesde(
                                event
                                    .target
                                    .value,
                            )
                        }
                        className="salon-control border border-border bg-[#F9FBFA] px-3 outline-none focus:border-primary"
                    />

                    <input
                        type="date"
                        value={
                            fechaHasta
                        }
                        onChange={(
                            event,
                        ) =>
                            setFechaHasta(
                                event
                                    .target
                                    .value,
                            )
                        }
                        className="salon-control border border-border bg-[#F9FBFA] px-3 outline-none focus:border-primary"
                    />

                    <Select
                        valor={
                            sucursalId
                        }
                        cambiar={
                            setSucursalId
                        }
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
                    </Select>

                    <Select
                        valor={
                            tipo
                        }
                        cambiar={(
                            valor,
                        ) =>
                            setTipo(
                                valor as TipoFiltro,
                            )
                        }
                    >
                        <option value="TODOS">
                            Ingresos y gastos
                        </option>
                        <option value="INGRESO">
                            Solo ingresos
                        </option>
                        <option value="GASTO">
                            Solo gastos
                        </option>
                    </Select>

                    <Select
                        valor={
                            estado
                        }
                        cambiar={(
                            valor,
                        ) =>
                            setEstado(
                                valor as EstadoFiltro,
                            )
                        }
                    >
                        <option value="APLICADO">
                            Aplicados
                        </option>
                        <option value="ANULADO">
                            Anulados
                        </option>
                        <option value="TODOS">
                            Todos los estados
                        </option>
                    </Select>

                    <Select
                        valor={
                            categoriaId
                        }
                        cambiar={
                            setCategoriaId
                        }
                    >
                        <option value="">
                            Todas las categorías
                        </option>

                        {categorias.map(
                            (
                                categoria,
                            ) => (
                                <option
                                    key={
                                        categoria.id
                                    }
                                    value={
                                        categoria.id
                                    }
                                >
                                    {categoria.tipo ===
                                        "INGRESO"
                                        ? "Ingreso"
                                        : "Gasto"}{" "}
                                    ·{" "}
                                    {
                                        categoria.nombre
                                    }
                                </option>
                            ),
                        )}
                    </Select>

                    <Select
                        valor={
                            origen
                        }
                        cambiar={
                            setOrigen
                        }
                    >
                        <option value="">
                            Todos los orígenes
                        </option>

                        {origenes.map(
                            (
                                item,
                            ) => (
                                <option
                                    key={
                                        item
                                    }
                                    value={
                                        item
                                    }
                                >
                                    {formatearOrigen(
                                        item,
                                    )}
                                </option>
                            ),
                        )}
                    </Select>

                    <Select
                        valor={
                            metodoPago
                        }
                        cambiar={
                            setMetodoPago
                        }
                    >
                        <option value="">
                            Todos los métodos
                        </option>

                        {metodos.map(
                            (
                                item,
                            ) => (
                                <option
                                    key={
                                        item
                                    }
                                    value={
                                        item
                                    }
                                >
                                    {formatearMetodo(
                                        item,
                                    )}
                                </option>
                            ),
                        )}
                    </Select>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <TendenciaMensual
                    datos={
                        tendencia
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />

                <RankingCategorias
                    datos={
                        porCategoria
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <RankingSimple
                    titulo="Origen de movimientos"
                    descripcion="Qué procesos generan los registros financieros."
                    datos={
                        porOrigen
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />

                <RankingSimple
                    titulo="Métodos de pago"
                    descripcion="Distribución de los movimientos según el medio registrado."
                    datos={
                        porMetodo
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />
            </section>

            <section className="salon-panel overflow-hidden border border-border bg-white">
                <div className="flex items-center justify-between border-b border-[#E7EEEA] px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="font-bold text-sidebar tracking-tight">
                            Detalle financiero
                        </h2>

                        <p className="mt-1 text-xs text-[#74837C]">
                            {movimientosFiltrados.length} movimientos encontrados
                        </p>
                    </div>

                    <Filter className="h-5 w-5 text-[#71817A]" />
                </div>

                <div className="overflow-x-auto">
                    <table className="salon-table min-w-[1250px] w-full">
                        <thead className="bg-[#F7FAF8]">
                            <tr>
                                <Th>Fecha</Th>
                                <Th>Tipo</Th>
                                <Th>Concepto</Th>
                                <Th>Categoría</Th>
                                <Th>Origen</Th>
                                <Th>Método</Th>
                                <Th>Sucursal</Th>
                                <Th>Estado</Th>
                                <Th derecha>Monto</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EDF3EF]">
                            {movimientosFiltrados.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            9
                                        }
                                        className="px-6 py-14 text-center text-sm text-[#74837C]"
                                    >
                                        No hay movimientos con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                movimientosFiltrados.map(
                                    (
                                        movimiento,
                                    ) => (
                                        <tr
                                            key={
                                                movimiento.id
                                            }
                                            className="transition hover:bg-[#FAFCFB]"
                                        >
                                            <Td>
                                                {fecha(
                                                    movimiento.fecha_movimiento,
                                                )}
                                            </Td>

                                            <Td>
                                                <span
                                                    className={[
                                                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                                                        movimiento.tipo ===
                                                            "INGRESO"
                                                            ? "bg-[#E3EEE8] text-[#4F7564]"
                                                            : "bg-[#F5E8EB] text-[#9A6470]",
                                                    ].join(
                                                        " ",
                                                    )}
                                                >
                                                    {
                                                        movimiento.tipo
                                                    }
                                                </span>
                                            </Td>

                                            <Td>
                                                <div className="max-w-[280px]">
                                                    <p className="font-semibold text-[#33413B]">
                                                        {
                                                            movimiento.concepto
                                                        }
                                                    </p>

                                                    {movimiento.referencia && (
                                                        <p className="mt-1 truncate text-xs text-[#829089]">
                                                            Ref.{" "}
                                                            {
                                                                movimiento.referencia
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </Td>

                                            <Td>
                                                {movimiento
                                                    .categorias_financieras
                                                    ?.nombre ??
                                                    "Sin categoría"}
                                            </Td>

                                            <Td>
                                                {formatearOrigen(
                                                    movimiento.origen,
                                                )}
                                            </Td>

                                            <Td>
                                                {formatearMetodo(
                                                    movimiento.metodo_pago,
                                                )}
                                            </Td>

                                            <Td>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Store className="h-3.5 w-3.5 text-[#7F8E87]" />
                                                    {movimiento
                                                        .sucursales
                                                        ?.nombre ??
                                                        "Sin sucursal"}
                                                </span>
                                            </Td>

                                            <Td>
                                                {
                                                    movimiento.estado
                                                }
                                            </Td>

                                            <Td derecha>
                                                <span
                                                    className={
                                                        movimiento.tipo ===
                                                            "INGRESO"
                                                            ? "font-bold text-[#4F7564]"
                                                            : "font-bold text-[#9A6470]"
                                                    }
                                                >
                                                    {movimiento.tipo ===
                                                        "INGRESO"
                                                        ? "+"
                                                        : "-"}{" "}
                                                    {moneda(
                                                        Number(
                                                            movimiento.monto,
                                                        ),
                                                        simboloMoneda,
                                                    )}
                                                </span>
                                            </Td>
                                        </tr>
                                    ),
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function Kpi({
    titulo,
    valor,
    icono: Icono,
    tono,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    tono:
    | "positivo"
    | "negativo"
    | "neutral";
}) {
    const clase =
        tono ===
            "positivo"
            ? "bg-[#E5F0EB] text-[#4F7564]"
            : tono ===
                "negativo"
                ? "bg-[#F5E8EB] text-[#9C6471]"
                : "bg-[#EEF4F0] text-[#587064]";

    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#71817A]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-sidebar">
                        {valor}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${clase}`}
                >
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function Select({
    valor,
    cambiar,
    children,
}: {
    valor: string;
    cambiar: (
        valor: string,
    ) => void;
    children: React.ReactNode;
}) {
    return (
        <select
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
            className="salon-control border border-border bg-[#F9FBFA] px-3 font-medium text-text-secondary outline-none focus:border-primary focus:bg-white"
        >
            {children}
        </select>
    );
}

function TendenciaMensual({
    datos,
    simboloMoneda,
}: {
    datos: {
        clave: string;
        etiqueta: string;
        ingresos: number;
        gastos: number;
        utilidad: number;
    }[];
    simboloMoneda: string;
}) {
    const maximo =
        Math.max(
            ...datos.flatMap(
                (
                    item,
                ) => [
                        item.ingresos,
                        item.gastos,
                    ],
            ),
            1,
        );

    return (
        <article className="salon-panel border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-sidebar tracking-tight">
                Tendencia mensual
            </h2>

            <p className="mt-1 text-sm text-[#72827A]">
                Ingresos y gastos del periodo filtrado.
            </p>

            <div className="mt-6 overflow-x-auto">
                <div className="grid min-w-[650px] grid-cols-12 gap-2">
                    {datos.map(
                        (
                            item,
                        ) => (
                            <div
                                key={
                                    item.clave
                                }
                                className="min-w-0"
                            >
                                <div className="flex h-[190px] items-end justify-center gap-1 rounded-2xl bg-[#F7FAF8] px-1.5 py-3">
                                    <div
                                        title={`Ingresos: ${moneda(
                                            item.ingresos,
                                            simboloMoneda,
                                        )}`}
                                        className="w-3 rounded-t bg-primary"
                                        style={{
                                            height: `${Math.max(
                                                (
                                                    item.ingresos /
                                                    maximo
                                                ) *
                                                150,
                                                item.ingresos >
                                                    0
                                                    ? 4
                                                    : 1,
                                            )}px`,
                                        }}
                                    />

                                    <div
                                        title={`Gastos: ${moneda(
                                            item.gastos,
                                            simboloMoneda,
                                        )}`}
                                        className="w-3 rounded-t bg-secondary"
                                        style={{
                                            height: `${Math.max(
                                                (
                                                    item.gastos /
                                                    maximo
                                                ) *
                                                150,
                                                item.gastos >
                                                    0
                                                    ? 4
                                                    : 1,
                                            )}px`,
                                        }}
                                    />
                                </div>

                                <p className="mt-2 truncate text-center text-xs font-bold uppercase text-[#71817A]">
                                    {
                                        item.etiqueta
                                    }
                                </p>
                            </div>
                        ),
                    )}
                </div>
            </div>
        </article>
    );
}

function RankingCategorias({
    datos,
    simboloMoneda,
}: {
    datos: {
        nombre: string;
        tipo: string;
        total: number;
        porcentaje: number;
    }[];
    simboloMoneda: string;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-sidebar tracking-tight">
                Categorías principales
            </h2>

            <p className="mt-1 text-sm text-[#72827A]">
                Rubros con mayor movimiento en el periodo.
            </p>

            <div className="mt-6 space-y-4">
                {datos.length ===
                    0 ? (
                    <EstadoVacio />
                ) : (
                    datos
                        .slice(
                            0,
                            7,
                        )
                        .map(
                            (
                                dato,
                            ) => (
                                <div
                                    key={`${dato.tipo}-${dato.nombre}`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-[#33413B]">
                                                {
                                                    dato.nombre
                                                }
                                            </p>

                                            <p className="mt-0.5 text-xs text-[#7D8A84]">
                                                {
                                                    dato.tipo
                                                }{" "}
                                                ·{" "}
                                                {dato.porcentaje.toFixed(
                                                    1,
                                                )}
                                                %
                                            </p>
                                        </div>

                                        <p className="text-sm font-bold text-sidebar">
                                            {moneda(
                                                dato.total,
                                                simboloMoneda,
                                            )}
                                        </p>
                                    </div>

                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-soft">
                                        <div
                                            className={
                                                dato.tipo ===
                                                    "INGRESO"
                                                    ? "h-full rounded-full bg-primary"
                                                    : "h-full rounded-full bg-secondary"
                                            }
                                            style={{
                                                width: `${Math.max(
                                                    dato.porcentaje,
                                                    2,
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ),
                        )
                )}
            </div>
        </article>
    );
}

function RankingSimple({
    titulo,
    descripcion,
    datos,
    simboloMoneda,
}: {
    titulo: string;
    descripcion: string;
    datos: {
        nombre: string;
        total: number;
        porcentaje: number;
    }[];
    simboloMoneda: string;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <h2 className="text-lg font-bold text-sidebar tracking-tight">
                {titulo}
            </h2>

            <p className="mt-1 text-sm text-[#72827A]">
                {descripcion}
            </p>

            <div className="mt-6 space-y-3">
                {datos.length ===
                    0 ? (
                    <EstadoVacio />
                ) : (
                    datos
                        .slice(
                            0,
                            7,
                        )
                        .map(
                            (
                                dato,
                            ) => (
                                <div
                                    key={
                                        dato.nombre
                                    }
                                    className="flex items-center justify-between gap-4 rounded-2xl bg-[#F7FAF8] px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-[#33413B]">
                                            {
                                                dato.nombre
                                            }
                                        </p>

                                        <p className="mt-0.5 text-xs text-[#7D8A84]">
                                            {dato.porcentaje.toFixed(
                                                1,
                                            )}
                                            %
                                        </p>
                                    </div>

                                    <p className="text-sm font-bold text-sidebar">
                                        {moneda(
                                            dato.total,
                                            simboloMoneda,
                                        )}
                                    </p>
                                </div>
                            ),
                        )
                )}
            </div>
        </article>
    );
}

function EstadoVacio() {
    return (
        <p className="rounded-2xl bg-[#F7FAF8] px-4 py-8 text-center text-sm text-[#74837C]">
            Sin datos en el periodo seleccionado.
        </p>
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

function resumirCategorias(
    movimientos: MovimientoReporteFinanciero[],
) {
    const aplicados =
        movimientos.filter(
            (movimiento) =>
                movimiento.estado ===
                "APLICADO",
        );

    const mapa =
        new Map<
            string,
            {
                nombre: string;
                tipo: string;
                total: number;
            }
        >();

    aplicados.forEach(
        (
            movimiento,
        ) => {
            const nombre =
                movimiento
                    .categorias_financieras
                    ?.nombre ??
                "Sin categoría";

            const clave =
                `${movimiento.tipo}-${nombre}`;

            const actual =
                mapa.get(
                    clave,
                ) ?? {
                    nombre,
                    tipo:
                        movimiento.tipo,
                    total: 0,
                };

            actual.total +=
                Number(
                    movimiento.monto,
                );

            mapa.set(
                clave,
                actual,
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
                valor.total,
            0,
        );

    return Array.from(
        mapa.values(),
    )
        .map(
            (
                item,
            ) => ({
                ...item,
                porcentaje:
                    total >
                        0
                        ? (
                            item.total /
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

function resumirGrupo(
    movimientos: MovimientoReporteFinanciero[],
    obtenerNombre: (
        movimiento: MovimientoReporteFinanciero,
    ) => string,
) {
    const mapa =
        new Map<
            string,
            number
        >();

    movimientos
        .filter(
            (movimiento) =>
                movimiento.estado ===
                "APLICADO",
        )
        .forEach(
            (
                movimiento,
            ) => {
                const nombre =
                    obtenerNombre(
                        movimiento,
                    );

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

function resumirMensual(
    movimientos: MovimientoReporteFinanciero[],
) {
    const mapa =
        new Map<
            string,
            {
                ingresos: number;
                gastos: number;
            }
        >();

    movimientos
        .filter(
            (movimiento) =>
                movimiento.estado ===
                "APLICADO",
        )
        .forEach(
            (
                movimiento,
            ) => {
                const fecha =
                    new Date(
                        movimiento.fecha_movimiento,
                    );

                const clave =
                    `${fecha.getFullYear()}-${String(
                        fecha.getMonth() +
                        1,
                    ).padStart(
                        2,
                        "0",
                    )}`;

                const actual =
                    mapa.get(
                        clave,
                    ) ?? {
                        ingresos: 0,
                        gastos: 0,
                    };

                if (
                    movimiento.tipo ===
                    "INGRESO"
                ) {
                    actual.ingresos +=
                        Number(
                            movimiento.monto,
                        );
                } else {
                    actual.gastos +=
                        Number(
                            movimiento.monto,
                        );
                }

                mapa.set(
                    clave,
                    actual,
                );
            },
        );

    const items =
        Array.from(
            mapa.entries(),
        )
            .sort(
                ([a], [b]) =>
                    a.localeCompare(
                        b,
                    ),
            )
            .slice(
                -12,
            );

    return items.map(
        ([
            clave,
            valores,
        ]) => {
            const [
                anio,
                mes,
            ] =
                clave.split(
                    "-",
                );

            const fecha =
                new Date(
                    Number(
                        anio,
                    ),
                    Number(
                        mes,
                    ) -
                    1,
                    1,
                );

            return {
                clave,
                etiqueta:
                    new Intl.DateTimeFormat(
                        "es-NI",
                        {
                            month: "short",
                        },
                    ).format(
                        fecha,
                    ),
                ingresos:
                    valores.ingresos,
                gastos:
                    valores.gastos,
                utilidad:
                    valores.ingresos -
                    valores.gastos,
            };
        },
    );
}

function formatearOrigen(
    valor: string,
) {
    return (
        {
            VENTA:
                "Ventas",
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

function formatearMetodo(
    valor: string | null,
) {
    if (
        !valor
    ) {
        return "Sin método";
    }

    return (
        {
            EFECTIVO:
                "Efectivo",
            TARJETA:
                "Tarjeta",
            TRANSFERENCIA:
                "Transferencia",
            DEPOSITO:
                "Depósito",
            CHEQUE:
                "Cheque",
            CREDITO:
                "Crédito",
            OTRO:
                "Otro",
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

function fecha(
    valor: string,
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
        new Date(
            valor,
        ),
    );
}
