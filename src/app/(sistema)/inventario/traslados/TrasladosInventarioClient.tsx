"use client";

import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Boxes,
    CheckCircle2,
    History,
    Package,
    Search,
    Send,
    Store,
    Truck,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    registrarTraslado,
} from "./actions";

export type SucursalTraslado = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type ProductoTraslado = {
    id: string;
    codigo_producto: string;
    codigo_barras: string | null;
    nombre: string;
    marca: string | null;
    presentacion: string | null;
    unidad_medida: string;
};

export type ExistenciaTraslado = {
    id: string;
    sucursal_id: string;
    producto_id: string;
    cantidad_actual: number;
    stock_minimo: number;
};

export type TrasladoListado = {
    id: string;
    sucursal_origen_id: string;
    sucursal_destino_id: string;
    producto_id: string;
    cantidad: number;
    referencia: string | null;
    observaciones: string | null;
    estado: string;
    fecha_traslado: string;

    producto: {
        id: string;
        codigo_producto: string;
        nombre: string;
        marca: string | null;
        unidad_medida: string;
    } | null;

    origen: {
        nombre: string;
    } | null;

    destino: {
        nombre: string;
    } | null;
};

export default function TrasladosInventarioClient({
    sucursales,
    productos,
    existencias,
    traslados,
}: {
    sucursales: SucursalTraslado[];
    productos: ProductoTraslado[];
    existencias: ExistenciaTraslado[];
    traslados: TrasladoListado[];
}) {
    const router = useRouter();

    const [
        sucursalOrigenId,
        setSucursalOrigenId,
    ] = useState(
        sucursales[0]?.id ?? "",
    );

    const [
        sucursalDestinoId,
        setSucursalDestinoId,
    ] = useState(
        sucursales[1]?.id ?? "",
    );

    const [
        productoId,
        setProductoId,
    ] = useState("");

    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        cantidadMover,
        setCantidadMover,
    ] = useState("");

    const [
        referencia,
        setReferencia,
    ] = useState("");

    const [
        observaciones,
        setObservaciones,
    ] = useState("");

    const [
        procesando,
        iniciarTransicion,
    ] = useTransition();

    const productosOrigen = useMemo(() => {
        const texto =
            busqueda.trim().toLowerCase();

        return productos.filter(
            (producto) => {
                const existencia =
                    existencias.find(
                        (item) =>
                            item.sucursal_id ===
                            sucursalOrigenId &&
                            item.producto_id ===
                            producto.id,
                    );

                const tieneStock =
                    Number(
                        existencia
                            ?.cantidad_actual ??
                        0,
                    ) > 0;

                const coincide =
                    !texto ||
                    producto.nombre
                        .toLowerCase()
                        .includes(texto) ||
                    producto.codigo_producto
                        .toLowerCase()
                        .includes(texto) ||
                    producto.codigo_barras
                        ?.toLowerCase()
                        .includes(texto) ||
                    producto.marca
                        ?.toLowerCase()
                        .includes(texto);

                return (
                    tieneStock &&
                    coincide
                );
            },
        );
    }, [
        busqueda,
        existencias,
        productos,
        sucursalOrigenId,
    ]);

    const producto =
        productos.find(
            (item) =>
                item.id ===
                productoId,
        ) ?? null;

    const stockOrigen = Number(
        existencias.find(
            (item) =>
                item.sucursal_id ===
                sucursalOrigenId &&
                item.producto_id ===
                productoId,
        )?.cantidad_actual ?? 0,
    );

    const stockDestino = Number(
        existencias.find(
            (item) =>
                item.sucursal_id ===
                sucursalDestinoId &&
                item.producto_id ===
                productoId,
        )?.cantidad_actual ?? 0,
    );

    const mover = Number(
        cantidadMover || 0,
    );

    const origenDespues =
        stockOrigen - mover;

    const destinoDespues =
        stockDestino + mover;

    const sucursalOrigen =
        sucursales.find(
            (item) =>
                item.id ===
                sucursalOrigenId,
        );

    const sucursalDestino =
        sucursales.find(
            (item) =>
                item.id ===
                sucursalDestinoId,
        );

    const puedeTrasladar =
        Boolean(productoId) &&
        Boolean(
            sucursalOrigenId,
        ) &&
        Boolean(
            sucursalDestinoId,
        ) &&
        sucursalOrigenId !==
        sucursalDestinoId &&
        mover > 0 &&
        mover <= stockOrigen;

    function guardar() {
        if (
            sucursales.length < 2
        ) {
            alert(
                "Necesitas al menos dos sucursales activas para realizar un traslado.",
            );
            return;
        }

        if (!puedeTrasladar) {
            alert(
                "Revisa el producto, las sucursales y la cantidad a trasladar.",
            );
            return;
        }

        iniciarTransicion(
            async () => {
                const resultado =
                    await registrarTraslado(
                        {
                            sucursalOrigenId,
                            sucursalDestinoId,
                            productoId,
                            cantidad: mover,
                            referencia,
                            observaciones,
                        },
                    );

                if (
                    !resultado.exito
                ) {
                    alert(
                        resultado.mensaje,
                    );
                    return;
                }

                alert(
                    resultado.mensaje,
                );

                setProductoId("");
                setCantidadMover("");
                setReferencia("");
                setObservaciones("");
                setBusqueda("");

                router.refresh();
            },
        );
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] bg-[#26332F] p-7 text-white shadow-[0_18px_55px_rgba(36,48,44,0.12)] sm:p-9">
                <Link
                    href="/inventario"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Inventario
                </Link>

                <div className="mt-6 flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                        <Truck className="h-7 w-7 text-[#DCE7E2]" />
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#AFC2B9]">
                            Distribución interna
                        </p>

                        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                            Traslados entre sucursales
                        </h1>

                        <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                            Mueve existencias sin
                            alterar el total general del
                            inventario del salón.
                        </p>
                    </div>
                </div>
            </section>

            {sucursales.length < 2 ? (
                <section className="rounded-[28px] border border-dashed border-[#CCD6D0] bg-white p-12 text-center shadow-sm">
                    <Store className="mx-auto h-10 w-10 text-[#829089]" />

                    <h2 className="mt-4 text-lg font-bold text-[#26332F]">
                        Se necesitan dos sucursales
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#718078]">
                        Los traslados solo están
                        disponibles cuando el salón
                        tiene al menos dos sucursales
                        activas.
                    </p>
                </section>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
                    <div className="space-y-6">
                        <section className="rounded-[28px] border border-[#E0E6E2] bg-white shadow-sm">
                            <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                                <h2 className="font-bold text-[#26332F]">
                                    1. Ruta del traslado
                                </h2>
                                <p className="mt-1 text-sm text-[#718078]">
                                    Elige desde dónde sale
                                    y hacia dónde llegará
                                    el producto.
                                </p>
                            </header>

                            <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:p-6">
                                <SucursalSelect
                                    titulo="Origen"
                                    valor={
                                        sucursalOrigenId
                                    }
                                    cambiar={(
                                        valor,
                                    ) => {
                                        setSucursalOrigenId(
                                            valor,
                                        );
                                        setProductoId(
                                            "",
                                        );
                                    }}
                                    sucursales={
                                        sucursales
                                    }
                                />

                                <div className="hidden h-11 items-center sm:flex">
                                    <ArrowRight className="h-5 w-5 text-[#829089]" />
                                </div>

                                <SucursalSelect
                                    titulo="Destino"
                                    valor={
                                        sucursalDestinoId
                                    }
                                    cambiar={
                                        setSucursalDestinoId
                                    }
                                    sucursales={
                                        sucursales.filter(
                                            (
                                                sucursal,
                                            ) =>
                                                sucursal.id !==
                                                sucursalOrigenId,
                                        )
                                    }
                                />
                            </div>
                        </section>

                        <section className="rounded-[28px] border border-[#E0E6E2] bg-white shadow-sm">
                            <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                                <h2 className="font-bold text-[#26332F]">
                                    2. Producto
                                </h2>

                                <p className="mt-1 text-sm text-[#718078]">
                                    Solo se muestran
                                    productos con stock
                                    disponible en el
                                    origen.
                                </p>
                            </header>

                            <div className="p-5 sm:p-6">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

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
                                        placeholder="Buscar producto, código o barra..."
                                        className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-[#FBFCFB] pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83]"
                                    />
                                </div>

                                <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                    {productosOrigen.map(
                                        (
                                            item,
                                        ) => {
                                            const existencia =
                                                existencias.find(
                                                    (
                                                        existencia,
                                                    ) =>
                                                        existencia.sucursal_id ===
                                                        sucursalOrigenId &&
                                                        existencia.producto_id ===
                                                        item.id,
                                                );

                                            const seleccionado =
                                                item.id ===
                                                productoId;

                                            return (
                                                <button
                                                    key={
                                                        item.id
                                                    }
                                                    type="button"
                                                    onClick={() => {
                                                        setProductoId(
                                                            item.id,
                                                        );
                                                        setCantidadMover(
                                                            "",
                                                        );
                                                    }}
                                                    className={[
                                                        "flex w-full items-center justify-between gap-4 rounded-2xl border p-3.5 text-left transition",
                                                        seleccionado
                                                            ? "border-[#6F8F83] bg-[#F1F6F3]"
                                                            : "border-[#E4E9E6] bg-white hover:bg-[#F8FAF8]",
                                                    ].join(
                                                        " ",
                                                    )}
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2EF] text-[#527064]">
                                                            <Package className="h-5 w-5" />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-[#26332F]">
                                                                {
                                                                    item.nombre
                                                                }
                                                            </p>

                                                            <p className="mt-1 truncate text-xs text-[#829089]">
                                                                {
                                                                    item.codigo_producto
                                                                }
                                                                {item.marca
                                                                    ? ` · ${item.marca}`
                                                                    : ""}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 text-right">
                                                        <p className="text-[10px] font-bold uppercase text-[#89948F]">
                                                            Disponible
                                                        </p>
                                                        <p className="mt-1 text-sm font-bold text-[#315C4B]">
                                                            {cantidad(
                                                                Number(
                                                                    existencia?.cantidad_actual ??
                                                                    0,
                                                                ),
                                                            )}{" "}
                                                            {abreviarUnidad(
                                                                item.unidad_medida,
                                                            )}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        },
                                    )}

                                    {productosOrigen.length ===
                                        0 && (
                                            <div className="rounded-2xl border border-dashed border-[#D4DAD6] p-8 text-center text-sm text-[#718078]">
                                                No hay
                                                productos con
                                                stock en esta
                                                sucursal.
                                            </div>
                                        )}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[28px] border border-[#E0E6E2] bg-white shadow-sm">
                            <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                                <h2 className="font-bold text-[#26332F]">
                                    3. Cantidad y detalle
                                </h2>
                            </header>

                            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                                <label>
                                    <span className="mb-2 block text-xs font-bold text-[#52605A]">
                                        Cantidad a
                                        trasladar
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value={
                                            cantidadMover
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setCantidadMover(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="0"
                                        className="h-11 w-full rounded-xl border border-[#D4DAD6] px-4 text-sm outline-none focus:border-[#6F8F83]"
                                    />
                                </label>

                                <label>
                                    <span className="mb-2 block text-xs font-bold text-[#52605A]">
                                        Referencia
                                    </span>

                                    <input
                                        value={
                                            referencia
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setReferencia(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Ej. TR-001"
                                        className="h-11 w-full rounded-xl border border-[#D4DAD6] px-4 text-sm outline-none focus:border-[#6F8F83]"
                                    />
                                </label>

                                <label className="sm:col-span-2">
                                    <span className="mb-2 block text-xs font-bold text-[#52605A]">
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
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        rows={4}
                                        placeholder="Motivo o detalle del traslado..."
                                        className="w-full resize-none rounded-xl border border-[#D4DAD6] px-4 py-3 text-sm outline-none focus:border-[#6F8F83]"
                                    />
                                </label>
                            </div>
                        </section>
                    </div>

                    <aside>
                        <div className="sticky top-5 space-y-4">
                            <section className="rounded-[26px] border border-[#E0E6E2] bg-white p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#849189]">
                                    Resumen del traslado
                                </p>

                                {!producto ? (
                                    <div className="mt-5 rounded-2xl bg-[#F8FAF8] p-6 text-center">
                                        <Boxes className="mx-auto h-7 w-7 text-[#829089]" />

                                        <p className="mt-3 text-sm font-bold text-[#52605A]">
                                            Selecciona
                                            un producto
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="mt-4 text-lg font-bold text-[#26332F]">
                                            {
                                                producto.nombre
                                            }
                                        </h3>

                                        <p className="mt-1 text-xs text-[#829089]">
                                            {
                                                producto.codigo_producto
                                            }
                                        </p>

                                        <div className="mt-5 rounded-2xl bg-[#F8FAF8] p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-[#89948F]">
                                                        Origen
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold text-[#26332F]">
                                                        {
                                                            sucursalOrigen?.nombre
                                                        }
                                                    </p>
                                                </div>

                                                <ArrowRight className="h-5 w-5 text-[#829089]" />

                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold uppercase text-[#89948F]">
                                                        Destino
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold text-[#26332F]">
                                                        {
                                                            sucursalDestino?.nombre
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <StockCard
                                                titulo="Origen"
                                                antes={
                                                    stockOrigen
                                                }
                                                despues={
                                                    origenDespues
                                                }
                                                unidad={
                                                    producto.unidad_medida
                                                }
                                            />

                                            <StockCard
                                                titulo="Destino"
                                                antes={
                                                    stockDestino
                                                }
                                                despues={
                                                    destinoDespues
                                                }
                                                unidad={
                                                    producto.unidad_medida
                                                }
                                            />
                                        </div>

                                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#EAF2ED] p-3 text-xs leading-5 text-[#527865]">
                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            El traslado
                                            conserva el
                                            total general
                                            del inventario.
                                        </div>
                                    </>
                                )}
                            </section>

                            <button
                                type="button"
                                onClick={guardar}
                                disabled={
                                    procesando ||
                                    !puedeTrasladar
                                }
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#26332F] text-sm font-bold text-white transition hover:bg-[#34443F] disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                                {procesando
                                    ? "Trasladando..."
                                    : "Confirmar traslado"}
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            <section className="overflow-hidden rounded-[28px] border border-[#E0E6E2] bg-white shadow-sm">
                <header className="flex items-center gap-3 border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF2EF] text-[#527064]">
                        <History className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="font-bold text-[#26332F]">
                            Traslados recientes
                        </h2>
                        <p className="mt-1 text-sm text-[#718078]">
                            Últimos movimientos entre
                            sucursales.
                        </p>
                    </div>
                </header>

                {traslados.length ===
                    0 ? (
                    <div className="p-10 text-center text-sm text-[#718078]">
                        Todavía no hay traslados
                        registrados.
                    </div>
                ) : (
                    <div className="divide-y divide-[#EDF1EE]">
                        {traslados.map(
                            (traslado) => (
                                <div
                                    key={
                                        traslado.id
                                    }
                                    className="grid gap-3 p-4 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center sm:px-6"
                                >
                                    <div>
                                        <p className="font-bold text-[#26332F]">
                                            {traslado
                                                .producto
                                                ?.nombre ??
                                                "Producto"}
                                        </p>

                                        <p className="mt-1 text-xs text-[#829089]">
                                            {traslado
                                                .producto
                                                ?.codigo_producto ??
                                                ""}
                                            {traslado.referencia
                                                ? ` · ${traslado.referencia}`
                                                : ""}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-[#52605A]">
                                        <span>
                                            {traslado
                                                .origen
                                                ?.nombre ??
                                                "Origen"}
                                        </span>
                                        <ArrowRight className="h-4 w-4 text-[#9AA59F]" />
                                        <strong>
                                            {traslado
                                                .destino
                                                ?.nombre ??
                                                "Destino"}
                                        </strong>
                                    </div>

                                    <div className="text-left sm:text-right">
                                        <p className="font-bold text-[#315C4B]">
                                            {cantidad(
                                                traslado.cantidad,
                                            )}{" "}
                                            {abreviarUnidad(
                                                traslado
                                                    .producto
                                                    ?.unidad_medida ??
                                                "",
                                            )}
                                        </p>

                                        <p className="mt-1 text-xs text-[#829089]">
                                            {formatearFechaHora(
                                                traslado.fecha_traslado,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

function SucursalSelect({
    titulo,
    valor,
    cambiar,
    sucursales,
}: {
    titulo: string;
    valor: string;
    cambiar: (valor: string) => void;
    sucursales: SucursalTraslado[];
}) {
    return (
        <label>
            <span className="mb-2 block text-xs font-bold text-[#52605A]">
                {titulo}
            </span>

            <div className="relative">
                <Store className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                <select
                    value={valor}
                    onChange={(event) =>
                        cambiar(
                            event.target.value,
                        )
                    }
                    className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm"
                >
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
        </label>
    );
}

function StockCard({
    titulo,
    antes,
    despues,
    unidad,
}: {
    titulo: string;
    antes: number;
    despues: number;
    unidad: string;
}) {
    return (
        <div className="rounded-xl bg-[#F8FAF8] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#929C97]">
                {titulo}
            </p>

            <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="text-[#718078]">
                    {cantidad(antes)}
                </span>
                <ArrowRight className="h-3 w-3 text-[#A2ACA7]" />
                <strong className="text-[#315C4B]">
                    {cantidad(despues)}{" "}
                    {abreviarUnidad(
                        unidad,
                    )}
                </strong>
            </div>
        </div>
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