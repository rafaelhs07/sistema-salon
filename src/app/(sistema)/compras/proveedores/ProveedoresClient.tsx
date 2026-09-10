"use client";

import Link from "next/link";
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    CheckCircle2,
    ChevronRight,
    CircleDollarSign,
    Edit3,
    Mail,
    MapPin,
    MessageCircle,
    MoreHorizontal,
    PackageSearch,
    Phone,
    Plus,
    Search,
    SlidersHorizontal,
    Store,
    Truck,
    UserRound,
    UserRoundCheck,
    UserRoundX,
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

import {
    actualizarProveedor,
    cambiarEstadoProveedor,
    crearProveedor,
    type DatosProveedor,
    type EstadoProveedor,
} from "./actions";

export type ProveedorListado = {
    id: string;
    codigo_proveedor: string;

    nombre: string;

    ruc: string | null;
    categoria: string | null;

    contacto: string | null;

    telefono: string | null;
    whatsapp: string | null;
    correo: string | null;

    direccion: string | null;

    condiciones_pago:
    | string
    | null;

    observaciones:
    | string
    | null;

    estado: EstadoProveedor;

    creado_en: string;
    actualizado_en: string;
};

type Mensaje = {
    tipo:
    | "EXITO"
    | "ERROR";

    texto: string;
} | null;

type FiltroEstado =
    | "TODOS"
    | EstadoProveedor;

export default function ProveedoresClient({
    proveedoresIniciales,
}: {
    proveedoresIniciales: ProveedorListado[];
}) {
    const router =
        useRouter();

    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        filtroEstado,
        setFiltroEstado,
    ] = useState<FiltroEstado>(
        "ACTIVO",
    );

    const [
        proveedorSeleccionadoId,
        setProveedorSeleccionadoId,
    ] = useState<
        string | null
    >(
        proveedoresIniciales[0]
            ?.id ??
        null,
    );

    const [
        formularioAbierto,
        setFormularioAbierto,
    ] = useState(false);

    const [
        proveedorEditando,
        setProveedorEditando,
    ] = useState<
        ProveedorListado | null
    >(null);

    const [
        mensaje,
        setMensaje,
    ] = useState<Mensaje>(
        null,
    );

    const [
        procesando,
        iniciarTransicion,
    ] = useTransition();

    const proveedoresFiltrados =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            return proveedoresIniciales.filter(
                (proveedor) => {
                    const coincideTexto =
                        !texto ||
                        proveedor.nombre
                            .toLowerCase()
                            .includes(texto) ||
                        proveedor.codigo_proveedor
                            .toLowerCase()
                            .includes(texto) ||
                        proveedor.ruc
                            ?.toLowerCase()
                            .includes(texto) ||
                        proveedor.contacto
                            ?.toLowerCase()
                            .includes(texto) ||
                        proveedor.telefono
                            ?.toLowerCase()
                            .includes(texto) ||
                        proveedor.categoria
                            ?.toLowerCase()
                            .includes(texto);

                    const coincideEstado =
                        filtroEstado ===
                        "TODOS" ||
                        proveedor.estado ===
                        filtroEstado;

                    return (
                        coincideTexto &&
                        coincideEstado
                    );
                },
            );
        }, [
            busqueda,
            filtroEstado,
            proveedoresIniciales,
        ]);

    const proveedorSeleccionado =
        useMemo(() => {
            const actual =
                proveedoresIniciales.find(
                    (proveedor) =>
                        proveedor.id ===
                        proveedorSeleccionadoId,
                );

            if (actual) {
                return actual;
            }

            return (
                proveedoresFiltrados[0] ??
                null
            );
        }, [
            proveedorSeleccionadoId,
            proveedoresFiltrados,
            proveedoresIniciales,
        ]);

    const resumen =
        useMemo(() => {
            const activos =
                proveedoresIniciales.filter(
                    (proveedor) =>
                        proveedor.estado ===
                        "ACTIVO",
                ).length;

            const inactivos =
                proveedoresIniciales.length -
                activos;

            const conContacto =
                proveedoresIniciales.filter(
                    (proveedor) =>
                        Boolean(
                            proveedor.telefono ||
                            proveedor.whatsapp ||
                            proveedor.correo,
                        ),
                ).length;

            return {
                total:
                    proveedoresIniciales.length,
                activos,
                inactivos,
                conContacto,
            };
        }, [
            proveedoresIniciales,
        ]);

    function abrirNuevo() {
        setProveedorEditando(
            null,
        );

        setFormularioAbierto(
            true,
        );

        setMensaje(null);
    }

    function abrirEditar(
        proveedor: ProveedorListado,
    ) {
        setProveedorEditando(
            proveedor,
        );

        setFormularioAbierto(
            true,
        );

        setMensaje(null);
    }

    function cambiarEstado(
        proveedor: ProveedorListado,
    ) {
        const nuevoEstado: EstadoProveedor =
            proveedor.estado ===
                "ACTIVO"
                ? "INACTIVO"
                : "ACTIVO";

        iniciarTransicion(
            async () => {
                const resultado =
                    await cambiarEstadoProveedor(
                        proveedor.id,
                        nuevoEstado,
                    );

                setMensaje({
                    tipo: resultado.exito
                        ? "EXITO"
                        : "ERROR",
                    texto:
                        resultado.mensaje,
                });

                if (
                    resultado.exito
                ) {
                    router.refresh();
                }
            },
        );
    }

    return (
        <div className="space-y-6">
            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() =>
                        setMensaje(
                            null,
                        )
                    }
                />
            )}

            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />

                <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-secondary/15 blur-3xl" />

                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <Link
                            href="/compras"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#B9C8C1] transition hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Compras
                        </Link>

                        <div className="mt-5 flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                                <Truck className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Directorio comercial
                                </p>

                                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                    Proveedores
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Centraliza contactos, condiciones de pago
                                    y datos de cada proveedor del salón.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={
                            abrirNuevo
                        }
                        className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-5 text-sidebar transition hover:bg-white"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo proveedor
                    </button>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaResumen
                    titulo="Total proveedores"
                    valor={
                        resumen.total
                    }
                    icono={
                        Truck
                    }
                />

                <TarjetaResumen
                    titulo="Activos"
                    valor={
                        resumen.activos
                    }
                    icono={
                        UserRoundCheck
                    }
                />

                <TarjetaResumen
                    titulo="Inactivos"
                    valor={
                        resumen.inactivos
                    }
                    icono={
                        UserRoundX
                    }
                />

                <TarjetaResumen
                    titulo="Con contacto"
                    valor={
                        resumen.conContacto
                    }
                    icono={
                        Phone
                    }
                />
            </section>

            <section className="salon-panel grid min-h-[650px] overflow-hidden border border-border bg-white xl:grid-cols-[380px_minmax(0,1fr)]">
                <aside className="border-b border-border bg-[#FBFCFA] lg:border-b-0 lg:border-r">
                    <div className="border-b border-border p-4">
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
                                placeholder="Buscar proveedor..."
                                className="salon-control w-full border border-border-strong bg-white pl-11 pr-4 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                            />
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {(
                                [
                                    "ACTIVO",
                                    "TODOS",
                                    "INACTIVO",
                                ] as const
                            ).map(
                                (
                                    estado,
                                ) => (
                                    <button
                                        key={
                                            estado
                                        }
                                        type="button"
                                        onClick={() =>
                                            setFiltroEstado(
                                                estado,
                                            )
                                        }
                                        className={[
                                            "h-9 rounded-xl text-xs font-bold transition",
                                            filtroEstado ===
                                                estado
                                                ? "bg-sidebar text-white"
                                                : "border border-[#DDE3DF] bg-white text-[#52605A] hover:bg-surface-soft",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        {estado ===
                                            "ACTIVO"
                                            ? "Activos"
                                            : estado ===
                                                "INACTIVO"
                                                ? "Inactivos"
                                                : "Todos"}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="max-h-[575px] overflow-y-auto p-3">
                        {proveedoresFiltrados.length ===
                            0 ? (
                            <EstadoVacioLista />
                        ) : (
                            <div className="space-y-2">
                                {proveedoresFiltrados.map(
                                    (
                                        proveedor,
                                    ) => {
                                        const seleccionado =
                                            proveedorSeleccionado?.id ===
                                            proveedor.id;

                                        return (
                                            <button
                                                key={
                                                    proveedor.id
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setProveedorSeleccionadoId(
                                                        proveedor.id,
                                                    )
                                                }
                                                className={[
                                                    "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                                                    seleccionado
                                                        ? "border-[#BDD0C7] bg-[#EDF4F0] shadow-sm"
                                                        : "border-transparent bg-transparent hover:border-border hover:bg-white",
                                                ].join(
                                                    " ",
                                                )}
                                            >
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-bold text-primary-strong">
                                                    {obtenerIniciales(
                                                        proveedor.nombre,
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate font-bold text-foreground">
                                                            {
                                                                proveedor.nombre
                                                            }
                                                        </p>

                                                        <EstadoPunto
                                                            activo={
                                                                proveedor.estado ===
                                                                "ACTIVO"
                                                            }
                                                        />
                                                    </div>

                                                    <p className="mt-1 truncate text-xs text-[#76817B]">
                                                        {proveedor.categoria ||
                                                            proveedor.codigo_proveedor}
                                                    </p>
                                                </div>

                                                <ChevronRight
                                                    className={[
                                                        "h-4 w-4 shrink-0 transition",
                                                        seleccionado
                                                            ? "text-primary-strong"
                                                            : "text-[#A9B1AD] group-hover:text-primary",
                                                    ].join(
                                                        " ",
                                                    )}
                                                />
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                <main className="min-w-0">
                    {proveedorSeleccionado ? (
                        <FichaProveedor
                            proveedor={
                                proveedorSeleccionado
                            }
                            procesando={
                                procesando
                            }
                            editar={() =>
                                abrirEditar(
                                    proveedorSeleccionado,
                                )
                            }
                            cambiarEstado={() =>
                                cambiarEstado(
                                    proveedorSeleccionado,
                                )
                            }
                        />
                    ) : (
                        <EstadoSinSeleccion
                            crear={
                                abrirNuevo
                            }
                        />
                    )}
                </main>
            </section>

            {formularioAbierto && (
                <FormularioProveedor
                    proveedor={
                        proveedorEditando
                    }
                    cerrar={() => {
                        if (
                            procesando
                        ) {
                            return;
                        }

                        setFormularioAbierto(
                            false,
                        );

                        setProveedorEditando(
                            null,
                        );
                    }}
                    guardado={(
                        texto,
                    ) => {
                        setFormularioAbierto(
                            false,
                        );

                        setProveedorEditando(
                            null,
                        );

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

function FichaProveedor({
    proveedor,
    procesando,
    editar,
    cambiarEstado,
}: {
    proveedor: ProveedorListado;
    procesando: boolean;
    editar: () => void;
    cambiarEstado: () => void;
}) {
    return (
        <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-5 border-b border-[#E8ECE9] pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sidebar text-xl font-bold text-white">
                        {obtenerIniciales(
                            proveedor.nombre,
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">
                                {
                                    proveedor.nombre
                                }
                            </h2>

                            <EstadoProveedorBadge
                                estado={
                                    proveedor.estado
                                }
                            />
                        </div>

                        <p className="mt-1 text-sm font-semibold text-primary">
                            {
                                proveedor.codigo_proveedor
                            }
                        </p>

                        {proveedor.categoria && (
                            <p className="mt-2 text-sm text-text-secondary">
                                {
                                    proveedor.categoria
                                }
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={
                            editar
                        }
                        className="salon-action inline-flex items-center justify-center gap-2 border border-border-strong bg-white px-4 text-text-secondary transition hover:bg-surface-soft"
                    >
                        <Edit3 className="h-4 w-4" />
                        Editar
                    </button>

                    <button
                        type="button"
                        onClick={
                            cambiarEstado
                        }
                        disabled={
                            procesando
                        }
                        className={[
                            "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:opacity-50",
                            proveedor.estado ===
                                "ACTIVO"
                                ? "bg-[#F8E5E5] text-[#A25E5E]"
                                : "bg-[#E3EEE8] text-[#527865]",
                        ].join(
                            " ",
                        )}
                    >
                        {proveedor.estado ===
                            "ACTIVO"
                            ? "Desactivar"
                            : "Activar"}
                    </button>
                </div>
            </div>

            <div className="mt-7 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
                <div className="space-y-6">
                    <BloqueFicha
                        titulo="Contacto"
                        icono={
                            UserRound
                        }
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            <DatoFicha
                                icono={
                                    UserRound
                                }
                                titulo="Persona de contacto"
                                valor={
                                    proveedor.contacto ||
                                    "No registrado"
                                }
                            />

                            <DatoFicha
                                icono={
                                    Phone
                                }
                                titulo="Teléfono"
                                valor={
                                    proveedor.telefono ||
                                    "No registrado"
                                }
                            />

                            <DatoFicha
                                icono={
                                    MessageCircle
                                }
                                titulo="WhatsApp"
                                valor={
                                    proveedor.whatsapp ||
                                    "No registrado"
                                }
                            />

                            <DatoFicha
                                icono={
                                    Mail
                                }
                                titulo="Correo"
                                valor={
                                    proveedor.correo ||
                                    "No registrado"
                                }
                            />
                        </div>
                    </BloqueFicha>

                    <BloqueFicha
                        titulo="Ubicación"
                        icono={
                            MapPin
                        }
                    >
                        <p className="text-sm leading-6 text-[#52605A]">
                            {proveedor.direccion ||
                                "No hay una dirección registrada para este proveedor."}
                        </p>
                    </BloqueFicha>

                    {proveedor.observaciones && (
                        <BloqueFicha
                            titulo="Observaciones"
                            icono={
                                MoreHorizontal
                            }
                        >
                            <p className="whitespace-pre-wrap text-sm leading-6 text-[#52605A]">
                                {
                                    proveedor.observaciones
                                }
                            </p>
                        </BloqueFicha>
                    )}
                </div>

                <div className="space-y-5">
                    <div className="rounded-3xl bg-surface-soft p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-strong">
                                <CircleDollarSign className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-[#7B8882]">
                                    Condiciones de pago
                                </p>

                                <p className="mt-1 font-bold text-foreground">
                                    {proveedor.condiciones_pago ||
                                        "Sin condición definida"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-border bg-[#FBFCFA] p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#839089]">
                            Identificación fiscal
                        </p>

                        <p className="mt-2 text-lg font-bold text-foreground">
                            {proveedor.ruc ||
                                "No registrado"}
                        </p>
                    </div>

                    <div className="salon-panel border border-border bg-white p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#839089]">
                            Acciones del proveedor
                        </p>

                        <div className="mt-4 space-y-3">
                            <AccionFutura
                                href="/compras/nueva"
                                icono={
                                    PackageSearch
                                }
                                titulo="Registrar compra"
                                texto="Crear una nueva compra para este proveedor."
                            />

                            <AccionFutura
                                href="/compras/cuentas-pagar"
                                icono={
                                    CircleDollarSign
                                }
                                titulo="Cuentas por pagar"
                                texto="Consultar saldos y pagos pendientes a proveedores."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormularioProveedor({
    proveedor,
    cerrar,
    guardado,
}: {
    proveedor:
    | ProveedorListado
    | null;

    cerrar: () => void;

    guardado: (
        mensaje: string,
    ) => void;
}) {
    const editando =
        Boolean(proveedor);

    const [
        formulario,
        setFormulario,
    ] = useState<DatosProveedor>(
        () =>
            crearFormularioInicial(
                proveedor,
            ),
    );

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

    function actualizar<
        K extends keyof DatosProveedor,
    >(
        campo: K,
        valor: DatosProveedor[K],
    ) {
        setFormulario(
            (actual) => ({
                ...actual,
                [campo]: valor,
            }),
        );

        setMensaje(null);
    }

    function guardar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        iniciarGuardado(
            async () => {
                const resultado =
                    editando
                        ? await actualizarProveedor(
                            formulario,
                        )
                        : await crearProveedor(
                            formulario,
                        );

                if (
                    !resultado.exito
                ) {
                    setMensaje({
                        tipo: "ERROR",
                        texto:
                            resultado.mensaje,
                    });

                    return;
                }

                guardado(
                    resultado.mensaje,
                );
            },
        );
    }

    return (
        <div className="fixed inset-0 z-[80] flex justify-end bg-sidebar/45 backdrop-blur-sm">
            <button
                type="button"
                aria-label="Cerrar"
                onClick={
                    cerrar
                }
                className="absolute inset-0"
            />

            <aside className="salon-sheet relative z-10 h-full w-full max-w-2xl overflow-y-auto bg-background shadow-2xl">
                <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white/95 px-5 py-5 backdrop-blur-xl sm:px-7">
                    <div>
                        <p className="text-sm font-semibold text-primary">
                            {editando
                                ? "Editar proveedor"
                                : "Nuevo proveedor"}
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-foreground tracking-tight">
                            {editando
                                ? proveedor?.nombre
                                : "Registrar proveedor"}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={
                            cerrar
                        }
                        disabled={
                            guardando
                        }
                        className="rounded-xl border border-border bg-white p-2.5 text-text-secondary transition hover:bg-surface-soft"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <form
                    onSubmit={
                        guardar
                    }
                    className="space-y-5 p-5 sm:p-7"
                >
                    {mensaje && (
                        <MensajeEstado
                            mensaje={
                                mensaje
                            }
                            cerrar={() =>
                                setMensaje(
                                    null,
                                )
                            }
                        />
                    )}

                    <SeccionFormulario
                        titulo="Identidad comercial"
                        icono={
                            Building2
                        }
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <CampoTexto
                                    etiqueta="Nombre del proveedor"
                                    valor={
                                        formulario.nombre
                                    }
                                    placeholder="Ej. Distribuidora Belleza Nicaragua"
                                    requerido
                                    cambiar={(
                                        valor,
                                    ) =>
                                        actualizar(
                                            "nombre",
                                            valor,
                                        )
                                    }
                                />
                            </div>

                            <CampoTexto
                                etiqueta="RUC / identificación fiscal"
                                valor={
                                    formulario.ruc
                                }
                                placeholder="Opcional"
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizar(
                                        "ruc",
                                        valor,
                                    )
                                }
                            />

                            <CampoTexto
                                etiqueta="Categoría"
                                valor={
                                    formulario.categoria
                                }
                                placeholder="Ej. Cosméticos"
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizar(
                                        "categoria",
                                        valor,
                                    )
                                }
                            />
                        </div>
                    </SeccionFormulario>

                    <SeccionFormulario
                        titulo="Contacto"
                        icono={
                            UserRound
                        }
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <CampoTexto
                                    etiqueta="Persona de contacto"
                                    valor={
                                        formulario.contacto
                                    }
                                    placeholder="Ej. Laura Gómez"
                                    cambiar={(
                                        valor,
                                    ) =>
                                        actualizar(
                                            "contacto",
                                            valor,
                                        )
                                    }
                                />
                            </div>

                            <CampoTexto
                                etiqueta="Teléfono"
                                valor={
                                    formulario.telefono
                                }
                                placeholder="8888 8888"
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizar(
                                        "telefono",
                                        valor,
                                    )
                                }
                            />

                            <CampoTexto
                                etiqueta="WhatsApp"
                                valor={
                                    formulario.whatsapp
                                }
                                placeholder="8888 8888"
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizar(
                                        "whatsapp",
                                        valor,
                                    )
                                }
                            />

                            <div className="sm:col-span-2">
                                <CampoTexto
                                    etiqueta="Correo"
                                    tipo="email"
                                    valor={
                                        formulario.correo
                                    }
                                    placeholder="ventas@proveedor.com"
                                    cambiar={(
                                        valor,
                                    ) =>
                                        actualizar(
                                            "correo",
                                            valor,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </SeccionFormulario>

                    <SeccionFormulario
                        titulo="Compras y ubicación"
                        icono={
                            Store
                        }
                    >
                        <div className="space-y-4">
                            <CampoTexto
                                etiqueta="Condiciones de pago"
                                valor={
                                    formulario.condicionesPago
                                }
                                placeholder="Ej. Contado / Crédito 30 días"
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizar(
                                        "condicionesPago",
                                        valor,
                                    )
                                }
                            />

                            <CampoArea
                                etiqueta="Dirección"
                                valor={
                                    formulario.direccion
                                }
                                placeholder="Dirección del proveedor..."
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizar(
                                        "direccion",
                                        valor,
                                    )
                                }
                            />

                            <CampoArea
                                etiqueta="Observaciones"
                                valor={
                                    formulario.observaciones
                                }
                                placeholder="Notas internas, horarios, condiciones especiales..."
                                cambiar={(
                                    valor,
                                ) =>
                                    actualizar(
                                        "observaciones",
                                        valor,
                                    )
                                }
                            />
                        </div>
                    </SeccionFormulario>

                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4">
                        <div>
                            <p className="font-bold text-[#33413B]">
                                Proveedor activo
                            </p>

                            <p className="mt-1 text-xs text-[#76817B]">
                                Los proveedores inactivos se conservan para el historial.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={
                                formulario.estado ===
                                "ACTIVO"
                            }
                            onChange={(
                                event,
                            ) =>
                                actualizar(
                                    "estado",
                                    event
                                        .target
                                        .checked
                                        ? "ACTIVO"
                                        : "INACTIVO",
                                )
                            }
                            className="sr-only"
                        />

                        <span
                            className={[
                                "relative h-7 w-12 rounded-full transition-colors",
                                formulario.estado ===
                                    "ACTIVO"
                                    ? "bg-primary"
                                    : "bg-[#CCD3CF]",
                            ].join(
                                " ",
                            )}
                        >
                            <span
                                className={[
                                    "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                                    formulario.estado ===
                                        "ACTIVO"
                                        ? "translate-x-6"
                                        : "translate-x-1",
                                ].join(
                                    " ",
                                )}
                            />
                        </span>
                    </label>

                    <div className="sticky bottom-4 flex flex-col-reverse gap-3 rounded-2xl border border-border-strong bg-white/95 p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={
                                cerrar
                            }
                            disabled={
                                guardando
                            }
                            className="salon-action border border-border-strong bg-surface-soft px-5 text-text-secondary"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={
                                guardando
                            }
                            className="salon-action inline-flex min-w-44 items-center justify-center gap-2 bg-primary px-5 text-white transition hover:bg-primary-hover disabled:opacity-50"
                        >
                            <BadgeCheck className="h-5 w-5" />

                            {guardando
                                ? "Guardando..."
                                : editando
                                    ? "Guardar cambios"
                                    : "Registrar proveedor"}
                        </button>
                    </div>
                </form>
            </aside>
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
    icono: React.ComponentType<{
        className?: string;
    }>;
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

function BloqueFicha({
    titulo,
    icono: Icono,
    children,
}: {
    titulo: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    children: React.ReactNode;
}) {
    return (
        <section className="salon-panel border border-border bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                    <Icono className="h-4 w-4" />
                </div>

                <h3 className="font-bold text-foreground tracking-tight">
                    {titulo}
                </h3>
            </div>

            {children}
        </section>
    );
}

function DatoFicha({
    icono: Icono,
    titulo,
    valor,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-2xl bg-[#FBFCFA] p-4">
            <div className="flex items-center gap-2 text-[#7A8680]">
                <Icono className="h-4 w-4" />

                <span className="text-xs font-bold">
                    {titulo}
                </span>
            </div>

            <p className="mt-2 break-words text-sm font-semibold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function AccionFutura({
    href,
    icono: Icono,
    titulo,
    texto,
}: {
    href: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    titulo: string;
    texto: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-start gap-3 rounded-2xl bg-[#FBFCFA] p-3 transition hover:bg-surface-soft"
        >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                <Icono className="h-4 w-4" />
            </div>

            <div>
                <p className="text-sm font-bold text-[#33413B]">
                    {titulo}
                </p>

                <p className="mt-1 text-xs text-[#76817B]">
                    {texto}
                </p>
            </div>
        </Link>
    );
}

function EstadoProveedorBadge({
    estado,
}: {
    estado: EstadoProveedor;
}) {
    return (
        <span
            className={[
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                estado === "ACTIVO"
                    ? "bg-[#E3EEE8] text-[#527865]"
                    : "bg-[#F1E8E8] text-[#A66161]",
            ].join(" ")}
        >
            {estado === "ACTIVO"
                ? "Activo"
                : "Inactivo"}
        </span>
    );
}

function EstadoPunto({
    activo,
}: {
    activo: boolean;
}) {
    return (
        <span
            className={[
                "h-2 w-2 shrink-0 rounded-full",
                activo
                    ? "bg-primary"
                    : "bg-[#C97878]",
            ].join(" ")}
        />
    );
}

function EstadoVacioLista() {
    return (
        <div className="p-7 text-center">
            <Search className="mx-auto h-7 w-7 text-[#9AA5A0]" />

            <p className="mt-3 text-sm font-bold text-[#33413B]">
                Sin resultados
            </p>

            <p className="mt-1 text-xs text-[#76817B]">
                Prueba otra búsqueda o filtro.
            </p>
        </div>
    );
}

function EstadoSinSeleccion({
    crear,
}: {
    crear: () => void;
}) {
    return (
        <div className="flex min-h-[650px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft text-primary-strong">
                <Truck className="h-8 w-8" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-foreground tracking-tight">
                Selecciona un proveedor
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">
                Consulta sus datos o registra uno nuevo para comenzar.
            </p>

            <button
                type="button"
                onClick={
                    crear
                }
                className="salon-action mt-5 inline-flex items-center gap-2 bg-primary px-5 text-white"
            >
                <Plus className="h-5 w-5" />
                Nuevo proveedor
            </button>
        </div>
    );
}

function SeccionFormulario({
    titulo,
    icono: Icono,
    children,
}: {
    titulo: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
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

            <div className="p-5">
                {children}
            </div>
        </section>
    );
}

function CampoTexto({
    etiqueta,
    valor,
    placeholder,
    requerido = false,
    tipo = "text",
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    placeholder: string;
    requerido?: boolean;
    tipo?: string;
    cambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}

                {requerido && (
                    <span className="ml-1 text-[#C97878]">
                        *
                    </span>
                )}
            </label>

            <input
                type={tipo}
                value={
                    valor
                }
                required={
                    requerido
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
    cambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </label>

            <textarea
                rows={3}
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
                className="salon-control w-full resize-y border border-border-strong bg-white px-4 py-3 leading-6 text-foreground outline-none transition placeholder:text-[#A2AAA6] focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
        </div>
    );
}

function MensajeEstado({
    mensaje,
    cerrar,
}: {
    mensaje: Exclude<
        Mensaje,
        null
    >;

    cerrar: () => void;
}) {
    return (
        <div
            className={[
                "flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-sm",
                mensaje.tipo ===
                    "EXITO"
                    ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                    : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
            ].join(" ")}
        >
            {mensaje.tipo ===
                "EXITO" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <p className="min-w-0 flex-1 text-sm font-semibold">
                {mensaje.texto}
            </p>

            <button
                type="button"
                onClick={
                    cerrar
                }
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

function crearFormularioInicial(
    proveedor:
        | ProveedorListado
        | null,
): DatosProveedor {
    if (proveedor) {
        return {
            id:
                proveedor.id,

            nombre:
                proveedor.nombre,

            ruc:
                proveedor.ruc ??
                "",

            categoria:
                proveedor.categoria ??
                "",

            contacto:
                proveedor.contacto ??
                "",

            telefono:
                proveedor.telefono ??
                "",

            whatsapp:
                proveedor.whatsapp ??
                "",

            correo:
                proveedor.correo ??
                "",

            direccion:
                proveedor.direccion ??
                "",

            condicionesPago:
                proveedor.condiciones_pago ??
                "",

            observaciones:
                proveedor.observaciones ??
                "",

            estado:
                proveedor.estado,
        };
    }

    return {
        nombre: "",
        ruc: "",
        categoria: "",
        contacto: "",
        telefono: "",
        whatsapp: "",
        correo: "",
        direccion: "",
        condicionesPago: "",
        observaciones: "",
        estado: "ACTIVO",
    };
}

function obtenerIniciales(
    nombre: string,
) {
    return nombre
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
            (parte) =>
                parte[0]
                    ?.toUpperCase(),
        )
        .join("");
}