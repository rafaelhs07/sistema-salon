"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    Boxes,
    CircleDollarSign,
    Filter,
    PackageCheck,
    Search,
    TrendingUp,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import BotonExportarExcel from "@/components/reportes/BotonExportarExcel";

import {
    exportarReporteInventarioExcel,
} from "./exportarReporteInventarioExcel";

export type ProductoReporteInventario = {
    id: string;
    codigo_producto: string;
    codigo_barras: string | null;
    nombre: string;
    marca: string | null;
    presentacion: string | null;
    unidad_medida: string;
    categoria: string | null;
    stock: number;
    stock_minimo: number;
    costo_unitario: number | null;
    precio_venta: number | null;
    controla_stock: boolean;
    estado: string;
};

type EstadoStock =
    | "NORMAL"
    | "BAJO"
    | "AGOTADO"
    | "SIN_CONTROL";

type ResumenCategoria = {
    nombre: string;
    cantidad: number;
    unidades: number;
    valorCosto: number;
    valorVenta: number;
    porcentaje: number;
};

export default function ReporteInventarioClient({
    simboloMoneda,
    productos,
}: {
    simboloMoneda: string;
    productos: ProductoReporteInventario[];
}) {
    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        categoria,
        setCategoria,
    ] = useState("");

    const [
        estadoProducto,
        setEstadoProducto,
    ] = useState("");

    const [
        estadoStock,
        setEstadoStock,
    ] = useState<
        "" | EstadoStock
    >("");

    const [
        exportando,
        setExportando,
    ] = useState(false);

    const categorias =
        useMemo(
            () =>
                Array.from(
                    new Set(
                        productos
                            .map(
                                (producto) =>
                                    producto.categoria?.trim(),
                            )
                            .filter(
                                (
                                    valor,
                                ): valor is string =>
                                    Boolean(
                                        valor,
                                    ),
                            ),
                    ),
                ).sort(),
            [productos],
        );

    const productosFiltrados =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            return productos.filter(
                (producto) => {
                    const stockVisual =
                        obtenerEstadoStock(
                            producto,
                        );

                    const coincideTexto =
                        !texto ||
                        producto.nombre
                            .toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        producto.codigo_producto
                            .toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        producto.codigo_barras
                            ?.toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        producto.marca
                            ?.toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        producto.presentacion
                            ?.toLowerCase()
                            .includes(
                                texto,
                            );

                    const coincideCategoria =
                        !categoria ||
                        producto.categoria ===
                        categoria;

                    const coincideEstadoProducto =
                        !estadoProducto ||
                        producto.estado ===
                        estadoProducto;

                    const coincideEstadoStock =
                        !estadoStock ||
                        stockVisual ===
                        estadoStock;

                    return (
                        coincideTexto &&
                        coincideCategoria &&
                        coincideEstadoProducto &&
                        coincideEstadoStock
                    );
                },
            );
        }, [
            productos,
            busqueda,
            categoria,
            estadoProducto,
            estadoStock,
        ]);

    const resumen =
        useMemo(() => {
            const activos =
                productosFiltrados.filter(
                    (producto) =>
                        producto.estado ===
                        "ACTIVO",
                );

            const agotados =
                activos.filter(
                    (producto) =>
                        obtenerEstadoStock(
                            producto,
                        ) ===
                        "AGOTADO",
                ).length;

            const bajos =
                activos.filter(
                    (producto) =>
                        obtenerEstadoStock(
                            producto,
                        ) ===
                        "BAJO",
                ).length;

            const unidades =
                activos.reduce(
                    (
                        total,
                        producto,
                    ) =>
                        total +
                        Number(
                            producto.stock ??
                            0,
                        ),
                    0,
                );

            const valorCosto =
                activos.reduce(
                    (
                        total,
                        producto,
                    ) =>
                        total +
                        Number(
                            producto.stock ??
                            0,
                        ) *
                        Number(
                            producto.costo_unitario ??
                            0,
                        ),
                    0,
                );

            const valorVenta =
                activos.reduce(
                    (
                        total,
                        producto,
                    ) =>
                        total +
                        Number(
                            producto.stock ??
                            0,
                        ) *
                        Number(
                            producto.precio_venta ??
                            0,
                        ),
                    0,
                );

            return {
                productos:
                    productosFiltrados.length,
                activos:
                    activos.length,
                bajos,
                agotados,
                unidades,
                valorCosto,
                valorVenta,
                margenPotencial:
                    valorVenta -
                    valorCosto,
            };
        }, [
            productosFiltrados,
        ]);

    const porCategoria =
        useMemo(
            () =>
                resumirCategorias(
                    productosFiltrados,
                ),
            [
                productosFiltrados,
            ],
        );

    const alertas =
        useMemo(
            () =>
                productosFiltrados
                    .filter(
                        (producto) =>
                            [
                                "BAJO",
                                "AGOTADO",
                            ].includes(
                                obtenerEstadoStock(
                                    producto,
                                ),
                            ),
                    )
                    .sort(
                        (a, b) =>
                            Number(
                                a.stock,
                            ) -
                            Number(
                                b.stock,
                            ),
                    ),
            [
                productosFiltrados,
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
            await exportarReporteInventarioExcel(
                {
                    simboloMoneda,

                    filtroCategoria:
                        categoria ||
                        "Todas las categorías",

                    filtroEstadoProducto:
                        estadoProducto ||
                        "Todos los estados",

                    filtroEstadoStock:
                        estadoStock
                            ? formatearEstadoStock(
                                estadoStock,
                            )
                            : "Todos los niveles de stock",

                    resumen,
                    productos:
                        productosFiltrados,
                    porCategoria,
                    alertas,
                },
            );
        } catch (error) {
            console.error(
                "Error exportando reporte de inventario:",
                error,
            );

            window.alert(
                "No fue posible generar el Excel.",
            );
        } finally {
            setExportando(
                false,
            );
        }
    }

    function limpiarFiltros() {
        setBusqueda("");
        setCategoria("");
        setEstadoProducto("");
        setEstadoStock("");
    }

    return (
        <div className="space-y-6 pb-8">
            <section className="relative overflow-hidden rounded-[32px] bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#6F8F83]/25 blur-3xl" />

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
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <Boxes className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Control de existencias
                                </p>

                                <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                    Reporte de inventario
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Revisa niveles de stock, productos críticos,
                                    valor invertido y valor potencial de venta.
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
                    titulo="Productos activos"
                    valor={String(
                        resumen.activos,
                    )}
                    icono={PackageCheck}
                />

                <Kpi
                    titulo="Stock bajo"
                    valor={String(
                        resumen.bajos,
                    )}
                    icono={AlertTriangle}
                    alerta
                />

                <Kpi
                    titulo="Agotados"
                    valor={String(
                        resumen.agotados,
                    )}
                    icono={AlertTriangle}
                    alerta
                />

                <Kpi
                    titulo="Valor a costo"
                    valor={moneda(
                        resumen.valorCosto,
                        simboloMoneda,
                    )}
                    icono={CircleDollarSign}
                />

                <Kpi
                    titulo="Valor a venta"
                    valor={moneda(
                        resumen.valorVenta,
                        simboloMoneda,
                    )}
                    icono={TrendingUp}
                />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <DatoFinanciero
                    titulo="Unidades registradas"
                    valor={resumen.unidades.toLocaleString(
                        "es-NI",
                    )}
                />

                <DatoFinanciero
                    titulo="Margen potencial del inventario"
                    valor={moneda(
                        resumen.margenPotencial,
                        simboloMoneda,
                    )}
                />
            </section>

            <section className="rounded-[30px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)] sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#26332F]">
                            Filtros de inventario
                        </h2>

                        <p className="mt-1 text-sm text-[#72827A]">
                            Segmenta el catálogo según categoría, estado y nivel de stock.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            limpiarFiltros
                        }
                        className="h-10 rounded-xl border border-[#DCE5E0] px-4 text-sm font-bold text-[#52605A] transition hover:bg-[#EEF2EF]"
                    >
                        Limpiar filtros
                    </button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="relative xl:col-span-1">
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
                            placeholder="Código, nombre, marca..."
                            className="h-11 w-full rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83] focus:bg-white"
                        />
                    </div>

                    <Select
                        valor={
                            categoria
                        }
                        cambiar={
                            setCategoria
                        }
                    >
                        <option value="">
                            Todas las categorías
                        </option>

                        {categorias.map(
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
                                    {
                                        item
                                    }
                                </option>
                            ),
                        )}
                    </Select>

                    <Select
                        valor={
                            estadoProducto
                        }
                        cambiar={
                            setEstadoProducto
                        }
                    >
                        <option value="">
                            Todos los estados
                        </option>
                        <option value="ACTIVO">
                            Activos
                        </option>
                        <option value="INACTIVO">
                            Inactivos
                        </option>
                    </Select>

                    <Select
                        valor={
                            estadoStock
                        }
                        cambiar={(
                            valor,
                        ) =>
                            setEstadoStock(
                                valor as
                                | ""
                                | EstadoStock,
                            )
                        }
                    >
                        <option value="">
                            Todos los niveles
                        </option>
                        <option value="NORMAL">
                            Stock normal
                        </option>
                        <option value="BAJO">
                            Stock bajo
                        </option>
                        <option value="AGOTADO">
                            Agotados
                        </option>
                        <option value="SIN_CONTROL">
                            Sin control de stock
                        </option>
                    </Select>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <RankingCategorias
                    datos={
                        porCategoria
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />

                <AlertasStock
                    productos={
                        alertas
                    }
                />
            </section>

            <section className="overflow-hidden rounded-[30px] border border-[#DCE5E0] bg-white shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
                <div className="flex items-center justify-between border-b border-[#E7EEEA] px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="font-bold text-[#26332F]">
                            Detalle de inventario
                        </h2>

                        <p className="mt-1 text-xs text-[#74837C]">
                            {productosFiltrados.length} productos encontrados
                        </p>
                    </div>

                    <Filter className="h-5 w-5 text-[#71817A]" />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1450px] w-full">
                        <thead className="bg-[#F7FAF8]">
                            <tr>
                                <Th>Código</Th>
                                <Th>Producto</Th>
                                <Th>Categoría</Th>
                                <Th>Unidad</Th>
                                <Th>Estado stock</Th>
                                <Th derecha>Stock</Th>
                                <Th derecha>Mínimo</Th>
                                <Th derecha>Costo unitario</Th>
                                <Th derecha>Precio venta</Th>
                                <Th derecha>Valor costo</Th>
                                <Th derecha>Valor venta</Th>
                                <Th>Estado</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EDF3EF]">
                            {productosFiltrados.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            12
                                        }
                                        className="px-6 py-14 text-center text-sm text-[#74837C]"
                                    >
                                        No hay productos con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                productosFiltrados.map(
                                    (
                                        producto,
                                    ) => {
                                        const estado =
                                            obtenerEstadoStock(
                                                producto,
                                            );

                                        return (
                                            <tr
                                                key={
                                                    producto.id
                                                }
                                                className="transition hover:bg-[#FAFCFB]"
                                            >
                                                <Td>
                                                    <span className="font-bold text-[#33413B]">
                                                        {
                                                            producto.codigo_producto
                                                        }
                                                    </span>
                                                </Td>

                                                <Td>
                                                    <div>
                                                        <p className="font-semibold text-[#33413B]">
                                                            {
                                                                producto.nombre
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-[#829089]">
                                                            {[
                                                                producto.marca,
                                                                producto.presentacion,
                                                            ]
                                                                .filter(
                                                                    Boolean,
                                                                )
                                                                .join(
                                                                    " · ",
                                                                ) ||
                                                                "Sin marca / presentación"}
                                                        </p>
                                                    </div>
                                                </Td>

                                                <Td>
                                                    {producto.categoria ??
                                                        "Sin categoría"}
                                                </Td>

                                                <Td>
                                                    {
                                                        producto.unidad_medida
                                                    }
                                                </Td>

                                                <Td>
                                                    <EstadoStockBadge
                                                        estado={
                                                            estado
                                                        }
                                                    />
                                                </Td>

                                                <Td derecha>
                                                    {
                                                        producto.stock
                                                    }
                                                </Td>

                                                <Td derecha>
                                                    {
                                                        producto.stock_minimo
                                                    }
                                                </Td>

                                                <Td derecha>
                                                    {moneda(
                                                        Number(
                                                            producto.costo_unitario ??
                                                            0,
                                                        ),
                                                        simboloMoneda,
                                                    )}
                                                </Td>

                                                <Td derecha>
                                                    {moneda(
                                                        Number(
                                                            producto.precio_venta ??
                                                            0,
                                                        ),
                                                        simboloMoneda,
                                                    )}
                                                </Td>

                                                <Td derecha>
                                                    {moneda(
                                                        Number(
                                                            producto.stock,
                                                        ) *
                                                        Number(
                                                            producto.costo_unitario ??
                                                            0,
                                                        ),
                                                        simboloMoneda,
                                                    )}
                                                </Td>

                                                <Td derecha>
                                                    {moneda(
                                                        Number(
                                                            producto.stock,
                                                        ) *
                                                        Number(
                                                            producto.precio_venta ??
                                                            0,
                                                        ),
                                                        simboloMoneda,
                                                    )}
                                                </Td>

                                                <Td>
                                                    {
                                                        producto.estado
                                                    }
                                                </Td>
                                            </tr>
                                        );
                                    },
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
    alerta = false,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    alerta?: boolean;
}) {
    return (
        <article className="rounded-[26px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.07)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#71817A]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-[#26332F]">
                        {valor}
                    </p>
                </div>

                <div
                    className={[
                        "flex h-11 w-11 items-center justify-center rounded-2xl",
                        alerta
                            ? "bg-[#F5E8EB] text-[#9A6470]"
                            : "bg-[#EEF4F0] text-[#587064]",
                    ].join(
                        " ",
                    )}
                >
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function DatoFinanciero({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <article className="rounded-2xl border border-[#DCE5E0] bg-[#FBFCFA] px-5 py-4">
            <p className="text-xs font-semibold text-[#7B8982]">
                {titulo}
            </p>

            <p className="mt-2 text-xl font-bold text-[#26332F]">
                {valor}
            </p>
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
            className="h-11 rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] px-3 text-sm font-medium text-[#43524B] outline-none focus:border-[#6F8F83] focus:bg-white"
        >
            {children}
        </select>
    );
}

function RankingCategorias({
    datos,
    simboloMoneda,
}: {
    datos: ResumenCategoria[];
    simboloMoneda: string;
}) {
    return (
        <article className="rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
            <h2 className="text-lg font-bold text-[#26332F]">
                Inventario por categoría
            </h2>

            <p className="mt-1 text-sm text-[#72827A]">
                Distribución del valor del inventario a costo.
            </p>

            <div className="mt-6 space-y-4">
                {datos.length ===
                    0 ? (
                    <EstadoVacio />
                ) : (
                    datos
                        .slice(
                            0,
                            8,
                        )
                        .map(
                            (
                                dato,
                            ) => (
                                <div
                                    key={
                                        dato.nombre
                                    }
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
                                                    dato.cantidad
                                                }{" "}
                                                producto
                                                {dato.cantidad ===
                                                    1
                                                    ? ""
                                                    : "s"}{" "}
                                                ·{" "}
                                                {dato.porcentaje.toFixed(
                                                    1,
                                                )}
                                                %
                                            </p>
                                        </div>

                                        <p className="text-sm font-bold text-[#26332F]">
                                            {moneda(
                                                dato.valorCosto,
                                                simboloMoneda,
                                            )}
                                        </p>
                                    </div>

                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EEF2EF]">
                                        <div
                                            className="h-full rounded-full bg-[#6F8F83]"
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

function AlertasStock({
    productos,
}: {
    productos: ProductoReporteInventario[];
}) {
    return (
        <article className="rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
            <h2 className="text-lg font-bold text-[#26332F]">
                Alertas de stock
            </h2>

            <p className="mt-1 text-sm text-[#72827A]">
                Productos que necesitan atención.
            </p>

            <div className="mt-6 space-y-3">
                {productos.length ===
                    0 ? (
                    <EstadoVacio />
                ) : (
                    productos
                        .slice(
                            0,
                            8,
                        )
                        .map(
                            (
                                producto,
                            ) => (
                                <div
                                    key={
                                        producto.id
                                    }
                                    className="flex items-center justify-between gap-4 rounded-2xl bg-[#F9FAF8] px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-[#33413B]">
                                            {
                                                producto.nombre
                                            }
                                        </p>

                                        <p className="mt-0.5 text-xs text-[#7D8A84]">
                                            {
                                                producto.codigo_producto
                                            }{" "}
                                            · mínimo{" "}
                                            {
                                                producto.stock_minimo
                                            }
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <EstadoStockBadge
                                            estado={obtenerEstadoStock(
                                                producto,
                                            )}
                                        />

                                        <p className="mt-1 text-xs font-bold text-[#6D7872]">
                                            Stock:{" "}
                                            {
                                                producto.stock
                                            }
                                        </p>
                                    </div>
                                </div>
                            ),
                        )
                )}
            </div>
        </article>
    );
}

function EstadoStockBadge({
    estado,
}: {
    estado: EstadoStock;
}) {
    const clase =
        estado ===
            "AGOTADO"
            ? "bg-[#F5E8EB] text-[#9A6470]"
            : estado ===
                "BAJO"
                ? "bg-[#FFF4D8] text-[#8A6A28]"
                : estado ===
                    "NORMAL"
                    ? "bg-[#E3EEE8] text-[#4F7564]"
                    : "bg-[#EEF1EF] text-[#66756E]";

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${clase}`}
        >
            {formatearEstadoStock(
                estado,
            )}
        </span>
    );
}

function EstadoVacio() {
    return (
        <p className="rounded-2xl bg-[#F7FAF8] px-4 py-8 text-center text-sm text-[#74837C]">
            Sin datos con los filtros seleccionados.
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

function obtenerEstadoStock(
    producto: ProductoReporteInventario,
): EstadoStock {
    if (
        !producto.controla_stock
    ) {
        return "SIN_CONTROL";
    }

    const stock =
        Number(
            producto.stock ??
            0,
        );

    const minimo =
        Number(
            producto.stock_minimo ??
            0,
        );

    if (
        stock <=
        0
    ) {
        return "AGOTADO";
    }

    if (
        stock <=
        minimo
    ) {
        return "BAJO";
    }

    return "NORMAL";
}

function resumirCategorias(
    productos: ProductoReporteInventario[],
): ResumenCategoria[] {
    const mapa =
        new Map<
            string,
            {
                cantidad: number;
                unidades: number;
                valorCosto: number;
                valorVenta: number;
            }
        >();

    productos
        .filter(
            (producto) =>
                producto.estado ===
                "ACTIVO",
        )
        .forEach(
            (
                producto,
            ) => {
                const nombre =
                    producto.categoria?.trim() ||
                    "Sin categoría";

                const actual =
                    mapa.get(
                        nombre,
                    ) ?? {
                        cantidad: 0,
                        unidades: 0,
                        valorCosto: 0,
                        valorVenta: 0,
                    };

                actual.cantidad +=
                    1;

                actual.unidades +=
                    Number(
                        producto.stock ??
                        0,
                    );

                actual.valorCosto +=
                    Number(
                        producto.stock ??
                        0,
                    ) *
                    Number(
                        producto.costo_unitario ??
                        0,
                    );

                actual.valorVenta +=
                    Number(
                        producto.stock ??
                        0,
                    ) *
                    Number(
                        producto.precio_venta ??
                        0,
                    );

                mapa.set(
                    nombre,
                    actual,
                );
            },
        );

    const totalCosto =
        Array.from(
            mapa.values(),
        ).reduce(
            (
                total,
                item,
            ) =>
                total +
                item.valorCosto,
            0,
        );

    return Array.from(
        mapa.entries(),
    )
        .map(
            ([
                nombre,
                item,
            ]) => ({
                nombre,
                ...item,
                porcentaje:
                    totalCosto >
                        0
                        ? (
                            item.valorCosto /
                            totalCosto
                        ) *
                        100
                        : 0,
            }),
        )
        .sort(
            (a, b) =>
                b.valorCosto -
                a.valorCosto,
        );
}

function formatearEstadoStock(
    estado: EstadoStock,
) {
    return (
        {
            NORMAL:
                "Normal",
            BAJO:
                "Stock bajo",
            AGOTADO:
                "Agotado",
            SIN_CONTROL:
                "Sin control",
        }[estado]
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
