"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowDownToLine,
    ArrowLeft,
    BellRing,
    Boxes,
    CheckCircle2,
    Package,
    PackageX,
    Search,
    Store,
    Tag,
    TrendingDown,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SucursalAlerta = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type AlertaInventario = {
    id: string;
    sucursal_id: string;
    sucursal_nombre: string;

    producto_id: string;
    codigo_producto: string;
    codigo_barras: string | null;
    producto_nombre: string;
    marca: string | null;
    presentacion: string | null;
    unidad_medida: string;

    categoria_id: string | null;
    categoria_nombre: string | null;

    cantidad_actual: number;
    stock_minimo: number;
    ubicacion: string | null;
    estado_stock: string;
    actualizado_en: string;
};

export default function AlertasInventarioClient({
    alertas,
    sucursales,
}: {
    alertas: AlertaInventario[];
    sucursales: SucursalAlerta[];
}) {
    const [busqueda, setBusqueda] =
        useState("");
    const [sucursalId, setSucursalId] =
        useState("");
    const [estado, setEstado] =
        useState("");

    const alertasFiltradas = useMemo(() => {
        const texto =
            busqueda.trim().toLowerCase();

        return alertas.filter((alerta) => {
            const coincideTexto =
                !texto ||
                alerta.producto_nombre
                    .toLowerCase()
                    .includes(texto) ||
                alerta.codigo_producto
                    .toLowerCase()
                    .includes(texto) ||
                alerta.codigo_barras
                    ?.toLowerCase()
                    .includes(texto) ||
                alerta.marca
                    ?.toLowerCase()
                    .includes(texto) ||
                alerta.categoria_nombre
                    ?.toLowerCase()
                    .includes(texto);

            return (
                coincideTexto &&
                (!sucursalId ||
                    alerta.sucursal_id ===
                    sucursalId) &&
                (!estado ||
                    alerta.estado_stock ===
                    estado)
            );
        });
    }, [
        alertas,
        busqueda,
        estado,
        sucursalId,
    ]);

    const resumen = useMemo(() => {
        const agotados =
            alertasFiltradas.filter(
                (alerta) =>
                    alerta.estado_stock ===
                    "AGOTADO",
            ).length;

        const bajos =
            alertasFiltradas.filter(
                (alerta) =>
                    alerta.estado_stock ===
                    "BAJO",
            ).length;

        const faltante = alertasFiltradas.reduce(
            (total, alerta) =>
                total +
                cantidadRecomendada(alerta),
            0,
        );

        return {
            total:
                alertasFiltradas.length,
            agotados,
            bajos,
            faltante,
        };
    }, [alertasFiltradas]);

    const hayFiltros =
        Boolean(busqueda) ||
        Boolean(sucursalId) ||
        Boolean(estado);

    function limpiarFiltros() {
        setBusqueda("");
        setSucursalId("");
        setEstado("");
    }

    return (
        <div className="space-y-6">
            <section className="salon-panel overflow-hidden border border-[#E1E6E3] bg-white">
                <div className="grid xl:grid-cols-[1fr_390px]">
                    <div className="salon-hero relative overflow-hidden bg-sidebar p-7 text-white sm:p-9">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

                        <div className="relative">
                            <Link
                                href="/inventario"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver a Inventario
                            </Link>

                            <div className="mt-6 flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F8E5E5] text-[#A25E5E]">
                                    <BellRing className="h-7 w-7" />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#AFC2B9]">
                                        Control preventivo
                                    </p>

                                    <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                        Alertas de stock
                                    </h1>

                                    <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                        Detecta productos
                                        agotados o cerca del
                                        mínimo antes de que
                                        afecten la operación
                                        del salón.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#F8FAF8] p-6 sm:p-7">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7A8781]">
                            Prioridad actual
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <MiniResumen
                                titulo="Agotados"
                                valor={String(
                                    resumen.agotados,
                                )}
                                tipo="AGOTADO"
                            />

                            <MiniResumen
                                titulo="Stock bajo"
                                valor={String(
                                    resumen.bajos,
                                )}
                                tipo="BAJO"
                            />
                        </div>

                        <div className="mt-4 rounded-2xl border border-border bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#89948F]">
                                Registros con atención
                            </p>

                            <p className="mt-2 text-3xl font-bold text-sidebar">
                                {resumen.total}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[#718078]">
                                Cada producto se evalúa
                                de forma independiente
                                por sucursal.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {alertas.length === 0 ? (
                <section className="salon-panel border border-primary-soft bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E3EEE8] text-[#527865]">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-sidebar tracking-tight">
                        Inventario saludable
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#718078]">
                        No hay productos agotados ni
                        existencias iguales o menores a
                        su stock mínimo.
                    </p>
                </section>
            ) : (
                <>
                    <section className="salon-panel border border-border bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                                <input
                                    value={busqueda}
                                    onChange={(event) =>
                                        setBusqueda(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Buscar producto, código, marca..."
                                    className="salon-control w-full border border-border-strong bg-[#FBFCFB] pl-11 pr-4 outline-none focus:border-primary"
                                />
                            </div>

                            <Select
                                valor={
                                    sucursalId
                                }
                                cambiar={
                                    setSucursalId
                                }
                                icono={Store}
                                opciones={[
                                    {
                                        valor: "",
                                        texto:
                                            "Todas las sucursales",
                                    },
                                    ...sucursales.map(
                                        (
                                            sucursal,
                                        ) => ({
                                            valor:
                                                sucursal.id,
                                            texto:
                                                sucursal.nombre,
                                        }),
                                    ),
                                ]}
                            />

                            <Select
                                valor={estado}
                                cambiar={setEstado}
                                icono={
                                    AlertTriangle
                                }
                                opciones={[
                                    {
                                        valor: "",
                                        texto:
                                            "Todas las alertas",
                                    },
                                    {
                                        valor:
                                            "AGOTADO",
                                        texto:
                                            "Solo agotados",
                                    },
                                    {
                                        valor: "BAJO",
                                        texto:
                                            "Solo stock bajo",
                                    },
                                ]}
                            />

                            {hayFiltros && (
                                <button
                                    type="button"
                                    onClick={
                                        limpiarFiltros
                                    }
                                    className="salon-action inline-flex items-center justify-center gap-2 bg-surface-soft px-4 text-[#52605A]"
                                >
                                    <X className="h-4 w-4" />
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </section>

                    <section>
                        <div className="mb-4 flex items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#849189]">
                                    Reposición
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-sidebar tracking-tight">
                                    Productos que requieren atención
                                </h2>
                            </div>

                            <p className="text-sm font-semibold text-[#718078]">
                                {
                                    alertasFiltradas.length
                                }{" "}
                                resultado
                                {alertasFiltradas.length ===
                                    1
                                    ? ""
                                    : "s"}
                            </p>
                        </div>

                        {alertasFiltradas.length ===
                            0 ? (
                            <div className="salon-panel border border-dashed border-[#CCD6D0] bg-white p-10 text-center text-sm text-[#718078]">
                                No hay alertas con los
                                filtros seleccionados.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {alertasFiltradas.map(
                                    (alerta) => (
                                        <TarjetaAlerta
                                            key={
                                                alerta.id
                                            }
                                            alerta={
                                                alerta
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

function TarjetaAlerta({
    alerta,
}: {
    alerta: AlertaInventario;
}) {
    const agotado =
        alerta.estado_stock ===
        "AGOTADO";

    const faltante =
        cantidadRecomendada(alerta);

    return (
        <article className="salon-panel relative overflow-hidden border border-border bg-white p-5">
            <div
                className={[
                    "absolute inset-x-0 top-0 h-1",
                    agotado
                        ? "bg-[#C98585]"
                        : "bg-[#D8B267]",
                ].join(" ")}
            />

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <span
                        className={[
                            "inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase",
                            agotado
                                ? "bg-[#F8E5E5] text-[#A25E5E]"
                                : "bg-[#FAF0DC] text-[#9A742D]",
                        ].join(" ")}
                    >
                        {agotado
                            ? "Agotado"
                            : "Stock bajo"}
                    </span>

                    <h3 className="mt-3 truncate text-base font-bold text-sidebar tracking-tight">
                        {
                            alerta.producto_nombre
                        }
                    </h3>

                    <p className="mt-1 truncate text-xs text-[#829089]">
                        {
                            alerta.codigo_producto
                        }
                        {alerta.marca
                            ? ` · ${alerta.marca}`
                            : ""}
                    </p>
                </div>

                <div
                    className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                        agotado
                            ? "bg-[#F8E5E5] text-[#A25E5E]"
                            : "bg-[#FAF0DC] text-[#9A742D]",
                    ].join(" ")}
                >
                    {agotado ? (
                        <PackageX className="h-5 w-5" />
                    ) : (
                        <TrendingDown className="h-5 w-5" />
                    )}
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
                <Dato
                    titulo="Actual"
                    valor={`${cantidad(
                        alerta.cantidad_actual,
                    )} ${abreviarUnidad(
                        alerta.unidad_medida,
                    )}`}
                />

                <Dato
                    titulo="Mínimo"
                    valor={`${cantidad(
                        alerta.stock_minimo,
                    )} ${abreviarUnidad(
                        alerta.unidad_medida,
                    )}`}
                />

                <Dato
                    titulo="Reponer"
                    valor={`${cantidad(
                        faltante,
                    )} ${abreviarUnidad(
                        alerta.unidad_medida,
                    )}`}
                    destacar
                />
            </div>

            <div className="mt-4 space-y-2 rounded-2xl bg-[#F8FAF8] p-3.5 text-xs text-[#65726B]">
                <p className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    <strong className="text-[#405049]">
                        {
                            alerta.sucursal_nombre
                        }
                    </strong>
                </p>

                {alerta.categoria_nombre && (
                    <p className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-[#829089]" />
                        {
                            alerta.categoria_nombre
                        }
                    </p>
                )}

                <p>
                    Ubicación:{" "}
                    <strong className="text-[#405049]">
                        {alerta.ubicacion ??
                            "Sin ubicación"}
                    </strong>
                </p>
            </div>

            <div className="mt-4">
                <Link
                    href="/inventario/movimientos/nuevo"
                    className="salon-action inline-flex w-full items-center justify-center gap-2 bg-sidebar text-white transition hover:bg-[#34443F]"
                >
                    <ArrowDownToLine className="h-4 w-4" />
                    Registrar entrada
                </Link>
            </div>
        </article>
    );
}

function MiniResumen({
    titulo,
    valor,
    tipo,
}: {
    titulo: string;
    valor: string;
    tipo: "AGOTADO" | "BAJO";
}) {
    return (
        <div
            className={[
                "rounded-2xl border p-4",
                tipo === "AGOTADO"
                    ? "border-[#ECD4D4] bg-[#FFF9F9]"
                    : "border-[#EEE1C6] bg-[#FFFDF8]",
            ].join(" ")}
        >
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#89948F]">
                {titulo}
            </p>

            <p
                className={[
                    "mt-2 text-2xl font-bold",
                    tipo === "AGOTADO"
                        ? "text-[#A25E5E]"
                        : "text-[#9A742D]",
                ].join(" ")}
            >
                {valor}
            </p>
        </div>
    );
}

function Dato({
    titulo,
    valor,
    destacar = false,
}: {
    titulo: string;
    valor: string;
    destacar?: boolean;
}) {
    return (
        <div
            className={[
                "rounded-xl p-3",
                destacar
                    ? "bg-surface-soft"
                    : "bg-[#F8FAF8]",
            ].join(" ")}
        >
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#929C97]">
                {titulo}
            </p>

            <p
                className={[
                    "mt-1 text-xs font-bold",
                    destacar
                        ? "text-[#315C4B]"
                        : "text-[#405049]",
                ].join(" ")}
            >
                {valor}
            </p>
        </div>
    );
}

function Select({
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
                className="salon-control min-w-[190px] border border-border-strong bg-white pl-11 pr-4"
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

function cantidadRecomendada(
    alerta: AlertaInventario,
) {
    const actual = Number(
        alerta.cantidad_actual || 0,
    );

    const minimo = Number(
        alerta.stock_minimo || 0,
    );

    /*
     * Sugerimos recuperar al menos el doble
     * del mínimo para salir de la zona crítica.
     * Si no tiene mínimo configurado, sugerimos 1.
     */
    const objetivo =
        minimo > 0
            ? minimo * 2
            : 1;

    return Math.max(
        0,
        objetivo - actual,
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