"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowUpToLine,
    Boxes,
    CheckCircle2,
    ChevronDown,
    CircleDollarSign,
    LoaderCircle,
    Minus,
    Package,
    Plus,
    RefreshCcw,
    Search,
    Store,
    Trash2,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";

import {
    registrarAjusteInventario,
    type DatosAjusteInventario,
} from "./actions";

export type SucursalAjuste = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type ProductoAjuste = {
    id: string;
    codigo_producto: string;
    codigo_barras: string | null;
    nombre: string;
    marca: string | null;
    presentacion: string | null;
    unidad_medida: string;
    costo_unitario: number;
    stock_minimo_general: number;
};

export type ExistenciaAjuste = {
    id: string;
    sucursal_id: string;
    producto_id: string;
    cantidad_actual: number;
    stock_minimo: number;
    ubicacion: string | null;
};

type TipoAjuste =
    DatosAjusteInventario["tipo"];

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
};

const TIPOS_AJUSTE: Array<{
    valor: TipoAjuste;
    titulo: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}> = [
        {
            valor:
                "ENTRADA_INICIAL",
            titulo:
                "Entrada inicial",
            descripcion:
                "Carga el inventario con el que comienzas.",
            icono:
                Boxes,
        },
        {
            valor:
                "AJUSTE_ENTRADA",
            titulo:
                "Ajuste de entrada",
            descripcion:
                "Suma unidades al stock existente.",
            icono:
                Plus,
        },
        {
            valor:
                "AJUSTE_SALIDA",
            titulo:
                "Ajuste de salida",
            descripcion:
                "Resta unidades por una corrección manual.",
            icono:
                Minus,
        },
        {
            valor:
                "MERMA",
            titulo:
                "Merma",
            descripcion:
                "Registra pérdida, daño o producto no utilizable.",
            icono:
                Trash2,
        },
    ];

export default function AjusteInventarioClient({
    sucursales,
    productos,
    existencias,
    simboloMoneda,
}: {
    sucursales: SucursalAjuste[];
    productos: ProductoAjuste[];
    existencias: ExistenciaAjuste[];
    simboloMoneda: string;
}) {
    const sucursalInicial =
        sucursales.find(
            (
                item,
            ) =>
                item.es_principal,
        )?.id ??
        sucursales[0]?.id ??
        "";

    const [
        sucursalId,
        setSucursalId,
    ] =
        useState(
            sucursalInicial,
        );

    const [
        productoId,
        setProductoId,
    ] =
        useState("");

    const [
        busquedaProducto,
        setBusquedaProducto,
    ] =
        useState("");

    const [
        mostrarProductos,
        setMostrarProductos,
    ] =
        useState(false);

    const [
        tipo,
        setTipo,
    ] =
        useState<TipoAjuste>(
            "AJUSTE_ENTRADA",
        );

    const [
        cantidad,
        setCantidad,
    ] =
        useState("1");

    const [
        costoUnitario,
        setCostoUnitario,
    ] =
        useState("");

    const [
        referencia,
        setReferencia,
    ] =
        useState("");

    const [
        observaciones,
        setObservaciones,
    ] =
        useState("");

    const [
        mensaje,
        setMensaje,
    ] =
        useState<Mensaje | null>(
            null,
        );

    const [
        guardando,
        iniciarTransicion,
    ] =
        useTransition();

    const producto =
        useMemo(
            () =>
                productos.find(
                    (
                        item,
                    ) =>
                        item.id ===
                        productoId,
                ) ??
                null,
            [
                productoId,
                productos,
            ],
        );

    const existencia =
        useMemo(
            () =>
                existencias.find(
                    (
                        item,
                    ) =>
                        item.sucursal_id ===
                        sucursalId &&
                        item.producto_id ===
                        productoId,
                ) ??
                null,
            [
                existencias,
                productoId,
                sucursalId,
            ],
        );

    const productosFiltrados =
        useMemo(
            () => {
                const texto =
                    busquedaProducto
                        .trim()
                        .toLowerCase();

                if (
                    !texto
                ) {
                    return productos.slice(
                        0,
                        40,
                    );
                }

                return productos
                    .filter(
                        (
                            item,
                        ) =>
                            item.nombre
                                .toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            item.codigo_producto
                                .toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            item.codigo_barras
                                ?.toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            item.marca
                                ?.toLowerCase()
                                .includes(
                                    texto,
                                ),
                    )
                    .slice(
                        0,
                        40,
                    );
            },
            [
                busquedaProducto,
                productos,
            ],
        );

    const cantidadNumero =
        Number(
            cantidad,
        );

    const costoNumero =
        costoUnitario.trim()
            ? Number(
                costoUnitario,
            )
            : null;

    const stockActual =
        Number(
            existencia?.cantidad_actual ??
            0,
        );

    const esSalida =
        tipo ===
        "AJUSTE_SALIDA" ||
        tipo ===
        "MERMA";

    const stockEstimado =
        Number.isFinite(
            cantidadNumero,
        )
            ? esSalida
                ? stockActual -
                cantidadNumero
                : stockActual +
                cantidadNumero
            : stockActual;

    const valorMovimiento =
        Number.isFinite(
            cantidadNumero,
        ) &&
            costoNumero !==
            null &&
            Number.isFinite(
                costoNumero,
            )
            ? cantidadNumero *
            costoNumero
            : 0;

    const puedeGuardar =
        Boolean(
            sucursalId,
        ) &&
        Boolean(
            productoId,
        ) &&
        Number.isFinite(
            cantidadNumero,
        ) &&
        cantidadNumero >
        0 &&
        !guardando;

    function seleccionarProducto(
        item: ProductoAjuste,
    ) {
        setProductoId(
            item.id,
        );
        setBusquedaProducto(
            item.nombre,
        );
        setMostrarProductos(
            false,
        );

        setCostoUnitario(
            String(
                Number(
                    item.costo_unitario ??
                    0,
                ),
            ),
        );
    }

    function limpiarFormulario() {
        setProductoId("");
        setBusquedaProducto("");
        setTipo(
            "AJUSTE_ENTRADA",
        );
        setCantidad(
            "1",
        );
        setCostoUnitario("");
        setReferencia("");
        setObservaciones("");
        setMensaje(
            null,
        );
    }

    function guardar() {
        if (
            !puedeGuardar
        ) {
            return;
        }

        setMensaje(
            null,
        );

        iniciarTransicion(
            async () => {
                const resultado =
                    await registrarAjusteInventario({
                        sucursalId,
                        productoId,
                        tipo,
                        cantidad:
                            cantidadNumero,
                        costoUnitario:
                            costoNumero,
                        referencia,
                        observaciones,
                    });

                setMensaje({
                    tipo:
                        resultado.exito
                            ? "EXITO"
                            : "ERROR",
                    texto:
                        resultado.mensaje,
                });

                if (
                    resultado.exito
                ) {
                    setCantidad(
                        "1",
                    );
                    setReferencia("");
                    setObservaciones("");
                }
            },
        );
    }

    return (
        <div className="space-y-7 pb-10">
            <section className="salon-hero relative overflow-hidden border border-white/10 bg-sidebar p-6 text-white sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-secondary/15 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/inventario"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#C9D7D0] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a inventario
                    </Link>

                    <div className="mt-6 grid gap-7 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-[#D8E3DE]">
                                <RefreshCcw className="h-3.5 w-3.5" />
                                Movimiento manual
                            </div>

                            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                                Ajustar
                                <span className="text-[#AFC6BB]">
                                    {" "}
                                    inventario
                                </span>
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CDD8D3] sm:text-base">
                                Registra entradas, salidas y mermas dejando una referencia clara del movimiento.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <HeroInfo
                                etiqueta="Stock actual"
                                valor={
                                    producto
                                        ? `${stockActual} ${producto.unidad_medida}`
                                        : "Selecciona producto"
                                }
                                icono={
                                    Package
                                }
                            />

                            <HeroInfo
                                etiqueta="Stock estimado"
                                valor={
                                    producto
                                        ? `${stockEstimado} ${producto.unidad_medida}`
                                        : "—"
                                }
                                icono={
                                    esSalida
                                        ? ArrowUpToLine
                                        : Boxes
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>

            {mensaje && (
                <div
                    className={[
                        "flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-sm",
                        mensaje.tipo ===
                            "EXITO"
                            ? "border-[#CFE0D8] bg-[#E8F1EC] text-[#456B5A]"
                            : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
                    ].join(
                        " ",
                    )}
                >
                    {mensaje.tipo ===
                        "EXITO" ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    )}

                    <p className="text-sm font-bold">
                        {
                            mensaje.texto
                        }
                    </p>
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <article className="salon-panel border border-[#DDE5E1] bg-white p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Movimiento
                            </p>

                            <h2 className="mt-1 text-xl font-black text-sidebar tracking-tight">
                                ¿Qué deseas registrar?
                            </h2>
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-primary">
                            <RefreshCcw className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {TIPOS_AJUSTE.map(
                            (
                                item,
                            ) => {
                                const Icono =
                                    item.icono;

                                const activo =
                                    tipo ===
                                    item.valor;

                                return (
                                    <button
                                        key={
                                            item.valor
                                        }
                                        type="button"
                                        onClick={() =>
                                            setTipo(
                                                item.valor,
                                            )
                                        }
                                        className={[
                                            "rounded-2xl border p-4 text-left transition",
                                            activo
                                                ? "border-[#9DB6AA] bg-surface-soft shadow-sm"
                                                : "border-[#DDE4E0] bg-[#FBFCFA] hover:bg-[#F5F8F6]",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icono className="h-5 w-5 text-[#648275]" />

                                            <span className="text-sm font-black text-[#35443D]">
                                                {
                                                    item.titulo
                                                }
                                            </span>
                                        </div>

                                        <p className="mt-2 text-xs leading-5 text-[#77847E]">
                                            {
                                                item.descripcion
                                            }
                                        </p>
                                    </button>
                                );
                            },
                        )}
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <Campo
                            etiqueta="Sucursal"
                            icono={
                                Store
                            }
                        >
                            <select
                                value={
                                    sucursalId
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSucursalId(
                                        event.target.value,
                                    )
                                }
                                className="salon-control w-full border border-[#D7DFDA] bg-[#F9FBF9] px-4 text-text-secondary outline-none focus:border-primary"
                            >
                                {sucursales.map(
                                    (
                                        item,
                                    ) => (
                                        <option
                                            key={
                                                item.id
                                            }
                                            value={
                                                item.id
                                            }
                                        >
                                            {item.nombre}
                                            {item.es_principal
                                                ? " · Principal"
                                                : ""}
                                        </option>
                                    ),
                                )}
                            </select>
                        </Campo>

                        <Campo
                            etiqueta="Producto"
                            icono={
                                Package
                            }
                        >
                            <div className="relative">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87958D]" />

                                    <input
                                        value={
                                            busquedaProducto
                                        }
                                        onFocus={() =>
                                            setMostrarProductos(
                                                true,
                                            )
                                        }
                                        onChange={(
                                            event,
                                        ) => {
                                            setBusquedaProducto(
                                                event.target.value,
                                            );
                                            setProductoId(
                                                "",
                                            );
                                            setMostrarProductos(
                                                true,
                                            );
                                        }}
                                        placeholder="Nombre, código o barras..."
                                        className="salon-control w-full border border-[#D7DFDA] bg-[#F9FBF9] pl-11 pr-11 font-semibold outline-none transition focus:border-primary focus:bg-white"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMostrarProductos(
                                                (
                                                    actual,
                                                ) =>
                                                    !actual,
                                            )
                                        }
                                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[#77847E] hover:bg-surface-soft"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                </div>

                                {mostrarProductos && (
                                    <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-[#D7DFDA] bg-white p-2 shadow-[0_18px_45px_rgba(36,48,44,0.16)]">
                                        {productosFiltrados.length >
                                            0 ? (
                                            productosFiltrados.map(
                                                (
                                                    item,
                                                ) => (
                                                    <button
                                                        key={
                                                            item.id
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            seleccionarProducto(
                                                                item,
                                                            )
                                                        }
                                                        className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-[#F4F7F5]"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-black text-[#34423C]">
                                                                {
                                                                    item.nombre
                                                                }
                                                            </p>

                                                            <p className="mt-1 truncate text-xs text-[#849088]">
                                                                {item.codigo_producto}
                                                                {item.marca
                                                                    ? ` · ${item.marca}`
                                                                    : ""}
                                                                {item.presentacion
                                                                    ? ` · ${item.presentacion}`
                                                                    : ""}
                                                            </p>
                                                        </div>

                                                        <span className="shrink-0 rounded-full bg-surface-soft px-2.5 py-1 text-xs font-black text-[#5E756A]">
                                                            {
                                                                item.unidad_medida
                                                            }
                                                        </span>
                                                    </button>
                                                ),
                                            )
                                        ) : (
                                            <div className="px-3 py-8 text-center text-sm text-[#859189]">
                                                No se encontraron productos.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Campo>
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <Campo
                            etiqueta="Cantidad"
                            icono={
                                Boxes
                            }
                        >
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                    cantidad
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setCantidad(
                                        event.target.value,
                                    )
                                }
                                className="salon-control w-full border border-[#D7DFDA] bg-[#F9FBF9] px-4 font-semibold outline-none focus:border-primary"
                            />
                        </Campo>

                        <Campo
                            etiqueta={`Costo unitario (${simboloMoneda})`}
                            icono={
                                CircleDollarSign
                            }
                        >
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                    costoUnitario
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setCostoUnitario(
                                        event.target.value,
                                    )
                                }
                                placeholder="Opcional"
                                className="salon-control w-full border border-[#D7DFDA] bg-[#F9FBF9] px-4 font-semibold outline-none focus:border-primary"
                            />
                        </Campo>
                    </div>

                    <div className="mt-5 grid gap-5">
                        <Campo
                            etiqueta="Referencia"
                            icono={
                                RefreshCcw
                            }
                        >
                            <input
                                value={
                                    referencia
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setReferencia(
                                        event.target.value,
                                    )
                                }
                                placeholder="Factura, conteo, motivo, documento..."
                                className="salon-control w-full border border-[#D7DFDA] bg-[#F9FBF9] px-4 font-semibold outline-none focus:border-primary"
                            />
                        </Campo>

                        <label className="block">
                            <span className="mb-2 block text-sm font-black text-text-secondary">
                                Observaciones
                            </span>

                            <textarea
                                value={
                                    observaciones
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setObservaciones(
                                        event.target.value,
                                    )
                                }
                                rows={
                                    4
                                }
                                placeholder="Detalle adicional del movimiento..."
                                className="salon-control w-full resize-none border border-[#D7DFDA] bg-[#F9FBF9] px-4 py-3 font-semibold outline-none focus:border-primary"
                            />
                        </label>
                    </div>
                </article>

                <aside className="space-y-5">
                    <article className="salon-panel border border-[#DDE5E1] bg-white p-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                            Resumen
                        </p>

                        <h2 className="mt-1 text-xl font-black text-sidebar tracking-tight">
                            Vista previa
                        </h2>

                        {producto ? (
                            <div className="mt-5">
                                <div className="rounded-[22px] bg-[#F6F9F7] p-4">
                                    <p className="text-base font-black text-[#33413B]">
                                        {
                                            producto.nombre
                                        }
                                    </p>

                                    <p className="mt-1 text-xs text-[#7D8A83]">
                                        {
                                            producto.codigo_producto
                                        }
                                        {producto.marca
                                            ? ` · ${producto.marca}`
                                            : ""}
                                    </p>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <DatoResumen
                                        etiqueta="Actual"
                                        valor={`${stockActual}`}
                                    />

                                    <DatoResumen
                                        etiqueta="Después"
                                        valor={`${stockEstimado}`}
                                        alerta={
                                            stockEstimado <
                                            0
                                        }
                                    />

                                    <DatoResumen
                                        etiqueta="Mínimo"
                                        valor={`${Number(
                                            existencia?.stock_minimo ??
                                            producto.stock_minimo_general ??
                                            0,
                                        )}`}
                                    />

                                    <DatoResumen
                                        etiqueta="Valor mov."
                                        valor={`${simboloMoneda} ${valorMovimiento.toLocaleString(
                                            "es-NI",
                                            {
                                                minimumFractionDigits:
                                                    2,
                                                maximumFractionDigits:
                                                    2,
                                            },
                                        )}`}
                                    />
                                </div>

                                {stockEstimado <
                                    0 && (
                                        <div className="mt-4 flex gap-3 rounded-2xl border border-[#EDCCCC] bg-[#FAEAEA] p-4 text-[#985D62]">
                                            <AlertTriangle className="h-5 w-5 shrink-0" />
                                            <p className="text-xs font-bold leading-5">
                                                La cantidad seleccionada dejaría el stock por debajo de cero. El servidor decidirá si el movimiento es válido.
                                            </p>
                                        </div>
                                    )}
                            </div>
                        ) : (
                            <div className="mt-5 rounded-[22px] border border-dashed border-[#CBD7D1] px-5 py-10 text-center">
                                <Package className="mx-auto h-8 w-8 text-[#8B9891]" />

                                <p className="mt-3 text-sm font-black text-[#4A5851]">
                                    Selecciona un producto
                                </p>

                                <p className="mt-1 text-xs text-[#89948E]">
                                    Aquí verás su stock y el resultado estimado.
                                </p>
                            </div>
                        )}
                    </article>

                    <article className="salon-panel border border-[#DDE5E1] bg-white p-5">
                        <button
                            type="button"
                            onClick={
                                guardar
                            }
                            disabled={
                                !puedeGuardar
                            }
                            className="salon-action inline-flex w-full items-center justify-center gap-2 bg-sidebar px-5 text-white transition hover:-translate-y-0.5 hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            {guardando ? (
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : (
                                <RefreshCcw className="h-5 w-5" />
                            )}

                            {guardando
                                ? "Registrando..."
                                : "Registrar movimiento"}
                        </button>

                        <button
                            type="button"
                            onClick={
                                limpiarFormulario
                            }
                            className="salon-action mt-3 inline-flex w-full items-center justify-center border border-[#D7DFDA] bg-white text-[#59675F] transition hover:bg-[#F4F7F5]"
                        >
                            Limpiar formulario
                        </button>
                    </article>
                </aside>
            </section>
        </div>
    );
}

function Campo({
    etiqueta,
    icono: Icono,
    children,
}: {
    etiqueta: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-black text-text-secondary">
                <Icono className="h-4 w-4 text-primary" />
                {
                    etiqueta
                }
            </span>

            {
                children
            }
        </label>
    );
}

function HeroInfo({
    etiqueta,
    valor,
    icono: Icono,
}: {
    etiqueta: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.13em] text-[#AEC0B7]">
                        {
                            etiqueta
                        }
                    </p>

                    <p className="mt-2 line-clamp-2 text-sm font-black text-white">
                        {
                            valor
                        }
                    </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-primary-soft">
                    <Icono className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
}

function DatoResumen({
    etiqueta,
    valor,
    alerta = false,
}: {
    etiqueta: string;
    valor: string;
    alerta?: boolean;
}) {
    return (
        <div
            className={[
                "rounded-2xl border p-3",
                alerta
                    ? "border-[#E5C1C3] bg-[#F8ECEC]"
                    : "border-[#E2E8E4] bg-[#FBFCFA]",
            ].join(
                " ",
            )}
        >
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87958D]">
                {
                    etiqueta
                }
            </p>

            <p
                className={[
                    "mt-2 text-lg font-black",
                    alerta
                        ? "text-[#9A6267]"
                        : "text-[#33413B]",
                ].join(
                    " ",
                )}
            >
                {
                    valor
                }
            </p>
        </div>
    );
}
