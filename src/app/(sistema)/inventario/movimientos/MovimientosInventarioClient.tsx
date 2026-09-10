"use client";

import Link from "next/link";
import {
    ArrowDownToLine,
    ArrowLeft,
    ArrowRight,
    ArrowUpFromLine,
    Boxes,
    CalendarDays,
    CircleDollarSign,
    Filter,
    History,
    Package,
    Search,
    Store,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SucursalMovimiento = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type MovimientoInventarioListado = {
    id: string;
    sucursal_id: string;
    producto_id: string;
    tipo: string;
    naturaleza: string;
    cantidad: number;
    cantidad_anterior: number;
    cantidad_nueva: number;
    costo_unitario: number | null;
    venta_id: string | null;
    cita_id: string | null;
    movimiento_origen_id: string | null;
    referencia: string | null;
    concepto: string | null;
    observaciones: string | null;
    fecha_movimiento: string;

    sucursales: {
        nombre: string;
    } | null;

    productos: {
        id: string;
        codigo_producto: string;
        codigo_barras: string | null;
        nombre: string;
        marca: string | null;
        presentacion: string | null;
        unidad_medida: string;
    } | null;

    ventas: {
        codigo_venta: string | null;
    } | null;
};

export default function MovimientosInventarioClient({
    movimientos,
    sucursales,
    simboloMoneda,
}: {
    movimientos: MovimientoInventarioListado[];
    sucursales: SucursalMovimiento[];
    simboloMoneda: string;
}) {
    const [busqueda, setBusqueda] =
        useState("");
    const [sucursalId, setSucursalId] =
        useState("");
    const [tipo, setTipo] =
        useState("");
    const [naturaleza, setNaturaleza] =
        useState("");
    const [fechaDesde, setFechaDesde] =
        useState("");
    const [fechaHasta, setFechaHasta] =
        useState("");

    const movimientosFiltrados = useMemo(() => {
        const texto =
            busqueda.trim().toLowerCase();

        return movimientos.filter(
            (movimiento) => {
                const fecha =
                    movimiento.fecha_movimiento.slice(
                        0,
                        10,
                    );

                const producto =
                    movimiento.productos;

                const coincideTexto =
                    !texto ||
                    producto?.nombre
                        .toLowerCase()
                        .includes(texto) ||
                    producto?.codigo_producto
                        .toLowerCase()
                        .includes(texto) ||
                    producto?.codigo_barras
                        ?.toLowerCase()
                        .includes(texto) ||
                    producto?.marca
                        ?.toLowerCase()
                        .includes(texto) ||
                    movimiento.referencia
                        ?.toLowerCase()
                        .includes(texto) ||
                    movimiento.concepto
                        ?.toLowerCase()
                        .includes(texto) ||
                    movimiento.ventas
                        ?.codigo_venta
                        ?.toLowerCase()
                        .includes(texto);

                return (
                    coincideTexto &&
                    (!sucursalId ||
                        movimiento.sucursal_id ===
                        sucursalId) &&
                    (!tipo ||
                        movimiento.tipo ===
                        tipo) &&
                    (!naturaleza ||
                        movimiento.naturaleza ===
                        naturaleza) &&
                    (!fechaDesde ||
                        fecha >= fechaDesde) &&
                    (!fechaHasta ||
                        fecha <= fechaHasta)
                );
            },
        );
    }, [
        busqueda,
        fechaDesde,
        fechaHasta,
        movimientos,
        naturaleza,
        sucursalId,
        tipo,
    ]);

    const resumen = useMemo(() => {
        return movimientosFiltrados.reduce(
            (acc, movimiento) => {
                const cantidad = Number(
                    movimiento.cantidad || 0,
                );

                return {
                    total:
                        acc.total + 1,
                    entradas:
                        acc.entradas +
                        (movimiento.naturaleza ===
                            "ENTRADA"
                            ? cantidad
                            : 0),
                    salidas:
                        acc.salidas +
                        (movimiento.naturaleza ===
                            "SALIDA"
                            ? cantidad
                            : 0),
                    mermas:
                        acc.mermas +
                        (movimiento.tipo ===
                            "MERMA"
                            ? cantidad
                            : 0),
                    valorEntradas:
                        acc.valorEntradas +
                        (movimiento.naturaleza ===
                            "ENTRADA" &&
                            movimiento.costo_unitario
                            ? cantidad *
                            Number(
                                movimiento.costo_unitario,
                            )
                            : 0),
                };
            },
            {
                total: 0,
                entradas: 0,
                salidas: 0,
                mermas: 0,
                valorEntradas: 0,
            },
        );
    }, [movimientosFiltrados]);

    const hayFiltros =
        Boolean(busqueda) ||
        Boolean(sucursalId) ||
        Boolean(tipo) ||
        Boolean(naturaleza) ||
        Boolean(fechaDesde) ||
        Boolean(fechaHasta);

    function limpiarFiltros() {
        setBusqueda("");
        setSucursalId("");
        setTipo("");
        setNaturaleza("");
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
            <section className="salon-hero overflow-hidden bg-sidebar p-7 text-white sm:p-9">
                <Link
                    href="/inventario"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Inventario
                </Link>

                <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                            <History className="h-7 w-7 text-primary-soft" />
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#AFC2B9]">
                                Auditoría de stock
                            </p>

                            <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                Historial de movimientos
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Revisa cada entrada y
                                salida registrada,
                                incluyendo el stock
                                anterior y el resultado
                                final.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/inventario/movimientos/nuevo"
                        className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-4 text-sidebar transition hover:bg-white"
                    >
                        <ArrowDownToLine className="h-4 w-4" />
                        Nuevo ajuste
                    </Link>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Resumen
                    titulo="Movimientos"
                    valor={String(
                        resumen.total,
                    )}
                    icono={History}
                />

                <Resumen
                    titulo="Entradas"
                    valor={cantidad(
                        resumen.entradas,
                    )}
                    icono={
                        ArrowDownToLine
                    }
                />

                <Resumen
                    titulo="Salidas"
                    valor={cantidad(
                        resumen.salidas,
                    )}
                    icono={
                        ArrowUpFromLine
                    }
                />

                <Resumen
                    titulo="Mermas"
                    valor={cantidad(
                        resumen.mermas,
                    )}
                    icono={Package}
                />

                <Resumen
                    titulo="Valor entradas"
                    valor={dinero(
                        resumen.valorEntradas,
                    )}
                    icono={
                        CircleDollarSign
                    }
                />
            </section>

            <section className="salon-panel border border-border bg-white shadow-sm">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="font-bold text-sidebar tracking-tight">
                                Filtros
                            </h2>
                            <p className="mt-1 text-sm text-[#718078]">
                                Busca por producto,
                                código, referencia,
                                concepto o venta.
                            </p>
                        </div>

                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={
                                    limpiarFiltros
                                }
                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-surface-soft px-3 text-xs font-bold text-[#52605A]"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-6 sm:p-6">
                    <div className="relative sm:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder="Producto, código, referencia..."
                            className="salon-control w-full border border-border-strong bg-[#FBFCFB] pl-11 pr-4 outline-none focus:border-primary"
                        />
                    </div>

                    <Select
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

                    <Select
                        valor={tipo}
                        cambiar={setTipo}
                        icono={Filter}
                        opciones={[
                            {
                                valor: "",
                                texto:
                                    "Todos los tipos",
                            },
                            {
                                valor:
                                    "ENTRADA_INICIAL",
                                texto:
                                    "Carga inicial",
                            },
                            {
                                valor: "COMPRA",
                                texto: "Compra",
                            },
                            {
                                valor: "VENTA",
                                texto: "Venta",
                            },
                            {
                                valor:
                                    "CONSUMO_SERVICIO",
                                texto:
                                    "Consumo servicio",
                            },
                            {
                                valor:
                                    "AJUSTE_ENTRADA",
                                texto:
                                    "Ajuste entrada",
                            },
                            {
                                valor:
                                    "AJUSTE_SALIDA",
                                texto:
                                    "Ajuste salida",
                            },
                            {
                                valor:
                                    "DEVOLUCION_CLIENTE",
                                texto:
                                    "Devolución cliente",
                            },
                            {
                                valor:
                                    "DEVOLUCION_PROVEEDOR",
                                texto:
                                    "Devolución proveedor",
                            },
                            {
                                valor:
                                    "TRASLADO_ENTRADA",
                                texto:
                                    "Traslado entrada",
                            },
                            {
                                valor:
                                    "TRASLADO_SALIDA",
                                texto:
                                    "Traslado salida",
                            },
                            {
                                valor: "MERMA",
                                texto: "Merma",
                            },
                            {
                                valor:
                                    "ANULACION",
                                texto:
                                    "Anulación",
                            },
                        ]}
                    />

                    <Select
                        valor={naturaleza}
                        cambiar={
                            setNaturaleza
                        }
                        icono={Boxes}
                        opciones={[
                            {
                                valor: "",
                                texto:
                                    "Entrada y salida",
                            },
                            {
                                valor:
                                    "ENTRADA",
                                texto:
                                    "Solo entradas",
                            },
                            {
                                valor:
                                    "SALIDA",
                                texto:
                                    "Solo salidas",
                            },
                        ]}
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <Fecha
                            titulo="Desde"
                            valor={fechaDesde}
                            cambiar={
                                setFechaDesde
                            }
                        />
                        <Fecha
                            titulo="Hasta"
                            valor={fechaHasta}
                            cambiar={
                                setFechaHasta
                            }
                        />
                    </div>
                </div>
            </section>

            <section className="salon-panel overflow-hidden border border-border bg-white shadow-sm">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <h2 className="font-bold text-sidebar tracking-tight">
                        Movimientos registrados
                    </h2>

                    <p className="mt-1 text-sm text-[#718078]">
                        {
                            movimientosFiltrados.length
                        }{" "}
                        resultado
                        {movimientosFiltrados.length ===
                            1
                            ? ""
                            : "s"}
                    </p>
                </header>

                {movimientosFiltrados.length ===
                    0 ? (
                    <EstadoVacio />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="salon-table w-full min-w-[1350px]">
                                <thead className="bg-[#FBFCFA] text-left text-xs uppercase text-[#76817B]">
                                    <tr>
                                        <Th>
                                            Fecha
                                        </Th>
                                        <Th>
                                            Producto
                                        </Th>
                                        <Th>
                                            Sucursal
                                        </Th>
                                        <Th>
                                            Tipo
                                        </Th>
                                        <Th>
                                            Cantidad
                                        </Th>
                                        <Th>
                                            Stock
                                        </Th>
                                        <Th>
                                            Costo
                                        </Th>
                                        <Th>
                                            Referencia
                                        </Th>
                                        <Th>
                                            Observación
                                        </Th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#E8ECE9]">
                                    {movimientosFiltrados.map(
                                        (
                                            movimiento,
                                        ) => (
                                            <FilaMovimiento
                                                key={
                                                    movimiento.id
                                                }
                                                movimiento={
                                                    movimiento
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
                            {movimientosFiltrados.map(
                                (
                                    movimiento,
                                ) => (
                                    <TarjetaMovimiento
                                        key={
                                            movimiento.id
                                        }
                                        movimiento={
                                            movimiento
                                        }
                                        dinero={
                                            dinero
                                        }
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

function FilaMovimiento({
    movimiento,
    dinero,
}: {
    movimiento: MovimientoInventarioListado;
    dinero: (valor: number) => string;
}) {
    const producto =
        movimiento.productos;

    return (
        <tr className="text-sm text-[#33413B] hover:bg-[#FBFCFA]">
            <Td>
                {formatearFechaHora(
                    movimiento.fecha_movimiento,
                )}
            </Td>

            <Td>
                <p className="font-bold text-sidebar">
                    {producto?.nombre ??
                        "Producto"}
                </p>
                <p className="mt-1 text-xs text-[#829089]">
                    {producto?.codigo_producto ??
                        ""}
                    {producto?.marca
                        ? ` · ${producto.marca}`
                        : ""}
                </p>
            </Td>

            <Td>
                <span className="inline-flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    {movimiento.sucursales
                        ?.nombre ??
                        "Sucursal"}
                </span>
            </Td>

            <Td>
                <TipoMovimiento
                    tipo={movimiento.tipo}
                    naturaleza={
                        movimiento.naturaleza
                    }
                />
            </Td>

            <Td>
                <strong
                    className={
                        movimiento.naturaleza ===
                            "ENTRADA"
                            ? "text-[#527865]"
                            : "text-[#A25E5E]"
                    }
                >
                    {movimiento.naturaleza ===
                        "ENTRADA"
                        ? "+"
                        : "-"}
                    {cantidad(
                        movimiento.cantidad,
                    )}{" "}
                    {abreviarUnidad(
                        producto?.unidad_medida ??
                        "",
                    )}
                </strong>
            </Td>

            <Td>
                <div className="flex items-center gap-2 whitespace-nowrap">
                    <span>
                        {cantidad(
                            movimiento.cantidad_anterior,
                        )}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#9AA59F]" />
                    <strong>
                        {cantidad(
                            movimiento.cantidad_nueva,
                        )}
                    </strong>
                </div>
            </Td>

            <Td>
                {movimiento.costo_unitario !=
                    null
                    ? dinero(
                        movimiento.costo_unitario,
                    )
                    : "—"}
            </Td>

            <Td>
                <p>
                    {movimiento.referencia ??
                        "—"}
                </p>

                {movimiento.ventas
                    ?.codigo_venta && (
                        <p className="mt-1 text-xs text-[#829089]">
                            Venta:{" "}
                            {
                                movimiento.ventas
                                    .codigo_venta
                            }
                        </p>
                    )}
            </Td>

            <Td>
                <p className="max-w-[260px]">
                    {movimiento.observaciones ??
                        movimiento.concepto ??
                        "—"}
                </p>
            </Td>
        </tr>
    );
}

function TarjetaMovimiento({
    movimiento,
    dinero,
}: {
    movimiento: MovimientoInventarioListado;
    dinero: (valor: number) => string;
}) {
    const producto =
        movimiento.productos;

    return (
        <article className="rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-bold text-sidebar">
                        {producto?.nombre ??
                            "Producto"}
                    </p>

                    <p className="mt-1 text-xs text-[#76817B]">
                        {movimiento.sucursales
                            ?.nombre ??
                            "Sucursal"}{" "}
                        ·{" "}
                        {formatearFechaHora(
                            movimiento.fecha_movimiento,
                        )}
                    </p>
                </div>

                <TipoMovimiento
                    tipo={movimiento.tipo}
                    naturaleza={
                        movimiento.naturaleza
                    }
                />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniDato
                    titulo="Cantidad"
                    valor={`${movimiento.naturaleza ===
                            "ENTRADA"
                            ? "+"
                            : "-"
                        }${cantidad(
                            movimiento.cantidad,
                        )}`}
                />

                <MiniDato
                    titulo="Antes"
                    valor={cantidad(
                        movimiento.cantidad_anterior,
                    )}
                />

                <MiniDato
                    titulo="Después"
                    valor={cantidad(
                        movimiento.cantidad_nueva,
                    )}
                />
            </div>

            {(movimiento.referencia ||
                movimiento.observaciones ||
                movimiento.concepto) && (
                    <div className="mt-3 rounded-xl bg-[#FBFCFA] p-3 text-xs leading-5 text-[#65726B]">
                        {movimiento.referencia && (
                            <p>
                                <strong>
                                    Ref:
                                </strong>{" "}
                                {
                                    movimiento.referencia
                                }
                            </p>
                        )}

                        <p>
                            {movimiento.observaciones ??
                                movimiento.concepto}
                        </p>
                    </div>
                )}

            {movimiento.costo_unitario !=
                null && (
                    <p className="mt-3 text-xs font-semibold text-[#52605A]">
                        Costo registrado:{" "}
                        {dinero(
                            movimiento.costo_unitario,
                        )}
                    </p>
                )}
        </article>
    );
}

function TipoMovimiento({
    tipo,
    naturaleza,
}: {
    tipo: string;
    naturaleza: string;
}) {
    return (
        <span
            className={[
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                naturaleza === "ENTRADA"
                    ? "bg-[#E3EEE8] text-[#527865]"
                    : "bg-[#F8E5E5] text-[#A25E5E]",
            ].join(" ")}
        >
            {textoTipo(tipo)}
        </span>
    );
}

function Resumen({
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
        <article className="salon-panel border border-border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-text-secondary">
                        {titulo}
                    </p>
                    <p className="mt-3 text-xl font-bold text-foreground">
                        {valor}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
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
                className="salon-control w-full border border-border-strong bg-white pl-11 pr-4"
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

function Fecha({
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
                    cambiar(
                        event.target.value,
                    )
                }
                className="salon-control h-9 w-full rounded-lg border border-border-strong px-2"
            />
        </label>
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
            <p className="text-xs font-bold uppercase text-[#829089]">
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
            <History className="mx-auto h-9 w-9 text-[#829089]" />

            <h3 className="mt-4 font-bold text-sidebar tracking-tight">
                No hay movimientos
            </h3>

            <p className="mt-2 text-sm text-[#718078]">
                Los cambios de stock aparecerán
                aquí automáticamente.
            </p>
        </div>
    );
}

function textoTipo(tipo: string) {
    const tipos: Record<
        string,
        string
    > = {
        ENTRADA_INICIAL:
            "Carga inicial",
        COMPRA: "Compra",
        VENTA: "Venta",
        CONSUMO_SERVICIO:
            "Consumo servicio",
        AJUSTE_ENTRADA:
            "Ajuste entrada",
        AJUSTE_SALIDA:
            "Ajuste salida",
        DEVOLUCION_CLIENTE:
            "Dev. cliente",
        DEVOLUCION_PROVEEDOR:
            "Dev. proveedor",
        TRASLADO_ENTRADA:
            "Traslado entrada",
        TRASLADO_SALIDA:
            "Traslado salida",
        MERMA: "Merma",
        ANULACION: "Anulación",
    };

    return tipos[tipo] ?? tipo;
}

function formatearFechaHora(
    fecha: string,
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
    ).format(new Date(fecha));
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