"use client";

import Link from "next/link";
import {
    AlertTriangle,
    BellRing,
    ArrowDownToLine,
    Boxes,
    CheckCircle2,
    CircleDollarSign,
    Filter,
    History,
    Layers3,
    Package,
    PackageCheck,
    PackageSearch,
    PackageX,
    Search,
    SlidersHorizontal,
    Store,
    Tag,
    TrendingDown,
    Truck,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SucursalInventario = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type CategoriaInventario = {
    id: string;
    nombre: string;
};

export type InventarioFila = {
    id: string;
    salon_id: string;
    sucursal_id: string;
    sucursal_nombre: string;

    producto_id: string;
    codigo_producto: string;
    codigo_barras: string | null;
    producto_nombre: string;
    marca: string | null;
    presentacion: string | null;
    unidad_medida: string;

    costo_unitario: number;
    precio_venta: number;

    controla_stock: boolean;
    producto_estado: string;

    categoria_id: string | null;
    categoria_nombre: string | null;

    cantidad_actual: number;
    stock_minimo: number;
    ubicacion: string | null;
    estado_stock: string;

    actualizado_en: string;
};

type FiltroRapido =
    | "TODOS"
    | "NORMAL"
    | "BAJO"
    | "AGOTADO";

export default function InventarioClient({
    inventario,
    sucursales,
    categorias,
    simboloMoneda,
}: {
    inventario: InventarioFila[];
    sucursales: SucursalInventario[];
    categorias: CategoriaInventario[];
    simboloMoneda: string;
}) {
    const [busqueda, setBusqueda] = useState("");
    const [sucursalId, setSucursalId] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [estadoProducto, setEstadoProducto] =
        useState("ACTIVO");
    const [filtroRapido, setFiltroRapido] =
        useState<FiltroRapido>("TODOS");

    const inventarioFiltrado = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return inventario.filter((fila) => {
            const coincideTexto =
                !texto ||
                fila.producto_nombre
                    .toLowerCase()
                    .includes(texto) ||
                fila.codigo_producto
                    .toLowerCase()
                    .includes(texto) ||
                fila.codigo_barras
                    ?.toLowerCase()
                    .includes(texto) ||
                fila.marca
                    ?.toLowerCase()
                    .includes(texto) ||
                fila.presentacion
                    ?.toLowerCase()
                    .includes(texto) ||
                fila.categoria_nombre
                    ?.toLowerCase()
                    .includes(texto);

            return (
                coincideTexto &&
                (!sucursalId ||
                    fila.sucursal_id ===
                    sucursalId) &&
                (!categoriaId ||
                    fila.categoria_id ===
                    categoriaId) &&
                (filtroRapido === "TODOS" ||
                    fila.estado_stock ===
                    filtroRapido) &&
                (!estadoProducto ||
                    fila.producto_estado ===
                    estadoProducto)
            );
        });
    }, [
        busqueda,
        categoriaId,
        estadoProducto,
        filtroRapido,
        inventario,
        sucursalId,
    ]);

    const resumenGlobal = useMemo(() => {
        const productos = new Set<string>();

        return inventario.reduce(
            (acc, fila) => {
                if (
                    fila.producto_estado !==
                    "ACTIVO"
                ) {
                    return acc;
                }

                productos.add(fila.producto_id);

                const cantidadActual = Number(
                    fila.cantidad_actual || 0,
                );

                return {
                    productos,
                    unidades:
                        acc.unidades +
                        cantidadActual,
                    valor:
                        acc.valor +
                        cantidadActual *
                        Number(
                            fila.costo_unitario ||
                            0,
                        ),
                    bajos:
                        acc.bajos +
                        (fila.estado_stock ===
                            "BAJO"
                            ? 1
                            : 0),
                    agotados:
                        acc.agotados +
                        (fila.estado_stock ===
                            "AGOTADO"
                            ? 1
                            : 0),
                };
            },
            {
                productos,
                unidades: 0,
                valor: 0,
                bajos: 0,
                agotados: 0,
            },
        );
    }, [inventario]);

    const productosCriticos = useMemo(
        () =>
            inventario
                .filter(
                    (fila) =>
                        fila.producto_estado ===
                        "ACTIVO" &&
                        (fila.estado_stock ===
                            "BAJO" ||
                            fila.estado_stock ===
                            "AGOTADO"),
                )
                .sort((a, b) => {
                    if (
                        a.estado_stock ===
                        "AGOTADO" &&
                        b.estado_stock !==
                        "AGOTADO"
                    ) {
                        return -1;
                    }

                    if (
                        b.estado_stock ===
                        "AGOTADO" &&
                        a.estado_stock !==
                        "AGOTADO"
                    ) {
                        return 1;
                    }

                    return (
                        Number(a.cantidad_actual) -
                        Number(b.cantidad_actual)
                    );
                })
                .slice(0, 5),
        [inventario],
    );

    const hayFiltros =
        Boolean(busqueda) ||
        Boolean(sucursalId) ||
        Boolean(categoriaId) ||
        filtroRapido !== "TODOS" ||
        estadoProducto !== "ACTIVO";

    function limpiarFiltros() {
        setBusqueda("");
        setSucursalId("");
        setCategoriaId("");
        setFiltroRapido("TODOS");
        setEstadoProducto("ACTIVO");
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
            {/* CABECERA DIFERENTE AL RESTO DEL SISTEMA */}
            <section className="overflow-hidden rounded-[32px] border border-[#DCE4DF] bg-white shadow-[0_18px_55px_rgba(36,48,44,0.08)]">
                <div className="grid lg:grid-cols-[1fr_420px]">
                    <div className="relative overflow-hidden bg-[#26332F] p-7 text-white sm:p-9">
                        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full border-[35px] border-white/[0.03]" />
                        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-[#6F8F83]/20 blur-3xl" />

                        <div className="relative">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                                    <Layers3 className="h-6 w-6 text-[#DCE7E2]" />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#AFC2B9]">
                                        Centro de control
                                    </p>
                                    <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                        Inventario
                                    </h1>
                                </div>
                            </div>

                            <p className="mt-5 max-w-xl text-sm leading-7 text-[#CDD9D3] sm:text-base">
                                Supervisa productos,
                                existencias y puntos
                                críticos desde una vista
                                operativa diseñada para
                                detectar problemas
                                rápidamente.
                            </p>

                            <div className="mt-7 flex flex-wrap items-center gap-2">
                                <ChipHero
                                    icono={Package}
                                    texto={`${resumenGlobal.productos.size} productos`}
                                />
                                <ChipHero
                                    icono={Store}
                                    texto={`${sucursales.length} sucursal${sucursales.length ===
                                            1
                                            ? ""
                                            : "es"
                                        }`}
                                />
                                <ChipHero
                                    icono={CircleDollarSign}
                                    texto={dinero(
                                        resumenGlobal.valor,
                                    )}
                                />

                                <Link
                                    href="/inventario/catalogo"
                                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#DCE7E2] px-3.5 text-xs font-bold text-[#26332F] transition hover:bg-white"
                                >
                                    <Layers3 className="h-4 w-4" />
                                    Catálogo
                                </Link>

                                <Link
                                    href="/inventario/movimientos/nuevo"
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 text-xs font-bold text-white transition hover:bg-white/[0.14]"
                                >
                                    <ArrowDownToLine className="h-4 w-4" />
                                    Entrada / ajuste
                                </Link>

                                <Link
                                    href="/inventario/movimientos"
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 text-xs font-bold text-white transition hover:bg-white/[0.14]"
                                >
                                    <History className="h-4 w-4" />
                                    Historial
                                </Link>

                                <Link
                                    href="/inventario/alertas"
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E8C5C5]/20 bg-[#C79AA1]/15 px-3.5 text-xs font-bold text-white transition hover:bg-[#C79AA1]/25"
                                >
                                    <BellRing className="h-4 w-4" />
                                    Alertas
                                </Link>

                                <Link
                                    href="/inventario/traslados"
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 text-xs font-bold text-white transition hover:bg-white/[0.14]"
                                >
                                    <Truck className="h-4 w-4" />
                                    Traslados
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#F8FAF8] p-6 sm:p-7">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7A8781]">
                                    Salud del stock
                                </p>
                                <p className="mt-1 text-sm text-[#637069]">
                                    Estado actual por
                                    sucursal
                                </p>
                            </div>

                            <div
                                className={[
                                    "flex h-11 w-11 items-center justify-center rounded-2xl",
                                    resumenGlobal.agotados >
                                        0
                                        ? "bg-[#F8E5E5] text-[#A25E5E]"
                                        : resumenGlobal.bajos >
                                            0
                                            ? "bg-[#FAF0DC] text-[#9A742D]"
                                            : "bg-[#E3EEE8] text-[#527865]",
                                ].join(" ")}
                            >
                                {resumenGlobal.agotados >
                                    0 ? (
                                    <PackageX className="h-5 w-5" />
                                ) : resumenGlobal.bajos >
                                    0 ? (
                                    <AlertTriangle className="h-5 w-5" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5" />
                                )}
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-3">
                            <SaludMini
                                titulo="Unidades"
                                valor={cantidad(
                                    resumenGlobal.unidades,
                                )}
                                estado="NORMAL"
                            />
                            <SaludMini
                                titulo="Bajo"
                                valor={String(
                                    resumenGlobal.bajos,
                                )}
                                estado="BAJO"
                            />
                            <SaludMini
                                titulo="Agotado"
                                valor={String(
                                    resumenGlobal.agotados,
                                )}
                                estado="AGOTADO"
                            />
                        </div>

                        <div className="mt-5 rounded-2xl border border-[#E1E7E3] bg-white p-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#5F6C65]">
                                    Inventario saludable
                                </span>
                                <span className="font-bold text-[#26332F]">
                                    {porcentajeSalud(
                                        inventario,
                                    )}
                                    %
                                </span>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDF1EE]">
                                <div
                                    className="h-full rounded-full bg-[#6F8F83] transition-all"
                                    style={{
                                        width: `${porcentajeSalud(
                                            inventario,
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FILTROS */}
            <section className="rounded-[28px] border border-[#E0E6E2] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#849189]" />

                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder="Buscar producto, código, barra, marca..."
                            className="h-12 w-full rounded-2xl border border-[#D7DED9] bg-[#FBFCFB] pl-12 pr-4 text-sm text-[#26332F] outline-none transition focus:border-[#6F8F83] focus:bg-white focus:ring-4 focus:ring-[#6F8F83]/10"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <SelectCompacto
                            valor={sucursalId}
                            cambiar={setSucursalId}
                            icono={Store}
                            opciones={[
                                {
                                    valor: "",
                                    texto:
                                        "Todas las sucursales",
                                },
                                ...sucursales.map(
                                    (sucursal) => ({
                                        valor:
                                            sucursal.id,
                                        texto:
                                            sucursal.nombre,
                                    }),
                                ),
                            ]}
                        />

                        <SelectCompacto
                            valor={categoriaId}
                            cambiar={setCategoriaId}
                            icono={Tag}
                            opciones={[
                                {
                                    valor: "",
                                    texto:
                                        "Todas las categorías",
                                },
                                ...categorias.map(
                                    (categoria) => ({
                                        valor:
                                            categoria.id,
                                        texto:
                                            categoria.nombre,
                                    }),
                                ),
                            ]}
                        />

                        <SelectCompacto
                            valor={estadoProducto}
                            cambiar={setEstadoProducto}
                            icono={SlidersHorizontal}
                            opciones={[
                                {
                                    valor: "ACTIVO",
                                    texto: "Activos",
                                },
                                {
                                    valor: "INACTIVO",
                                    texto: "Inactivos",
                                },
                                {
                                    valor: "",
                                    texto:
                                        "Todos los productos",
                                },
                            ]}
                        />

                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={
                                    limpiarFiltros
                                }
                                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#EEF2EF] px-4 text-sm font-bold text-[#52605A] transition hover:bg-[#E4EAE6]"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#EDF1EE] pt-5">
                    <FiltroEstado
                        activo={
                            filtroRapido === "TODOS"
                        }
                        onClick={() =>
                            setFiltroRapido("TODOS")
                        }
                        texto="Todos"
                        cantidad={
                            inventario.filter(
                                (item) =>
                                    item.producto_estado ===
                                    "ACTIVO",
                            ).length
                        }
                        icono={Boxes}
                    />

                    <FiltroEstado
                        activo={
                            filtroRapido ===
                            "NORMAL"
                        }
                        onClick={() =>
                            setFiltroRapido(
                                "NORMAL",
                            )
                        }
                        texto="Stock normal"
                        cantidad={
                            inventario.filter(
                                (item) =>
                                    item.producto_estado ===
                                    "ACTIVO" &&
                                    item.estado_stock ===
                                    "NORMAL",
                            ).length
                        }
                        icono={PackageCheck}
                    />

                    <FiltroEstado
                        activo={
                            filtroRapido === "BAJO"
                        }
                        onClick={() =>
                            setFiltroRapido("BAJO")
                        }
                        texto="Stock bajo"
                        cantidad={
                            inventario.filter(
                                (item) =>
                                    item.producto_estado ===
                                    "ACTIVO" &&
                                    item.estado_stock ===
                                    "BAJO",
                            ).length
                        }
                        icono={TrendingDown}
                    />

                    <FiltroEstado
                        activo={
                            filtroRapido ===
                            "AGOTADO"
                        }
                        onClick={() =>
                            setFiltroRapido(
                                "AGOTADO",
                            )
                        }
                        texto="Agotados"
                        cantidad={
                            inventario.filter(
                                (item) =>
                                    item.producto_estado ===
                                    "ACTIVO" &&
                                    item.estado_stock ===
                                    "AGOTADO",
                            ).length
                        }
                        icono={PackageX}
                    />
                </div>
            </section>

            {/* CONTENIDO PRINCIPAL */}
            <div className="grid gap-6 2xl:grid-cols-[1fr_330px]">
                <section>
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#849189]">
                                Existencias
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-[#26332F]">
                                Productos por sucursal
                            </h2>
                        </div>

                        <p className="text-sm font-semibold text-[#718078]">
                            {
                                inventarioFiltrado.length
                            }{" "}
                            resultado
                            {inventarioFiltrado.length ===
                                1
                                ? ""
                                : "s"}
                        </p>
                    </div>

                    {inventarioFiltrado.length ===
                        0 ? (
                        <EstadoVacio />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {inventarioFiltrado.map(
                                (fila) => (
                                    <TarjetaProducto
                                        key={
                                            fila.id
                                        }
                                        fila={
                                            fila
                                        }
                                        dinero={
                                            dinero
                                        }
                                    />
                                ),
                            )}
                        </div>
                    )}
                </section>

                {/* PANEL LATERAL */}
                <aside className="space-y-5">
                    <section className="rounded-[26px] border border-[#E0E6E2] bg-white p-5 shadow-sm 2xl:sticky 2xl:top-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F8E5E5] text-[#A25E5E]">
                                <AlertTriangle className="h-5 w-5" />
                            </div>

                            <div>
                                <h3 className="font-bold text-[#26332F]">
                                    Atención requerida
                                </h3>
                                <p className="text-xs text-[#718078]">
                                    Prioridad de reposición
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {productosCriticos.length ===
                                0 ? (
                                <div className="rounded-2xl bg-[#F4F8F5] p-4 text-center">
                                    <CheckCircle2 className="mx-auto h-7 w-7 text-[#527865]" />
                                    <p className="mt-2 text-sm font-bold text-[#40584E]">
                                        Todo en orden
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-[#6F7C75]">
                                        No hay productos
                                        agotados ni con
                                        stock bajo.
                                    </p>
                                </div>
                            ) : (
                                productosCriticos.map(
                                    (fila) => (
                                        <Critico
                                            key={
                                                fila.id
                                            }
                                            fila={
                                                fila
                                            }
                                        />
                                    ),
                                )
                            )}
                        </div>

                        <div className="mt-5 border-t border-[#EDF1EE] pt-5">
                            <div className="flex items-center gap-2 text-xs text-[#718078]">
                                <PackageSearch className="h-4 w-4" />
                                <span>
                                    Este panel se actualiza
                                    según las existencias
                                    registradas.
                                </span>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

function TarjetaProducto({
    fila,
    dinero,
}: {
    fila: InventarioFila;
    dinero: (valor: number) => string;
}) {
    const porcentaje =
        calcularNivelStock(
            fila.cantidad_actual,
            fila.stock_minimo,
        );

    return (
        <article className="group relative overflow-hidden rounded-[26px] border border-[#E0E6E2] bg-white p-5 shadow-[0_8px_25px_rgba(36,48,44,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(36,48,44,0.09)]">
            <div
                className={[
                    "absolute inset-x-0 top-0 h-1",
                    fila.estado_stock ===
                        "AGOTADO"
                        ? "bg-[#C98585]"
                        : fila.estado_stock ===
                            "BAJO"
                            ? "bg-[#D8B267]"
                            : "bg-[#7FA394]",
                ].join(" ")}
            />

            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <EstadoStock
                            estado={
                                fila.estado_stock
                            }
                        />

                        {fila.categoria_nombre && (
                            <span className="rounded-lg bg-[#F1F4F2] px-2 py-1 text-[10px] font-bold text-[#718078]">
                                {
                                    fila.categoria_nombre
                                }
                            </span>
                        )}
                    </div>

                    <h3 className="mt-3 truncate text-base font-bold text-[#26332F]">
                        {fila.producto_nombre}
                    </h3>

                    <p className="mt-1 truncate text-xs text-[#829089]">
                        {fila.codigo_producto}
                        {fila.marca
                            ? ` · ${fila.marca}`
                            : ""}
                    </p>
                </div>

                <div
                    className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                        fila.estado_stock ===
                            "AGOTADO"
                            ? "bg-[#F8E5E5] text-[#A25E5E]"
                            : fila.estado_stock ===
                                "BAJO"
                                ? "bg-[#FAF0DC] text-[#9A742D]"
                                : "bg-[#E3EEE8] text-[#527865]",
                    ].join(" ")}
                >
                    <Package className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#F8FAF8] p-4">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#87938D]">
                            Disponible
                        </p>

                        <p
                            className={[
                                "mt-1 text-2xl font-bold",
                                fila.estado_stock ===
                                    "AGOTADO"
                                    ? "text-[#A25E5E]"
                                    : fila.estado_stock ===
                                        "BAJO"
                                        ? "text-[#9A742D]"
                                        : "text-[#315C4B]",
                            ].join(" ")}
                        >
                            {cantidad(
                                fila.cantidad_actual,
                            )}{" "}
                            <span className="text-sm font-semibold">
                                {abreviarUnidad(
                                    fila.unidad_medida,
                                )}
                            </span>
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#87938D]">
                            Mínimo
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#52605A]">
                            {cantidad(
                                fila.stock_minimo,
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E7ECE9]">
                    <div
                        className={[
                            "h-full rounded-full transition-all",
                            fila.estado_stock ===
                                "AGOTADO"
                                ? "bg-[#C98585]"
                                : fila.estado_stock ===
                                    "BAJO"
                                    ? "bg-[#D8B267]"
                                    : "bg-[#7FA394]",
                        ].join(" ")}
                        style={{
                            width: `${porcentaje}%`,
                        }}
                    />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <DatoProducto
                    titulo="Costo"
                    valor={dinero(
                        fila.costo_unitario,
                    )}
                />
                <DatoProducto
                    titulo="Precio"
                    valor={dinero(
                        fila.precio_venta,
                    )}
                />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EDF1EE] pt-4">
                <div className="flex min-w-0 items-center gap-2 text-xs text-[#637069]">
                    <Store className="h-4 w-4 shrink-0 text-[#6F8F83]" />
                    <span className="truncate font-semibold">
                        {fila.sucursal_nombre}
                    </span>
                </div>

                <span className="max-w-[45%] truncate text-xs text-[#89948F]">
                    {fila.ubicacion ??
                        "Sin ubicación"}
                </span>
            </div>
        </article>
    );
}

function Critico({
    fila,
}: {
    fila: InventarioFila;
}) {
    return (
        <div className="rounded-2xl border border-[#E7EBE8] bg-[#FBFCFB] p-3.5">
            <div className="flex items-start gap-3">
                <div
                    className={[
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        fila.estado_stock ===
                            "AGOTADO"
                            ? "bg-[#F8E5E5] text-[#A25E5E]"
                            : "bg-[#FAF0DC] text-[#9A742D]",
                    ].join(" ")}
                >
                    {fila.estado_stock ===
                        "AGOTADO" ? (
                        <PackageX className="h-4 w-4" />
                    ) : (
                        <TrendingDown className="h-4 w-4" />
                    )}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#33413B]">
                        {fila.producto_nombre}
                    </p>

                    <p className="mt-1 truncate text-[11px] text-[#829089]">
                        {fila.sucursal_nombre}
                    </p>

                    <p
                        className={[
                            "mt-2 text-xs font-bold",
                            fila.estado_stock ===
                                "AGOTADO"
                                ? "text-[#A25E5E]"
                                : "text-[#9A742D]",
                        ].join(" ")}
                    >
                        {fila.estado_stock ===
                            "AGOTADO"
                            ? "Agotado"
                            : `${cantidad(
                                fila.cantidad_actual,
                            )} disponibles`}
                    </p>
                </div>
            </div>
        </div>
    );
}

function FiltroEstado({
    activo,
    onClick,
    texto,
    cantidad,
    icono: Icono,
}: {
    activo: boolean;
    onClick: () => void;
    texto: string;
    cantidad: number;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition",
                activo
                    ? "border-[#26332F] bg-[#26332F] text-white"
                    : "border-[#E0E6E2] bg-white text-[#5F6D66] hover:bg-[#F6F8F6]",
            ].join(" ")}
        >
            <Icono className="h-4 w-4" />
            {texto}
            <span
                className={[
                    "rounded-lg px-1.5 py-0.5 text-[10px]",
                    activo
                        ? "bg-white/15 text-white"
                        : "bg-[#EEF2EF] text-[#6B756F]",
                ].join(" ")}
            >
                {cantidad}
            </span>
        </button>
    );
}

function SelectCompacto({
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
            <Icono className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

            <select
                value={valor}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="h-12 max-w-[220px] rounded-2xl border border-[#D7DED9] bg-[#FBFCFB] pl-10 pr-8 text-sm font-semibold text-[#52605A] outline-none transition focus:border-[#6F8F83] focus:bg-white"
            >
                {opciones.map((opcion) => (
                    <option
                        key={
                            opcion.valor ||
                            opcion.texto
                        }
                        value={opcion.valor}
                    >
                        {opcion.texto}
                    </option>
                ))}
            </select>
        </div>
    );
}

function EstadoStock({
    estado,
}: {
    estado: string;
}) {
    const estilos: Record<
        string,
        string
    > = {
        NORMAL:
            "bg-[#E3EEE8] text-[#527865]",
        BAJO:
            "bg-[#FAF0DC] text-[#9A742D]",
        AGOTADO:
            "bg-[#F8E5E5] text-[#A25E5E]",
    };

    const textos: Record<
        string,
        string
    > = {
        NORMAL: "Normal",
        BAJO: "Stock bajo",
        AGOTADO: "Agotado",
    };

    return (
        <span
            className={[
                "inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase",
                estilos[estado] ??
                "bg-[#EEF2EF] text-[#6B756F]",
            ].join(" ")}
        >
            {textos[estado] ?? estado}
        </span>
    );
}

function ChipHero({
    icono: Icono,
    texto,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    texto: string;
}) {
    return (
        <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-[#E1E8E4]">
            <Icono className="h-4 w-4 text-[#AFC2B9]" />
            {texto}
        </span>
    );
}

function SaludMini({
    titulo,
    valor,
    estado,
}: {
    titulo: string;
    valor: string;
    estado: "NORMAL" | "BAJO" | "AGOTADO";
}) {
    return (
        <div className="rounded-2xl border border-[#E1E7E3] bg-white p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#89948F]">
                {titulo}
            </p>

            <p
                className={[
                    "mt-2 text-lg font-bold",
                    estado === "AGOTADO"
                        ? "text-[#A25E5E]"
                        : estado === "BAJO"
                            ? "text-[#9A742D]"
                            : "text-[#315C4B]",
                ].join(" ")}
            >
                {valor}
            </p>
        </div>
    );
}

function DatoProducto({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl border border-[#EBEFEC] bg-white px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#929C97]">
                {titulo}
            </p>
            <p className="mt-1 text-xs font-bold text-[#405049]">
                {valor}
            </p>
        </div>
    );
}

function EstadoVacio() {
    return (
        <div className="rounded-[28px] border border-dashed border-[#CCD6D0] bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2EF] text-[#6F8F83]">
                <PackageSearch className="h-7 w-7" />
            </div>

            <h3 className="mt-4 font-bold text-[#26332F]">
                No encontramos productos
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#718078]">
                Cambia los filtros o la búsqueda
                para consultar otras existencias.
            </p>
        </div>
    );
}

function calcularNivelStock(
    actual: number,
    minimo: number,
) {
    const cantidadActual =
        Number(actual || 0);
    const stockMinimo =
        Number(minimo || 0);

    if (cantidadActual <= 0) {
        return 0;
    }

    if (stockMinimo <= 0) {
        return 100;
    }

    /*
     * La barra toma 2x el mínimo como nivel
     * visual saludable completo.
     */
    return Math.min(
        100,
        Math.max(
            5,
            (cantidadActual /
                (stockMinimo * 2)) *
            100,
        ),
    );
}

function porcentajeSalud(
    inventario: InventarioFila[],
) {
    const activos =
        inventario.filter(
            (fila) =>
                fila.producto_estado ===
                "ACTIVO",
        );

    if (activos.length === 0) {
        return 100;
    }

    const normales =
        activos.filter(
            (fila) =>
                fila.estado_stock ===
                "NORMAL",
        ).length;

    return Math.round(
        (normales / activos.length) * 100,
    );
}

function cantidad(valor: number) {
    return Number(valor).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
        },
    );
}

function abreviarUnidad(
    unidad: string,
) {
    const unidades: Record<
        string,
        string
    > = {
        UNIDAD: "und.",
        ML: "ml",
        LITRO: "L",
        GRAMO: "g",
        KILOGRAMO: "kg",
        ONZA: "oz",
        CAJA: "caja",
        PAQUETE: "paq.",
    };

    return (
        unidades[
        unidad.toUpperCase()
        ] ?? unidad
    );
}