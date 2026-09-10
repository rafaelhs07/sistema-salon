"use client";

import {
    BadgeDollarSign,
    CalendarCheck2,
    Check,
    CheckCircle2,
    Clock3,
    Edit3,
    Layers3,
    LoaderCircle,
    PackageOpen,
    PackageMinus,
    PackageSearch,
    Palette,
    Plus,
    Search,
    Scissors,
    SlidersHorizontal,
    Tag,
    Trash2,
    UserCheck,
    UserRoundCheck,
    UserX,
    UsersRound,
    X,
    XCircle,
} from "lucide-react";
import {
    FormEvent,
    useMemo,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
    actualizarServicio,
    cambiarEstadoServicio,
    crearCategoriaServicio,
    crearServicio,
    type DatosServicio,
    type EstadoServicio,
    type MaterialServicioFormulario,
    type TipoComisionEspecial,
    type TipoComisionServicio,
    type TrabajadorServicioFormulario,
    type UnidadMaterial,
} from "./actions";

export type CategoriaServicioListado = {
    id: string;
    nombre: string;
    descripcion: string | null;
    color: string;
    estado: string;
    orden: number;
};

export type TrabajadorDisponible = {
    id: string;
    nombre_completo: string;
    color_calendario: string;
    modalidad_pago: string;
    tipo_comision:
    | "PORCENTAJE"
    | "MONTO_FIJO"
    | "SIN_COMISION";
    comision_general: number;
    estado: string;
    permite_citas: boolean;
};

export type ProductoInventarioDisponible = {
    id: string;
    codigo_producto: string;
    codigo_barras: string | null;
    nombre: string;
    marca: string | null;
    presentacion: string | null;
    unidad_medida: UnidadMaterial;
    controla_stock: boolean;
    permite_consumo_servicio: boolean;
    estado: string;
};

export type ServicioListado = {
    id: string;
    categoria_id: string | null;
    nombre: string;
    descripcion: string | null;
    precio: number;
    duracion_minutos: number;
    color: string;
    permite_citas: boolean;
    permite_descuento: boolean;
    requiere_anticipo: boolean;
    monto_anticipo: number;
    tipo_comision_general: TipoComisionServicio;
    comision_general: number;
    estado: EstadoServicio;
    categorias_servicios: {
        id: string;
        nombre: string;
        color: string;
    } | null;
    trabajador_servicios: {
        trabajador_id: string;
        usa_comision_especial: boolean;
        tipo_comision_especial: TipoComisionEspecial | null;
        comision_especial: number | null;
        estado: string;
        trabajadores: {
            id: string;
            nombre_completo: string;
            color_calendario: string;
        } | null;
    }[];
    servicio_materiales: {
        id: string;
        producto_id: string | null;
        nombre_material: string;
        cantidad: number;
        unidad_medida: UnidadMaterial;
        costo_estimado: number;
        descontar_inventario: boolean;
        observaciones: string | null;
    }[];
};

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

type ServiciosClientProps = {
    serviciosIniciales: ServicioListado[];
    categoriasIniciales: CategoriaServicioListado[];
    trabajadoresDisponibles: TrabajadorDisponible[];
    productosDisponibles: ProductoInventarioDisponible[];
    simboloMoneda: string;
    puedeAdministrar: boolean;
};

const coloresDisponibles = [
    "#6F8F83",
    "#7893A6",
    "#C79AA1",
    "#D8B36A",
    "#8D7FA8",
    "#C97878",
    "#5F8A77",
    "#A47B67",
    "#929A96",
];

const unidades: {
    valor: UnidadMaterial;
    texto: string;
}[] = [
        { valor: "UNIDAD", texto: "Unidad" },
        { valor: "ML", texto: "Mililitros" },
        { valor: "LITRO", texto: "Litro" },
        { valor: "GRAMO", texto: "Gramo" },
        { valor: "KILOGRAMO", texto: "Kilogramo" },
        { valor: "PAR", texto: "Par" },
        { valor: "PAQUETE", texto: "Paquete" },
        { valor: "APLICACION", texto: "Aplicación" },
        { valor: "OTRO", texto: "Otro" },
    ];

export default function ServiciosClient({
    serviciosIniciales,
    categoriasIniciales,
    trabajadoresDisponibles,
    productosDisponibles,
    simboloMoneda,
    puedeAdministrar,
}: ServiciosClientProps) {
    const router = useRouter();

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] =
        useState<"TODOS" | EstadoServicio>("TODOS");
    const [filtroCategoria, setFiltroCategoria] =
        useState("TODAS");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [servicioEditando, setServicioEditando] =
        useState<ServicioListado | null>(null);
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [procesando, iniciarTransicion] = useTransition();

    const serviciosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return serviciosIniciales.filter((servicio) => {
            const trabajadoresTexto =
                servicio.trabajador_servicios
                    .map(
                        (relacion) =>
                            relacion.trabajadores?.nombre_completo ?? "",
                    )
                    .join(" ")
                    .toLowerCase();

            const coincideBusqueda =
                !texto ||
                servicio.nombre.toLowerCase().includes(texto) ||
                servicio.descripcion
                    ?.toLowerCase()
                    .includes(texto) ||
                servicio.categorias_servicios?.nombre
                    .toLowerCase()
                    .includes(texto) ||
                trabajadoresTexto.includes(texto);

            const coincideEstado =
                filtroEstado === "TODOS" ||
                servicio.estado === filtroEstado;

            const coincideCategoria =
                filtroCategoria === "TODAS" ||
                servicio.categoria_id === filtroCategoria;

            return (
                coincideBusqueda &&
                coincideEstado &&
                coincideCategoria
            );
        });
    }, [
        busqueda,
        filtroCategoria,
        filtroEstado,
        serviciosIniciales,
    ]);

    const resumen = useMemo(() => {
        return {
            total: serviciosIniciales.length,
            activos: serviciosIniciales.filter(
                (servicio) => servicio.estado === "ACTIVO",
            ).length,
            conCitas: serviciosIniciales.filter(
                (servicio) =>
                    servicio.estado === "ACTIVO" &&
                    servicio.permite_citas,
            ).length,
            categorias: categoriasIniciales.length,
        };
    }, [categoriasIniciales, serviciosIniciales]);

    function abrirNuevoServicio() {
        setServicioEditando(null);
        setMensaje(null);
        setModalAbierto(true);
    }

    function abrirEditar(servicio: ServicioListado) {
        setServicioEditando(servicio);
        setMensaje(null);
        setModalAbierto(true);
    }

    function cerrarModal() {
        if (procesando) return;

        setModalAbierto(false);
        setServicioEditando(null);
    }

    function cambiarEstado(servicio: ServicioListado) {
        const nuevoEstado: EstadoServicio =
            servicio.estado === "ACTIVO"
                ? "INACTIVO"
                : "ACTIVO";

        iniciarTransicion(async () => {
            const resultado = await cambiarEstadoServicio(
                servicio.id,
                nuevoEstado,
            );

            setMensaje({
                tipo: resultado.exito ? "EXITO" : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                router.refresh();
            }
        });
    }

    return (
        <div className="space-y-6">
            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() => setMensaje(null)}
                />
            )}

            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-secondary/15 blur-3xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                            <Scissors className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Catálogo del salón
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                Servicios
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Organiza precios, duración, categorías,
                                trabajadores, comisiones y materiales.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/servicios/consumos"
                            className="salon-action inline-flex items-center justify-center gap-2 border border-white/20 bg-white/10 px-5 text-white transition hover:bg-white/15"
                        >
                            <PackageMinus className="h-5 w-5" />
                            Consumos
                        </Link>

                        {puedeAdministrar && (
                            <button
                                type="button"
                                onClick={abrirNuevoServicio}
                                className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-5 text-sidebar transition hover:bg-white"
                            >
                                <Plus className="h-5 w-5" />
                                Nuevo servicio
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaResumen
                    titulo="Total de servicios"
                    valor={resumen.total}
                    icono={Scissors}
                />
                <TarjetaResumen
                    titulo="Servicios activos"
                    valor={resumen.activos}
                    icono={CheckCircle2}
                />
                <TarjetaResumen
                    titulo="Disponibles para citas"
                    valor={resumen.conCitas}
                    icono={CalendarCheck2}
                />
                <TarjetaResumen
                    titulo="Categorías activas"
                    valor={resumen.categorias}
                    icono={Layers3}
                />
            </section>

            <section className="salon-panel border border-border bg-white">
                <header className="flex flex-col gap-4 border-b border-[#E8ECE9] p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">
                            Catálogo de servicios
                        </h2>

                        <p className="mt-1 text-sm text-text-secondary">
                            {serviciosFiltrados.length} servicio
                            {serviciosFiltrados.length === 1 ? "" : "s"} encontrado
                            {serviciosFiltrados.length === 1 ? "" : "s"}.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="relative min-w-0">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />
                            <input
                                value={busqueda}
                                onChange={(event) =>
                                    setBusqueda(event.target.value)
                                }
                                placeholder="Buscar servicio..."
                                className="salon-control w-full border border-border-strong bg-white pl-12 pr-4 text-foreground outline-none transition placeholder:text-[#A2AAA6] focus:border-primary focus:ring-4 focus:ring-primary/15"
                            />
                        </div>

                        <div className="relative">
                            <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                            <select
                                value={filtroCategoria}
                                onChange={(event) =>
                                    setFiltroCategoria(event.target.value)
                                }
                                className="salon-control w-full appearance-none border border-border-strong bg-white pl-11 pr-8 font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                            >
                                <option value="TODAS">
                                    Todas las categorías
                                </option>
                                {categoriasIniciales.map((categoria) => (
                                    <option
                                        key={categoria.id}
                                        value={categoria.id}
                                    >
                                        {categoria.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                            <select
                                value={filtroEstado}
                                onChange={(event) =>
                                    setFiltroEstado(
                                        event.target.value as
                                        | "TODOS"
                                        | EstadoServicio,
                                    )
                                }
                                className="salon-control w-full appearance-none border border-border-strong bg-white pl-11 pr-8 font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                            >
                                <option value="TODOS">
                                    Todos los estados
                                </option>
                                <option value="ACTIVO">Activos</option>
                                <option value="INACTIVO">Inactivos</option>
                            </select>
                        </div>
                    </div>
                </header>

                {serviciosFiltrados.length === 0 ? (
                    <EstadoVacio
                        tieneRegistros={serviciosIniciales.length > 0}
                        puedeAdministrar={puedeAdministrar}
                        crear={abrirNuevoServicio}
                    />
                ) : (
                    <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 2xl:grid-cols-3">
                        {serviciosFiltrados.map((servicio) => (
                            <TarjetaServicio
                                key={servicio.id}
                                servicio={servicio}
                                simboloMoneda={simboloMoneda}
                                puedeAdministrar={puedeAdministrar}
                                procesando={procesando}
                                editar={() => abrirEditar(servicio)}
                                cambiarEstado={() =>
                                    cambiarEstado(servicio)
                                }
                            />
                        ))}
                    </div>
                )}
            </section>

            {modalAbierto && puedeAdministrar && (
                <ModalServicio
                    servicio={servicioEditando}
                    categoriasIniciales={categoriasIniciales}
                    trabajadoresDisponibles={
                        trabajadoresDisponibles
                    }
                    productosDisponibles={
                        productosDisponibles
                    }
                    simboloMoneda={simboloMoneda}
                    cerrar={cerrarModal}
                    guardado={(texto) => {
                        setModalAbierto(false);
                        setServicioEditando(null);
                        setMensaje({
                            tipo: "EXITO",
                            texto,
                        });
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}

function TarjetaResumen({
    titulo,
    valor,
    icono: Icono,
}: {
    titulo: string;
    valor: number;
    icono: React.ComponentType<{ className?: string }>;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-text-secondary">
                        {titulo}
                    </p>
                    <p className="mt-3 text-3xl font-bold text-foreground">
                        {valor}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function TarjetaServicio({
    servicio,
    simboloMoneda,
    puedeAdministrar,
    procesando,
    editar,
    cambiarEstado,
}: {
    servicio: ServicioListado;
    simboloMoneda: string;
    puedeAdministrar: boolean;
    procesando: boolean;
    editar: () => void;
    cambiarEstado: () => void;
}) {
    return (
        <article className="overflow-hidden rounded-2xl border border-border bg-[#FBFCFA] transition hover:-translate-y-0.5 hover:border-[#C8D9D1] hover:shadow-lg">
            <div
                className="h-1.5 w-full"
                style={{
                    backgroundColor: servicio.color,
                }}
            />

            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-bold text-foreground tracking-tight">
                                {servicio.nombre}
                            </h3>

                            <span
                                className={[
                                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                                    servicio.estado === "ACTIVO"
                                        ? "bg-[#E3EEE8] text-[#527865]"
                                        : "bg-[#F1E8E8] text-[#A66161]",
                                ].join(" ")}
                            >
                                {servicio.estado === "ACTIVO"
                                    ? "Activo"
                                    : "Inactivo"}
                            </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-primary">
                            {servicio.categorias_servicios?.nombre ??
                                "Sin categoría"}
                        </p>
                    </div>

                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                        style={{
                            backgroundColor: servicio.color,
                        }}
                    >
                        <Scissors className="h-5 w-5" />
                    </div>
                </div>

                <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-text-secondary">
                    {servicio.descripcion ||
                        "Sin descripción registrada."}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <DatoServicio
                        titulo="Precio"
                        valor={`${simboloMoneda} ${Number(
                            servicio.precio,
                        ).toLocaleString("es-NI", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}`}
                    />

                    <DatoServicio
                        titulo="Duración"
                        valor={formatearDuracion(
                            servicio.duracion_minutos,
                        )}
                    />

                    <DatoServicio
                        titulo="Trabajadores"
                        valor={String(
                            servicio.trabajador_servicios.filter(
                                (item) => item.estado === "ACTIVO",
                            ).length,
                        )}
                    />

                    <DatoServicio
                        titulo="Materiales"
                        valor={String(
                            servicio.servicio_materiales.length,
                        )}
                    />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {servicio.permite_citas && (
                        <Etiqueta texto="Permite citas" />
                    )}

                    {servicio.requiere_anticipo && (
                        <Etiqueta
                            texto={`Anticipo ${simboloMoneda} ${Number(
                                servicio.monto_anticipo,
                            ).toLocaleString("es-NI")}`}
                        />
                    )}

                    <Etiqueta
                        texto={formatearComisionGeneral(
                            servicio,
                            simboloMoneda,
                        )}
                    />
                </div>

                {puedeAdministrar && (
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={editar}
                            className="salon-action inline-flex flex-1 items-center justify-center gap-2 border border-border-strong bg-white text-text-secondary transition hover:bg-surface-soft"
                        >
                            <Edit3 className="h-4 w-4" />
                            Editar
                        </button>

                        <button
                            type="button"
                            onClick={cambiarEstado}
                            disabled={procesando}
                            className={[
                                "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                                servicio.estado === "ACTIVO"
                                    ? "bg-[#F8E5E5] text-[#A25E5E] hover:bg-[#F2DADA]"
                                    : "bg-[#E3EEE8] text-[#527865] hover:bg-[#D8E8E0]",
                            ].join(" ")}
                        >
                            {servicio.estado === "ACTIVO" ? (
                                <>
                                    <UserX className="h-4 w-4" />
                                    Desactivar
                                </>
                            ) : (
                                <>
                                    <UserCheck className="h-4 w-4" />
                                    Activar
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}

function ModalServicio({
    servicio,
    categoriasIniciales,
    trabajadoresDisponibles,
    productosDisponibles,
    simboloMoneda,
    cerrar,
    guardado,
}: {
    servicio: ServicioListado | null;
    categoriasIniciales: CategoriaServicioListado[];
    trabajadoresDisponibles: TrabajadorDisponible[];
    productosDisponibles: ProductoInventarioDisponible[];
    simboloMoneda: string;
    cerrar: () => void;
    guardado: (mensaje: string) => void;
}) {
    const editando = Boolean(servicio);

    const [formulario, setFormulario] =
        useState<DatosServicio>(() =>
            crearFormularioInicial(servicio),
        );
    const [categorias, setCategorias] = useState(
        categoriasIniciales,
    );
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [guardando, iniciarGuardado] = useTransition();

    function actualizar<K extends keyof DatosServicio>(
        campo: K,
        valor: DatosServicio[K],
    ) {
        setFormulario((actual) => ({
            ...actual,
            [campo]: valor,
        }));
        setMensaje(null);
    }

    async function agregarCategoria(
        nombre: string,
        color: string,
    ) {
        const resultado = await crearCategoriaServicio(
            nombre,
            color,
        );

        if (!resultado.exito || !resultado.categoria) {
            return resultado;
        }

        const categoriaCreada = resultado.categoria;

        setCategorias((actuales) => {
            const existe = actuales.some(
                (categoria) =>
                    categoria.id === categoriaCreada.id,
            );

            if (existe) return actuales;

            return [
                ...actuales,
                {
                    id: categoriaCreada.id,
                    nombre: categoriaCreada.nombre,
                    descripcion: null,
                    color: categoriaCreada.color,
                    estado: categoriaCreada.estado,
                    orden: actuales.length + 1,
                },
            ].sort((a, b) =>
                a.nombre.localeCompare(b.nombre, "es"),
            );
        });

        setFormulario((actual) => ({
            ...actual,
            categoriaId: categoriaCreada.id,
            color: actual.color || categoriaCreada.color,
        }));

        return resultado;
    }

    function guardar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMensaje(null);

        iniciarGuardado(async () => {
            const resultado = editando
                ? await actualizarServicio(formulario)
                : await crearServicio(formulario);

            if (!resultado.exito) {
                setMensaje({
                    tipo: "ERROR",
                    texto: resultado.mensaje,
                });
                return;
            }

            guardado(resultado.mensaje);
        });
    }

    const usaComisionGeneral =
        formulario.tipoComisionGeneral ===
        "PORCENTAJE" ||
        formulario.tipoComisionGeneral ===
        "MONTO_FIJO";

    return (
        <div className="fixed inset-0 z-[70] flex justify-end bg-sidebar/45 backdrop-blur-sm">
            <button
                type="button"
                aria-label="Cerrar formulario"
                onClick={cerrar}
                className="absolute inset-0"
            />

            <aside className="salon-sheet relative z-10 h-full w-full max-w-3xl overflow-y-auto bg-background shadow-2xl">
                <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white/95 px-5 py-5 backdrop-blur-xl sm:px-7">
                    <div>
                        <p className="text-sm font-semibold text-primary">
                            {editando
                                ? "Editar servicio"
                                : "Nuevo servicio"}
                        </p>
                        <h2 className="mt-1 text-2xl font-bold text-foreground tracking-tight">
                            {editando
                                ? servicio?.nombre
                                : "Registrar servicio"}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={cerrar}
                        disabled={guardando}
                        className="rounded-xl border border-border bg-white p-2.5 text-text-secondary transition hover:bg-surface-soft"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <form onSubmit={guardar} className="p-5 sm:p-7">
                    <div className="space-y-6">
                        {mensaje && (
                            <MensajeEstado
                                mensaje={mensaje}
                                cerrar={() => setMensaje(null)}
                            />
                        )}

                        <SeccionFormulario
                            titulo="Información general"
                            icono={Scissors}
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <CampoTexto
                                        etiqueta="Nombre del servicio"
                                        valor={formulario.nombre}
                                        placeholder="Ej. Tinte completo"
                                        requerido
                                        cambiar={(valor) =>
                                            actualizar("nombre", valor)
                                        }
                                    />
                                </div>

                                <SelectorCategoria
                                    categorias={categorias}
                                    valor={formulario.categoriaId}
                                    cambiar={(valor) => {
                                        actualizar("categoriaId", valor);

                                        const categoria =
                                            categorias.find(
                                                (item) => item.id === valor,
                                            );

                                        if (categoria) {
                                            actualizar(
                                                "color",
                                                categoria.color,
                                            );
                                        }
                                    }}
                                    agregarCategoria={agregarCategoria}
                                />

                                <CampoDinero
                                    etiqueta="Precio"
                                    valor={formulario.precio}
                                    simbolo={simboloMoneda}
                                    cambiar={(valor) =>
                                        actualizar("precio", valor)
                                    }
                                />

                                <CampoNumero
                                    etiqueta="Duración en minutos"
                                    valor={formulario.duracionMinutos}
                                    minimo={5}
                                    maximo={1440}
                                    paso={5}
                                    icono={Clock3}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "duracionMinutos",
                                            valor,
                                        )
                                    }
                                />

                                <SelectorColor
                                    valor={formulario.color}
                                    cambiar={(valor) =>
                                        actualizar("color", valor)
                                    }
                                />

                                <div className="sm:col-span-2">
                                    <CampoArea
                                        etiqueta="Descripción"
                                        valor={formulario.descripcion}
                                        placeholder="Describe brevemente el servicio..."
                                        cambiar={(valor) =>
                                            actualizar("descripcion", valor)
                                        }
                                    />
                                </div>
                            </div>
                        </SeccionFormulario>

                        <SeccionFormulario
                            titulo="Reservas y cobro"
                            icono={CalendarCheck2}
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Interruptor
                                    titulo="Permitir citas"
                                    descripcion="El servicio podrá seleccionarse en la agenda."
                                    activo={formulario.permiteCitas}
                                    cambiar={(valor) =>
                                        actualizar("permiteCitas", valor)
                                    }
                                />

                                <Interruptor
                                    titulo="Permitir descuentos"
                                    descripcion="Caja podrá aplicar descuentos al servicio."
                                    activo={formulario.permiteDescuento}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "permiteDescuento",
                                            valor,
                                        )
                                    }
                                />

                                <Interruptor
                                    titulo="Requiere anticipo"
                                    descripcion="La cita podrá exigir un pago previo."
                                    activo={formulario.requiereAnticipo}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "requiereAnticipo",
                                            valor,
                                        )
                                    }
                                />

                                <Interruptor
                                    titulo="Servicio activo"
                                    descripcion="Estará disponible dentro del sistema."
                                    activo={formulario.estado === "ACTIVO"}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "estado",
                                            valor ? "ACTIVO" : "INACTIVO",
                                        )
                                    }
                                />
                            </div>

                            {formulario.requiereAnticipo && (
                                <div className="mt-5 max-w-sm">
                                    <CampoDinero
                                        etiqueta="Monto del anticipo"
                                        valor={formulario.montoAnticipo}
                                        simbolo={simboloMoneda}
                                        cambiar={(valor) =>
                                            actualizar(
                                                "montoAnticipo",
                                                valor,
                                            )
                                        }
                                    />
                                </div>
                            )}
                        </SeccionFormulario>

                        <SeccionFormulario
                            titulo="Comisión general"
                            icono={BadgeDollarSign}
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <CampoSelect
                                    etiqueta="Regla de comisión"
                                    valor={
                                        formulario.tipoComisionGeneral
                                    }
                                    opciones={[
                                        {
                                            valor: "USAR_TRABAJADOR",
                                            texto:
                                                "Usar comisión configurada en el trabajador",
                                        },
                                        {
                                            valor: "PORCENTAJE",
                                            texto:
                                                "Porcentaje propio del servicio",
                                        },
                                        {
                                            valor: "MONTO_FIJO",
                                            texto:
                                                "Monto fijo propio del servicio",
                                        },
                                        {
                                            valor: "SIN_COMISION",
                                            texto: "Sin comisión",
                                        },
                                    ]}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "tipoComisionGeneral",
                                            valor as TipoComisionServicio,
                                        )
                                    }
                                />

                                {usaComisionGeneral && (
                                    <CampoComision
                                        tipo={
                                            formulario.tipoComisionGeneral as
                                            | "PORCENTAJE"
                                            | "MONTO_FIJO"
                                        }
                                        valor={formulario.comisionGeneral}
                                        simboloMoneda={simboloMoneda}
                                        cambiar={(valor) =>
                                            actualizar(
                                                "comisionGeneral",
                                                valor,
                                            )
                                        }
                                    />
                                )}
                            </div>
                        </SeccionFormulario>

                        <SeccionFormulario
                            titulo="Trabajadores autorizados"
                            icono={UsersRound}
                        >
                            <SelectorTrabajadores
                                trabajadoresDisponibles={
                                    trabajadoresDisponibles
                                }
                                seleccionados={formulario.trabajadores}
                                simboloMoneda={simboloMoneda}
                                cambiar={(trabajadores) =>
                                    actualizar(
                                        "trabajadores",
                                        trabajadores,
                                    )
                                }
                            />
                        </SeccionFormulario>

                        <SeccionFormulario
                            titulo="Materiales del servicio"
                            icono={PackageOpen}
                        >
                            <EditorMateriales
                                materiales={formulario.materiales}
                                productosDisponibles={
                                    productosDisponibles
                                }
                                simboloMoneda={simboloMoneda}
                                cambiar={(materiales) =>
                                    actualizar("materiales", materiales)
                                }
                            />
                        </SeccionFormulario>
                    </div>

                    <div className="sticky bottom-4 mt-6 flex flex-col-reverse gap-3 rounded-2xl border border-border-strong bg-white/95 p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={cerrar}
                            disabled={guardando}
                            className="salon-action border border-border-strong bg-surface-soft px-5 text-text-secondary transition hover:bg-[#E3EAE6]"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={guardando}
                            className="salon-action inline-flex min-w-44 items-center justify-center gap-2 bg-primary px-5 text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-[#AAB9B3]"
                        >
                            {guardando ? (
                                <>
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5" />
                                    {editando
                                        ? "Guardar cambios"
                                        : "Registrar servicio"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </aside>
        </div>
    );
}

function SelectorCategoria({
    categorias,
    valor,
    cambiar,
    agregarCategoria,
}: {
    categorias: CategoriaServicioListado[];
    valor: string;
    cambiar: (valor: string) => void;
    agregarCategoria: (
        nombre: string,
        color: string,
    ) => Promise<{
        exito: boolean;
        mensaje: string;
    }>;
}) {
    const [mostrarNueva, setMostrarNueva] = useState(false);
    const [nombre, setNombre] = useState("");
    const [color, setColor] = useState("#6F8F83");
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [creando, iniciarCreacion] = useTransition();

    function crearNueva() {
        iniciarCreacion(async () => {
            const resultado = await agregarCategoria(
                nombre,
                color,
            );

            setMensaje({
                tipo: resultado.exito ? "EXITO" : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                setNombre("");
                setMostrarNueva(false);
            }
        });
    }

    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                Categoría
                <span className="ml-1 text-[#C97878]">*</span>
            </label>

            <select
                value={valor}
                required
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="salon-control w-full border border-border-strong bg-white px-4 font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            >
                <option value="">Seleccionar categoría</option>
                {categorias.map((categoria) => (
                    <option
                        key={categoria.id}
                        value={categoria.id}
                    >
                        {categoria.nombre}
                    </option>
                ))}
            </select>

            <button
                type="button"
                onClick={() =>
                    setMostrarNueva((actual) => !actual)
                }
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary-hover"
            >
                <Plus className="h-3.5 w-3.5" />
                Agregar categoría
            </button>

            {mostrarNueva && (
                <div className="mt-3 rounded-2xl border border-border-strong bg-[#FBFCFA] p-3">
                    <div className="flex gap-2">
                        <input
                            value={nombre}
                            onChange={(event) => {
                                setNombre(event.target.value);
                                setMensaje(null);
                            }}
                            placeholder="Nombre de la categoría"
                            className="salon-control min-w-0 flex-1 border border-border-strong bg-white px-3 outline-none focus:border-primary"
                        />

                        <label className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border-strong">
                            <span
                                className="absolute inset-1 rounded-lg"
                                style={{
                                    backgroundColor: color,
                                }}
                            />
                            <input
                                type="color"
                                value={color}
                                onChange={(event) =>
                                    setColor(event.target.value)
                                }
                                className="absolute inset-0 opacity-0"
                            />
                        </label>

                        <button
                            type="button"
                            onClick={crearNueva}
                            disabled={creando}
                            className="salon-action inline-flex items-center justify-center bg-primary-soft px-3 text-text-secondary"
                        >
                            {creando ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                "Guardar"
                            )}
                        </button>
                    </div>

                    {mensaje && (
                        <p
                            className={[
                                "mt-2 text-xs font-semibold",
                                mensaje.tipo === "EXITO"
                                    ? "text-[#527865]"
                                    : "text-[#A25E5E]",
                            ].join(" ")}
                        >
                            {mensaje.texto}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function SelectorTrabajadores({
    trabajadoresDisponibles,
    seleccionados,
    simboloMoneda,
    cambiar,
}: {
    trabajadoresDisponibles: TrabajadorDisponible[];
    seleccionados: TrabajadorServicioFormulario[];
    simboloMoneda: string;
    cambiar: (
        trabajadores: TrabajadorServicioFormulario[],
    ) => void;
}) {
    function alternar(trabajadorId: string) {
        const existe = seleccionados.find(
            (item) => item.trabajadorId === trabajadorId,
        );

        if (existe) {
            cambiar(
                seleccionados.filter(
                    (item) =>
                        item.trabajadorId !== trabajadorId,
                ),
            );
            return;
        }

        cambiar([
            ...seleccionados,
            {
                trabajadorId,
                usaComisionEspecial: false,
                tipoComisionEspecial: "PORCENTAJE",
                comisionEspecial: 0,
            },
        ]);
    }

    function actualizarTrabajador(
        trabajadorId: string,
        cambios: Partial<TrabajadorServicioFormulario>,
    ) {
        cambiar(
            seleccionados.map((item) =>
                item.trabajadorId === trabajadorId
                    ? {
                        ...item,
                        ...cambios,
                    }
                    : item,
            ),
        );
    }

    if (trabajadoresDisponibles.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border-strong bg-[#FBFCFA] p-6 text-center">
                <UsersRound className="mx-auto h-8 w-8 text-[#829089]" />
                <p className="mt-3 font-semibold text-[#33413B]">
                    No hay trabajadores activos
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                    Registra trabajadores antes de asignarlos a un
                    servicio.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {trabajadoresDisponibles.map((trabajador) => {
                const configuracion = seleccionados.find(
                    (item) =>
                        item.trabajadorId === trabajador.id,
                );
                const seleccionado = Boolean(configuracion);

                return (
                    <article
                        key={trabajador.id}
                        className={[
                            "rounded-2xl border p-4 transition",
                            seleccionado
                                ? "border-[#C8D9D1] bg-surface-soft"
                                : "border-border bg-[#FBFCFA]",
                        ].join(" ")}
                    >
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => alternar(trabajador.id)}
                                className={[
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition",
                                    seleccionado
                                        ? "border-primary bg-primary text-white"
                                        : "border-[#C8D0CC] bg-white",
                                ].join(" ")}
                            >
                                {seleccionado && (
                                    <Check className="h-4 w-4" />
                                )}
                            </button>

                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                                style={{
                                    backgroundColor:
                                        trabajador.color_calendario,
                                }}
                            >
                                {obtenerIniciales(
                                    trabajador.nombre_completo,
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-[#33413B]">
                                    {trabajador.nombre_completo}
                                </p>

                                <p className="mt-0.5 text-xs text-[#76817B]">
                                    Comisión general:{" "}
                                    {formatearComisionTrabajador(
                                        trabajador,
                                        simboloMoneda,
                                    )}
                                </p>
                            </div>
                        </div>

                        {seleccionado && configuracion && (
                            <div className="mt-4 rounded-xl border border-border-strong bg-white p-3">
                                <InterruptorCompacto
                                    titulo="Usar comisión especial"
                                    activo={
                                        configuracion.usaComisionEspecial
                                    }
                                    cambiar={(valor) =>
                                        actualizarTrabajador(
                                            trabajador.id,
                                            {
                                                usaComisionEspecial: valor,
                                            },
                                        )
                                    }
                                />

                                {configuracion.usaComisionEspecial && (
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <CampoSelect
                                            etiqueta="Tipo"
                                            valor={
                                                configuracion.tipoComisionEspecial
                                            }
                                            opciones={[
                                                {
                                                    valor: "PORCENTAJE",
                                                    texto: "Porcentaje",
                                                },
                                                {
                                                    valor: "MONTO_FIJO",
                                                    texto: "Monto fijo",
                                                },
                                                {
                                                    valor: "SIN_COMISION",
                                                    texto: "Sin comisión",
                                                },
                                            ]}
                                            cambiar={(valor) =>
                                                actualizarTrabajador(
                                                    trabajador.id,
                                                    {
                                                        tipoComisionEspecial:
                                                            valor as TipoComisionEspecial,
                                                        comisionEspecial:
                                                            valor === "SIN_COMISION"
                                                                ? 0
                                                                : configuracion.comisionEspecial,
                                                    },
                                                )
                                            }
                                        />

                                        {configuracion.tipoComisionEspecial !==
                                            "SIN_COMISION" && (
                                                <CampoComision
                                                    tipo={
                                                        configuracion.tipoComisionEspecial
                                                    }
                                                    valor={
                                                        configuracion.comisionEspecial
                                                    }
                                                    simboloMoneda={simboloMoneda}
                                                    cambiar={(valor) =>
                                                        actualizarTrabajador(
                                                            trabajador.id,
                                                            {
                                                                comisionEspecial: valor,
                                                            },
                                                        )
                                                    }
                                                />
                                            )}
                                    </div>
                                )}
                            </div>
                        )}
                    </article>
                );
            })}
        </div>
    );
}

function EditorMateriales({
    materiales,
    productosDisponibles,
    simboloMoneda,
    cambiar,
}: {
    materiales: MaterialServicioFormulario[];
    productosDisponibles: ProductoInventarioDisponible[];
    simboloMoneda: string;
    cambiar: (
        materiales: MaterialServicioFormulario[],
    ) => void;
}) {
    function agregarMaterial() {
        cambiar([
            ...materiales,
            {
                idTemporal: crearIdTemporal(),
                productoId: "",
                nombreMaterial: "",
                cantidad: 1,
                unidadMedida: "UNIDAD",
                costoEstimado: 0,
                descontarInventario: false,
                observaciones: "",
            },
        ]);
    }

    function actualizarMaterial(
        idTemporal: string,
        cambios: Partial<MaterialServicioFormulario>,
    ) {
        cambiar(
            materiales.map((material) =>
                material.idTemporal === idTemporal
                    ? {
                        ...material,
                        ...cambios,
                    }
                    : material,
            ),
        );
    }

    function eliminarMaterial(idTemporal: string) {
        cambiar(
            materiales.filter(
                (material) =>
                    material.idTemporal !== idTemporal,
            ),
        );
    }

    function cambiarProducto(
        material: MaterialServicioFormulario,
        productoId: string,
    ) {
        const producto =
            productosDisponibles.find(
                (item) =>
                    item.id === productoId,
            );

        actualizarMaterial(
            material.idTemporal,
            {
                productoId,
                unidadMedida:
                    producto?.unidad_medida ??
                    material.unidadMedida,
                nombreMaterial:
                    material.nombreMaterial.trim() ||
                    producto?.nombre ||
                    "",
            },
        );
    }

    const productosValidos =
        productosDisponibles.filter(
            (producto) =>
                producto.estado === "ACTIVO" &&
                producto.permite_consumo_servicio &&
                producto.controla_stock,
        );

    return (
        <div>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-semibold text-[#33413B]">
                        Materiales y consumo de inventario
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#76817B]">
                        Si un material se descuenta del inventario,
                        vincúlalo con el producto real y usa la misma
                        unidad de medida.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={agregarMaterial}
                    className="salon-action inline-flex items-center justify-center gap-2 bg-surface-soft px-4 text-text-secondary transition hover:bg-primary-soft"
                >
                    <Plus className="h-4 w-4" />
                    Agregar material
                </button>
            </div>

            {materiales.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-border-strong bg-[#FBFCFA] p-6 text-center">
                    <PackageOpen className="mx-auto h-8 w-8 text-[#829089]" />

                    <p className="mt-3 text-sm text-text-secondary">
                        Este servicio todavía no tiene materiales.
                    </p>
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    {materiales.map((material, indice) => {
                        const productoSeleccionado =
                            productosDisponibles.find(
                                (producto) =>
                                    producto.id ===
                                    material.productoId,
                            ) ?? null;

                        return (
                            <article
                                key={material.idTemporal}
                                className="rounded-2xl border border-border bg-[#FBFCFA] p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-[#33413B]">
                                            Material {indice + 1}
                                        </p>

                                        {productoSeleccionado && (
                                            <p className="mt-1 text-xs font-semibold text-primary-hover">
                                                Vinculado a:{" "}
                                                {productoSeleccionado.nombre}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            eliminarMaterial(
                                                material.idTemporal,
                                            )
                                        }
                                        className="rounded-lg p-2 text-[#A25E5E] transition hover:bg-[#F8E5E5]"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <CampoTexto
                                        etiqueta="Nombre del material"
                                        valor={material.nombreMaterial}
                                        placeholder="Ej. Shampoo"
                                        requerido
                                        cambiar={(valor) =>
                                            actualizarMaterial(
                                                material.idTemporal,
                                                {
                                                    nombreMaterial: valor,
                                                },
                                            )
                                        }
                                    />

                                    <CampoNumero
                                        etiqueta="Cantidad usada por servicio"
                                        valor={material.cantidad}
                                        minimo={0.001}
                                        paso={0.001}
                                        icono={PackageOpen}
                                        cambiar={(valor) =>
                                            actualizarMaterial(
                                                material.idTemporal,
                                                {
                                                    cantidad: valor,
                                                },
                                            )
                                        }
                                    />

                                    <CampoSelect
                                        etiqueta="Unidad"
                                        valor={material.unidadMedida}
                                        opciones={unidades.map(
                                            (unidad) => ({
                                                valor: unidad.valor,
                                                texto: unidad.texto,
                                            }),
                                        )}
                                        cambiar={(valor) =>
                                            actualizarMaterial(
                                                material.idTemporal,
                                                {
                                                    unidadMedida:
                                                        valor as UnidadMaterial,
                                                },
                                            )
                                        }
                                    />

                                    <CampoDinero
                                        etiqueta="Costo estimado"
                                        valor={material.costoEstimado}
                                        simbolo={simboloMoneda}
                                        cambiar={(valor) =>
                                            actualizarMaterial(
                                                material.idTemporal,
                                                {
                                                    costoEstimado: valor,
                                                },
                                            )
                                        }
                                    />
                                </div>

                                <div className="mt-4 rounded-xl border border-border-strong bg-white p-4">
                                    <InterruptorCompacto
                                        titulo="Descontar automáticamente del inventario"
                                        activo={
                                            material.descontarInventario
                                        }
                                        cambiar={(valor) =>
                                            actualizarMaterial(
                                                material.idTemporal,
                                                {
                                                    descontarInventario: valor,
                                                    productoId: valor
                                                        ? material.productoId
                                                        : "",
                                                },
                                            )
                                        }
                                    />

                                    {material.descontarInventario && (
                                        <div className="mt-4">
                                            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#3D4A45]">
                                                <PackageSearch className="h-4 w-4 text-primary" />
                                                Producto de inventario
                                                <span className="text-[#C97878]">
                                                    *
                                                </span>
                                            </label>

                                            <select
                                                value={
                                                    material.productoId
                                                }
                                                required
                                                onChange={(event) =>
                                                    cambiarProducto(
                                                        material,
                                                        event.target.value,
                                                    )
                                                }
                                                className="salon-control w-full border border-border-strong bg-white px-4 font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                                            >
                                                <option value="">
                                                    Seleccionar producto
                                                </option>

                                                {productosValidos.map(
                                                    (producto) => (
                                                        <option
                                                            key={
                                                                producto.id
                                                            }
                                                            value={
                                                                producto.id
                                                            }
                                                        >
                                                            {
                                                                producto.nombre
                                                            }
                                                            {" · "}
                                                            {
                                                                producto.codigo_producto
                                                            }
                                                            {" · "}
                                                            {
                                                                producto.unidad_medida
                                                            }
                                                        </option>
                                                    ),
                                                )}
                                            </select>

                                            {productosValidos.length ===
                                                0 && (
                                                    <p className="mt-2 text-xs font-semibold text-[#A25E5E]">
                                                        No hay productos activos
                                                        habilitados para consumo
                                                        por servicios y con control
                                                        de stock.
                                                    </p>
                                                )}

                                            {productoSeleccionado && (
                                                <div className="mt-3 rounded-xl bg-surface-soft px-3 py-3 text-xs text-[#52605A]">
                                                    <p>
                                                        <strong>
                                                            Producto:
                                                        </strong>{" "}
                                                        {
                                                            productoSeleccionado.nombre
                                                        }
                                                    </p>

                                                    <p className="mt-1">
                                                        <strong>
                                                            Unidad de inventario:
                                                        </strong>{" "}
                                                        {
                                                            productoSeleccionado.unidad_medida
                                                        }
                                                    </p>

                                                    {material.unidadMedida !==
                                                        productoSeleccionado.unidad_medida && (
                                                            <p className="mt-2 font-bold text-[#A25E5E]">
                                                                La unidad del
                                                                material debe
                                                                coincidir con la
                                                                unidad del producto.
                                                            </p>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SeccionFormulario({
    titulo,
    icono: Icono,
    children,
}: {
    titulo: string;
    icono: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <section className="salon-panel overflow-hidden border border-border bg-white">
            <header className="flex items-center gap-3 border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                    <Icono className="h-5 w-5" />
                </div>

                <h3 className="font-bold text-foreground tracking-tight">
                    {titulo}
                </h3>
            </header>

            <div className="p-5">{children}</div>
        </section>
    );
}

function CampoTexto({
    etiqueta,
    valor,
    placeholder,
    requerido = false,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    placeholder: string;
    requerido?: boolean;
    cambiar: (valor: string) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
                {requerido && (
                    <span className="ml-1 text-[#C97878]">*</span>
                )}
            </label>

            <input
                value={valor}
                required={requerido}
                placeholder={placeholder}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="salon-control w-full border border-border-strong bg-white px-4 text-foreground outline-none transition placeholder:text-[#A2AAA6] focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
        </div>
    );
}

function CampoArea({
    etiqueta,
    valor,
    placeholder,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    placeholder: string;
    cambiar: (valor: string) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </label>

            <textarea
                rows={4}
                maxLength={500}
                value={valor}
                placeholder={placeholder}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="salon-control w-full resize-y border border-border-strong bg-white px-4 py-3 leading-6 text-foreground outline-none transition placeholder:text-[#A2AAA6] focus:border-primary focus:ring-4 focus:ring-primary/15"
            />

            <p className="mt-1 text-right text-xs text-[#909A95]">
                {valor.length}/500
            </p>
        </div>
    );
}

function CampoDinero({
    etiqueta,
    valor,
    simbolo,
    cambiar,
}: {
    etiqueta: string;
    valor: number;
    simbolo: string;
    cambiar: (valor: number) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </label>

            <div className="relative">
                <BadgeDollarSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valor}
                    onChange={(event) =>
                        cambiar(Number(event.target.value))
                    }
                    className="salon-control w-full border border-border-strong bg-white pl-12 pr-14 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-secondary">
                    {simbolo}
                </span>
            </div>
        </div>
    );
}

function CampoNumero({
    etiqueta,
    valor,
    minimo,
    maximo,
    paso,
    icono: Icono,
    cambiar,
}: {
    etiqueta: string;
    valor: number;
    minimo: number;
    maximo?: number;
    paso: number;
    icono: React.ComponentType<{ className?: string }>;
    cambiar: (valor: number) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </label>

            <div className="relative">
                <Icono className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />
                <input
                    type="number"
                    min={minimo}
                    max={maximo}
                    step={paso}
                    value={valor}
                    onChange={(event) =>
                        cambiar(Number(event.target.value))
                    }
                    className="salon-control w-full border border-border-strong bg-white pl-12 pr-4 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
            </div>
        </div>
    );
}

function CampoSelect({
    etiqueta,
    valor,
    opciones,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    opciones: {
        valor: string;
        texto: string;
    }[];
    cambiar: (valor: string) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </label>

            <select
                value={valor}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="salon-control w-full border border-border-strong bg-white px-4 font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            >
                {opciones.map((opcion) => (
                    <option
                        key={opcion.valor}
                        value={opcion.valor}
                    >
                        {opcion.texto}
                    </option>
                ))}
            </select>
        </div>
    );
}

function SelectorColor({
    valor,
    cambiar,
}: {
    valor: string;
    cambiar: (valor: string) => void;
}) {
    return (
        <div>
            <p className="mb-2 text-sm font-semibold text-[#3D4A45]">
                Color
            </p>

            <div className="flex flex-wrap gap-2">
                {coloresDisponibles.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => cambiar(color)}
                        className={[
                            "flex h-10 w-10 items-center justify-center rounded-xl transition",
                            valor === color
                                ? "ring-4 ring-primary/20"
                                : "hover:scale-105",
                        ].join(" ")}
                        style={{
                            backgroundColor: color,
                        }}
                    >
                        {valor === color && (
                            <Check className="h-5 w-5 text-white" />
                        )}
                    </button>
                ))}

                <label className="relative flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-white px-3 text-sm font-semibold text-[#52605A]">
                    <Palette className="h-4 w-4" />
                    Otro
                    <input
                        type="color"
                        value={valor}
                        onChange={(event) =>
                            cambiar(event.target.value)
                        }
                        className="absolute inset-0 cursor-pointer opacity-0"
                    />
                </label>
            </div>
        </div>
    );
}

function CampoComision({
    tipo,
    valor,
    simboloMoneda,
    cambiar,
}: {
    tipo: "PORCENTAJE" | "MONTO_FIJO";
    valor: number;
    simboloMoneda: string;
    cambiar: (valor: number) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {tipo === "PORCENTAJE"
                    ? "Porcentaje"
                    : "Monto fijo"}
            </label>

            <div className="relative">
                <BadgeDollarSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />
                <input
                    type="number"
                    min="0"
                    max={
                        tipo === "PORCENTAJE"
                            ? 100
                            : undefined
                    }
                    step="0.01"
                    value={valor}
                    onChange={(event) =>
                        cambiar(Number(event.target.value))
                    }
                    className="salon-control w-full border border-border-strong bg-white pl-12 pr-14 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-secondary">
                    {tipo === "PORCENTAJE"
                        ? "%"
                        : simboloMoneda}
                </span>
            </div>
        </div>
    );
}

function Interruptor({
    titulo,
    descripcion,
    activo,
    cambiar,
}: {
    titulo: string;
    descripcion: string;
    activo: boolean;
    cambiar: (valor: boolean) => void;
}) {
    return (
        <label
            className={[
                "flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition",
                activo
                    ? "border-[#C8D9D1] bg-surface-soft"
                    : "border-border bg-[#FBFCFA]",
            ].join(" ")}
        >
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#33413B]">
                    {titulo}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#76817B]">
                    {descripcion}
                </p>
            </div>

            <input
                type="checkbox"
                checked={activo}
                onChange={(event) =>
                    cambiar(event.target.checked)
                }
                className="sr-only"
            />

            <InterruptorVisual activo={activo} />
        </label>
    );
}

function InterruptorCompacto({
    titulo,
    activo,
    cambiar,
}: {
    titulo: string;
    activo: boolean;
    cambiar: (valor: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-xs font-semibold text-[#52605A]">
                {titulo}
            </span>

            <input
                type="checkbox"
                checked={activo}
                onChange={(event) =>
                    cambiar(event.target.checked)
                }
                className="sr-only"
            />

            <InterruptorVisual activo={activo} />
        </label>
    );
}

function InterruptorVisual({
    activo,
}: {
    activo: boolean;
}) {
    return (
        <span
            className={[
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                activo ? "bg-primary" : "bg-[#CCD3CF]",
            ].join(" ")}
        >
            <span
                className={[
                    "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                    activo ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
            />
        </span>
    );
}

function DatoServicio({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#839089]">
                {titulo}
            </p>
            <p className="mt-1 text-sm font-bold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function Etiqueta({
    texto,
}: {
    texto: string;
}) {
    return (
        <span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-bold text-primary-strong">
            {texto}
        </span>
    );
}

function MensajeEstado({
    mensaje,
    cerrar,
}: {
    mensaje: Exclude<Mensaje, null>;
    cerrar: () => void;
}) {
    return (
        <div
            className={[
                "flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-sm",
                mensaje.tipo === "EXITO"
                    ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                    : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
            ].join(" ")}
        >
            {mensaje.tipo === "EXITO" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <p className="min-w-0 flex-1 text-sm font-semibold">
                {mensaje.texto}
            </p>

            <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar mensaje"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

function EstadoVacio({
    tieneRegistros,
    puedeAdministrar,
    crear,
}: {
    tieneRegistros: boolean;
    puedeAdministrar: boolean;
    crear: () => void;
}) {
    return (
        <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft text-primary-strong">
                <Scissors className="h-8 w-8" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-foreground tracking-tight">
                {tieneRegistros
                    ? "No encontramos resultados"
                    : "Todavía no hay servicios"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                {tieneRegistros
                    ? "Prueba utilizando otra búsqueda o cambiando los filtros."
                    : "Registra los servicios del salón para comenzar a crear citas y ventas."}
            </p>

            {!tieneRegistros && puedeAdministrar && (
                <button
                    type="button"
                    onClick={crear}
                    className="salon-action mt-5 inline-flex items-center justify-center gap-2 bg-primary px-5 text-white transition hover:bg-primary-hover"
                >
                    <Plus className="h-5 w-5" />
                    Registrar servicio
                </button>
            )}
        </div>
    );
}

function crearFormularioInicial(
    servicio: ServicioListado | null,
): DatosServicio {
    if (servicio) {
        return {
            id: servicio.id,
            categoriaId: servicio.categoria_id ?? "",
            nombre: servicio.nombre,
            descripcion: servicio.descripcion ?? "",
            precio: Number(servicio.precio),
            duracionMinutos: servicio.duracion_minutos,
            color: servicio.color,
            permiteCitas: servicio.permite_citas,
            permiteDescuento:
                servicio.permite_descuento,
            requiereAnticipo:
                servicio.requiere_anticipo,
            montoAnticipo: Number(
                servicio.monto_anticipo,
            ),
            tipoComisionGeneral:
                servicio.tipo_comision_general,
            comisionGeneral: Number(
                servicio.comision_general,
            ),
            estado: servicio.estado,
            trabajadores: servicio.trabajador_servicios
                .filter((item) => item.estado === "ACTIVO")
                .map((item) => ({
                    trabajadorId: item.trabajador_id,
                    usaComisionEspecial:
                        item.usa_comision_especial,
                    tipoComisionEspecial:
                        item.tipo_comision_especial ??
                        "PORCENTAJE",
                    comisionEspecial: Number(
                        item.comision_especial ?? 0,
                    ),
                })),
            materiales: servicio.servicio_materiales.map(
                (material) => ({
                    idTemporal: material.id,
                    productoId:
                        material.producto_id ?? "",
                    nombreMaterial:
                        material.nombre_material,
                    cantidad: Number(material.cantidad),
                    unidadMedida: material.unidad_medida,
                    costoEstimado: Number(
                        material.costo_estimado,
                    ),
                    descontarInventario:
                        material.descontar_inventario,
                    observaciones:
                        material.observaciones ?? "",
                }),
            ),
        };
    }

    return {
        categoriaId: "",
        nombre: "",
        descripcion: "",
        precio: 0,
        duracionMinutos: 30,
        color: "#6F8F83",
        permiteCitas: true,
        permiteDescuento: true,
        requiereAnticipo: false,
        montoAnticipo: 0,
        tipoComisionGeneral: "USAR_TRABAJADOR",
        comisionGeneral: 0,
        estado: "ACTIVO",
        trabajadores: [],
        materiales: [],
    };
}

function formatearDuracion(minutos: number) {
    if (minutos < 60) {
        return `${minutos} min`;
    }

    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;

    if (resto === 0) {
        return `${horas} h`;
    }

    return `${horas} h ${resto} min`;
}

function formatearComisionGeneral(
    servicio: ServicioListado,
    simboloMoneda: string,
) {
    if (
        servicio.tipo_comision_general ===
        "USAR_TRABAJADOR"
    ) {
        return "Comisión del trabajador";
    }

    if (
        servicio.tipo_comision_general ===
        "SIN_COMISION"
    ) {
        return "Sin comisión";
    }

    if (
        servicio.tipo_comision_general ===
        "PORCENTAJE"
    ) {
        return `Comisión ${Number(
            servicio.comision_general,
        )}%`;
    }

    return `Comisión ${simboloMoneda} ${Number(
        servicio.comision_general,
    ).toLocaleString("es-NI")}`;
}

function formatearComisionTrabajador(
    trabajador: TrabajadorDisponible,
    simboloMoneda: string,
) {
    if (trabajador.tipo_comision === "SIN_COMISION") {
        return "Sin comisión";
    }

    if (trabajador.tipo_comision === "PORCENTAJE") {
        return `${Number(trabajador.comision_general)}%`;
    }

    return `${simboloMoneda} ${Number(
        trabajador.comision_general,
    ).toLocaleString("es-NI")}`;
}

function obtenerIniciales(nombre: string) {
    return nombre
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase())
        .join("");
}

function crearIdTemporal() {
    return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}