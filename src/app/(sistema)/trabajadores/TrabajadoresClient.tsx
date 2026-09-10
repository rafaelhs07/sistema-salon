"use client";

import {
    BriefcaseBusiness,
    CalendarCheck2,
    Check,
    CheckCircle2,
    CircleDollarSign,
    Edit3,
    LoaderCircle,
    Mail,
    MapPin,
    Palette,
    Phone,
    Plus,
    Search,
    SlidersHorizontal,
    UserCheck,
    UserRound,
    UserX,
    UsersRound,
    X,
    XCircle,
    CalendarClock,
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
    actualizarTrabajador,
    cambiarEstadoTrabajador,
    crearEspecialidad,
    crearTrabajador,
    type DatosTrabajador,
    type EstadoTrabajador,
    type FrecuenciaPago,
    type ModalidadPago,
    type TipoComision,
} from "./actions";

export type EspecialidadListado = {
    id: string;
    nombre: string;
    estado: string;
};

export type TrabajadorListado = {
    id: string;
    sucursal_id: string | null;
    nombre_completo: string;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    descripcion: string | null;
    fecha_nacimiento: string | null;
    fecha_ingreso: string | null;
    color_calendario: string;
    modalidad_pago: ModalidadPago;
    salario_fijo: number;
    frecuencia_pago: FrecuenciaPago;
    tipo_comision: TipoComision;
    comision_general: number;
    permite_citas: boolean;
    estado: EstadoTrabajador;
    observaciones: string | null;
    sucursales: {
        nombre: string;
    } | null;
    trabajador_especialidades: {
        especialidad_id: string;
        especialidades: {
            id: string;
            nombre: string;
        } | null;
    }[];
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

type TrabajadoresClientProps = {
    trabajadoresIniciales: TrabajadorListado[];
    sucursales: SucursalListado[];
    especialidadesIniciales: EspecialidadListado[];
    simboloMoneda: string;
};

const coloresAgenda = [
    "#6F8F83",
    "#7893A6",
    "#C79AA1",
    "#D8B36A",
    "#8D7FA8",
    "#C97878",
    "#5F8A77",
    "#A47B67",
];

export default function TrabajadoresClient({
    trabajadoresIniciales,
    sucursales,
    especialidadesIniciales,
    simboloMoneda,
}: TrabajadoresClientProps) {
    const router = useRouter();

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] =
        useState<"TODOS" | EstadoTrabajador>("TODOS");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [trabajadorEditando, setTrabajadorEditando] =
        useState<TrabajadorListado | null>(null);
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [procesando, iniciarTransicion] = useTransition();

    const trabajadoresFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return trabajadoresIniciales.filter((trabajador) => {
            const especialidadesTexto =
                trabajador.trabajador_especialidades
                    .map(
                        (relacion) =>
                            relacion.especialidades?.nombre ?? "",
                    )
                    .join(" ")
                    .toLowerCase();

            const coincideBusqueda =
                !texto ||
                trabajador.nombre_completo
                    .toLowerCase()
                    .includes(texto) ||
                especialidadesTexto.includes(texto) ||
                trabajador.telefono
                    ?.toLowerCase()
                    .includes(texto) ||
                trabajador.correo
                    ?.toLowerCase()
                    .includes(texto);

            const coincideEstado =
                filtroEstado === "TODOS" ||
                trabajador.estado === filtroEstado;

            return coincideBusqueda && coincideEstado;
        });
    }, [busqueda, filtroEstado, trabajadoresIniciales]);

    const resumen = useMemo(() => {
        return {
            total: trabajadoresIniciales.length,
            activos: trabajadoresIniciales.filter(
                (trabajador) => trabajador.estado === "ACTIVO",
            ).length,
            recibenCitas: trabajadoresIniciales.filter(
                (trabajador) =>
                    trabajador.estado === "ACTIVO" &&
                    trabajador.permite_citas,
            ).length,
            inactivos: trabajadoresIniciales.filter(
                (trabajador) => trabajador.estado === "INACTIVO",
            ).length,
        };
    }, [trabajadoresIniciales]);

    function abrirNuevoTrabajador() {
        setTrabajadorEditando(null);
        setMensaje(null);
        setModalAbierto(true);
    }

    function abrirEditarTrabajador(
        trabajador: TrabajadorListado,
    ) {
        setTrabajadorEditando(trabajador);
        setMensaje(null);
        setModalAbierto(true);
    }

    function cerrarModal() {
        if (procesando) return;

        setModalAbierto(false);
        setTrabajadorEditando(null);
    }

    function cambiarEstado(
        trabajador: TrabajadorListado,
    ) {
        const nuevoEstado: EstadoTrabajador =
            trabajador.estado === "ACTIVO"
                ? "INACTIVO"
                : "ACTIVO";

        iniciarTransicion(async () => {
            const resultado = await cambiarEstadoTrabajador(
                trabajador.id,
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
                                Personal del salón
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                Trabajadores
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Administra especialidades, salario, comisiones y
                                disponibilidad del equipo.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={abrirNuevoTrabajador}
                        className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-5 text-sidebar transition hover:bg-white"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo trabajador
                    </button>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaResumen
                    titulo="Total de trabajadores"
                    valor={resumen.total}
                    icono={UsersRound}
                />
                <TarjetaResumen
                    titulo="Trabajadores activos"
                    valor={resumen.activos}
                    icono={UserCheck}
                />
                <TarjetaResumen
                    titulo="Disponibles para citas"
                    valor={resumen.recibenCitas}
                    icono={CalendarCheck2}
                />
                <TarjetaResumen
                    titulo="Trabajadores inactivos"
                    valor={resumen.inactivos}
                    icono={UserX}
                />
            </section>

            <section className="salon-panel border border-border bg-white">
                <header className="flex flex-col gap-4 border-b border-[#E8ECE9] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">
                            Equipo de trabajo
                        </h2>
                        <p className="mt-1 text-sm text-text-secondary">
                            {trabajadoresFiltrados.length} trabajador
                            {trabajadoresFiltrados.length === 1 ? "" : "es"} encontrado
                            {trabajadoresFiltrados.length === 1 ? "" : "s"}.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative min-w-0 sm:w-72">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />
                            <input
                                value={busqueda}
                                onChange={(event) =>
                                    setBusqueda(event.target.value)
                                }
                                placeholder="Buscar trabajador..."
                                className="salon-control w-full border border-border-strong bg-white pl-12 pr-4 text-foreground outline-none transition placeholder:text-[#A2AAA6] focus:border-primary focus:ring-4 focus:ring-primary/15"
                            />
                        </div>

                        <div className="relative">
                            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                            <select
                                value={filtroEstado}
                                onChange={(event) =>
                                    setFiltroEstado(
                                        event.target.value as
                                        | "TODOS"
                                        | EstadoTrabajador,
                                    )
                                }
                                className="salon-control min-w-44 appearance-none border border-border-strong bg-white pl-11 pr-8 font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                            >
                                <option value="TODOS">Todos los estados</option>
                                <option value="ACTIVO">Activos</option>
                                <option value="INACTIVO">Inactivos</option>
                            </select>
                        </div>
                    </div>
                </header>

                {trabajadoresFiltrados.length === 0 ? (
                    <EstadoVacio
                        tieneRegistros={trabajadoresIniciales.length > 0}
                        crear={abrirNuevoTrabajador}
                    />
                ) : (
                    <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 2xl:grid-cols-3">
                        {trabajadoresFiltrados.map((trabajador) => (
                            <TarjetaTrabajador
                                key={trabajador.id}
                                trabajador={trabajador}
                                simboloMoneda={simboloMoneda}
                                editar={() =>
                                    abrirEditarTrabajador(trabajador)
                                }
                                cambiarEstado={() =>
                                    cambiarEstado(trabajador)
                                }
                                procesando={procesando}
                            />
                        ))}
                    </div>
                )}
            </section>

            {modalAbierto && (
                <ModalTrabajador
                    trabajador={trabajadorEditando}
                    sucursales={sucursales}
                    especialidadesIniciales={especialidadesIniciales}
                    simboloMoneda={simboloMoneda}
                    cerrar={cerrarModal}
                    guardado={(texto) => {
                        setModalAbierto(false);
                        setTrabajadorEditando(null);
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

function TarjetaTrabajador({
    trabajador,
    simboloMoneda,
    editar,
    cambiarEstado,
    procesando,
}: {
    trabajador: TrabajadorListado;
    simboloMoneda: string;
    editar: () => void;
    cambiarEstado: () => void;
    procesando: boolean;
}) {
    const iniciales = obtenerIniciales(
        trabajador.nombre_completo,
    );

    return (
        <article className="group overflow-hidden rounded-2xl border border-border bg-[#FBFCFA] transition hover:-translate-y-0.5 hover:border-[#C8D9D1] hover:shadow-lg">
            <div
                className="h-1.5 w-full"
                style={{
                    backgroundColor: trabajador.color_calendario,
                }}
            />

            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm"
                        style={{
                            backgroundColor: trabajador.color_calendario,
                        }}
                    >
                        {iniciales}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-bold text-foreground tracking-tight">
                                {trabajador.nombre_completo}
                            </h3>

                            <span
                                className={[
                                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                                    trabajador.estado === "ACTIVO"
                                        ? "bg-[#E3EEE8] text-[#527865]"
                                        : "bg-[#F1E8E8] text-[#A66161]",
                                ].join(" ")}
                            >
                                {trabajador.estado === "ACTIVO"
                                    ? "Activo"
                                    : "Inactivo"}
                            </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {trabajador.trabajador_especialidades.length > 0 ? (
                                trabajador.trabajador_especialidades.map(
                                    (relacion) =>
                                        relacion.especialidades && (
                                            <span
                                                key={relacion.especialidad_id}
                                                className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-bold text-primary-strong"
                                            >
                                                {relacion.especialidades.nombre}
                                            </span>
                                        ),
                                )
                            ) : (
                                <span className="text-sm text-text-secondary">
                                    Sin especialidades
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-5 space-y-2.5">
                    <DatoTarjeta
                        icono={MapPin}
                        texto={
                            trabajador.sucursales?.nombre ??
                            "Sin sucursal asignada"
                        }
                    />
                    <DatoTarjeta
                        icono={Phone}
                        texto={
                            trabajador.telefono || "Sin teléfono registrado"
                        }
                    />
                    <DatoTarjeta
                        icono={Mail}
                        texto={
                            trabajador.correo || "Sin correo registrado"
                        }
                    />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#839089]">
                            Modalidad
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#33413B]">
                            {formatearModalidadPago(
                                trabajador.modalidad_pago,
                            )}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#839089]">
                            Pago
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#33413B]">
                            {formatearPagoTrabajador(
                                trabajador,
                                simboloMoneda,
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-3 rounded-xl bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#839089]">
                        Agenda
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#33413B]">
                        {trabajador.permite_citas
                            ? "Recibe citas"
                            : "No recibe citas"}
                    </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={editar}
                        className="salon-action inline-flex items-center justify-center gap-2 border border-border-strong bg-white text-text-secondary transition hover:bg-surface-soft"
                    >
                        <Edit3 className="h-4 w-4" />
                        Editar
                    </button>

                    <Link
                        href={`/trabajadores/${trabajador.id}/horarios`}
                        className="salon-action inline-flex items-center justify-center gap-2 bg-surface-soft text-[#52605A] transition hover:bg-primary-soft"
                    >
                        <CalendarClock className="h-4 w-4" />
                        Horario
                    </Link>

                    <button
                        type="button"
                        onClick={cambiarEstado}
                        disabled={procesando}
                        className={[
                            "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                            trabajador.estado === "ACTIVO"
                                ? "bg-[#F8E5E5] text-[#A25E5E] hover:bg-[#F2DADA]"
                                : "bg-[#E3EEE8] text-[#527865] hover:bg-[#D8E8E0]",
                        ].join(" ")}
                    >
                        {trabajador.estado === "ACTIVO" ? (
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
            </div>
        </article>
    );
}

function ModalTrabajador({
    trabajador,
    sucursales,
    especialidadesIniciales,
    simboloMoneda,
    cerrar,
    guardado,
}: {
    trabajador: TrabajadorListado | null;
    sucursales: SucursalListado[];
    especialidadesIniciales: EspecialidadListado[];
    simboloMoneda: string;
    cerrar: () => void;
    guardado: (mensaje: string) => void;
}) {
    const editando = Boolean(trabajador);

    const [formulario, setFormulario] =
        useState<DatosTrabajador>(() =>
            crearFormularioInicial(trabajador, sucursales),
        );
    const [especialidades, setEspecialidades] = useState(
        especialidadesIniciales,
    );
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [guardando, iniciarGuardado] = useTransition();

    function actualizar<K extends keyof DatosTrabajador>(
        campo: K,
        valor: DatosTrabajador[K],
    ) {
        setFormulario((actual) => ({
            ...actual,
            [campo]: valor,
        }));
        setMensaje(null);
    }

    function guardar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMensaje(null);

        iniciarGuardado(async () => {
            const resultado = editando
                ? await actualizarTrabajador(formulario)
                : await crearTrabajador(formulario);

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

    async function agregarEspecialidad(nombre: string) {
        const resultado = await crearEspecialidad(nombre);

        if (!resultado.exito || !resultado.especialidad) {
            return resultado;
        }

        const especialidadCreada = resultado.especialidad;

        setEspecialidades((actuales) => {
            const existe = actuales.some(
                (item) => item.id === especialidadCreada.id,
            );

            if (existe) {
                return actuales;
            }

            return [
                ...actuales,
                {
                    id: especialidadCreada.id,
                    nombre: especialidadCreada.nombre,
                    estado: "ACTIVA",
                },
            ].sort((a, b) =>
                a.nombre.localeCompare(b.nombre, "es"),
            );
        });

        setFormulario((actual) => ({
            ...actual,
            especialidadesIds:
                actual.especialidadesIds.includes(
                    especialidadCreada.id,
                )
                    ? actual.especialidadesIds
                    : [
                        ...actual.especialidadesIds,
                        especialidadCreada.id,
                    ],
        }));

        return resultado;
    }

    const usaSalario =
        formulario.modalidadPago === "SALARIO_FIJO" ||
        formulario.modalidadPago === "SALARIO_MAS_COMISION";

    const usaComision =
        formulario.modalidadPago === "SOLO_COMISION" ||
        formulario.modalidadPago === "SALARIO_MAS_COMISION";

    const etiquetaComision =
        formulario.tipoComision === "PORCENTAJE"
            ? "Porcentaje de comisión"
            : "Monto fijo por servicio";

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
                                ? trabajador?.nombre_completo
                                : "Nuevo trabajador"}
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
                            titulo="Información personal"
                            icono={UserRound}
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <CampoTexto
                                        etiqueta="Nombre completo"
                                        valor={formulario.nombreCompleto}
                                        icono={UserRound}
                                        requerido
                                        placeholder="Nombre y apellidos"
                                        cambiar={(valor) =>
                                            actualizar("nombreCompleto", valor)
                                        }
                                    />
                                </div>

                                <CampoTexto
                                    etiqueta="Teléfono"
                                    valor={formulario.telefono}
                                    icono={Phone}
                                    tipo="tel"
                                    placeholder="Ej. 8888-8888"
                                    cambiar={(valor) =>
                                        actualizar("telefono", valor)
                                    }
                                />

                                <CampoTexto
                                    etiqueta="Correo electrónico"
                                    valor={formulario.correo}
                                    icono={Mail}
                                    tipo="email"
                                    placeholder="correo@ejemplo.com"
                                    cambiar={(valor) =>
                                        actualizar("correo", valor)
                                    }
                                />

                                <div className="sm:col-span-2">
                                    <CampoTexto
                                        etiqueta="Dirección"
                                        valor={formulario.direccion}
                                        icono={MapPin}
                                        placeholder="Dirección del trabajador"
                                        cambiar={(valor) =>
                                            actualizar("direccion", valor)
                                        }
                                    />
                                </div>

                                <CampoFecha
                                    etiqueta="Fecha de nacimiento"
                                    valor={formulario.fechaNacimiento}
                                    cambiar={(valor) =>
                                        actualizar("fechaNacimiento", valor)
                                    }
                                />

                                <CampoFecha
                                    etiqueta="Fecha de ingreso"
                                    valor={formulario.fechaIngreso}
                                    cambiar={(valor) =>
                                        actualizar("fechaIngreso", valor)
                                    }
                                />
                            </div>
                        </SeccionFormulario>

                        <SeccionFormulario
                            titulo="Información laboral"
                            icono={BriefcaseBusiness}
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <SelectorEspecialidades
                                        especialidades={especialidades}
                                        seleccionadas={
                                            formulario.especialidadesIds
                                        }
                                        cambiar={(ids) =>
                                            actualizar("especialidadesIds", ids)
                                        }
                                        agregarEspecialidad={agregarEspecialidad}
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

                                <div className="sm:col-span-2">
                                    <CampoArea
                                        etiqueta="Descripción profesional"
                                        valor={formulario.descripcion}
                                        placeholder="Experiencia, habilidades o funciones principales..."
                                        cambiar={(valor) =>
                                            actualizar("descripcion", valor)
                                        }
                                    />
                                </div>
                            </div>
                        </SeccionFormulario>

                        <SeccionFormulario
                            titulo="Pago, comisión y agenda"
                            icono={CircleDollarSign}
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <CampoSelect
                                    etiqueta="Modalidad de pago"
                                    valor={formulario.modalidadPago}
                                    opciones={[
                                        {
                                            valor: "SALARIO_FIJO",
                                            texto: "Salario fijo",
                                        },
                                        {
                                            valor: "SOLO_COMISION",
                                            texto: "Solo comisión",
                                        },
                                        {
                                            valor: "SALARIO_MAS_COMISION",
                                            texto: "Salario fijo + comisión",
                                        },
                                        {
                                            valor: "SIN_PAGO",
                                            texto: "Sin pago configurado",
                                        },
                                    ]}
                                    cambiar={(valor) =>
                                        actualizar(
                                            "modalidadPago",
                                            valor as ModalidadPago,
                                        )
                                    }
                                />

                                {usaSalario && (
                                    <CampoDinero
                                        etiqueta="Salario fijo"
                                        valor={formulario.salarioFijo}
                                        simbolo={simboloMoneda}
                                        cambiar={(valor) =>
                                            actualizar("salarioFijo", valor)
                                        }
                                    />
                                )}

                                {usaSalario && (
                                    <CampoSelect
                                        etiqueta="Frecuencia de pago"
                                        valor={formulario.frecuenciaPago}
                                        opciones={[
                                            {
                                                valor: "SEMANAL",
                                                texto: "Semanal",
                                            },
                                            {
                                                valor: "QUINCENAL",
                                                texto: "Quincenal",
                                            },
                                            {
                                                valor: "MENSUAL",
                                                texto: "Mensual",
                                            },
                                        ]}
                                        cambiar={(valor) =>
                                            actualizar(
                                                "frecuenciaPago",
                                                valor as FrecuenciaPago,
                                            )
                                        }
                                    />
                                )}

                                {usaComision && (
                                    <CampoSelect
                                        etiqueta="Tipo de comisión"
                                        valor={formulario.tipoComision}
                                        opciones={[
                                            {
                                                valor: "PORCENTAJE",
                                                texto: "Porcentaje",
                                            },
                                            {
                                                valor: "MONTO_FIJO",
                                                texto: "Monto fijo",
                                            },
                                        ]}
                                        cambiar={(valor) =>
                                            actualizar(
                                                "tipoComision",
                                                valor as TipoComision,
                                            )
                                        }
                                    />
                                )}

                                {usaComision && (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                                            {etiquetaComision}
                                        </label>

                                        <div className="relative">
                                            <CircleDollarSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />
                                            <input
                                                type="number"
                                                min="0"
                                                max={
                                                    formulario.tipoComision ===
                                                        "PORCENTAJE"
                                                        ? "100"
                                                        : undefined
                                                }
                                                step="0.01"
                                                value={formulario.comisionGeneral}
                                                onChange={(event) =>
                                                    actualizar(
                                                        "comisionGeneral",
                                                        Number(event.target.value),
                                                    )
                                                }
                                                className="salon-control w-full border border-border-strong bg-white pl-12 pr-14 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-secondary">
                                                {formulario.tipoComision ===
                                                    "PORCENTAJE"
                                                    ? "%"
                                                    : simboloMoneda}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5">
                                <p className="mb-3 text-sm font-semibold text-[#3D4A45]">
                                    Color en el calendario
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    {coloresAgenda.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() =>
                                                actualizar("colorCalendario", color)
                                            }
                                            className={[
                                                "flex h-10 w-10 items-center justify-center rounded-xl transition",
                                                formulario.colorCalendario === color
                                                    ? "ring-4 ring-primary/20"
                                                    : "hover:scale-105",
                                            ].join(" ")}
                                            style={{
                                                backgroundColor: color,
                                            }}
                                        >
                                            {formulario.colorCalendario ===
                                                color && (
                                                    <CheckCircle2 className="h-5 w-5 text-white" />
                                                )}
                                        </button>
                                    ))}

                                    <label className="relative flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-white px-3 text-sm font-semibold text-[#52605A]">
                                        <Palette className="h-4 w-4" />
                                        Otro
                                        <input
                                            type="color"
                                            value={formulario.colorCalendario}
                                            onChange={(event) =>
                                                actualizar(
                                                    "colorCalendario",
                                                    event.target.value,
                                                )
                                            }
                                            className="absolute inset-0 cursor-pointer opacity-0"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <Interruptor
                                    titulo="Puede recibir citas"
                                    descripcion="Aparecerá disponible dentro de la agenda."
                                    activo={formulario.permiteCitas}
                                    cambiar={(valor) =>
                                        actualizar("permiteCitas", valor)
                                    }
                                />

                                <Interruptor
                                    titulo="Trabajador activo"
                                    descripcion="Podrá utilizarse en los módulos del sistema."
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
                            icono={BriefcaseBusiness}
                        >
                            <CampoArea
                                etiqueta="Notas internas"
                                valor={formulario.observaciones}
                                placeholder="Información interna sobre el trabajador..."
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
                                        : "Registrar trabajador"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </aside>
        </div>
    );
}

function SelectorEspecialidades({
    especialidades,
    seleccionadas,
    cambiar,
    agregarEspecialidad,
}: {
    especialidades: EspecialidadListado[];
    seleccionadas: string[];
    cambiar: (ids: string[]) => void;
    agregarEspecialidad: (
        nombre: string,
    ) => Promise<{
        exito: boolean;
        mensaje: string;
    }>;
}) {
    const [nuevaEspecialidad, setNuevaEspecialidad] =
        useState("");
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [creando, iniciarCreacion] = useTransition();

    function alternar(especialidadId: string) {
        if (seleccionadas.includes(especialidadId)) {
            cambiar(
                seleccionadas.filter(
                    (id) => id !== especialidadId,
                ),
            );
            return;
        }

        cambiar([...seleccionadas, especialidadId]);
    }

    function crearNueva() {
        const nombre = nuevaEspecialidad.trim();

        if (!nombre) {
            setMensaje({
                tipo: "ERROR",
                texto: "Escribe el nombre de la especialidad.",
            });
            return;
        }

        iniciarCreacion(async () => {
            const resultado = await agregarEspecialidad(nombre);

            setMensaje({
                tipo: resultado.exito ? "EXITO" : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                setNuevaEspecialidad("");
            }
        });
    }

    return (
        <div>
            <p className="mb-2 text-sm font-semibold text-[#3D4A45]">
                Especialidades
                <span className="ml-1 text-[#C97878]">*</span>
            </p>

            <div className="rounded-2xl border border-border-strong bg-[#FBFCFA] p-3">
                <div className="flex flex-wrap gap-2">
                    {especialidades.map((especialidad) => {
                        const seleccionada = seleccionadas.includes(
                            especialidad.id,
                        );

                        return (
                            <button
                                key={especialidad.id}
                                type="button"
                                onClick={() => alternar(especialidad.id)}
                                className={[
                                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition",
                                    seleccionada
                                        ? "border-primary bg-primary-soft text-[#3F6657]"
                                        : "border-[#E0E5E2] bg-white text-text-secondary hover:border-[#B9CEC4]",
                                ].join(" ")}
                            >
                                {seleccionada && (
                                    <Check className="h-3.5 w-3.5" />
                                )}
                                {especialidad.nombre}
                            </button>
                        );
                    })}
                </div>

                {especialidades.length === 0 && (
                    <p className="py-3 text-sm text-[#7C8781]">
                        Aún no hay especialidades. Puedes crear la primera
                        aquí abajo.
                    </p>
                )}

                <div className="mt-4 border-t border-border pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#718079]">
                        Agregar nueva especialidad
                    </p>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            value={nuevaEspecialidad}
                            onChange={(event) => {
                                setNuevaEspecialidad(event.target.value);
                                setMensaje(null);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    crearNueva();
                                }
                            }}
                            maxLength={80}
                            placeholder="Ej. Peinados, nail art, depilación..."
                            className="salon-control min-w-0 flex-1 border border-border-strong bg-white px-4 text-foreground outline-none transition placeholder:text-[#A2AAA6] focus:border-primary focus:ring-4 focus:ring-primary/15"
                        />

                        <button
                            type="button"
                            onClick={crearNueva}
                            disabled={creando}
                            className="salon-action inline-flex items-center justify-center gap-2 bg-surface-soft px-4 text-text-secondary transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {creando ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Agregar
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
            </div>

            <p className="mt-2 text-xs text-[#7C8781]">
                Puedes seleccionar varias especialidades o crear una nueva.
            </p>
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
    icono: Icono,
    tipo = "text",
    requerido = false,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    placeholder: string;
    icono: React.ComponentType<{ className?: string }>;
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

            <div className="relative">
                <Icono className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />
                <input
                    type={tipo}
                    value={valor}
                    required={requerido}
                    placeholder={placeholder}
                    onChange={(event) => cambiar(event.target.value)}
                    className="salon-control w-full border border-border-strong bg-white pl-12 pr-4 text-foreground outline-none transition placeholder:text-[#A2AAA6] focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
            </div>
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
                onChange={(event) => cambiar(event.target.value)}
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
                onChange={(event) => cambiar(event.target.value)}
                className="salon-control w-full border border-border-strong bg-white px-4 font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            >
                <option value="">Seleccionar</option>
                {opciones.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                        {opcion.texto}
                    </option>
                ))}
            </select>
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
                <CircleDollarSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />
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
                onChange={(event) => cambiar(event.target.value)}
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
                onChange={(event) => cambiar(event.target.checked)}
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

            <button type="button" onClick={cerrar}>
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
                    : "Todavía no hay trabajadores"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                {tieneRegistros
                    ? "Prueba utilizando otro nombre o cambiando el filtro seleccionado."
                    : "Registra el personal del salón para comenzar a asignar servicios, horarios y citas."}
            </p>

            {!tieneRegistros && (
                <button
                    type="button"
                    onClick={crear}
                    className="salon-action mt-5 inline-flex items-center justify-center gap-2 bg-primary px-5 text-white transition hover:bg-primary-hover"
                >
                    <Plus className="h-5 w-5" />
                    Registrar trabajador
                </button>
            )}
        </div>
    );
}

function crearFormularioInicial(
    trabajador: TrabajadorListado | null,
    sucursales: SucursalListado[],
): DatosTrabajador {
    if (trabajador) {
        return {
            id: trabajador.id,
            sucursalId: trabajador.sucursal_id ?? "",
            nombreCompleto: trabajador.nombre_completo,
            telefono: trabajador.telefono ?? "",
            correo: trabajador.correo ?? "",
            direccion: trabajador.direccion ?? "",
            especialidadesIds:
                trabajador.trabajador_especialidades.map(
                    (relacion) => relacion.especialidad_id,
                ),
            descripcion: trabajador.descripcion ?? "",
            fechaNacimiento: trabajador.fecha_nacimiento ?? "",
            fechaIngreso: trabajador.fecha_ingreso ?? "",
            colorCalendario:
                trabajador.color_calendario || "#6F8F83",
            modalidadPago: trabajador.modalidad_pago,
            salarioFijo: Number(trabajador.salario_fijo),
            frecuenciaPago: trabajador.frecuencia_pago,
            tipoComision: trabajador.tipo_comision,
            comisionGeneral: Number(
                trabajador.comision_general,
            ),
            permiteCitas: trabajador.permite_citas,
            estado: trabajador.estado,
            observaciones: trabajador.observaciones ?? "",
        };
    }

    const sucursalPrincipal =
        sucursales.find((sucursal) => sucursal.es_principal) ??
        sucursales[0];

    return {
        sucursalId: sucursalPrincipal?.id ?? "",
        nombreCompleto: "",
        telefono: "",
        correo: "",
        direccion: "",
        especialidadesIds: [],
        descripcion: "",
        fechaNacimiento: "",
        fechaIngreso: new Date().toISOString().slice(0, 10),
        colorCalendario: "#6F8F83",
        modalidadPago: "SOLO_COMISION",
        salarioFijo: 0,
        frecuenciaPago: "MENSUAL",
        tipoComision: "PORCENTAJE",
        comisionGeneral: 0,
        permiteCitas: true,
        estado: "ACTIVO",
        observaciones: "",
    };
}

function obtenerIniciales(nombre: string) {
    const partes = nombre
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    return partes
        .map((parte) => parte[0]?.toUpperCase())
        .join("");
}

function formatearModalidadPago(
    modalidad: ModalidadPago,
) {
    const nombres: Record<ModalidadPago, string> = {
        SALARIO_FIJO: "Salario fijo",
        SOLO_COMISION: "Solo comisión",
        SALARIO_MAS_COMISION: "Salario + comisión",
        SIN_PAGO: "Sin pago",
    };

    return nombres[modalidad];
}

function formatearPagoTrabajador(
    trabajador: TrabajadorListado,
    simboloMoneda: string,
) {
    const salario = `${simboloMoneda} ${Number(
        trabajador.salario_fijo,
    ).toLocaleString("es-NI", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    const comision = formatearComision(
        trabajador,
        simboloMoneda,
    );

    if (trabajador.modalidad_pago === "SALARIO_FIJO") {
        return `${salario} ${formatearFrecuencia(
            trabajador.frecuencia_pago,
        )}`;
    }

    if (trabajador.modalidad_pago === "SOLO_COMISION") {
        return comision;
    }

    if (
        trabajador.modalidad_pago ===
        "SALARIO_MAS_COMISION"
    ) {
        return `${salario} + ${comision}`;
    }

    return "No configurado";
}

function formatearFrecuencia(
    frecuencia: FrecuenciaPago,
) {
    const nombres: Record<FrecuenciaPago, string> = {
        SEMANAL: "semanal",
        QUINCENAL: "quincenal",
        MENSUAL: "mensual",
    };

    return nombres[frecuencia];
}

function formatearComision(
    trabajador: TrabajadorListado,
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
    ).toLocaleString("es-NI", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}