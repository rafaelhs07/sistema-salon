"use client";

import Link from "next/link";
import {
    Archive,
    ArrowLeft,
    Barcode,
    Boxes,
    Check,
    CircleDollarSign,
    Edit3,
    Layers3,
    Package,
    Plus,
    Search,
    Tag,
    ToggleLeft,
    ToggleRight,
    X,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";

import {
    cambiarEstadoCategoria,
    crearCategoria,
    editarCategoria,
} from "./actions";
import {
    cambiarEstadoProducto,
} from "./product-actions";

export type CategoriaCatalogo = {
    id: string;
    nombre: string;
    descripcion: string | null;
    estado: string;
    orden: number;
    creado_en: string;
    actualizado_en: string;
};

export type ProductoCatalogo = {
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
    estado: string;
    creado_en: string;

    categorias_productos: {
        id: string;
        nombre: string;
    } | null;
};

type Vista =
    | "CATEGORIAS"
    | "PRODUCTOS";

export default function CatalogoInventarioClient({
    categorias,
    productos,
    simboloMoneda,
    puedeAdministrar,
}: {
    categorias: CategoriaCatalogo[];
    productos: ProductoCatalogo[];
    simboloMoneda: string;
    puedeAdministrar: boolean;
}) {
    const [vista, setVista] =
        useState<Vista>("PRODUCTOS");

    const [busqueda, setBusqueda] =
        useState("");

    const [modalCategoria, setModalCategoria] =
        useState(false);

    const [
        categoriaEditando,
        setCategoriaEditando,
    ] =
        useState<CategoriaCatalogo | null>(
            null,
        );

    const [
        procesando,
        iniciarTransicion,
    ] = useTransition();

    const productosFiltrados = useMemo(() => {
        const texto =
            busqueda.trim().toLowerCase();

        return productos.filter(
            (producto) =>
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
                    .includes(texto) ||
                producto.categorias_productos
                    ?.nombre.toLowerCase()
                    .includes(texto),
        );
    }, [busqueda, productos]);

    const categoriasFiltradas = useMemo(() => {
        const texto =
            busqueda.trim().toLowerCase();

        return categorias.filter(
            (categoria) =>
                !texto ||
                categoria.nombre
                    .toLowerCase()
                    .includes(texto) ||
                categoria.descripcion
                    ?.toLowerCase()
                    .includes(texto),
        );
    }, [busqueda, categorias]);

    const resumen = useMemo(() => {
        return {
            productosActivos:
                productos.filter(
                    (producto) =>
                        producto.estado ===
                        "ACTIVO",
                ).length,

            productosInactivos:
                productos.filter(
                    (producto) =>
                        producto.estado ===
                        "INACTIVO",
                ).length,

            categoriasActivas:
                categorias.filter(
                    (categoria) =>
                        categoria.estado ===
                        "ACTIVA",
                ).length,

            categoriasInactivas:
                categorias.filter(
                    (categoria) =>
                        categoria.estado ===
                        "INACTIVA",
                ).length,
        };
    }, [categorias, productos]);

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function abrirNuevaCategoria() {
        setCategoriaEditando(null);
        setModalCategoria(true);
    }

    function abrirEditarCategoria(
        categoria: CategoriaCatalogo,
    ) {
        setCategoriaEditando(categoria);
        setModalCategoria(true);
    }

    function alternarCategoria(
        categoria: CategoriaCatalogo,
    ) {
        const nuevoEstado =
            categoria.estado === "ACTIVA"
                ? "INACTIVA"
                : "ACTIVA";

        iniciarTransicion(async () => {
            const resultado =
                await cambiarEstadoCategoria(
                    categoria.id,
                    nuevoEstado,
                );

            if (!resultado.exito) {
                alert(resultado.mensaje);
            }
        });
    }

    return (
        <div className="space-y-6">
            <section className="salon-panel overflow-hidden border border-[#DCE4DF] bg-white">
                <div className="salon-hero relative bg-sidebar p-7 text-white sm:p-9">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

                    <div className="relative">
                        <Link
                            href="/inventario"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a Inventario
                        </Link>

                        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                                    <Layers3 className="h-7 w-7 text-primary-soft" />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#AFC2B9]">
                                        Inventario
                                    </p>

                                    <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                        Catálogo
                                    </h1>

                                    <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                        Organiza las
                                        categorías y revisa
                                        todos los productos
                                        registrados en el
                                        salón.
                                    </p>
                                </div>
                            </div>

                            {puedeAdministrar && (
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href="/inventario/catalogo/nuevo"
                                        className="salon-action inline-flex items-center justify-center gap-2 bg-white px-4 text-sidebar transition hover:bg-[#F3F6F4]"
                                    >
                                        <Package className="h-4 w-4" />
                                        Nuevo producto
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={
                                            abrirNuevaCategoria
                                        }
                                        className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-4 text-sidebar transition hover:bg-white"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nueva categoría
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-[#E3E8E5] sm:grid-cols-4">
                    <DatoCabecera
                        titulo="Productos activos"
                        valor={String(
                            resumen.productosActivos,
                        )}
                    />
                    <DatoCabecera
                        titulo="Productos inactivos"
                        valor={String(
                            resumen.productosInactivos,
                        )}
                    />
                    <DatoCabecera
                        titulo="Categorías activas"
                        valor={String(
                            resumen.categoriasActivas,
                        )}
                    />
                    <DatoCabecera
                        titulo="Categorías inactivas"
                        valor={String(
                            resumen.categoriasInactivas,
                        )}
                    />
                </div>
            </section>

            <section className="salon-panel border border-border bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="inline-flex w-fit rounded-2xl bg-surface-soft p-1">
                        <button
                            type="button"
                            onClick={() =>
                                setVista("PRODUCTOS")
                            }
                            className={botonVista(
                                vista ===
                                "PRODUCTOS",
                            )}
                        >
                            <Package className="h-4 w-4" />
                            Productos
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setVista(
                                    "CATEGORIAS",
                                )
                            }
                            className={botonVista(
                                vista ===
                                "CATEGORIAS",
                            )}
                        >
                            <Tag className="h-4 w-4" />
                            Categorías
                        </button>
                    </div>

                    <div className="relative w-full lg:max-w-md">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder={
                                vista ===
                                    "PRODUCTOS"
                                    ? "Buscar producto, código, barra o marca..."
                                    : "Buscar categoría..."
                            }
                            className="salon-control w-full border border-border-strong bg-[#FBFCFB] pl-11 pr-4 outline-none focus:border-primary"
                        />
                    </div>
                </div>
            </section>

            {vista === "PRODUCTOS" ? (
                <section>
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#849189]">
                                Productos
                            </p>
                            <h2 className="mt-1 text-xl font-bold text-sidebar tracking-tight">
                                Catálogo de productos
                            </h2>
                        </div>

                        <p className="text-sm font-semibold text-[#718078]">
                            {
                                productosFiltrados.length
                            }{" "}
                            resultado
                            {productosFiltrados.length ===
                                1
                                ? ""
                                : "s"}
                        </p>
                    </div>

                    {productosFiltrados.length ===
                        0 ? (
                        <EstadoVacio
                            icono={Boxes}
                            titulo="No hay productos"
                            descripcion="Los productos que registremos en el siguiente paso aparecerán aquí."
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {productosFiltrados.map(
                                (producto) => (
                                    <TarjetaProducto
                                        key={
                                            producto.id
                                        }
                                        producto={
                                            producto
                                        }
                                        dinero={
                                            dinero
                                        }
                                        puedeAdministrar={
                                            puedeAdministrar
                                        }
                                        cambiarEstado={(
                                            nuevoEstado,
                                        ) => {
                                            iniciarTransicion(
                                                async () => {
                                                    const resultado =
                                                        await cambiarEstadoProducto(
                                                            producto.id,
                                                            nuevoEstado,
                                                        );

                                                    if (
                                                        !resultado.exito
                                                    ) {
                                                        alert(
                                                            resultado.mensaje,
                                                        );
                                                    }
                                                },
                                            );
                                        }}
                                    />
                                ),
                            )}
                        </div>
                    )}
                </section>
            ) : (
                <section>
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#849189]">
                                Organización
                            </p>
                            <h2 className="mt-1 text-xl font-bold text-sidebar tracking-tight">
                                Categorías
                            </h2>
                        </div>

                        <p className="text-sm font-semibold text-[#718078]">
                            {
                                categoriasFiltradas.length
                            }{" "}
                            resultado
                            {categoriasFiltradas.length ===
                                1
                                ? ""
                                : "s"}
                        </p>
                    </div>

                    {categoriasFiltradas.length ===
                        0 ? (
                        <EstadoVacio
                            icono={Tag}
                            titulo="No hay categorías"
                            descripcion="Crea la primera categoría para organizar tus productos."
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {categoriasFiltradas.map(
                                (categoria) => (
                                    <TarjetaCategoria
                                        key={
                                            categoria.id
                                        }
                                        categoria={
                                            categoria
                                        }
                                        productos={
                                            productos.filter(
                                                (
                                                    producto,
                                                ) =>
                                                    producto.categoria_id ===
                                                    categoria.id,
                                            ).length
                                        }
                                        puedeAdministrar={
                                            puedeAdministrar
                                        }
                                        procesando={
                                            procesando
                                        }
                                        editar={() =>
                                            abrirEditarCategoria(
                                                categoria,
                                            )
                                        }
                                        alternar={() =>
                                            alternarCategoria(
                                                categoria,
                                            )
                                        }
                                    />
                                ),
                            )}
                        </div>
                    )}
                </section>
            )}

            {modalCategoria && (
                <ModalCategoria
                    categoria={
                        categoriaEditando
                    }
                    cerrar={() =>
                        setModalCategoria(
                            false,
                        )
                    }
                />
            )}
        </div>
    );
}

function TarjetaProducto({
    producto,
    dinero,
    puedeAdministrar,
    cambiarEstado,
}: {
    producto: ProductoCatalogo;
    dinero: (valor: number) => string;
    puedeAdministrar: boolean;
    cambiarEstado: (
        nuevoEstado:
            | "ACTIVO"
            | "INACTIVO",
    ) => void;
}) {
    return (
        <article className="salon-panel overflow-hidden border border-border bg-white">
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                            <span
                                className={[
                                    "rounded-lg px-2 py-1 text-[10px] font-bold uppercase",
                                    producto.estado ===
                                        "ACTIVO"
                                        ? "bg-[#E3EEE8] text-[#527865]"
                                        : "bg-[#EEF0EF] text-[#7B8580]",
                                ].join(" ")}
                            >
                                {
                                    producto.estado
                                }
                            </span>

                            {producto.categorias_productos && (
                                <span className="rounded-lg bg-[#F1F4F2] px-2 py-1 text-xs font-bold text-[#718078]">
                                    {
                                        producto
                                            .categorias_productos
                                            .nombre
                                    }
                                </span>
                            )}
                        </div>

                        <h3 className="mt-3 truncate text-base font-bold text-sidebar tracking-tight">
                            {producto.nombre}
                        </h3>

                        <p className="mt-1 truncate text-xs text-[#829089]">
                            {
                                producto.codigo_producto
                            }
                            {producto.marca
                                ? ` · ${producto.marca}`
                                : ""}
                        </p>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-primary-strong">
                        <Package className="h-5 w-5" />
                    </div>
                </div>

                {(producto.presentacion ||
                    producto.codigo_barras) && (
                        <div className="mt-4 space-y-2 rounded-2xl bg-[#F8FAF8] p-3.5 text-xs text-[#65726B]">
                            {producto.presentacion && (
                                <p>
                                    Presentación:{" "}
                                    <strong className="text-[#405049]">
                                        {
                                            producto.presentacion
                                        }
                                    </strong>
                                </p>
                            )}

                            {producto.codigo_barras && (
                                <p className="flex items-center gap-2">
                                    <Barcode className="h-4 w-4" />
                                    {
                                        producto.codigo_barras
                                    }
                                </p>
                            )}
                        </div>
                    )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniDato
                        titulo="Costo"
                        valor={dinero(
                            producto.costo_unitario,
                        )}
                    />
                    <MiniDato
                        titulo="Precio"
                        valor={dinero(
                            producto.precio_venta,
                        )}
                    />
                    <MiniDato
                        titulo="Unidad"
                        valor={
                            producto.unidad_medida
                        }
                    />
                    <MiniDato
                        titulo="Stock mínimo"
                        valor={Number(
                            producto.stock_minimo_general,
                        ).toLocaleString(
                            "es-NI",
                            {
                                maximumFractionDigits: 3,
                            },
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 border-t border-[#EDF1EE] bg-[#FBFCFB]">
                <Caracteristica
                    activa={
                        producto.permite_venta
                    }
                    texto="Venta"
                />
                <Caracteristica
                    activa={
                        producto.permite_consumo_servicio
                    }
                    texto="Servicios"
                />
                <Caracteristica
                    activa={
                        producto.controla_stock
                    }
                    texto="Stock"
                />
            </div>

            {puedeAdministrar && (
                <div className="grid grid-cols-2 gap-2 border-t border-[#EDF1EE] p-3">
                    <Link
                        href={`/inventario/catalogo/${producto.id}/editar`}
                        className="salon-action inline-flex items-center justify-center gap-2 bg-surface-soft text-[#52605A]"
                    >
                        <Edit3 className="h-4 w-4" />
                        Editar
                    </Link>

                    <button
                        type="button"
                        onClick={() =>
                            cambiarEstado(
                                producto.estado ===
                                    "ACTIVO"
                                    ? "INACTIVO"
                                    : "ACTIVO",
                            )
                        }
                        className={[
                            "inline-flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-bold",
                            producto.estado ===
                                "ACTIVO"
                                ? "bg-[#F8E5E5] text-[#A25E5E]"
                                : "bg-[#E3EEE8] text-[#527865]",
                        ].join(" ")}
                    >
                        {producto.estado ===
                            "ACTIVO" ? (
                            <ToggleLeft className="h-4 w-4" />
                        ) : (
                            <ToggleRight className="h-4 w-4" />
                        )}

                        {producto.estado ===
                            "ACTIVO"
                            ? "Inactivar"
                            : "Activar"}
                    </button>
                </div>
            )}
        </article>
    );
}

function TarjetaCategoria({
    categoria,
    productos,
    puedeAdministrar,
    procesando,
    editar,
    alternar,
}: {
    categoria: CategoriaCatalogo;
    productos: number;
    puedeAdministrar: boolean;
    procesando: boolean;
    editar: () => void;
    alternar: () => void;
}) {
    const activa =
        categoria.estado === "ACTIVA";

    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-soft text-primary-strong">
                    <Tag className="h-5 w-5" />
                </div>

                <span
                    className={[
                        "rounded-lg px-2 py-1 text-[10px] font-bold uppercase",
                        activa
                            ? "bg-[#E3EEE8] text-[#527865]"
                            : "bg-[#EEF0EF] text-[#7B8580]",
                    ].join(" ")}
                >
                    {categoria.estado}
                </span>
            </div>

            <h3 className="mt-4 text-lg font-bold text-sidebar tracking-tight">
                {categoria.nombre}
            </h3>

            <p className="mt-2 min-h-10 text-sm leading-5 text-[#718078]">
                {categoria.descripcion ??
                    "Sin descripción."}
            </p>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F8FAF8] px-4 py-3">
                <span className="text-xs font-semibold text-[#718078]">
                    Productos
                </span>
                <strong className="text-sm text-sidebar">
                    {productos}
                </strong>
            </div>

            {puedeAdministrar && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={editar}
                        disabled={
                            procesando
                        }
                        className="salon-action inline-flex items-center justify-center gap-2 bg-surface-soft text-[#52605A] transition hover:bg-[#E5EAE7] disabled:opacity-50"
                    >
                        <Edit3 className="h-4 w-4" />
                        Editar
                    </button>

                    <button
                        type="button"
                        onClick={alternar}
                        disabled={
                            procesando
                        }
                        className={[
                            "inline-flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-bold transition disabled:opacity-50",
                            activa
                                ? "bg-[#F8E5E5] text-[#A25E5E]"
                                : "bg-[#E3EEE8] text-[#527865]",
                        ].join(" ")}
                    >
                        {activa ? (
                            <ToggleLeft className="h-4 w-4" />
                        ) : (
                            <ToggleRight className="h-4 w-4" />
                        )}

                        {activa
                            ? "Inactivar"
                            : "Activar"}
                    </button>
                </div>
            )}
        </article>
    );
}

function ModalCategoria({
    categoria,
    cerrar,
}: {
    categoria:
    | CategoriaCatalogo
    | null;
    cerrar: () => void;
}) {
    const [nombre, setNombre] =
        useState(
            categoria?.nombre ?? "",
        );

    const [
        descripcion,
        setDescripcion,
    ] = useState(
        categoria?.descripcion ?? "",
    );

    const [
        procesando,
        iniciarTransicion,
    ] = useTransition();

    function guardar() {
        iniciarTransicion(async () => {
            const resultado =
                categoria
                    ? await editarCategoria(
                        categoria.id,
                        {
                            nombre,
                            descripcion,
                        },
                    )
                    : await crearCategoria({
                        nombre,
                        descripcion,
                    });

            if (!resultado.exito) {
                alert(resultado.mensaje);
                return;
            }

            cerrar();
        });
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
            <div className="salon-panel w-full max-w-lg bg-white shadow-2xl">
                <header className="flex items-center justify-between border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#849189]">
                            Catálogo
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-sidebar tracking-tight">
                            {categoria
                                ? "Editar categoría"
                                : "Nueva categoría"}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={cerrar}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-soft text-[#52605A]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="space-y-5 p-5 sm:p-6">
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold text-[#52605A]">
                            Nombre de la categoría
                        </span>

                        <input
                            value={nombre}
                            onChange={(event) =>
                                setNombre(
                                    event.target.value,
                                )
                            }
                            placeholder="Ej. Shampoo, Tintes, Cuidado facial..."
                            className="salon-control w-full border border-border-strong px-4 outline-none focus:border-primary"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-bold text-[#52605A]">
                            Descripción
                        </span>

                        <textarea
                            value={descripcion}
                            onChange={(event) =>
                                setDescripcion(
                                    event.target.value,
                                )
                            }
                            rows={4}
                            placeholder="Descripción opcional..."
                            className="salon-control w-full resize-none border border-border-strong px-4 py-3 outline-none focus:border-primary"
                        />
                    </label>

                    <div className="flex justify-end gap-2 border-t border-[#EDF1EE] pt-5">
                        <button
                            type="button"
                            onClick={cerrar}
                            disabled={
                                procesando
                            }
                            className="salon-action bg-surface-soft px-4 text-[#52605A]"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={guardar}
                            disabled={
                                procesando
                            }
                            className="salon-action inline-flex items-center gap-2 bg-sidebar px-4 text-white disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />
                            {procesando
                                ? "Guardando..."
                                : "Guardar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DatoCabecera({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="p-4 text-center sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#87938D]">
                {titulo}
            </p>
            <p className="mt-2 text-xl font-bold text-sidebar">
                {valor}
            </p>
        </div>
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
            <p className="mt-1 truncate text-xs font-bold text-[#405049]">
                {valor}
            </p>
        </div>
    );
}

function Caracteristica({
    activa,
    texto,
}: {
    activa: boolean;
    texto: string;
}) {
    return (
        <div className="flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-bold uppercase text-[#718078]">
            <span
                className={[
                    "h-2 w-2 rounded-full",
                    activa
                        ? "bg-primary"
                        : "bg-[#CBD2CE]",
                ].join(" ")}
            />
            {texto}
        </div>
    );
}

function EstadoVacio({
    icono: Icono,
    titulo,
    descripcion,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    titulo: string;
    descripcion: string;
}) {
    return (
        <div className="salon-panel border border-dashed border-[#CCD6D0] bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft text-primary">
                <Icono className="h-7 w-7" />
            </div>

            <h3 className="mt-4 font-bold text-sidebar tracking-tight">
                {titulo}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#718078]">
                {descripcion}
            </p>
        </div>
    );
}

function botonVista(
    activo: boolean,
) {
    return [
        "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition",
        activo
            ? "bg-white text-[#26332F] shadow-sm"
            : "text-[#718078] hover:text-[#26332F]",
    ].join(" ");
}