"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    FileText,
    PackagePlus,
    Plus,
    Search,
    Store,
    Trash2,
    Truck,
    XCircle,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    registrarCompraBorrador,
    type DatosCompraFormulario,
    type ItemCompraFormulario,
} from "./actions";

export type SucursalCompra = {
    id: string;
    nombre: string;
};

export type ProveedorCompra = {
    id: string;
    codigo_proveedor: string;
    nombre: string;
    condiciones_pago:
    | string
    | null;
};

export type ProductoCompra = {
    id: string;
    codigo_producto: string;
    codigo_barras:
    | string
    | null;
    nombre: string;
    marca: string | null;
    presentacion:
    | string
    | null;
    unidad_medida: string;
    costo_unitario: number | null;
    controla_stock: boolean;
    estado: string;
};

type ItemCompraUI =
    ItemCompraFormulario & {
        nombre: string;
        codigo: string;
        unidad: string;
    };

type Mensaje = {
    tipo:
    | "EXITO"
    | "ERROR";
    texto: string;
} | null;

export default function NuevaCompraClient({
    sucursales,
    proveedores,
    productos,
}: {
    sucursales: SucursalCompra[];
    proveedores: ProveedorCompra[];
    productos: ProductoCompra[];
}) {
    const router =
        useRouter();

    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        formulario,
        setFormulario,
    ] = useState<
        Omit<
            DatosCompraFormulario,
            "items"
        >
    >({
        sucursalId:
            sucursales[0]?.id ??
            "",
        proveedorId: "",
        numeroFactura: "",
        condicionPago:
            "CONTADO",
        fechaVencimiento: "",
        descuento: 0,
        impuestos: 0,
        notas: "",
    });

    const [
        items,
        setItems,
    ] = useState<
        ItemCompraUI[]
    >([]);

    const [
        mensaje,
        setMensaje,
    ] = useState<Mensaje>(
        null,
    );

    const [
        guardando,
        iniciarGuardado,
    ] = useTransition();

    const productosFiltrados =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            if (!texto) {
                return productos.slice(
                    0,
                    12,
                );
            }

            return productos
                .filter(
                    (producto) =>
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
                            .includes(texto),
                )
                .slice(0, 20);
        }, [
            busqueda,
            productos,
        ]);

    const totales =
        useMemo(() => {
            const subtotal =
                items.reduce(
                    (
                        total,
                        item,
                    ) =>
                        total +
                        item.cantidad *
                        item.costoUnitario,
                    0,
                );

            const descuentoItems =
                items.reduce(
                    (
                        total,
                        item,
                    ) =>
                        total +
                        item.descuento,
                    0,
                );

            const descuentoGeneral =
                Number(
                    formulario.descuento ??
                    0,
                );

            const impuestos =
                Number(
                    formulario.impuestos ??
                    0,
                );

            const total =
                subtotal -
                descuentoItems -
                descuentoGeneral +
                impuestos;

            return {
                subtotal,
                descuentoItems,
                descuentoGeneral,
                impuestos,
                total: Math.max(
                    total,
                    0,
                ),
            };
        }, [
            formulario.descuento,
            formulario.impuestos,
            items,
        ]);

    function actualizarFormulario<
        K extends keyof typeof formulario,
    >(
        campo: K,
        valor:
            (typeof formulario)[K],
    ) {
        setFormulario(
            (actual) => ({
                ...actual,
                [campo]: valor,
            }),
        );

        setMensaje(null);
    }

    function agregarProducto(
        producto: ProductoCompra,
    ) {
        const existente =
            items.find(
                (item) =>
                    item.productoId ===
                    producto.id,
            );

        if (existente) {
            setItems(
                (actuales) =>
                    actuales.map(
                        (item) =>
                            item.productoId ===
                                producto.id
                                ? {
                                    ...item,
                                    cantidad:
                                        item.cantidad +
                                        1,
                                }
                                : item,
                    ),
            );

            return;
        }

        setItems(
            (actuales) => [
                ...actuales,
                {
                    productoId:
                        producto.id,

                    nombre:
                        producto.nombre,

                    codigo:
                        producto.codigo_producto,

                    unidad:
                        producto.unidad_medida,

                    cantidad: 1,

                    costoUnitario:
                        Number(
                            producto.costo_unitario ??
                            0,
                        ),

                    descuento: 0,

                    lote: "",

                    fechaVencimiento:
                        "",
                },
            ],
        );

        setBusqueda("");
    }

    function actualizarItem(
        productoId: string,
        cambios: Partial<ItemCompraUI>,
    ) {
        setItems(
            (actuales) =>
                actuales.map(
                    (item) =>
                        item.productoId ===
                            productoId
                            ? {
                                ...item,
                                ...cambios,
                            }
                            : item,
                ),
        );
    }

    function quitarItem(
        productoId: string,
    ) {
        setItems(
            (actuales) =>
                actuales.filter(
                    (item) =>
                        item.productoId !==
                        productoId,
                ),
        );
    }

    function guardarCompra() {
        setMensaje(null);

        iniciarGuardado(
            async () => {
                const resultado =
                    await registrarCompraBorrador(
                        {
                            ...formulario,
                            items:
                                items.map(
                                    ({
                                        nombre: _nombre,
                                        codigo: _codigo,
                                        unidad: _unidad,
                                        ...item
                                    }) =>
                                        item,
                                ),
                        },
                    );

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
                    setTimeout(
                        () => {
                            if (
                                resultado.compraId
                            ) {
                                router.push(
                                    `/compras/${resultado.compraId}`,
                                );
                            } else {
                                router.push(
                                    "/compras",
                                );
                            }

                            router.refresh();
                        },
                        700,
                    );
                }
            },
        );
    }

    return (
        <div className="space-y-6">
            {mensaje && (
                <div
                    className={[
                        "flex items-start gap-3 rounded-2xl border px-4 py-4",
                        mensaje.tipo ===
                            "EXITO"
                            ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                            : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
                    ].join(" ")}
                >
                    {mensaje.tipo ===
                        "EXITO" ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5" />
                    ) : (
                        <XCircle className="mt-0.5 h-5 w-5" />
                    )}

                    <p className="text-sm font-semibold">
                        {
                            mensaje.texto
                        }
                    </p>
                </div>
            )}

            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <Link
                    href="/compras"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#B9C8C1]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Compras
                </Link>

                <div className="mt-5 flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                        <PackagePlus className="h-7 w-7" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-[#B9C8C1]">
                            Entrada de mercancía
                        </p>

                        <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                            Nueva compra
                        </h1>

                        <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                            Registra los datos de la compra y revisa todo antes de confirmar la entrada al inventario.
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="space-y-6">
                    <div className="salon-panel border border-border bg-white p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-foreground tracking-tight">
                            Datos de la compra
                        </h2>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <CampoSelect
                                etiqueta="Sucursal"
                                valor={
                                    formulario.sucursalId
                                }
                                opciones={sucursales.map(
                                    (
                                        sucursal,
                                    ) => ({
                                        valor:
                                            sucursal.id,
                                        texto:
                                            sucursal.nombre,
                                    }),
                                )}
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizarFormulario(
                                        "sucursalId",
                                        valor,
                                    )
                                }
                            />

                            <CampoSelect
                                etiqueta="Proveedor"
                                valor={
                                    formulario.proveedorId
                                }
                                placeholder="Seleccionar proveedor"
                                opciones={proveedores.map(
                                    (
                                        proveedor,
                                    ) => ({
                                        valor:
                                            proveedor.id,
                                        texto:
                                            proveedor.nombre,
                                    }),
                                )}
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizarFormulario(
                                        "proveedorId",
                                        valor,
                                    )
                                }
                            />

                            <CampoTexto
                                etiqueta="Número de factura"
                                valor={
                                    formulario.numeroFactura
                                }
                                placeholder="Ej. F-4587"
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizarFormulario(
                                        "numeroFactura",
                                        valor,
                                    )
                                }
                            />

                            <CampoSelect
                                etiqueta="Condición de pago"
                                valor={
                                    formulario.condicionPago
                                }
                                opciones={[
                                    {
                                        valor:
                                            "CONTADO",
                                        texto:
                                            "Contado",
                                    },
                                    {
                                        valor:
                                            "CREDITO",
                                        texto:
                                            "Crédito",
                                    },
                                    {
                                        valor:
                                            "MIXTA",
                                        texto:
                                            "Mixta",
                                    },
                                ]}
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizarFormulario(
                                        "condicionPago",
                                        valor as
                                        | "CONTADO"
                                        | "CREDITO"
                                        | "MIXTA",
                                    )
                                }
                            />

                            {formulario.condicionPago !==
                                "CONTADO" && (
                                    <CampoFecha
                                        etiqueta="Fecha de vencimiento"
                                        valor={
                                            formulario.fechaVencimiento
                                        }
                                        cambiar={(
                                            valor,
                                        ) =>
                                            actualizarFormulario(
                                                "fechaVencimiento",
                                                valor,
                                            )
                                        }
                                    />
                                )}
                        </div>
                    </div>

                    <div className="salon-panel border border-border bg-white p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-foreground tracking-tight">
                                    Productos
                                </h2>

                                <p className="mt-1 text-sm text-text-secondary">
                                    Busca y agrega todos los productos de la factura.
                                </p>
                            </div>
                        </div>

                        <div className="relative mt-5">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />

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
                                placeholder="Nombre, código o código de barras..."
                                className="salon-control w-full border border-border-strong bg-white pl-12 pr-4 outline-none focus:border-primary"
                            />
                        </div>

                        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-[#FBFCFA]">
                            <div className="flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3">
                                <div>
                                    <p className="text-sm font-bold text-[#33413B]">
                                        Productos del inventario
                                    </p>

                                    <p className="mt-0.5 text-xs text-[#76817B]">
                                        {busqueda
                                            ? `${productosFiltrados.length} resultado${productosFiltrados.length === 1 ? "" : "s"}`
                                            : `${productos.length} producto${productos.length === 1 ? "" : "s"} disponible${productos.length === 1 ? "" : "s"}`}
                                    </p>
                                </div>
                            </div>

                            {productosFiltrados.length === 0 ? (
                                <div className="p-8 text-center">
                                    <PackagePlus className="mx-auto h-8 w-8 text-[#9AA5A0]" />

                                    <p className="mt-3 text-sm font-bold text-[#33413B]">
                                        No encontramos productos
                                    </p>

                                    <p className="mt-1 text-xs text-[#76817B]">
                                        Revisa la búsqueda o verifica que existan productos activos en Inventario.
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto p-2">
                                    {productosFiltrados.map(
                                        (
                                            producto,
                                        ) => {
                                            const agregado =
                                                items.some(
                                                    (item) =>
                                                        item.productoId ===
                                                        producto.id,
                                                );

                                            return (
                                                <button
                                                    key={
                                                        producto.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        agregarProducto(
                                                            producto,
                                                        )
                                                    }
                                                    className="group flex w-full items-center justify-between gap-4 rounded-xl p-3 text-left transition hover:bg-white"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="truncate font-bold text-foreground">
                                                                {
                                                                    producto.nombre
                                                                }
                                                            </p>

                                                            {agregado && (
                                                                <span className="rounded-full bg-[#E3EEE8] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#527865]">
                                                                    Agregado
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="mt-1 text-xs text-[#76817B]">
                                                            {
                                                                producto.codigo_producto
                                                            }
                                                            {" · "}
                                                            {
                                                                producto.unidad_medida
                                                            }
                                                            {producto.marca
                                                                ? ` · ${producto.marca}`
                                                                : ""}
                                                            {producto.presentacion
                                                                ? ` · ${producto.presentacion}`
                                                                : ""}
                                                        </p>

                                                        <p className="mt-1 text-xs font-semibold text-primary-strong">
                                                            Último costo: C${" "}
                                                            {Number(
                                                                producto.costo_unitario ??
                                                                0,
                                                            ).toLocaleString(
                                                                "es-NI",
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                },
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong transition group-hover:bg-sidebar group-hover:text-white">
                                                        <Plus className="h-4 w-4" />
                                                    </div>
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            )}
                        </div>

                        {items.length ===
                            0 ? (
                            <div className="mt-5 rounded-2xl border border-dashed border-border-strong bg-[#FBFCFA] p-10 text-center">
                                <PackagePlus className="mx-auto h-8 w-8 text-[#829089]" />

                                <p className="mt-3 font-semibold text-[#33413B]">
                                    Aún no hay productos
                                </p>
                            </div>
                        ) : (
                            <div className="mt-5 space-y-3">
                                {items.map(
                                    (
                                        item,
                                    ) => (
                                        <article
                                            key={
                                                item.productoId
                                            }
                                            className="rounded-2xl border border-border bg-[#FBFCFA] p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-bold text-foreground">
                                                        {
                                                            item.nombre
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs text-[#76817B]">
                                                        {
                                                            item.codigo
                                                        }
                                                        {" · "}
                                                        {
                                                            item.unidad
                                                        }
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        quitarItem(
                                                            item.productoId,
                                                        )
                                                    }
                                                    className="rounded-lg p-2 text-[#A25E5E] hover:bg-[#F8E5E5]"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                                <CampoNumero
                                                    etiqueta="Cantidad"
                                                    valor={
                                                        item.cantidad
                                                    }
                                                    paso={
                                                        0.001
                                                    }
                                                    cambiar={(
                                                        valor,
                                                    ) =>
                                                        actualizarItem(
                                                            item.productoId,
                                                            {
                                                                cantidad:
                                                                    valor,
                                                            },
                                                        )
                                                    }
                                                />

                                                <CampoNumero
                                                    etiqueta="Costo unitario"
                                                    valor={
                                                        item.costoUnitario
                                                    }
                                                    paso={
                                                        0.01
                                                    }
                                                    cambiar={(
                                                        valor,
                                                    ) =>
                                                        actualizarItem(
                                                            item.productoId,
                                                            {
                                                                costoUnitario:
                                                                    valor,
                                                            },
                                                        )
                                                    }
                                                />

                                                <CampoNumero
                                                    etiqueta="Descuento"
                                                    valor={
                                                        item.descuento
                                                    }
                                                    paso={
                                                        0.01
                                                    }
                                                    cambiar={(
                                                        valor,
                                                    ) =>
                                                        actualizarItem(
                                                            item.productoId,
                                                            {
                                                                descuento:
                                                                    valor,
                                                            },
                                                        )
                                                    }
                                                />

                                                <CampoTexto
                                                    etiqueta="Lote"
                                                    valor={
                                                        item.lote
                                                    }
                                                    placeholder="Opcional"
                                                    cambiar={(
                                                        valor,
                                                    ) =>
                                                        actualizarItem(
                                                            item.productoId,
                                                            {
                                                                lote:
                                                                    valor,
                                                            },
                                                        )
                                                    }
                                                />

                                                <CampoFecha
                                                    etiqueta="Vencimiento"
                                                    valor={
                                                        item.fechaVencimiento
                                                    }
                                                    cambiar={(
                                                        valor,
                                                    ) =>
                                                        actualizarItem(
                                                            item.productoId,
                                                            {
                                                                fechaVencimiento:
                                                                    valor,
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="mt-3 text-right text-sm font-bold text-[#33413B]">
                                                Total línea: C${" "}
                                                {(
                                                    item.cantidad *
                                                    item.costoUnitario -
                                                    item.descuento
                                                ).toLocaleString(
                                                    "es-NI",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    },
                                                )}
                                            </div>
                                        </article>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <aside className="space-y-5">
                    <div className="salon-panel sticky top-24 border border-border bg-white p-5">
                        <h2 className="font-bold text-foreground tracking-tight">
                            Resumen
                        </h2>

                        <div className="mt-5 space-y-3 text-sm">
                            <Linea
                                titulo="Subtotal"
                                valor={
                                    totales.subtotal
                                }
                            />

                            <Linea
                                titulo="Descuentos por producto"
                                valor={
                                    -totales.descuentoItems
                                }
                            />

                            <CampoNumero
                                etiqueta="Descuento general"
                                valor={
                                    formulario.descuento
                                }
                                paso={0.01}
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizarFormulario(
                                        "descuento",
                                        valor,
                                    )
                                }
                            />

                            <CampoNumero
                                etiqueta="Impuestos"
                                valor={
                                    formulario.impuestos
                                }
                                paso={0.01}
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizarFormulario(
                                        "impuestos",
                                        valor,
                                    )
                                }
                            />

                            <div className="border-t border-border-strong pt-3">
                                <Linea
                                    titulo="TOTAL"
                                    valor={
                                        totales.total
                                    }
                                    fuerte
                                />
                            </div>
                        </div>

                        <div className="mt-5">
                            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                                Notas
                            </label>

                            <textarea
                                rows={3}
                                value={
                                    formulario.notas
                                }
                                onChange={(
                                    event,
                                ) =>
                                    actualizarFormulario(
                                        "notas",
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Observaciones de la compra..."
                                className="salon-control w-full border border-border-strong bg-white px-4 py-3 outline-none focus:border-primary"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={
                                guardarCompra
                            }
                            disabled={
                                guardando ||
                                items.length ===
                                0
                            }
                            className="salon-action mt-5 inline-flex w-full items-center justify-center gap-2 bg-primary px-5 text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FileText className="h-5 w-5" />

                            {guardando
                                ? "Guardando..."
                                : "Continuar y revisar compra"}
                        </button>

                        <p className="mt-3 text-center text-xs leading-5 text-[#76817B]">
                            El inventario se actualizará únicamente cuando confirmes la compra en la siguiente pantalla.
                        </p>
                    </div>
                </aside>
            </section>
        </div>
    );
}

function CampoTexto({
    etiqueta,
    valor,
    placeholder,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    placeholder: string;
    cambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-xs font-bold text-[#52605A]">
                {etiqueta}
            </label>

            <input
                value={
                    valor
                }
                placeholder={
                    placeholder
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
                className="salon-control w-full border border-border-strong bg-white px-3 outline-none focus:border-primary"
            />
        </div>
    );
}

function CampoNumero({
    etiqueta,
    valor,
    paso,
    cambiar,
}: {
    etiqueta: string;
    valor: number;
    paso: number;
    cambiar: (
        valor: number,
    ) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-xs font-bold text-[#52605A]">
                {etiqueta}
            </label>

            <input
                type="number"
                min="0"
                step={paso}
                value={
                    valor
                }
                onChange={(
                    event,
                ) =>
                    cambiar(
                        Number(
                            event
                                .target
                                .value,
                        ),
                    )
                }
                className="salon-control w-full border border-border-strong bg-white px-3 outline-none focus:border-primary"
            />
        </div>
    );
}

function CampoFecha({
    etiqueta,
    valor,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    cambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-xs font-bold text-[#52605A]">
                {etiqueta}
            </label>

            <input
                type="date"
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
                className="salon-control w-full border border-border-strong bg-white px-3 outline-none focus:border-primary"
            />
        </div>
    );
}

function CampoSelect({
    etiqueta,
    valor,
    opciones,
    placeholder,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    opciones: {
        valor: string;
        texto: string;
    }[];
    placeholder?: string;
    cambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-xs font-bold text-[#52605A]">
                {etiqueta}
            </label>

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
                className="salon-control w-full border border-border-strong bg-white px-3 outline-none focus:border-primary"
            >
                {placeholder && (
                    <option value="">
                        {
                            placeholder
                        }
                    </option>
                )}

                {opciones.map(
                    (
                        opcion,
                    ) => (
                        <option
                            key={
                                opcion.valor
                            }
                            value={
                                opcion.valor
                            }
                        >
                            {
                                opcion.texto
                            }
                        </option>
                    ),
                )}
            </select>
        </div>
    );
}

function Linea({
    titulo,
    valor,
    fuerte = false,
}: {
    titulo: string;
    valor: number;
    fuerte?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span
                className={
                    fuerte
                        ? "font-bold text-foreground"
                        : "text-text-secondary"
                }
            >
                {titulo}
            </span>

            <strong
                className={
                    fuerte
                        ? "text-lg text-foreground"
                        : "text-[#33413B]"
                }
            >
                C${" "}
                {Number(
                    valor,
                ).toLocaleString(
                    "es-NI",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    },
                )}
            </strong>
        </div>
    );
}