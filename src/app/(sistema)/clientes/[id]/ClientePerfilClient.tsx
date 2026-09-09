"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    Camera,
    CheckCircle2,
    ClipboardList,
    FileImage,
    FileText,
    FlaskConical,
    HeartPulse,
    LoaderCircle,
    Mail,
    MapPin,
    MessageCircle,
    NotebookPen,
    Phone,
    Plus,
    Save,
    Search,
    Star,
    Trash2,
    Upload,
    UserRound,
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
    crearFormulaCliente,
    crearNotaCliente,
    eliminarArchivoCliente,
    eliminarFormulaCliente,
    eliminarNotaCliente,
    guardarFichaBelleza,
    subirArchivoCliente,
    type DatosFichaBelleza,
    type DatosFormula,
    type DatosNota,
} from "./actions";

export type ClientePerfil = {
    id: string;
    codigo_cliente: string | null;
    nombre_completo: string;
    telefono: string | null;
    whatsapp: string | null;
    correo: string | null;
    direccion: string | null;
    fecha_nacimiento: string | null;
    genero: string | null;
    contacto_emergencia_nombre: string | null;
    contacto_emergencia_telefono: string | null;
    como_conocio_salon: string | null;
    permite_notificaciones: boolean;
    permite_whatsapp: boolean;
    permite_correo: boolean;
    cliente_frecuente: boolean;
    estado: string;
    observaciones: string | null;
    fecha_registro: string;
    sucursales: {
        nombre: string;
    } | null;
};

export type FichaBelleza = {
    alergias: string | null;
    sensibilidades: string | null;
    tipo_cabello: string | null;
    textura_cabello: string | null;
    estado_cabello: string | null;
    color_natural_cabello: string | null;
    color_actual_cabello: string | null;
    tratamientos_previos: string | null;
    productos_preferidos: string | null;
    productos_no_recomendados: string | null;
    preferencias_generales: string | null;
    restricciones: string | null;
    observaciones_profesionales: string | null;
};

export type FormulaCliente = {
    id: string;
    trabajador_id: string | null;
    nombre: string;
    tipo: string;
    formula: string;
    resultado: string | null;
    observaciones: string | null;
    fecha_aplicacion: string | null;
    estado: string;
    fecha_registro: string;
    trabajadores: {
        nombre_completo: string;
    } | null;
};

export type NotaCliente = {
    id: string;
    titulo: string | null;
    nota: string;
    tipo: string;
    es_importante: boolean;
    fecha_registro: string;
};

export type ArchivoCliente = {
    id: string;
    tipo: string;
    nombre_archivo: string;
    ruta_archivo: string;
    descripcion: string | null;
    fecha_servicio: string | null;
    fecha_registro: string;
    urlFirmada?: string | null;
};

export type TrabajadorSimple = {
    id: string;
    nombre_completo: string;
};

type Pestana =
    | "RESUMEN"
    | "FICHA"
    | "FORMULAS"
    | "NOTAS"
    | "ARCHIVOS";

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

export default function ClientePerfilClient({
    cliente,
    ficha,
    formulas,
    notas,
    archivos,
    trabajadores,
    puedeEditarFicha,
    puedeCrearFormula,
    puedeSubirArchivos,
}: {
    cliente: ClientePerfil;
    ficha: FichaBelleza | null;
    formulas: FormulaCliente[];
    notas: NotaCliente[];
    archivos: ArchivoCliente[];
    trabajadores: TrabajadorSimple[];
    puedeEditarFicha: boolean;
    puedeCrearFormula: boolean;
    puedeSubirArchivos: boolean;
}) {
    const router = useRouter();
    const [pestana, setPestana] =
        useState<Pestana>("RESUMEN");
    const [mensaje, setMensaje] = useState<Mensaje>(null);

    const iniciales = obtenerIniciales(
        cliente.nombre_completo,
    );

    const edad = useMemo(
        () =>
            cliente.fecha_nacimiento
                ? calcularEdad(cliente.fecha_nacimiento)
                : null,
        [cliente.fecha_nacimiento],
    );

    function actualizado(texto: string) {
        setMensaje({
            tipo: "EXITO",
            texto,
        });
        router.refresh();
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-[#C79AA1]/15 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/clientes"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a clientes
                    </Link>

                    <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#DCE7E2] text-xl font-bold text-[#26332F]">
                                {iniciales}
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                        {cliente.nombre_completo}
                                    </h1>

                                    {cliente.cliente_frecuente && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#D8B36A]/20 px-3 py-1 text-xs font-bold text-[#F2D79F]">
                                            <Star className="h-3.5 w-3.5" />
                                            Frecuente
                                        </span>
                                    )}
                                </div>

                                <p className="mt-2 text-sm font-semibold text-[#B9C8C1]">
                                    {cliente.codigo_cliente ?? "Sin código"} ·{" "}
                                    {cliente.sucursales?.nombre ??
                                        "Sin sucursal"}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <ResumenCabecera
                                titulo="Fórmulas"
                                valor={String(formulas.length)}
                            />
                            <ResumenCabecera
                                titulo="Notas"
                                valor={String(notas.length)}
                            />
                            <ResumenCabecera
                                titulo="Archivos"
                                valor={String(archivos.length)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() => setMensaje(null)}
                />
            )}

            <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[#E3E7E4] bg-white p-2 shadow-sm">
                <BotonPestana
                    texto="Resumen"
                    icono={UserRound}
                    activa={pestana === "RESUMEN"}
                    cambiar={() => setPestana("RESUMEN")}
                />
                <BotonPestana
                    texto="Ficha de belleza"
                    icono={HeartPulse}
                    activa={pestana === "FICHA"}
                    cambiar={() => setPestana("FICHA")}
                />
                <BotonPestana
                    texto="Fórmulas"
                    icono={FlaskConical}
                    activa={pestana === "FORMULAS"}
                    cambiar={() => setPestana("FORMULAS")}
                />
                <BotonPestana
                    texto="Notas"
                    icono={NotebookPen}
                    activa={pestana === "NOTAS"}
                    cambiar={() => setPestana("NOTAS")}
                />
                <BotonPestana
                    texto="Archivos"
                    icono={Camera}
                    activa={pestana === "ARCHIVOS"}
                    cambiar={() => setPestana("ARCHIVOS")}
                />
            </nav>

            {pestana === "RESUMEN" && (
                <ResumenCliente cliente={cliente} edad={edad} />
            )}

            {pestana === "FICHA" && (
                <FormularioFicha
                    clienteId={cliente.id}
                    ficha={ficha}
                    puedeEditar={puedeEditarFicha}
                    guardado={actualizado}
                />
            )}

            {pestana === "FORMULAS" && (
                <SeccionFormulas
                    clienteId={cliente.id}
                    formulas={formulas}
                    trabajadores={trabajadores}
                    puedeCrear={puedeCrearFormula}
                    guardado={actualizado}
                />
            )}

            {pestana === "NOTAS" && (
                <SeccionNotas
                    clienteId={cliente.id}
                    notas={notas}
                    guardado={actualizado}
                />
            )}

            {pestana === "ARCHIVOS" && (
                <SeccionArchivos
                    clienteId={cliente.id}
                    archivos={archivos}
                    puedeSubir={puedeSubirArchivos}
                    guardado={actualizado}
                />
            )}
        </div>
    );
}

function ResumenCliente({
    cliente,
    edad,
}: {
    cliente: ClientePerfil;
    edad: number | null;
}) {
    return (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
            <Seccion titulo="Información del cliente" icono={UserRound}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Dato
                        icono={Phone}
                        etiqueta="Teléfono"
                        valor={cliente.telefono ?? "No registrado"}
                    />
                    <Dato
                        icono={MessageCircle}
                        etiqueta="WhatsApp"
                        valor={cliente.whatsapp ?? "No registrado"}
                    />
                    <Dato
                        icono={Mail}
                        etiqueta="Correo"
                        valor={cliente.correo ?? "No registrado"}
                    />
                    <Dato
                        icono={MapPin}
                        etiqueta="Dirección"
                        valor={cliente.direccion ?? "No registrada"}
                    />
                    <Dato
                        icono={CalendarDays}
                        etiqueta="Fecha de nacimiento"
                        valor={
                            cliente.fecha_nacimiento
                                ? `${formatearFecha(
                                    cliente.fecha_nacimiento,
                                )}${edad !== null ? ` · ${edad} años` : ""}`
                                : "No registrada"
                        }
                    />
                    <Dato
                        icono={UserRound}
                        etiqueta="Género"
                        valor={formatearTexto(cliente.genero)}
                    />
                </div>
            </Seccion>

            <Seccion
                titulo="Detalles importantes"
                icono={ClipboardList}
            >
                <div className="space-y-4">
                    <BloqueTexto
                        titulo="Cómo conoció el salón"
                        texto={
                            cliente.como_conocio_salon ??
                            "Sin información"
                        }
                    />
                    <BloqueTexto
                        titulo="Observaciones"
                        texto={
                            cliente.observaciones ??
                            "Sin observaciones"
                        }
                    />
                    <BloqueTexto
                        titulo="Contacto de emergencia"
                        texto={
                            cliente.contacto_emergencia_nombre
                                ? `${cliente.contacto_emergencia_nombre}${cliente.contacto_emergencia_telefono
                                    ? ` · ${cliente.contacto_emergencia_telefono}`
                                    : ""
                                }`
                                : "No registrado"
                        }
                    />
                </div>
            </Seccion>
        </div>
    );
}

function FormularioFicha({
    clienteId,
    ficha,
    puedeEditar,
    guardado,
}: {
    clienteId: string;
    ficha: FichaBelleza | null;
    puedeEditar: boolean;
    guardado: (mensaje: string) => void;
}) {
    const [datos, setDatos] =
        useState<DatosFichaBelleza>({
            alergias: ficha?.alergias ?? "",
            sensibilidades: ficha?.sensibilidades ?? "",
            tipoCabello: ficha?.tipo_cabello ?? "",
            texturaCabello: ficha?.textura_cabello ?? "",
            estadoCabello: ficha?.estado_cabello ?? "",
            colorNaturalCabello:
                ficha?.color_natural_cabello ?? "",
            colorActualCabello:
                ficha?.color_actual_cabello ?? "",
            tratamientosPrevios:
                ficha?.tratamientos_previos ?? "",
            productosPreferidos:
                ficha?.productos_preferidos ?? "",
            productosNoRecomendados:
                ficha?.productos_no_recomendados ?? "",
            preferenciasGenerales:
                ficha?.preferencias_generales ?? "",
            restricciones: ficha?.restricciones ?? "",
            observacionesProfesionales:
                ficha?.observaciones_profesionales ?? "",
        });
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [guardando, iniciarGuardado] = useTransition();

    function actualizar<K extends keyof DatosFichaBelleza>(
        campo: K,
        valor: DatosFichaBelleza[K],
    ) {
        setDatos((actual) => ({
            ...actual,
            [campo]: valor,
        }));
    }

    function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        iniciarGuardado(async () => {
            const resultado = await guardarFichaBelleza(
                clienteId,
                datos,
            );

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

    return (
        <Seccion titulo="Ficha de belleza" icono={HeartPulse}>
            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() => setMensaje(null)}
                />
            )}

            <form onSubmit={enviar}>
                <div className="grid gap-5 md:grid-cols-2">
                    <CampoArea
                        etiqueta="Alergias"
                        valor={datos.alergias}
                        cambiar={(valor) =>
                            actualizar("alergias", valor)
                        }
                    />
                    <CampoArea
                        etiqueta="Sensibilidades"
                        valor={datos.sensibilidades}
                        cambiar={(valor) =>
                            actualizar("sensibilidades", valor)
                        }
                    />
                    <CampoTexto
                        etiqueta="Tipo de cabello"
                        valor={datos.tipoCabello}
                        cambiar={(valor) =>
                            actualizar("tipoCabello", valor)
                        }
                    />
                    <CampoTexto
                        etiqueta="Textura del cabello"
                        valor={datos.texturaCabello}
                        cambiar={(valor) =>
                            actualizar("texturaCabello", valor)
                        }
                    />
                    <CampoTexto
                        etiqueta="Estado actual del cabello"
                        valor={datos.estadoCabello}
                        cambiar={(valor) =>
                            actualizar("estadoCabello", valor)
                        }
                    />
                    <CampoTexto
                        etiqueta="Color natural"
                        valor={datos.colorNaturalCabello}
                        cambiar={(valor) =>
                            actualizar("colorNaturalCabello", valor)
                        }
                    />
                    <CampoTexto
                        etiqueta="Color actual"
                        valor={datos.colorActualCabello}
                        cambiar={(valor) =>
                            actualizar("colorActualCabello", valor)
                        }
                    />
                    <CampoArea
                        etiqueta="Tratamientos previos"
                        valor={datos.tratamientosPrevios}
                        cambiar={(valor) =>
                            actualizar("tratamientosPrevios", valor)
                        }
                    />
                    <CampoArea
                        etiqueta="Productos preferidos"
                        valor={datos.productosPreferidos}
                        cambiar={(valor) =>
                            actualizar("productosPreferidos", valor)
                        }
                    />
                    <CampoArea
                        etiqueta="Productos no recomendados"
                        valor={datos.productosNoRecomendados}
                        cambiar={(valor) =>
                            actualizar(
                                "productosNoRecomendados",
                                valor,
                            )
                        }
                    />
                    <CampoArea
                        etiqueta="Preferencias generales"
                        valor={datos.preferenciasGenerales}
                        cambiar={(valor) =>
                            actualizar(
                                "preferenciasGenerales",
                                valor,
                            )
                        }
                    />
                    <CampoArea
                        etiqueta="Restricciones"
                        valor={datos.restricciones}
                        cambiar={(valor) =>
                            actualizar("restricciones", valor)
                        }
                    />
                    <div className="md:col-span-2">
                        <CampoArea
                            etiqueta="Observaciones profesionales"
                            valor={datos.observacionesProfesionales}
                            cambiar={(valor) =>
                                actualizar(
                                    "observacionesProfesionales",
                                    valor,
                                )
                            }
                        />
                    </div>
                </div>

                {puedeEditar && (
                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6F8F83] px-5 text-sm font-bold text-white disabled:opacity-60"
                        >
                            {guardando ? (
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5" />
                            )}
                            Guardar ficha
                        </button>
                    </div>
                )}
            </form>
        </Seccion>
    );
}

function SeccionFormulas({
    clienteId,
    formulas,
    trabajadores,
    puedeCrear,
    guardado,
}: {
    clienteId: string;
    formulas: FormulaCliente[];
    trabajadores: TrabajadorSimple[];
    puedeCrear: boolean;
    guardado: (mensaje: string) => void;
}) {
    const router = useRouter();
    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] =
        useState("TODOS");
    const [datos, setDatos] = useState<DatosFormula>({
        trabajadorId: "",
        nombre: "",
        tipo: "TINTE",
        formula: "",
        resultado: "",
        observaciones: "",
        fechaAplicacion: new Date()
            .toISOString()
            .slice(0, 10),
    });
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [guardando, iniciarGuardado] = useTransition();
    const [eliminando, iniciarEliminacion] =
        useTransition();

    const formulasFiltradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return formulas.filter((formula) => {
            const coincideBusqueda =
                !texto ||
                formula.nombre.toLowerCase().includes(texto) ||
                formula.formula.toLowerCase().includes(texto) ||
                formula.resultado
                    ?.toLowerCase()
                    .includes(texto) ||
                formula.observaciones
                    ?.toLowerCase()
                    .includes(texto) ||
                formula.trabajadores?.nombre_completo
                    .toLowerCase()
                    .includes(texto);

            const coincideTipo =
                filtroTipo === "TODOS" ||
                formula.tipo === filtroTipo;

            return coincideBusqueda && coincideTipo;
        });
    }, [busqueda, filtroTipo, formulas]);

    function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        iniciarGuardado(async () => {
            const resultado = await crearFormulaCliente(
                clienteId,
                datos,
            );

            if (!resultado.exito) {
                setMensaje({
                    tipo: "ERROR",
                    texto: resultado.mensaje,
                });
                return;
            }

            setMostrarFormulario(false);
            guardado(resultado.mensaje);
        });
    }

    function eliminar(formula: FormulaCliente) {
        const confirmar = window.confirm(
            `¿Deseas eliminar la fórmula "${formula.nombre}"? Esta acción no se puede deshacer.`,
        );

        if (!confirmar) return;

        iniciarEliminacion(async () => {
            const resultado = await eliminarFormulaCliente(
                clienteId,
                formula.id,
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
        <Seccion titulo="Fórmulas y mezclas" icono={FlaskConical}>
            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() => setMensaje(null)}
                />
            )}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(event.target.value)
                            }
                            placeholder="Buscar nombre, fórmula o trabajador..."
                            className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83]"
                        />
                    </div>

                    <select
                        value={filtroTipo}
                        onChange={(event) =>
                            setFiltroTipo(event.target.value)
                        }
                        className="h-10 rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
                    >
                        <option value="TODOS">Todos los tipos</option>
                        <option value="TINTE">Tinte</option>
                        <option value="DECOLORACION">
                            Decoloración
                        </option>
                        <option value="TRATAMIENTO">
                            Tratamiento
                        </option>
                        <option value="MEZCLA">Mezcla</option>
                        <option value="OTRO">Otro</option>
                    </select>
                </div>

                {puedeCrear && (
                    <button
                        type="button"
                        onClick={() =>
                            setMostrarFormulario((valor) => !valor)
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B]"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva fórmula
                    </button>
                )}
            </div>

            {mostrarFormulario && (
                <form
                    onSubmit={enviar}
                    className="mt-5 rounded-2xl border border-[#DCE3DF] bg-[#FBFCFA] p-5"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <CampoTexto
                            etiqueta="Nombre"
                            valor={datos.nombre}
                            cambiar={(valor) =>
                                setDatos((actual) => ({
                                    ...actual,
                                    nombre: valor,
                                }))
                            }
                        />
                        <CampoSelect
                            etiqueta="Tipo"
                            valor={datos.tipo}
                            opciones={[
                                ["TINTE", "Tinte"],
                                ["DECOLORACION", "Decoloración"],
                                ["TRATAMIENTO", "Tratamiento"],
                                ["MEZCLA", "Mezcla"],
                                ["OTRO", "Otro"],
                            ]}
                            cambiar={(valor) =>
                                setDatos((actual) => ({
                                    ...actual,
                                    tipo: valor as DatosFormula["tipo"],
                                }))
                            }
                        />
                        <CampoSelect
                            etiqueta="Trabajador"
                            valor={datos.trabajadorId}
                            opciones={[
                                ["", "Sin trabajador"],
                                ...trabajadores.map((trabajador) => [
                                    trabajador.id,
                                    trabajador.nombre_completo,
                                ]),
                            ]}
                            cambiar={(valor) =>
                                setDatos((actual) => ({
                                    ...actual,
                                    trabajadorId: valor,
                                }))
                            }
                        />
                        <CampoFecha
                            etiqueta="Fecha de aplicación"
                            valor={datos.fechaAplicacion}
                            cambiar={(valor) =>
                                setDatos((actual) => ({
                                    ...actual,
                                    fechaAplicacion: valor,
                                }))
                            }
                        />
                        <div className="md:col-span-2">
                            <CampoArea
                                etiqueta="Fórmula"
                                valor={datos.formula}
                                cambiar={(valor) =>
                                    setDatos((actual) => ({
                                        ...actual,
                                        formula: valor,
                                    }))
                                }
                            />
                        </div>
                        <CampoArea
                            etiqueta="Resultado"
                            valor={datos.resultado}
                            cambiar={(valor) =>
                                setDatos((actual) => ({
                                    ...actual,
                                    resultado: valor,
                                }))
                            }
                        />
                        <CampoArea
                            etiqueta="Observaciones"
                            valor={datos.observaciones}
                            cambiar={(valor) =>
                                setDatos((actual) => ({
                                    ...actual,
                                    observaciones: valor,
                                }))
                            }
                        />
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6F8F83] px-4 text-sm font-bold text-white"
                        >
                            {guardando ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Guardar fórmula
                        </button>
                    </div>
                </form>
            )}

            <p className="mt-4 text-sm text-[#6B756F]">
                {formulasFiltradas.length} fórmula
                {formulasFiltradas.length === 1 ? "" : "s"} encontrada
                {formulasFiltradas.length === 1 ? "" : "s"}.
            </p>

            <div className="mt-4 space-y-4">
                {formulasFiltradas.length === 0 ? (
                    <EstadoVacio texto="No hay fórmulas que coincidan con la búsqueda." />
                ) : (
                    formulasFiltradas.map((formula) => (
                        <article
                            key={formula.id}
                            className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-bold text-[#24302C]">
                                        {formula.nombre}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-[#6F8F83]">
                                        {formatearTexto(formula.tipo)} ·{" "}
                                        {formula.fecha_aplicacion
                                            ? formatearFecha(
                                                formula.fecha_aplicacion,
                                            )
                                            : "Sin fecha"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-[#EEF2EF] px-3 py-1 text-xs font-semibold text-[#52605A]">
                                        {formula.trabajadores
                                            ?.nombre_completo ??
                                            "Sin trabajador"}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => eliminar(formula)}
                                        disabled={eliminando}
                                        title="Eliminar fórmula"
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8E5E5] text-[#A25E5E] transition hover:bg-[#F2DADA] disabled:opacity-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl bg-white p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-[#829089]">
                                    Fórmula
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#33413B]">
                                    {formula.formula}
                                </p>
                            </div>

                            {formula.resultado && (
                                <BloqueTexto
                                    titulo="Resultado"
                                    texto={formula.resultado}
                                />
                            )}

                            {formula.observaciones && (
                                <BloqueTexto
                                    titulo="Observaciones"
                                    texto={formula.observaciones}
                                />
                            )}
                        </article>
                    ))
                )}
            </div>
        </Seccion>
    );
}

function SeccionNotas({
    clienteId,
    notas,
    guardado,
}: {
    clienteId: string;
    notas: NotaCliente[];
    guardado: (mensaje: string) => void;
}) {
    const router = useRouter();
    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] =
        useState("TODOS");
    const [soloImportantes, setSoloImportantes] =
        useState(false);
    const [datos, setDatos] = useState<DatosNota>({
        titulo: "",
        nota: "",
        tipo: "GENERAL",
        esImportante: false,
    });
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [guardando, iniciarGuardado] = useTransition();
    const [eliminando, iniciarEliminacion] =
        useTransition();

    const notasFiltradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return notas.filter((nota) => {
            const coincideBusqueda =
                !texto ||
                nota.titulo?.toLowerCase().includes(texto) ||
                nota.nota.toLowerCase().includes(texto) ||
                nota.tipo.toLowerCase().includes(texto);

            const coincideTipo =
                filtroTipo === "TODOS" ||
                nota.tipo === filtroTipo;

            const coincideImportante =
                !soloImportantes || nota.es_importante;

            return (
                coincideBusqueda &&
                coincideTipo &&
                coincideImportante
            );
        });
    }, [busqueda, filtroTipo, notas, soloImportantes]);

    function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        iniciarGuardado(async () => {
            const resultado = await crearNotaCliente(
                clienteId,
                datos,
            );

            if (!resultado.exito) {
                setMensaje({
                    tipo: "ERROR",
                    texto: resultado.mensaje,
                });
                return;
            }

            setMostrarFormulario(false);
            guardado(resultado.mensaje);
        });
    }

    function eliminar(nota: NotaCliente) {
        const confirmar = window.confirm(
            `¿Deseas eliminar la nota "${nota.titulo || formatearTexto(nota.tipo)
            }"? Esta acción no se puede deshacer.`,
        );

        if (!confirmar) return;

        iniciarEliminacion(async () => {
            const resultado = await eliminarNotaCliente(
                clienteId,
                nota.id,
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
        <Seccion titulo="Notas internas" icono={NotebookPen}>
            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() => setMensaje(null)}
                />
            )}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(event.target.value)
                            }
                            placeholder="Buscar en notas..."
                            className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83]"
                        />
                    </div>

                    <select
                        value={filtroTipo}
                        onChange={(event) =>
                            setFiltroTipo(event.target.value)
                        }
                        className="h-10 rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
                    >
                        <option value="TODOS">Todos los tipos</option>
                        <option value="GENERAL">General</option>
                        <option value="PREFERENCIA">Preferencia</option>
                        <option value="ALERGIA">Alergia</option>
                        <option value="SERVICIO">Servicio</option>
                        <option value="PAGO">Pago</option>
                        <option value="IMPORTANTE">Importante</option>
                        <option value="OTRO">Otro</option>
                    </select>

                    <label className="flex h-10 cursor-pointer items-center justify-between rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm font-semibold text-[#52605A]">
                        Solo importantes
                        <input
                            type="checkbox"
                            checked={soloImportantes}
                            onChange={(event) =>
                                setSoloImportantes(
                                    event.target.checked,
                                )
                            }
                        />
                    </label>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setMostrarFormulario((valor) => !valor)
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B]"
                >
                    <Plus className="h-4 w-4" />
                    Nueva nota
                </button>
            </div>

            {mostrarFormulario && (
                <form
                    onSubmit={enviar}
                    className="mt-5 rounded-2xl border border-[#DCE3DF] bg-[#FBFCFA] p-5"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <CampoTexto
                            etiqueta="Título"
                            valor={datos.titulo}
                            cambiar={(valor) =>
                                setDatos((actual) => ({
                                    ...actual,
                                    titulo: valor,
                                }))
                            }
                        />
                        <CampoSelect
                            etiqueta="Tipo"
                            valor={datos.tipo}
                            opciones={[
                                ["GENERAL", "General"],
                                ["PREFERENCIA", "Preferencia"],
                                ["ALERGIA", "Alergia"],
                                ["SERVICIO", "Servicio"],
                                ["PAGO", "Pago"],
                                ["IMPORTANTE", "Importante"],
                                ["OTRO", "Otro"],
                            ]}
                            cambiar={(valor) =>
                                setDatos((actual) => ({
                                    ...actual,
                                    tipo: valor as DatosNota["tipo"],
                                }))
                            }
                        />
                        <div className="md:col-span-2">
                            <CampoArea
                                etiqueta="Nota"
                                valor={datos.nota}
                                cambiar={(valor) =>
                                    setDatos((actual) => ({
                                        ...actual,
                                        nota: valor,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-[#52605A]">
                        <input
                            type="checkbox"
                            checked={datos.esImportante}
                            onChange={(event) =>
                                setDatos((actual) => ({
                                    ...actual,
                                    esImportante: event.target.checked,
                                }))
                            }
                        />
                        Marcar como importante
                    </label>

                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6F8F83] px-4 text-sm font-bold text-white"
                        >
                            {guardando ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Guardar nota
                        </button>
                    </div>
                </form>
            )}

            <p className="mt-4 text-sm text-[#6B756F]">
                {notasFiltradas.length} nota
                {notasFiltradas.length === 1 ? "" : "s"} encontrada
                {notasFiltradas.length === 1 ? "" : "s"}.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                {notasFiltradas.length === 0 ? (
                    <EstadoVacio texto="No hay notas que coincidan con la búsqueda." />
                ) : (
                    notasFiltradas.map((nota) => (
                        <article
                            key={nota.id}
                            className={[
                                "rounded-2xl border p-5",
                                nota.es_importante
                                    ? "border-[#E6D7B9] bg-[#FAF0DC]"
                                    : "border-[#E3E7E4] bg-[#FBFCFA]",
                            ].join(" ")}
                        >
                            <div className="flex items-start gap-3">
                                {nota.es_importante && (
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#A77C2D]" />
                                )}

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-bold text-[#24302C]">
                                                {nota.titulo ||
                                                    formatearTexto(nota.tipo)}
                                            </p>
                                            <p className="mt-1 text-xs text-[#76817B]">
                                                {formatearFechaHora(
                                                    nota.fecha_registro,
                                                )}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => eliminar(nota)}
                                            disabled={eliminando}
                                            title="Eliminar nota"
                                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8E5E5] text-[#A25E5E] transition hover:bg-[#F2DADA] disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#52605A]">
                                        {nota.nota}
                                    </p>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </Seccion>
    );
}

function SeccionArchivos({
    clienteId,
    archivos,
    puedeSubir,
    guardado,
}: {
    clienteId: string;
    archivos: ArchivoCliente[];
    puedeSubir: boolean;
    guardado: (mensaje: string) => void;
}) {
    const router = useRouter();
    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] =
        useState("TODOS");
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [subiendo, iniciarSubida] = useTransition();
    const [eliminando, iniciarEliminacion] =
        useTransition();

    const archivosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return archivos.filter((archivo) => {
            const coincideBusqueda =
                !texto ||
                archivo.nombre_archivo
                    .toLowerCase()
                    .includes(texto) ||
                archivo.descripcion
                    ?.toLowerCase()
                    .includes(texto) ||
                archivo.tipo.toLowerCase().includes(texto);

            const coincideTipo =
                filtroTipo === "TODOS" ||
                archivo.tipo === filtroTipo;

            return coincideBusqueda && coincideTipo;
        });
    }, [archivos, busqueda, filtroTipo]);

    function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("clienteId", clienteId);

        iniciarSubida(async () => {
            const resultado =
                await subirArchivoCliente(formData);

            if (!resultado.exito) {
                setMensaje({
                    tipo: "ERROR",
                    texto: resultado.mensaje,
                });
                return;
            }

            setMostrarFormulario(false);
            guardado(resultado.mensaje);
        });
    }

    function eliminar(archivo: ArchivoCliente) {
        const confirmar = window.confirm(
            `¿Deseas eliminar "${archivo.nombre_archivo}"? También se eliminará del almacenamiento y no podrá recuperarse.`,
        );

        if (!confirmar) return;

        iniciarEliminacion(async () => {
            const resultado = await eliminarArchivoCliente(
                clienteId,
                archivo.id,
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
        <Seccion titulo="Fotografías y documentos" icono={Camera}>
            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() => setMensaje(null)}
                />
            )}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(event.target.value)
                            }
                            placeholder="Buscar archivo o descripción..."
                            className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83]"
                        />
                    </div>

                    <select
                        value={filtroTipo}
                        onChange={(event) =>
                            setFiltroTipo(event.target.value)
                        }
                        className="h-10 rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
                    >
                        <option value="TODOS">Todos los tipos</option>
                        <option value="ANTES">Antes</option>
                        <option value="DESPUES">Después</option>
                        <option value="REFERENCIA">Referencia</option>
                        <option value="DOCUMENTO">Documento</option>
                        <option value="OTRO">Otro</option>
                    </select>
                </div>

                {puedeSubir && (
                    <button
                        type="button"
                        onClick={() =>
                            setMostrarFormulario((valor) => !valor)
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B]"
                    >
                        <Upload className="h-4 w-4" />
                        Subir archivo
                    </button>
                )}
            </div>

            {mostrarFormulario && (
                <form
                    onSubmit={enviar}
                    className="mt-5 rounded-2xl border border-[#DCE3DF] bg-[#FBFCFA] p-5"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <CampoSelect
                            etiqueta="Tipo"
                            nombre="tipo"
                            valor="OTRO"
                            opciones={[
                                ["ANTES", "Antes"],
                                ["DESPUES", "Después"],
                                ["REFERENCIA", "Referencia"],
                                ["DOCUMENTO", "Documento"],
                                ["OTRO", "Otro"],
                            ]}
                            cambiar={() => { }}
                            noControlado
                        />
                        <CampoFecha
                            etiqueta="Fecha del servicio"
                            nombre="fechaServicio"
                            valor=""
                            cambiar={() => { }}
                            noControlado
                        />
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                                Archivo
                            </label>
                            <input
                                name="archivo"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                required
                                className="block w-full rounded-xl border border-[#D4DAD6] bg-white p-3 text-sm"
                            />
                            <p className="mt-2 text-xs text-[#76817B]">
                                JPG, PNG, WEBP o PDF. Máximo 8 MB.
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                                Descripción
                            </label>
                            <textarea
                                name="descripcion"
                                rows={3}
                                className="w-full rounded-xl border border-[#D4DAD6] bg-white px-4 py-3"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={subiendo}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6F8F83] px-4 text-sm font-bold text-white"
                        >
                            {subiendo ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            Subir archivo
                        </button>
                    </div>
                </form>
            )}

            <p className="mt-4 text-sm text-[#6B756F]">
                {archivosFiltrados.length} archivo
                {archivosFiltrados.length === 1 ? "" : "s"} encontrado
                {archivosFiltrados.length === 1 ? "" : "s"}.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {archivosFiltrados.length === 0 ? (
                    <EstadoVacio texto="No hay archivos que coincidan con la búsqueda." />
                ) : (
                    archivosFiltrados.map((archivo) => (
                        <article
                            key={archivo.id}
                            className="overflow-hidden rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA]"
                        >
                            {archivo.urlFirmada &&
                                archivo.tipo !== "DOCUMENTO" &&
                                !archivo.nombre_archivo
                                    .toLowerCase()
                                    .endsWith(".pdf") ? (
                                <img
                                    src={archivo.urlFirmada}
                                    alt={
                                        archivo.descripcion ??
                                        archivo.nombre_archivo
                                    }
                                    className="h-48 w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-48 items-center justify-center bg-[#EEF2EF]">
                                    <FileText className="h-12 w-12 text-[#829089]" />
                                </div>
                            )}

                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-[#24302C]">
                                            {archivo.nombre_archivo}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-[#6F8F83]">
                                            {formatearTexto(archivo.tipo)}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => eliminar(archivo)}
                                        disabled={eliminando}
                                        title="Eliminar archivo"
                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8E5E5] text-[#A25E5E] transition hover:bg-[#F2DADA] disabled:opacity-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-3 rounded-xl bg-white p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#829089]">
                                        Fecha del servicio
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-[#33413B]">
                                        {archivo.fecha_servicio
                                            ? formatearFecha(
                                                archivo.fecha_servicio,
                                            )
                                            : "Sin fecha registrada"}
                                    </p>
                                </div>

                                {archivo.descripcion && (
                                    <p className="mt-3 text-sm leading-5 text-[#6B756F]">
                                        {archivo.descripcion}
                                    </p>
                                )}

                                <p className="mt-3 text-xs text-[#829089]">
                                    Subido el{" "}
                                    {formatearFechaHora(
                                        archivo.fecha_registro,
                                    )}
                                </p>

                                {archivo.urlFirmada && (
                                    <a
                                        href={archivo.urlFirmada}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#5E7D71]"
                                    >
                                        <FileImage className="h-4 w-4" />
                                        Abrir archivo
                                    </a>
                                )}
                            </div>
                        </article>
                    ))
                )}
            </div>
        </Seccion>
    );
}

function Seccion({
    titulo,
    icono: Icono,
    children,
}: {
    titulo: string;
    icono: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <header className="flex items-center gap-3 border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-[#24302C]">
                    {titulo}
                </h2>
            </header>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

function BotonPestana({
    texto,
    icono: Icono,
    activa,
    cambiar,
}: {
    texto: string;
    icono: React.ComponentType<{ className?: string }>;
    activa: boolean;
    cambiar: () => void;
}) {
    return (
        <button
            type="button"
            onClick={cambiar}
            className={[
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition",
                activa
                    ? "bg-[#DCE7E2] text-[#43524B]"
                    : "text-[#6B756F] hover:bg-[#EEF2EF]",
            ].join(" ")}
        >
            <Icono className="h-4 w-4" />
            {texto}
        </button>
    );
}

function ResumenCabecera({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-center">
            <p className="text-xs text-[#B9C8C1]">{titulo}</p>
            <p className="mt-2 text-xl font-bold">{valor}</p>
        </div>
    );
}

function Dato({
    icono: Icono,
    etiqueta,
    valor,
}: {
    icono: React.ComponentType<{ className?: string }>;
    etiqueta: string;
    valor: string;
}) {
    return (
        <div className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4">
            <div className="flex items-center gap-2 text-[#6F8F83]">
                <Icono className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-wide">
                    {etiqueta}
                </p>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function BloqueTexto({
    titulo,
    texto,
}: {
    titulo: string;
    texto: string;
}) {
    return (
        <div className="mt-4 rounded-xl bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#829089]">
                {titulo}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#52605A]">
                {texto}
            </p>
        </div>
    );
}

function CampoTexto({
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
                value={valor}
                onChange={(event) => cambiar(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4 outline-none focus:border-[#6F8F83]"
            />
        </div>
    );
}

function CampoArea({
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
            <textarea
                rows={4}
                value={valor}
                onChange={(event) => cambiar(event.target.value)}
                className="w-full rounded-xl border border-[#D4DAD6] bg-white px-4 py-3 outline-none focus:border-[#6F8F83]"
            />
        </div>
    );
}

function CampoSelect({
    etiqueta,
    valor,
    opciones,
    cambiar,
    nombre,
    noControlado = false,
}: {
    etiqueta: string;
    valor: string;
    opciones: string[][];
    cambiar: (valor: string) => void;
    nombre?: string;
    noControlado?: boolean;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </label>
            <select
                name={nombre}
                {...(noControlado
                    ? { defaultValue: valor }
                    : {
                        value: valor,
                        onChange: (event) =>
                            cambiar(event.target.value),
                    })}
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4"
            >
                {opciones.map(([opcionValor, texto]) => (
                    <option
                        key={`${opcionValor}-${texto}`}
                        value={opcionValor}
                    >
                        {texto}
                    </option>
                ))}
            </select>
        </div>
    );
}

function CampoFecha({
    etiqueta,
    valor,
    cambiar,
    nombre,
    noControlado = false,
}: {
    etiqueta: string;
    valor: string;
    cambiar: (valor: string) => void;
    nombre?: string;
    noControlado?: boolean;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </label>
            <input
                name={nombre}
                type="date"
                {...(noControlado
                    ? { defaultValue: valor }
                    : {
                        value: valor,
                        onChange: (event) =>
                            cambiar(event.target.value),
                    })}
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4"
            />
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
                "mb-5 flex items-start gap-3 rounded-2xl border px-4 py-4",
                mensaje.tipo === "EXITO"
                    ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                    : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
            ].join(" ")}
        >
            {mensaje.tipo === "EXITO" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
                <XCircle className="h-5 w-5 shrink-0" />
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

function EstadoVacio({ texto }: { texto: string }) {
    return (
        <div className="col-span-full rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-8 text-center">
            <p className="text-sm text-[#6B756F]">{texto}</p>
        </div>
    );
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

function calcularEdad(fecha: string) {
    const nacimiento = new Date(`${fecha}T00:00:00`);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMes =
        hoy.getMonth() - nacimiento.getMonth();

    if (
        diferenciaMes < 0 ||
        (diferenciaMes === 0 &&
            hoy.getDate() < nacimiento.getDate())
    ) {
        edad -= 1;
    }

    return edad;
}

function formatearFecha(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(`${fecha}T00:00:00`));
}

function formatearFechaHora(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(fecha));
}

function formatearTexto(valor: string | null) {
    if (!valor) return "No especificado";

    return valor
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letra) => letra.toUpperCase());
}