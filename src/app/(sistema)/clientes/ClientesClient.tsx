"use client";

import Link from "next/link";
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Edit3,
    Heart,
    LoaderCircle,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Plus,
    Search,
    SlidersHorizontal,
    Star,
    UserCheck,
    UserRound,
    UserRoundPlus,
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

import {
    actualizarCliente,
    buscarTelefonosDuplicados,
    cambiarEstadoCliente,
    crearCliente,
    type DatosCliente,
    type EstadoCliente,
    type GeneroCliente,
} from "./actions";

export type ClienteListado = {
    id: string;
    codigo_cliente: string | null;
    sucursal_id: string | null;
    nombre_completo: string;
    telefono: string | null;
    whatsapp: string | null;
    correo: string | null;
    direccion: string | null;
    fecha_nacimiento: string | null;
    genero: GeneroCliente | null;
    contacto_emergencia_nombre: string | null;
    contacto_emergencia_telefono: string | null;
    como_conocio_salon: string | null;
    permite_notificaciones: boolean;
    permite_whatsapp: boolean;
    permite_correo: boolean;
    cliente_frecuente: boolean;
    estado: EstadoCliente;
    observaciones: string | null;
    fecha_registro: string;
    sucursales: {
        nombre: string;
    } | null;
};

type SucursalListado = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

type ClientesClientProps = {
    clientesIniciales: ClienteListado[];
    sucursales: SucursalListado[];
};

export default function ClientesClient({
    clientesIniciales,
    sucursales,
}: ClientesClientProps) {
    const router = useRouter();

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] =
        useState<"TODOS" | EstadoCliente>("TODOS");
    const [filtroSucursal, setFiltroSucursal] =
        useState("TODAS");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [clienteEditando, setClienteEditando] =
        useState<ClienteListado | null>(null);
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [procesando, iniciarTransicion] = useTransition();

    const clientesFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return clientesIniciales.filter((cliente) => {
            const coincideBusqueda =
                !texto ||
                cliente.nombre_completo
                    .toLowerCase()
                    .includes(texto) ||
                cliente.codigo_cliente
                    ?.toLowerCase()
                    .includes(texto) ||
                cliente.telefono
                    ?.toLowerCase()
                    .includes(texto) ||
                cliente.whatsapp
                    ?.toLowerCase()
                    .includes(texto) ||
                cliente.correo
                    ?.toLowerCase()
                    .includes(texto);

            const coincideEstado =
                filtroEstado === "TODOS" ||
                cliente.estado === filtroEstado;

            const coincideSucursal =
                filtroSucursal === "TODAS" ||
                cliente.sucursal_id === filtroSucursal;

            return (
                coincideBusqueda &&
                coincideEstado &&
                coincideSucursal
            );
        });
    }, [
        busqueda,
        clientesIniciales,
        filtroEstado,
        filtroSucursal,
    ]);

    const resumen = useMemo(() => {
        const ahora = new Date();
        const mesActual = ahora.getMonth();

        return {
            total: clientesIniciales.length,
            activos: clientesIniciales.filter(
                (cliente) => cliente.estado === "ACTIVO",
            ).length,
            frecuentes: clientesIniciales.filter(
                (cliente) =>
                    cliente.estado === "ACTIVO" &&
                    cliente.cliente_frecuente,
            ).length,
            cumpleanios: clientesIniciales.filter(
                (cliente) => {
                    if (!cliente.fecha_nacimiento) return false;

                    const fecha = new Date(
                        `${cliente.fecha_nacimiento}T00:00:00`,
                    );

                    return fecha.getMonth() === mesActual;
                },
            ).length,
        };
    }, [clientesIniciales]);

    function abrirNuevo() {
        setClienteEditando(null);
        setMensaje(null);
        setModalAbierto(true);
    }

    function abrirEditar(cliente: ClienteListado) {
        setClienteEditando(cliente);
        setMensaje(null);
        setModalAbierto(true);
    }

    function cerrarModal() {
        if (procesando) return;

        setModalAbierto(false);
        setClienteEditando(null);
    }

    function cambiarEstado(cliente: ClienteListado) {
        const nuevoEstado: EstadoCliente =
            cliente.estado === "ACTIVO"
                ? "INACTIVO"
                : "ACTIVO";

        iniciarTransicion(async () => {
            const resultado = await cambiarEstadoCliente(
                cliente.id,
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
                            <UsersRound className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Personas y relaciones
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                Clientes
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Administra datos de contacto, preferencias,
                                comunicación y el historial de cada cliente.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={abrirNuevo}
                        className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-5 text-sidebar transition hover:bg-white"
                    >
                        <UserRoundPlus className="h-5 w-5" />
                        Nuevo cliente
                    </button>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaResumen
                    titulo="Total de clientes"
                    valor={resumen.total}
                    icono={UsersRound}
                />
                <TarjetaResumen
                    titulo="Clientes activos"
                    valor={resumen.activos}
                    icono={UserCheck}
                />
                <TarjetaResumen
                    titulo="Clientes frecuentes"
                    valor={resumen.frecuentes}
                    icono={Star}
                />
                <TarjetaResumen
                    titulo="Cumpleaños del mes"
                    valor={resumen.cumpleanios}
                    icono={CalendarDays}
                />
            </section>

            <section className="salon-panel border border-border bg-white">
                <header className="flex flex-col gap-4 border-b border-[#E8ECE9] p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">
                            Directorio de clientes
                        </h2>

                        <p className="mt-1 text-sm text-text-secondary">
                            {clientesFiltrados.length} cliente
                            {clientesFiltrados.length === 1 ? "" : "s"} encontrado
                            {clientesFiltrados.length === 1 ? "" : "s"}.
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
                                placeholder="Nombre, teléfono o código..."
                                className="salon-control w-full border border-border-strong bg-white pl-12 pr-4 text-foreground outline-none transition placeholder:text-[#A2AAA6] focus:border-primary focus:ring-4 focus:ring-primary/15"
                            />
                        </div>

                        <select
                            value={filtroSucursal}
                            onChange={(event) =>
                                setFiltroSucursal(event.target.value)
                            }
                            className="salon-control w-full border border-border-strong bg-white px-4 font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                        >
                            <option value="TODAS">
                                Todas las sucursales
                            </option>

                            {sucursales.map((sucursal) => (
                                <option
                                    key={sucursal.id}
                                    value={sucursal.id}
                                >
                                    {sucursal.nombre}
                                </option>
                            ))}
                        </select>

                        <div className="relative">
                            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                            <select
                                value={filtroEstado}
                                onChange={(event) =>
                                    setFiltroEstado(
                                        event.target.value as
                                        | "TODOS"
                                        | EstadoCliente,
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

                {clientesFiltrados.length === 0 ? (
                    <EstadoVacio
                        tieneRegistros={clientesIniciales.length > 0}
                        crear={abrirNuevo}
                    />
                ) : (
                    <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 2xl:grid-cols-3">
                        {clientesFiltrados.map((cliente) => (
                            <TarjetaCliente
                                key={cliente.id}
                                cliente={cliente}
                                procesando={procesando}
                                editar={() => abrirEditar(cliente)}
                                cambiarEstado={() =>
                                    cambiarEstado(cliente)
                                }
                            />
                        ))}
                    </div>
                )}
            </section>

            {modalAbierto && (
                <ModalCliente
                    cliente={clienteEditando}
                    sucursales={sucursales}
                    cerrar={cerrarModal}
                    guardado={(texto) => {
                        setModalAbierto(false);
                        setClienteEditando(null);
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

function TarjetaCliente({
    cliente,
    procesando,
    editar,
    cambiarEstado,
}: {
    cliente: ClienteListado;
    procesando: boolean;
    editar: () => void;
    cambiarEstado: () => void;
}) {
    const iniciales = obtenerIniciales(
        cliente.nombre_completo,
    );

    return (
        <article className="overflow-hidden rounded-2xl border border-border bg-[#FBFCFA] transition hover:-translate-y-0.5 hover:border-[#C8D9D1] hover:shadow-lg">
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white">
                        {iniciales}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-bold text-foreground tracking-tight">
                                {cliente.nombre_completo}
                            </h3>

                            <span
                                className={[
                                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                                    cliente.estado === "ACTIVO"
                                        ? "bg-[#E3EEE8] text-[#527865]"
                                        : "bg-[#F1E8E8] text-[#A66161]",
                                ].join(" ")}
                            >
                                {cliente.estado === "ACTIVO"
                                    ? "Activo"
                                    : "Inactivo"}
                            </span>

                            {cliente.cliente_frecuente && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF0DC] px-2.5 py-1 text-xs font-bold text-[#9A742D]">
                                    <Star className="h-3 w-3" />
                                    Frecuente
                                </span>
                            )}
                        </div>

                        <p className="mt-1 text-xs font-semibold text-primary">
                            {cliente.codigo_cliente ?? "Sin código"}
                        </p>
                    </div>
                </div>

                <div className="mt-5 space-y-2.5">
                    <DatoTarjeta
                        icono={MapPin}
                        texto={
                            cliente.sucursales?.nombre ??
                            "Sin sucursal"
                        }
                    />

                    <DatoTarjeta
                        icono={Phone}
                        texto={
                            cliente.telefono ||
                            "Sin teléfono registrado"
                        }
                    />

                    <DatoTarjeta
                        icono={MessageCircle}
                        texto={
                            cliente.whatsapp ||
                            "Sin WhatsApp registrado"
                        }
                    />

                    <DatoTarjeta
                        icono={Mail}
                        texto={
                            cliente.correo ||
                            "Sin correo registrado"
                        }
                    />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                    <Link
                        href={`/clientes/${cliente.id}`}
                        className="salon-action inline-flex items-center justify-center gap-1.5 bg-primary-soft text-text-secondary transition hover:bg-[#CFE0D8]"
                    >
                        <UserRound className="h-4 w-4" />
                        Perfil
                    </Link>

                    <button
                        type="button"
                        onClick={editar}
                        className="salon-action inline-flex items-center justify-center gap-1.5 border border-border-strong bg-white text-text-secondary transition hover:bg-surface-soft"
                    >
                        <Edit3 className="h-4 w-4" />
                        Editar
                    </button>

                    <button
                        type="button"
                        onClick={cambiarEstado}
                        disabled={procesando}
                        className={[
                            "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                            cliente.estado === "ACTIVO"
                                ? "bg-[#F8E5E5] text-[#A25E5E]"
                                : "bg-[#E3EEE8] text-[#527865]",
                        ].join(" ")}
                    >
                        {cliente.estado === "ACTIVO" ? (
                            <>
                                <UserX className="h-4 w-4" />
                                Inactivar
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-4 w-4" />
                                Activar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}

function ModalCliente({
    cliente,
    sucursales,
    cerrar,
    guardado,
}: {
    cliente: ClienteListado | null;
    sucursales: SucursalListado[];
    cerrar: () => void;
    guardado: (mensaje: string) => void;
}) {
    const editando = Boolean(cliente);

    const [formulario, setFormulario] =
        useState<DatosCliente>(() =>
            crearFormularioInicial(cliente, sucursales),
        );
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [duplicados, setDuplicados] = useState<
        {
            id: string;
            codigo_cliente: string | null;
            nombre_completo: string;
            telefono: string | null;
            whatsapp: string | null;
        }[]
    >([]);
    const [confirmarDuplicado, setConfirmarDuplicado] =
        useState(false);
    const [guardando, iniciarGuardado] = useTransition();
    const [
        verificandoDuplicados,
        iniciarVerificacion,
    ] = useTransition();

    function actualizar<K extends keyof DatosCliente>(
        campo: K,
        valor: DatosCliente[K],
    ) {
        setFormulario((actual) => ({
            ...actual,
            [campo]: valor,
        }));

        if (
            campo === "telefono" ||
            campo === "whatsapp"
        ) {
            setDuplicados([]);
            setConfirmarDuplicado(false);
        }

        setMensaje(null);
    }

    function guardarCliente() {
        iniciarGuardado(async () => {
            const resultado = editando
                ? await actualizarCliente(formulario)
                : await crearCliente(formulario);

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

    function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMensaje(null);

        if (confirmarDuplicado) {
            guardarCliente();
            return;
        }

        iniciarVerificacion(async () => {
            const resultado =
                await buscarTelefonosDuplicados(
                    formulario.telefono,
                    formulario.whatsapp,
                    formulario.id,
                );

            if (resultado.existe) {
                setDuplicados(resultado.clientes);
                return;
            }

            guardarCliente();
        });
    }

    return (
        <div className="fixed inset-0 z-[70] flex justify-end bg-sidebar/45 backdrop-blur-sm">
            <button
                type="button"
                aria-label="Cerrar formulario"
                onClick={cerrar}
                className="absolute inset-0"
            />

            <aside className="salon-sheet relative z-10 h-full w-full max-w-2xl overflow-y-auto bg-background shadow-2xl">
                <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white/95 px-5 py-5 backdrop-blur-xl sm:px-7">
                    <div>
                        <p className="text-sm font-semibold text-primary">
                            {editando
                                ? "Editar información"
                                : "Nuevo registro"}
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-foreground tracking-tight">
                            {editando
                                ? cliente?.nombre_completo
                                : "Nuevo cliente"}
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

                <form onSubmit={enviar} className="p-5 sm:p-7">
                    <div className="space-y-6">
                        {mensaje && (
                            <MensajeEstado
                                mensaje={mensaje}
                                cerrar={() => setMensaje(null)}
                            />
                        )}

                        {duplicados.length > 0 && (
                            <AlertaDuplicados
                                clientes={duplicados}
                                confirmar={() => {
                                    setConfirmarDuplicado(true);
                                    setDuplicados([]);
                                    guardarCliente();
                                }}
                                cancelar={() => {
                                    setDuplicados([]);
                                    setConfirmarDuplicado(false);
                                }}
                            />
                        )}

                        <SeccionFormulario
                            titulo="Información personal"
                            icono={UserRound}
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <CampoTexto
                                        etiqueta="Nombre completo"
                                        valor={formulario.nombreCompleto}
                                        placeholder="Nombre y apellidos"
                                        requerido
                                        cambiar={(valor) =>
                                            actualizar("nombreCompleto", valor)
                                        }
                                    />
                                </div>

                                <CampoSelect
                                    etiqueta="Sucursal"
                                    valor={formulario.sucursalId}
                                    opciones={sucursales.map((sucursal) => ({
                                        valor: sucursal.id,
                                        texto: sucursal.nombre,
                                    }))}
                                    cambiar={(valor) =>
                                        actualizar("sucursalId", valor)
                                    }
                                />

                                <CampoSelect
                                    etiqueta="Género"
                                    valor={formulario.genero}
                                    opciones={[
                                        {
                                            valor: "NO_ESPECIFICADO",
                                            texto: "No especificado",
                                        },
                                        {
                                            valor: "FEMENINO",
                                            texto: "Femenino",
                                        },
                                        {
                                            valor: "MASCULINO",
                                            texto: "Masculino",
                                        },
                                        {
                                            valor: "OTRO",
                                            texto: "Otro",
                                        },
                                    ]}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "genero",
                                            valor as GeneroCliente,
                                        )
                                    }
                                />

                                <CampoFecha
                                    etiqueta="Fecha de nacimiento"
                                    valor={formulario.fechaNacimiento}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "fechaNacimiento",
                                            valor,
                                        )
                                    }
                                />

                                <CampoTexto
                                    etiqueta="Cómo conoció el salón"
                                    valor={formulario.comoConocioSalon}
                                    placeholder="Ej. Instagram, recomendación"
                                    cambiar={(valor) =>
                                        actualizar(
                                            "comoConocioSalon",
                                            valor,
                                        )
                                    }
                                />
                            </div>
                        </SeccionFormulario>

                        <SeccionFormulario
                            titulo="Contacto"
                            icono={Phone}
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <CampoTexto
                                    etiqueta="Teléfono"
                                    valor={formulario.telefono}
                                    placeholder="Ej. 8888-8888"
                                    tipo="tel"
                                    cambiar={(valor) =>
                                        actualizar("telefono", valor)
                                    }
                                />

                                <CampoTexto
                                    etiqueta="WhatsApp"
                                    valor={formulario.whatsapp}
                                    placeholder="Ej. 8888-8888"
                                    tipo="tel"
                                    cambiar={(valor) =>
                                        actualizar("whatsapp", valor)
                                    }
                                />

                                <CampoTexto
                                    etiqueta="Correo"
                                    valor={formulario.correo}
                                    placeholder="cliente@correo.com"
                                    tipo="email"
                                    cambiar={(valor) =>
                                        actualizar("correo", valor)
                                    }
                                />

                                <div className="sm:col-span-2">
                                    <CampoTexto
                                        etiqueta="Dirección"
                                        valor={formulario.direccion}
                                        placeholder="Dirección del cliente"
                                        cambiar={(valor) =>
                                            actualizar("direccion", valor)
                                        }
                                    />
                                </div>
                            </div>
                        </SeccionFormulario>

                        <SeccionFormulario
                            titulo="Contacto de emergencia"
                            icono={Heart}
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <CampoTexto
                                    etiqueta="Nombre"
                                    valor={
                                        formulario.contactoEmergenciaNombre
                                    }
                                    placeholder="Nombre del contacto"
                                    cambiar={(valor) =>
                                        actualizar(
                                            "contactoEmergenciaNombre",
                                            valor,
                                        )
                                    }
                                />

                                <CampoTexto
                                    etiqueta="Teléfono"
                                    valor={
                                        formulario.contactoEmergenciaTelefono
                                    }
                                    placeholder="Número de contacto"
                                    tipo="tel"
                                    cambiar={(valor) =>
                                        actualizar(
                                            "contactoEmergenciaTelefono",
                                            valor,
                                        )
                                    }
                                />
                            </div>
                        </SeccionFormulario>

                        <SeccionFormulario
                            titulo="Comunicación y estado"
                            icono={MessageCircle}
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Interruptor
                                    titulo="Permitir notificaciones"
                                    descripcion="Habilita recordatorios del sistema."
                                    activo={
                                        formulario.permiteNotificaciones
                                    }
                                    cambiar={(valor) =>
                                        actualizar(
                                            "permiteNotificaciones",
                                            valor,
                                        )
                                    }
                                />

                                <Interruptor
                                    titulo="Permitir WhatsApp"
                                    descripcion="El cliente acepta mensajes por WhatsApp."
                                    activo={formulario.permiteWhatsapp}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "permiteWhatsapp",
                                            valor,
                                        )
                                    }
                                />

                                <Interruptor
                                    titulo="Permitir correo"
                                    descripcion="El cliente acepta mensajes por correo."
                                    activo={formulario.permiteCorreo}
                                    cambiar={(valor) =>
                                        actualizar("permiteCorreo", valor)
                                    }
                                />

                                <Interruptor
                                    titulo="Cliente frecuente"
                                    descripcion="Destaca al cliente dentro del sistema."
                                    activo={formulario.clienteFrecuente}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "clienteFrecuente",
                                            valor,
                                        )
                                    }
                                />

                                <Interruptor
                                    titulo="Cliente activo"
                                    descripcion="Podrá utilizarse en citas y ventas."
                                    activo={formulario.estado === "ACTIVO"}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "estado",
                                            valor ? "ACTIVO" : "INACTIVO",
                                        )
                                    }
                                />
                            </div>
                        </SeccionFormulario>

                        <SeccionFormulario
                            titulo="Observaciones"
                            icono={Edit3}
                        >
                            <CampoArea
                                etiqueta="Notas generales"
                                valor={formulario.observaciones}
                                placeholder="Preferencias, detalles o información importante..."
                                cambiar={(valor) =>
                                    actualizar("observaciones", valor)
                                }
                            />
                        </SeccionFormulario>
                    </div>

                    <div className="sticky bottom-4 mt-6 flex flex-col-reverse gap-3 rounded-2xl border border-border-strong bg-white/95 p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={cerrar}
                            disabled={
                                guardando || verificandoDuplicados
                            }
                            className="salon-action border border-border-strong bg-surface-soft px-5 text-text-secondary"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={
                                guardando || verificandoDuplicados
                            }
                            className="salon-action inline-flex min-w-44 items-center justify-center gap-2 bg-primary px-5 text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-[#AAB9B3]"
                        >
                            {guardando || verificandoDuplicados ? (
                                <>
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                    {verificandoDuplicados
                                        ? "Verificando..."
                                        : "Guardando..."}
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5" />
                                    {editando
                                        ? "Guardar cambios"
                                        : "Registrar cliente"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </aside>
        </div>
    );
}

function AlertaDuplicados({
    clientes,
    confirmar,
    cancelar,
}: {
    clientes: {
        id: string;
        codigo_cliente: string | null;
        nombre_completo: string;
        telefono: string | null;
        whatsapp: string | null;
    }[];
    confirmar: () => void;
    cancelar: () => void;
}) {
    return (
        <div className="rounded-2xl border border-[#E6D7B9] bg-[#FAF0DC] p-4 text-[#7B5B25]">
            <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                <div className="min-w-0 flex-1">
                    <p className="font-bold">
                        Encontramos números similares
                    </p>

                    <p className="mt-1 text-sm leading-6">
                        Revisa si el cliente ya existe antes de continuar.
                    </p>

                    <div className="mt-3 space-y-2">
                        {clientes.map((cliente) => (
                            <div
                                key={cliente.id}
                                className="rounded-xl bg-white/70 p-3 text-sm"
                            >
                                <p className="font-semibold">
                                    {cliente.nombre_completo}
                                </p>

                                <p className="mt-1 text-xs">
                                    {cliente.codigo_cliente ?? "Sin código"} ·{" "}
                                    {cliente.telefono ||
                                        cliente.whatsapp ||
                                        "Sin número"}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={cancelar}
                            className="salon-action bg-white px-4"
                        >
                            Revisar datos
                        </button>

                        <button
                            type="button"
                            onClick={confirmar}
                            className="salon-action bg-[#D8B36A] px-4 text-white"
                        >
                            Registrar de todas formas
                        </button>
                    </div>
                </div>
            </div>
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
    tipo = "text",
    requerido = false,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    placeholder: string;
    tipo?: "text" | "email" | "tel";
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
                type={tipo}
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

function CampoFecha({
    etiqueta,
    valor,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    cambiar: (valor: string) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </label>

            <input
                type="date"
                value={valor}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="salon-control w-full border border-border-strong bg-white px-4 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
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
                required
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="salon-control w-full border border-border-strong bg-white px-4 font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            >
                <option value="">Seleccionar</option>

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
        </label>
    );
}

function DatoTarjeta({
    icono: Icono,
    texto,
}: {
    icono: React.ComponentType<{ className?: string }>;
    texto: string;
}) {
    return (
        <div className="flex items-center gap-2.5 text-sm text-text-secondary">
            <Icono className="h-4 w-4 shrink-0 text-[#829089]" />

            <span className="truncate">{texto}</span>
        </div>
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
    crear,
}: {
    tieneRegistros: boolean;
    crear: () => void;
}) {
    return (
        <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft text-primary-strong">
                <UsersRound className="h-8 w-8" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-foreground tracking-tight">
                {tieneRegistros
                    ? "No encontramos resultados"
                    : "Todavía no hay clientes"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                {tieneRegistros
                    ? "Prueba utilizando otra búsqueda o cambiando los filtros."
                    : "Registra el primer cliente para comenzar a crear citas e historial."}
            </p>

            {!tieneRegistros && (
                <button
                    type="button"
                    onClick={crear}
                    className="salon-action mt-5 inline-flex items-center justify-center gap-2 bg-primary px-5 text-white transition hover:bg-primary-hover"
                >
                    <Plus className="h-5 w-5" />
                    Registrar cliente
                </button>
            )}
        </div>
    );
}

function crearFormularioInicial(
    cliente: ClienteListado | null,
    sucursales: SucursalListado[],
): DatosCliente {
    if (cliente) {
        return {
            id: cliente.id,
            sucursalId: cliente.sucursal_id ?? "",
            nombreCompleto: cliente.nombre_completo,
            telefono: cliente.telefono ?? "",
            whatsapp: cliente.whatsapp ?? "",
            correo: cliente.correo ?? "",
            direccion: cliente.direccion ?? "",
            fechaNacimiento:
                cliente.fecha_nacimiento ?? "",
            genero:
                cliente.genero ?? "NO_ESPECIFICADO",
            contactoEmergenciaNombre:
                cliente.contacto_emergencia_nombre ?? "",
            contactoEmergenciaTelefono:
                cliente.contacto_emergencia_telefono ?? "",
            comoConocioSalon:
                cliente.como_conocio_salon ?? "",
            permiteNotificaciones:
                cliente.permite_notificaciones,
            permiteWhatsapp: cliente.permite_whatsapp,
            permiteCorreo: cliente.permite_correo,
            clienteFrecuente:
                cliente.cliente_frecuente,
            estado: cliente.estado,
            observaciones: cliente.observaciones ?? "",
        };
    }

    const sucursalPrincipal =
        sucursales.find(
            (sucursal) => sucursal.es_principal,
        ) ?? sucursales[0];

    return {
        sucursalId: sucursalPrincipal?.id ?? "",
        nombreCompleto: "",
        telefono: "",
        whatsapp: "",
        correo: "",
        direccion: "",
        fechaNacimiento: "",
        genero: "NO_ESPECIFICADO",
        contactoEmergenciaNombre: "",
        contactoEmergenciaTelefono: "",
        comoConocioSalon: "",
        permiteNotificaciones: true,
        permiteWhatsapp: true,
        permiteCorreo: false,
        clienteFrecuente: false,
        estado: "ACTIVO",
        observaciones: "",
    };
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