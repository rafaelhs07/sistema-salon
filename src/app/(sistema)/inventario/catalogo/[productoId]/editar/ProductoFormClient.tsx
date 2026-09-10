"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Barcode,
    Boxes,
    Check,
    CircleDollarSign,
    FlaskConical,
    Package,
    Save,
    ShoppingBag,
    Tag,
} from "lucide-react";
import {
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    crearProducto,
    editarProducto,
    type DatosProducto,
} from "../../product-actions";

export type CategoriaProductoForm = {
    id: string;
    nombre: string;
};

export type ProductoEditar = {
    id: string;
    categoria_id: string | null;
    codigo_producto: string;
    codigo_barras: string | null;
    nombre: string;
    descripcion: string | null;
    marca: string | null;
    presentacion: string | null;
    unidad_medida: string;
    costo_unitario: number;
    precio_venta: number;
    permite_venta: boolean;
    permite_consumo_servicio: boolean;
    controla_stock: boolean;
    stock_minimo_general: number;
};

export default function ProductoFormClient({
    categorias,
    producto,
    simboloMoneda,
}: {
    categorias: CategoriaProductoForm[];
    producto?: ProductoEditar | null;
    simboloMoneda: string;
}) {
    const router = useRouter();

    const [categoriaId, setCategoriaId] =
        useState(
            producto?.categoria_id ?? "",
        );
    const [
        codigoBarras,
        setCodigoBarras,
    ] = useState(
        producto?.codigo_barras ?? "",
    );
    const [nombre, setNombre] =
        useState(producto?.nombre ?? "");
    const [
        descripcion,
        setDescripcion,
    ] = useState(
        producto?.descripcion ?? "",
    );
    const [marca, setMarca] =
        useState(producto?.marca ?? "");
    const [
        presentacion,
        setPresentacion,
    ] = useState(
        producto?.presentacion ?? "",
    );
    const [
        unidadMedida,
        setUnidadMedida,
    ] = useState(
        producto?.unidad_medida ??
        "UNIDAD",
    );
    const [
        costoUnitario,
        setCostoUnitario,
    ] = useState(
        String(
            producto?.costo_unitario ??
            0,
        ),
    );
    const [
        precioVenta,
        setPrecioVenta,
    ] = useState(
        String(
            producto?.precio_venta ??
            0,
        ),
    );
    const [
        permiteVenta,
        setPermiteVenta,
    ] = useState(
        producto?.permite_venta ??
        true,
    );
    const [
        permiteConsumoServicio,
        setPermiteConsumoServicio,
    ] = useState(
        producto
            ?.permite_consumo_servicio ??
        true,
    );
    const [
        controlaStock,
        setControlaStock,
    ] = useState(
        producto?.controla_stock ??
        true,
    );
    const [
        stockMinimoGeneral,
        setStockMinimoGeneral,
    ] = useState(
        String(
            producto
                ?.stock_minimo_general ??
            0,
        ),
    );

    const [
        procesando,
        iniciarTransicion,
    ] = useTransition();

    function guardar() {
        const datos: DatosProducto = {
            categoriaId:
                categoriaId || null,
            codigoBarras,
            nombre,
            descripcion,
            marca,
            presentacion,
            unidadMedida,
            costoUnitario:
                Number(
                    costoUnitario || 0,
                ),
            precioVenta:
                Number(
                    precioVenta || 0,
                ),
            permiteVenta,
            permiteConsumoServicio,
            controlaStock,
            stockMinimoGeneral:
                Number(
                    stockMinimoGeneral ||
                    0,
                ),
        };

        iniciarTransicion(async () => {
            const resultado =
                producto
                    ? await editarProducto(
                        producto.id,
                        datos,
                    )
                    : await crearProducto(
                        datos,
                    );

            if (!resultado.exito) {
                alert(resultado.mensaje);
                return;
            }

            router.push(
                "/inventario/catalogo",
            );
            router.refresh();
        });
    }

    return (
        <div className="space-y-6">
            <section className="salon-hero overflow-hidden bg-sidebar p-7 text-white sm:p-9">
                <Link
                    href="/inventario/catalogo"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al Catálogo
                </Link>

                <div className="mt-6 flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                        <Package className="h-7 w-7 text-primary-soft" />
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#AFC2B9]">
                            Inventario
                        </p>

                        <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                            {producto
                                ? "Editar producto"
                                : "Nuevo producto"}
                        </h1>

                        <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                            Configura la información
                            comercial y de inventario
                            del producto.
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <Seccion
                        titulo="Información principal"
                        descripcion="Datos con los que identificarás el producto."
                        icono={Package}
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <CampoTexto
                                titulo="Nombre del producto"
                                valor={nombre}
                                cambiar={setNombre}
                                placeholder="Ej. Shampoo reparación intensa"
                                requerido
                            />

                            <CampoSelect
                                titulo="Categoría"
                                valor={categoriaId}
                                cambiar={setCategoriaId}
                                opciones={[
                                    {
                                        valor: "",
                                        texto:
                                            "Sin categoría",
                                    },
                                    ...categorias.map(
                                        (
                                            categoria,
                                        ) => ({
                                            valor:
                                                categoria.id,
                                            texto:
                                                categoria.nombre,
                                        }),
                                    ),
                                ]}
                            />

                            <CampoTexto
                                titulo="Marca"
                                valor={marca}
                                cambiar={setMarca}
                                placeholder="Ej. L'Oréal"
                            />

                            <CampoTexto
                                titulo="Presentación"
                                valor={presentacion}
                                cambiar={
                                    setPresentacion
                                }
                                placeholder="Ej. Botella 500 ml"
                            />

                            <CampoSelect
                                titulo="Unidad de medida"
                                valor={unidadMedida}
                                cambiar={
                                    setUnidadMedida
                                }
                                opciones={[
                                    {
                                        valor:
                                            "UNIDAD",
                                        texto:
                                            "Unidad",
                                    },
                                    {
                                        valor: "ML",
                                        texto:
                                            "Mililitros",
                                    },
                                    {
                                        valor:
                                            "LITRO",
                                        texto:
                                            "Litro",
                                    },
                                    {
                                        valor:
                                            "GRAMO",
                                        texto:
                                            "Gramo",
                                    },
                                    {
                                        valor:
                                            "KILOGRAMO",
                                        texto:
                                            "Kilogramo",
                                    },
                                    {
                                        valor:
                                            "ONZA",
                                        texto:
                                            "Onza",
                                    },
                                    {
                                        valor:
                                            "CAJA",
                                        texto:
                                            "Caja",
                                    },
                                    {
                                        valor:
                                            "PAQUETE",
                                        texto:
                                            "Paquete",
                                    },
                                ]}
                            />

                            <CampoTexto
                                titulo="Código de barras"
                                valor={codigoBarras}
                                cambiar={
                                    setCodigoBarras
                                }
                                placeholder="Opcional"
                                icono={Barcode}
                            />
                        </div>

                        <label className="mt-4 block">
                            <span className="mb-2 block text-xs font-bold text-[#52605A]">
                                Descripción
                            </span>

                            <textarea
                                value={descripcion}
                                onChange={(event) =>
                                    setDescripcion(
                                        event.target
                                            .value,
                                    )
                                }
                                rows={4}
                                placeholder="Descripción opcional..."
                                className="salon-control w-full resize-none border border-border-strong bg-white px-4 py-3 outline-none focus:border-primary"
                            />
                        </label>
                    </Seccion>

                    <Seccion
                        titulo="Precios"
                        descripcion="Costo interno y precio de venta al cliente."
                        icono={
                            CircleDollarSign
                        }
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <CampoNumero
                                titulo={`Costo unitario (${simboloMoneda})`}
                                valor={
                                    costoUnitario
                                }
                                cambiar={
                                    setCostoUnitario
                                }
                            />

                            <CampoNumero
                                titulo={`Precio de venta (${simboloMoneda})`}
                                valor={precioVenta}
                                cambiar={
                                    setPrecioVenta
                                }
                            />
                        </div>

                        <div className="mt-4 rounded-2xl bg-[#F8FAF8] p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#849189]">
                                Margen estimado
                            </p>

                            <p className="mt-2 text-xl font-bold text-[#315C4B]">
                                {margen(
                                    Number(
                                        costoUnitario ||
                                        0,
                                    ),
                                    Number(
                                        precioVenta ||
                                        0,
                                    ),
                                )}
                                %
                            </p>
                        </div>
                    </Seccion>

                    <Seccion
                        titulo="Control de existencias"
                        descripcion="Define cómo participa este producto dentro del inventario."
                        icono={Boxes}
                    >
                        <div className="space-y-3">
                            <Opcion
                                titulo="Controlar stock"
                                descripcion="Las entradas y salidas modificarán existencias por sucursal."
                                activa={
                                    controlaStock
                                }
                                cambiar={
                                    setControlaStock
                                }
                                icono={Boxes}
                            />

                            {controlaStock && (
                                <div className="rounded-2xl border border-[#E3E8E5] bg-[#FBFCFB] p-4">
                                    <CampoNumero
                                        titulo="Stock mínimo general"
                                        valor={
                                            stockMinimoGeneral
                                        }
                                        cambiar={
                                            setStockMinimoGeneral
                                        }
                                        paso="0.001"
                                    />

                                    <p className="mt-2 text-xs leading-5 text-[#718078]">
                                        Este valor se
                                        usará como alerta
                                        inicial en todas
                                        las sucursales.
                                    </p>
                                </div>
                            )}

                            <Opcion
                                titulo="Permitir venta"
                                descripcion="El producto podrá venderse directamente al cliente."
                                activa={
                                    permiteVenta
                                }
                                cambiar={
                                    setPermiteVenta
                                }
                                icono={
                                    ShoppingBag
                                }
                            />

                            <Opcion
                                titulo="Permitir consumo en servicios"
                                descripcion="Podrá usarse como material o insumo durante servicios."
                                activa={
                                    permiteConsumoServicio
                                }
                                cambiar={
                                    setPermiteConsumoServicio
                                }
                                icono={
                                    FlaskConical
                                }
                            />
                        </div>
                    </Seccion>
                </div>

                <aside>
                    <div className="sticky top-5 space-y-4">
                        <section className="salon-panel border border-border bg-white p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#849189]">
                                Vista previa
                            </p>

                            <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft text-primary-strong">
                                <Package className="h-7 w-7" />
                            </div>

                            <h3 className="mt-4 text-lg font-bold text-sidebar tracking-tight">
                                {nombre ||
                                    "Nuevo producto"}
                            </h3>

                            <p className="mt-1 text-xs text-[#829089]">
                                {marca ||
                                    "Sin marca"}
                                {presentacion
                                    ? ` · ${presentacion}`
                                    : ""}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-2">
                                <MiniDato
                                    titulo="Costo"
                                    valor={`${simboloMoneda} ${Number(
                                        costoUnitario ||
                                        0,
                                    ).toLocaleString(
                                        "es-NI",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    )}`}
                                />
                                <MiniDato
                                    titulo="Precio"
                                    valor={`${simboloMoneda} ${Number(
                                        precioVenta ||
                                        0,
                                    ).toLocaleString(
                                        "es-NI",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    )}`}
                                />
                            </div>

                            <div className="mt-4 space-y-2 text-xs text-[#65726B]">
                                <Indicador
                                    texto="Venta"
                                    activo={
                                        permiteVenta
                                    }
                                />
                                <Indicador
                                    texto="Servicios"
                                    activo={
                                        permiteConsumoServicio
                                    }
                                />
                                <Indicador
                                    texto="Control stock"
                                    activo={
                                        controlaStock
                                    }
                                />
                            </div>
                        </section>

                        <button
                            type="button"
                            onClick={guardar}
                            disabled={
                                procesando
                            }
                            className="salon-action inline-flex w-full items-center justify-center gap-2 bg-sidebar text-white shadow-sm transition hover:bg-[#34443F] disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {procesando
                                ? "Guardando..."
                                : producto
                                    ? "Guardar cambios"
                                    : "Crear producto"}
                        </button>

                        <Link
                            href="/inventario/catalogo"
                            className="salon-action inline-flex w-full items-center justify-center bg-surface-soft text-[#52605A]"
                        >
                            Cancelar
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function Seccion({
    titulo,
    descripcion,
    icono: Icono,
    children,
}: {
    titulo: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    children: React.ReactNode;
}) {
    return (
        <section className="salon-panel border border-border bg-white shadow-sm">
            <header className="flex items-start gap-3 border-b border-[#E8ECE9] p-5 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-primary-strong">
                    <Icono className="h-5 w-5" />
                </div>

                <div>
                    <h2 className="font-bold text-sidebar tracking-tight">
                        {titulo}
                    </h2>
                    <p className="mt-1 text-sm text-[#718078]">
                        {descripcion}
                    </p>
                </div>
            </header>

            <div className="p-5 sm:p-6">
                {children}
            </div>
        </section>
    );
}

function CampoTexto({
    titulo,
    valor,
    cambiar,
    placeholder,
    requerido = false,
    icono: Icono,
}: {
    titulo: string;
    valor: string;
    cambiar: (valor: string) => void;
    placeholder?: string;
    requerido?: boolean;
    icono?: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-bold text-[#52605A]">
                {titulo}
                {requerido ? " *" : ""}
            </span>

            <div className="relative">
                {Icono && (
                    <Icono className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                )}

                <input
                    value={valor}
                    onChange={(event) =>
                        cambiar(
                            event.target.value,
                        )
                    }
                    placeholder={placeholder}
                    className={[
                        "h-11 w-full rounded-xl border border-border-strong bg-white pr-4 text-sm outline-none focus:border-primary",
                        Icono
                            ? "pl-10"
                            : "pl-4",
                    ].join(" ")}
                />
            </div>
        </label>
    );
}

function CampoNumero({
    titulo,
    valor,
    cambiar,
    paso = "0.01",
}: {
    titulo: string;
    valor: string;
    cambiar: (valor: string) => void;
    paso?: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-bold text-[#52605A]">
                {titulo}
            </span>

            <input
                type="number"
                min="0"
                step={paso}
                value={valor}
                onChange={(event) =>
                    cambiar(
                        event.target.value,
                    )
                }
                className="salon-control w-full border border-border-strong bg-white px-4 outline-none focus:border-primary"
            />
        </label>
    );
}

function CampoSelect({
    titulo,
    valor,
    cambiar,
    opciones,
}: {
    titulo: string;
    valor: string;
    cambiar: (valor: string) => void;
    opciones: {
        valor: string;
        texto: string;
    }[];
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-bold text-[#52605A]">
                {titulo}
            </span>

            <select
                value={valor}
                onChange={(event) =>
                    cambiar(
                        event.target.value,
                    )
                }
                className="salon-control w-full border border-border-strong bg-white px-4 outline-none focus:border-primary"
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
        </label>
    );
}

function Opcion({
    titulo,
    descripcion,
    activa,
    cambiar,
    icono: Icono,
}: {
    titulo: string;
    descripcion: string;
    activa: boolean;
    cambiar: (valor: boolean) => void;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <button
            type="button"
            onClick={() =>
                cambiar(!activa)
            }
            className={[
                "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition",
                activa
                    ? "border-[#BFD0C7] bg-[#F4F8F5]"
                    : "border-[#E3E8E5] bg-white",
            ].join(" ")}
        >
            <div className="flex items-start gap-3">
                <div
                    className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        activa
                            ? "bg-primary-soft text-primary-strong"
                            : "bg-surface-soft text-[#849189]",
                    ].join(" ")}
                >
                    <Icono className="h-5 w-5" />
                </div>

                <div>
                    <p className="text-sm font-bold text-sidebar">
                        {titulo}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#718078]">
                        {descripcion}
                    </p>
                </div>
            </div>

            <div
                className={[
                    "flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition",
                    activa
                        ? "justify-end bg-primary"
                        : "justify-start bg-[#CDD5D0]",
                ].join(" ")}
            >
                <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
            </div>
        </button>
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
        <div className="rounded-xl bg-[#F8FAF8] p-3">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#929C97]">
                {titulo}
            </p>
            <p className="mt-1 text-xs font-bold text-[#405049]">
                {valor}
            </p>
        </div>
    );
}

function Indicador({
    texto,
    activo,
}: {
    texto: string;
    activo: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <span>{texto}</span>
            <span
                className={[
                    "flex h-5 w-5 items-center justify-center rounded-full",
                    activo
                        ? "bg-[#E3EEE8] text-[#527865]"
                        : "bg-[#EEF0EF] text-[#9AA29E]",
                ].join(" ")}
            >
                {activo && (
                    <Check className="h-3 w-3" />
                )}
            </span>
        </div>
    );
}

function margen(
    costo: number,
    precio: number,
) {
    if (precio <= 0) {
        return "0.0";
    }

    return (
        ((precio - costo) / precio) *
        100
    ).toLocaleString("es-NI", {
        maximumFractionDigits: 1,
    });
}