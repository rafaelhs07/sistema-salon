"use client";

import {
    Building2,
    CheckCircle2,
    Clock3,
    Coins,
    CreditCard,
    FileText,
    Landmark,
    Percent,
    Plus,
    Pencil,
    Power,
    Store,
    Trash2,
    LoaderCircle,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    ReceiptText,
    Save,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import {
    FormEvent,
    useEffect,
    useState,
    useTransition,
} from "react";

import {
    cambiarEstadoTerminalPos,
    DatosConfiguracion,
    eliminarTerminalPos,
    guardarConfiguracion,
    guardarTerminalPos,
    type DatosTerminalPos,
} from "./actions";

export type SucursalConfiguracion = {
    id: string;
    nombre: string;
    es_principal: boolean;
    estado: string;
};

export type TerminalPosConfiguracion = {
    id: string;
    nombre: string;
    banco: string | null;
    sucursal_id: string | null;
    porcentaje_comision: number;
    estado: "ACTIVO" | "INACTIVO";
    fecha_registro: string;
    sucursales: {
        nombre: string;
    } | null;
};

type FormularioConfiguracionProps = {
    configuracionInicial: DatosConfiguracion;
    sucursales: SucursalConfiguracion[];
    terminalesIniciales: TerminalPosConfiguracion[];
};

type MensajeEstado = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

const monedas = [
    {
        codigo: "NIO",
        nombre: "Córdoba nicaragüense",
        simbolo: "C$",
    },
    {
        codigo: "USD",
        nombre: "Dólar estadounidense",
        simbolo: "$",
    },
    {
        codigo: "CRC",
        nombre: "Colón costarricense",
        simbolo: "₡",
    },
];

export default function FormularioConfiguracion({
    configuracionInicial,
    sucursales,
    terminalesIniciales,
}: FormularioConfiguracionProps) {
    const [formulario, setFormulario] =
        useState<DatosConfiguracion>(configuracionInicial);

    const [mensaje, setMensaje] = useState<MensajeEstado>(null);
    const [hayCambios, setHayCambios] = useState(false);
    const [guardando, iniciarGuardado] = useTransition();

    const [terminales, setTerminales] =
        useState<TerminalPosConfiguracion[]>(
            terminalesIniciales,
        );
    const [mostrarFormularioPos, setMostrarFormularioPos] =
        useState(false);
    const [terminalEditandoId, setTerminalEditandoId] =
        useState<string | null>(null);
    const [mensajePos, setMensajePos] =
        useState<MensajeEstado>(null);
    const [procesandoPos, iniciarProcesoPos] =
        useTransition();
    const [formularioPos, setFormularioPos] =
        useState<DatosTerminalPos>({
            nombre: "",
            banco: "",
            sucursalId: "",
            porcentajeComision: 0,
            estado: "ACTIVO",
        });

    useEffect(() => {
        const cambio =
            JSON.stringify(formulario) !==
            JSON.stringify(configuracionInicial);

        setHayCambios(cambio);
    }, [formulario, configuracionInicial]);

    function actualizarCampo<K extends keyof DatosConfiguracion>(
        campo: K,
        valor: DatosConfiguracion[K],
    ) {
        setFormulario((actual) => ({
            ...actual,
            [campo]: valor,
        }));

        setMensaje(null);
    }

    function cambiarMoneda(codigo: string) {
        const moneda = monedas.find(
            (elemento) => elemento.codigo === codigo,
        );

        setFormulario((actual) => ({
            ...actual,
            moneda: codigo,
            simboloMoneda:
                moneda?.simbolo ?? actual.simboloMoneda,
        }));

        setMensaje(null);
    }

    function restaurarCambios() {
        setFormulario(configuracionInicial);
        setMensaje(null);
    }

    function enviarFormulario(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setMensaje(null);

        iniciarGuardado(async () => {
            const resultado = await guardarConfiguracion(formulario);

            setMensaje({
                tipo: resultado.exito ? "EXITO" : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                setHayCambios(false);
            }

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        });
    }

    function limpiarFormularioPos() {
        setFormularioPos({
            nombre: "",
            banco: "",
            sucursalId: "",
            porcentajeComision: 0,
            estado: "ACTIVO",
        });
        setTerminalEditandoId(null);
        setMostrarFormularioPos(false);
    }

    function editarTerminalPos(
        terminal: TerminalPosConfiguracion,
    ) {
        setFormularioPos({
            id: terminal.id,
            nombre: terminal.nombre,
            banco: terminal.banco ?? "",
            sucursalId:
                terminal.sucursal_id ?? "",
            porcentajeComision: Number(
                terminal.porcentaje_comision,
            ),
            estado: terminal.estado,
        });
        setTerminalEditandoId(terminal.id);
        setMostrarFormularioPos(true);
        setMensajePos(null);
    }

    function guardarPos() {
        setMensajePos(null);

        iniciarProcesoPos(async () => {
            const resultado =
                await guardarTerminalPos(
                    formularioPos,
                );

            setMensajePos({
                tipo: resultado.exito
                    ? "EXITO"
                    : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                window.location.reload();
            }
        });
    }

    function cambiarEstadoPos(
        terminal: TerminalPosConfiguracion,
    ) {
        const nuevoEstado =
            terminal.estado === "ACTIVO"
                ? "INACTIVO"
                : "ACTIVO";

        iniciarProcesoPos(async () => {
            const resultado =
                await cambiarEstadoTerminalPos(
                    terminal.id,
                    nuevoEstado,
                );

            setMensajePos({
                tipo: resultado.exito
                    ? "EXITO"
                    : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                setTerminales((actuales) =>
                    actuales.map((item) =>
                        item.id === terminal.id
                            ? {
                                ...item,
                                estado:
                                    nuevoEstado,
                            }
                            : item,
                    ),
                );
            }
        });
    }

    function eliminarPos(
        terminal: TerminalPosConfiguracion,
    ) {
        const confirmado = window.confirm(
            `¿Deseas eliminar la terminal "${terminal.nombre}"?`,
        );

        if (!confirmado) return;

        iniciarProcesoPos(async () => {
            const resultado =
                await eliminarTerminalPos(
                    terminal.id,
                );

            setMensajePos({
                tipo: resultado.exito
                    ? "EXITO"
                    : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                setTerminales((actuales) =>
                    actuales.filter(
                        (item) =>
                            item.id !==
                            terminal.id,
                    ),
                );
            }
        });
    }

    return (
        <form onSubmit={enviarFormulario}>
            <div className="space-y-6">
                {mensaje && (
                    <div
                        role="alert"
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

                        <div>
                            <p className="font-semibold">
                                {mensaje.tipo === "EXITO"
                                    ? "Cambios guardados"
                                    : "No se pudo guardar"}
                            </p>

                            <p className="mt-1 text-sm leading-6">
                                {mensaje.texto}
                            </p>
                        </div>
                    </div>
                )}

                <SeccionConfiguracion
                    icono={Building2}
                    titulo="Información del salón"
                    descripcion="Datos principales que aparecerán dentro del sistema y en los documentos."
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        <CampoTexto
                            id="nombreSalon"
                            etiqueta="Nombre del salón"
                            valor={formulario.nombreSalon}
                            placeholder="Ej. Bella Vita Salón"
                            icono={Building2}
                            requerido
                            alCambiar={(valor) =>
                                actualizarCampo("nombreSalon", valor)
                            }
                        />

                        <CampoTexto
                            id="telefono"
                            etiqueta="Teléfono"
                            valor={formulario.telefono}
                            placeholder="Ej. 2222-2222"
                            icono={Phone}
                            tipo="tel"
                            alCambiar={(valor) =>
                                actualizarCampo("telefono", valor)
                            }
                        />

                        <CampoTexto
                            id="whatsapp"
                            etiqueta="WhatsApp"
                            valor={formulario.whatsapp}
                            placeholder="Ej. 8888-8888"
                            icono={MessageCircle}
                            tipo="tel"
                            alCambiar={(valor) =>
                                actualizarCampo("whatsapp", valor)
                            }
                        />

                        <CampoTexto
                            id="correo"
                            etiqueta="Correo electrónico"
                            valor={formulario.correo}
                            placeholder="salon@correo.com"
                            icono={Mail}
                            tipo="email"
                            alCambiar={(valor) =>
                                actualizarCampo("correo", valor)
                            }
                        />

                        <div className="md:col-span-2">
                            <CampoTexto
                                id="direccion"
                                etiqueta="Dirección"
                                valor={formulario.direccion}
                                placeholder="Dirección completa del salón"
                                icono={MapPin}
                                alCambiar={(valor) =>
                                    actualizarCampo("direccion", valor)
                                }
                            />
                        </div>
                    </div>
                </SeccionConfiguracion>

                <SeccionConfiguracion
                    icono={Clock3}
                    titulo="Horario y agenda"
                    descripcion="Define el horario general y los intervalos utilizados al organizar las citas."
                >
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        <CampoHora
                            id="horaApertura"
                            etiqueta="Hora de apertura"
                            valor={formulario.horaApertura}
                            alCambiar={(valor) =>
                                actualizarCampo("horaApertura", valor)
                            }
                        />

                        <CampoHora
                            id="horaCierre"
                            etiqueta="Hora de cierre"
                            valor={formulario.horaCierre}
                            alCambiar={(valor) =>
                                actualizarCampo("horaCierre", valor)
                            }
                        />

                        <div>
                            <label
                                htmlFor="intervaloCitas"
                                className="mb-2 block text-sm font-semibold text-[#3D4A45]"
                            >
                                Intervalo de la agenda
                            </label>

                            <div className="relative">
                                <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />

                                <select
                                    id="intervaloCitas"
                                    value={formulario.intervaloCitasMinutos}
                                    onChange={(event) =>
                                        actualizarCampo(
                                            "intervaloCitasMinutos",
                                            Number(event.target.value),
                                        )
                                    }
                                    disabled={guardando}
                                    className="h-12 w-full appearance-none rounded-xl border border-[#D4DAD6] bg-white pl-12 pr-10 font-medium text-[#24302C] outline-none transition focus:border-[#6F8F83] focus:ring-4 focus:ring-[#6F8F83]/15 disabled:cursor-not-allowed disabled:bg-[#F1F3F1]"
                                >
                                    <option value={10}>Cada 10 minutos</option>
                                    <option value={15}>Cada 15 minutos</option>
                                    <option value={20}>Cada 20 minutos</option>
                                    <option value={30}>Cada 30 minutos</option>
                                    <option value={45}>Cada 45 minutos</option>
                                    <option value={60}>Cada 60 minutos</option>
                                </select>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-[#7C8781]">
                                Determina la división visual de las horas en la agenda.
                            </p>
                        </div>
                    </div>
                </SeccionConfiguracion>

                <SeccionConfiguracion
                    icono={Coins}
                    titulo="Moneda y cobros"
                    descripcion="Configura cómo se mostrarán los importes y qué modalidades estarán permitidas."
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="moneda"
                                className="mb-2 block text-sm font-semibold text-[#3D4A45]"
                            >
                                Moneda principal
                            </label>

                            <div className="relative">
                                <Coins className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />

                                <select
                                    id="moneda"
                                    value={formulario.moneda}
                                    onChange={(event) =>
                                        cambiarMoneda(event.target.value)
                                    }
                                    disabled={guardando}
                                    className="h-12 w-full appearance-none rounded-xl border border-[#D4DAD6] bg-white pl-12 pr-10 font-medium text-[#24302C] outline-none transition focus:border-[#6F8F83] focus:ring-4 focus:ring-[#6F8F83]/15 disabled:cursor-not-allowed disabled:bg-[#F1F3F1]"
                                >
                                    {monedas.map((moneda) => (
                                        <option
                                            key={moneda.codigo}
                                            value={moneda.codigo}
                                        >
                                            {moneda.nombre} ({moneda.codigo})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <CampoTexto
                            id="simboloMoneda"
                            etiqueta="Símbolo de moneda"
                            valor={formulario.simboloMoneda}
                            placeholder="C$"
                            icono={Coins}
                            requerido
                            alCambiar={(valor) =>
                                actualizarCampo("simboloMoneda", valor)
                            }
                        />
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <OpcionInterruptor
                            titulo="Permitir ventas a crédito"
                            descripcion="Habilita saldos pendientes y cuentas por cobrar."
                            icono={ReceiptText}
                            activo={formulario.permitirCredito}
                            deshabilitado={guardando}
                            alCambiar={(valor) =>
                                actualizarCampo("permitirCredito", valor)
                            }
                        />

                        <OpcionInterruptor
                            titulo="Permitir pagos combinados"
                            descripcion="Una venta podrá pagarse con más de un método."
                            icono={CreditCard}
                            activo={formulario.permitirPagoCombinado}
                            deshabilitado={guardando}
                            alCambiar={(valor) =>
                                actualizarCampo(
                                    "permitirPagoCombinado",
                                    valor,
                                )
                            }
                        />
                    </div>
                </SeccionConfiguracion>

                <SeccionConfiguracion
                    icono={Landmark}
                    titulo="Terminales POS"
                    descripcion="Administra los POS utilizados para pagos con tarjeta y la comisión aplicada por cada banco."
                >
                    {mensajePos && (
                        <div
                            className={[
                                "mb-5 rounded-2xl border px-4 py-3 text-sm font-semibold",
                                mensajePos.tipo === "EXITO"
                                    ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                                    : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
                            ].join(" ")}
                        >
                            {mensajePos.texto}
                        </div>
                    )}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold text-[#33413B]">
                                POS configurados
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#76817B]">
                                La comisión se calculará automáticamente al registrar un pago con tarjeta.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (mostrarFormularioPos) {
                                    limpiarFormularioPos();
                                } else {
                                    setMostrarFormularioPos(true);
                                    setMensajePos(null);
                                }
                            }}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#6F8F83] px-4 text-sm font-bold text-white transition hover:bg-[#5E7D71]"
                        >
                            <Plus className="h-4 w-4" />
                            {mostrarFormularioPos
                                ? "Cerrar formulario"
                                : "Agregar POS"}
                        </button>
                    </div>

                    {mostrarFormularioPos && (
                        <div className="mt-5 rounded-2xl border border-[#DCE3DF] bg-[#FBFCFA] p-5">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <CampoPosTexto
                                    etiqueta="Nombre del POS"
                                    valor={formularioPos.nombre}
                                    placeholder="Ej. POS BAC"
                                    cambiar={(nombre) =>
                                        setFormularioPos((actual) => ({
                                            ...actual,
                                            nombre,
                                        }))
                                    }
                                />

                                <CampoPosTexto
                                    etiqueta="Banco"
                                    valor={formularioPos.banco}
                                    placeholder="Ej. BAC"
                                    cambiar={(banco) =>
                                        setFormularioPos((actual) => ({
                                            ...actual,
                                            banco,
                                        }))
                                    }
                                />

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                                        Sucursal
                                    </span>
                                    <select
                                        value={formularioPos.sucursalId}
                                        onChange={(event) =>
                                            setFormularioPos((actual) => ({
                                                ...actual,
                                                sucursalId:
                                                    event.target.value,
                                            }))
                                        }
                                        className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4"
                                    >
                                        <option value="">
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
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                                        Comisión
                                    </span>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.01}
                                            value={
                                                formularioPos.porcentajeComision
                                            }
                                            onChange={(event) =>
                                                setFormularioPos((actual) => ({
                                                    ...actual,
                                                    porcentajeComision:
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                }))
                                            }
                                            className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4 pr-12 text-right"
                                        />
                                        <Percent className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                                    </div>
                                </label>
                            </div>

                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={limpiarFormularioPos}
                                    className="h-10 rounded-xl bg-[#EEF2EF] px-4 text-sm font-bold text-[#52605A]"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        procesandoPos ||
                                        formularioPos.nombre.trim().length < 2
                                    }
                                    onClick={guardarPos}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#6F8F83] px-5 text-sm font-bold text-white disabled:opacity-50"
                                >
                                    {procesandoPos ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {terminalEditandoId
                                        ? "Actualizar POS"
                                        : "Guardar POS"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        {terminales.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-8 text-center lg:col-span-2">
                                <CreditCard className="mx-auto h-8 w-8 text-[#98A19D]" />
                                <p className="mt-3 font-semibold text-[#33413B]">
                                    No hay terminales POS
                                </p>
                                <p className="mt-1 text-sm text-[#76817B]">
                                    Agrega la primera para habilitar cobros con tarjeta.
                                </p>
                            </div>
                        ) : (
                            terminales.map((terminal) => (
                                <article
                                    key={terminal.id}
                                    className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DCE7E2] text-[#527064]">
                                                <CreditCard className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-bold text-[#24302C]">
                                                        {terminal.nombre}
                                                    </p>
                                                    <span
                                                        className={[
                                                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                                            terminal.estado ===
                                                                "ACTIVO"
                                                                ? "bg-[#E3EEE8] text-[#527865]"
                                                                : "bg-[#EEF2EF] text-[#6B756F]",
                                                        ].join(" ")}
                                                    >
                                                        {terminal.estado}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-sm text-[#6B756F]">
                                                    {terminal.banco ??
                                                        "Banco no especificado"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xl font-bold text-[#24302C]">
                                                {Number(
                                                    terminal.porcentaje_comision,
                                                ).toLocaleString("es-NI", {
                                                    maximumFractionDigits: 4,
                                                })}
                                                %
                                            </p>
                                            <p className="text-[10px] font-bold uppercase text-[#829089]">
                                                Comisión
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 text-xs text-[#76817B]">
                                        <Store className="h-4 w-4" />
                                        {terminal.sucursales?.nombre ??
                                            "Disponible en todas las sucursales"}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                editarTerminalPos(terminal)
                                            }
                                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#DCE7E2] px-3 text-xs font-bold text-[#43524B]"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            disabled={procesandoPos}
                                            onClick={() =>
                                                cambiarEstadoPos(terminal)
                                            }
                                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#EEF2EF] px-3 text-xs font-bold text-[#52605A]"
                                        >
                                            <Power className="h-4 w-4" />
                                            {terminal.estado === "ACTIVO"
                                                ? "Desactivar"
                                                : "Activar"}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={procesandoPos}
                                            onClick={() =>
                                                eliminarPos(terminal)
                                            }
                                            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#F8E5E5] px-3 text-xs font-bold text-[#A25E5E]"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </SeccionConfiguracion>

                <SeccionConfiguracion
                    icono={FileText}
                    titulo="Recibos y políticas"
                    descripcion="Personaliza el mensaje final de los recibos y las condiciones de cancelación."
                >
                    <div className="grid gap-5 xl:grid-cols-2">
                        <CampoAreaTexto
                            id="mensajeRecibo"
                            etiqueta="Mensaje del recibo"
                            valor={formulario.mensajeRecibo}
                            placeholder="Gracias por preferir nuestros servicios."
                            ayuda="Aparecerá al final de los recibos entregados al cliente."
                            alCambiar={(valor) =>
                                actualizarCampo("mensajeRecibo", valor)
                            }
                        />

                        <CampoAreaTexto
                            id="politicaCancelacion"
                            etiqueta="Política de cancelación"
                            valor={formulario.politicaCancelacion}
                            placeholder="Ej. Las citas deben cancelarse con al menos 4 horas de anticipación."
                            ayuda="Podrá mostrarse en confirmaciones y recordatorios."
                            alCambiar={(valor) =>
                                actualizarCampo(
                                    "politicaCancelacion",
                                    valor,
                                )
                            }
                        />
                    </div>
                </SeccionConfiguracion>

                <div className="sticky bottom-4 z-20 rounded-2xl border border-[#DCE3DF] bg-white/95 p-4 shadow-[0_14px_40px_rgba(36,48,44,0.12)] backdrop-blur-xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div
                                className={[
                                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                    hayCambios
                                        ? "bg-[#FAF0DC] text-[#A77C2D]"
                                        : "bg-[#E3EEE8] text-[#527865]",
                                ].join(" ")}
                            >
                                <ShieldCheck className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#33413B]">
                                    {hayCambios
                                        ? "Tienes cambios sin guardar"
                                        : "La configuración está actualizada"}
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[#76817B]">
                                    Los cambios se aplicarán para todo el salón.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={restaurarCambios}
                                disabled={!hayCambios || guardando}
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#DCE3DF] bg-[#EEF2EF] px-5 text-sm font-bold text-[#43524B] transition hover:bg-[#E3EAE6] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Descartar cambios
                            </button>

                            <button
                                type="submit"
                                disabled={!hayCambios || guardando}
                                className="inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-xl bg-[#6F8F83] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#5E7D71] hover:shadow-md disabled:cursor-not-allowed disabled:bg-[#AAB9B3]"
                            >
                                {guardando ? (
                                    <>
                                        <LoaderCircle className="h-5 w-5 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        Guardar cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}

function SeccionConfiguracion({
    icono: Icono,
    titulo,
    descripcion,
    children,
}: {
    icono: React.ComponentType<{ className?: string }>;
    titulo: string;
    descripcion: string;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <header className="flex items-start gap-4 border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-5 sm:px-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>

                <div>
                    <h2 className="text-lg font-bold tracking-tight text-[#24302C]">
                        {titulo}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-[#6B756F]">
                        {descripcion}
                    </p>
                </div>
            </header>

            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

function CampoTexto({
    id,
    etiqueta,
    valor,
    placeholder,
    icono: Icono,
    tipo = "text",
    requerido = false,
    alCambiar,
}: {
    id: string;
    etiqueta: string;
    valor: string;
    placeholder: string;
    icono: React.ComponentType<{ className?: string }>;
    tipo?: "text" | "email" | "tel";
    requerido?: boolean;
    alCambiar: (valor: string) => void;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-semibold text-[#3D4A45]"
            >
                {etiqueta}
                {requerido && (
                    <span className="ml-1 text-[#C97878]">*</span>
                )}
            </label>

            <div className="relative">
                <Icono className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />

                <input
                    id={id}
                    type={tipo}
                    value={valor}
                    placeholder={placeholder}
                    required={requerido}
                    onChange={(event) => alCambiar(event.target.value)}
                    className="h-12 w-full rounded-xl border border-[#D4DAD6] bg-white pl-12 pr-4 text-[#24302C] outline-none transition placeholder:text-[#A2AAA6] focus:border-[#6F8F83] focus:ring-4 focus:ring-[#6F8F83]/15"
                />
            </div>
        </div>
    );
}

function CampoHora({
    id,
    etiqueta,
    valor,
    alCambiar,
}: {
    id: string;
    etiqueta: string;
    valor: string;
    alCambiar: (valor: string) => void;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-semibold text-[#3D4A45]"
            >
                {etiqueta}
            </label>

            <div className="relative">
                <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />

                <input
                    id={id}
                    type="time"
                    value={valor}
                    required
                    onChange={(event) => alCambiar(event.target.value)}
                    className="h-12 w-full rounded-xl border border-[#D4DAD6] bg-white pl-12 pr-4 font-medium text-[#24302C] outline-none transition focus:border-[#6F8F83] focus:ring-4 focus:ring-[#6F8F83]/15"
                />
            </div>
        </div>
    );
}

function CampoAreaTexto({
    id,
    etiqueta,
    valor,
    placeholder,
    ayuda,
    alCambiar,
}: {
    id: string;
    etiqueta: string;
    valor: string;
    placeholder: string;
    ayuda: string;
    alCambiar: (valor: string) => void;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-semibold text-[#3D4A45]"
            >
                {etiqueta}
            </label>

            <textarea
                id={id}
                value={valor}
                placeholder={placeholder}
                rows={5}
                maxLength={500}
                onChange={(event) => alCambiar(event.target.value)}
                className="w-full resize-y rounded-xl border border-[#D4DAD6] bg-white px-4 py-3 leading-6 text-[#24302C] outline-none transition placeholder:text-[#A2AAA6] focus:border-[#6F8F83] focus:ring-4 focus:ring-[#6F8F83]/15"
            />

            <div className="mt-2 flex items-start justify-between gap-4">
                <p className="text-xs leading-5 text-[#7C8781]">
                    {ayuda}
                </p>

                <span className="shrink-0 text-xs text-[#909A95]">
                    {valor.length}/500
                </span>
            </div>
        </div>
    );
}

function CampoPosTexto({
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
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </span>
            <input
                value={valor}
                placeholder={placeholder}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4 outline-none focus:border-[#6F8F83]"
            />
        </label>
    );
}

function OpcionInterruptor({
    titulo,
    descripcion,
    icono: Icono,
    activo,
    deshabilitado,
    alCambiar,
}: {
    titulo: string;
    descripcion: string;
    icono: React.ComponentType<{ className?: string }>;
    activo: boolean;
    deshabilitado: boolean;
    alCambiar: (valor: boolean) => void;
}) {
    return (
        <label
            className={[
                "flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition",
                activo
                    ? "border-[#C8D9D1] bg-[#F0F5F2]"
                    : "border-[#E3E7E4] bg-[#FBFCFA]",
                deshabilitado
                    ? "cursor-not-allowed opacity-60"
                    : "hover:border-[#B9CEC4]",
            ].join(" ")}
        >
            <div
                className={[
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    activo
                        ? "bg-[#DCE7E2] text-[#527064]"
                        : "bg-[#EEF1EF] text-[#7C8781]",
                ].join(" ")}
            >
                <Icono className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#33413B]">{titulo}</p>

                <p className="mt-1 text-xs leading-5 text-[#76817B]">
                    {descripcion}
                </p>
            </div>

            <input
                type="checkbox"
                checked={activo}
                disabled={deshabilitado}
                onChange={(event) => alCambiar(event.target.checked)}
                className="sr-only"
            />

            <span
                aria-hidden="true"
                className={[
                    "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                    activo ? "bg-[#6F8F83]" : "bg-[#CCD3CF]",
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