"use client";

import {
    Building2,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Coins,
    CreditCard,
    FileText,
    Landmark,
    LoaderCircle,
    Mail,
    MapPin,
    MessageCircle,
    Pencil,
    Percent,
    Phone,
    Plus,
    Power,
    ReceiptText,
    RotateCcw,
    Save,
    Settings2,
    ShieldCheck,
    Store,
    Trash2,
    WalletCards,
    X,
    XCircle,
} from "lucide-react";
import {
    FormEvent,
    useEffect,
    useMemo,
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

type SeccionId =
    | "GENERAL"
    | "AGENDA"
    | "COBROS"
    | "POS"
    | "RECIBOS";

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

const intervalos = [
    10,
    15,
    20,
    30,
    45,
    60,
];

const secciones: Array<{
    id: SeccionId;
    titulo: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}> = [
        {
            id: "GENERAL",
            titulo: "Información general",
            descripcion: "Datos del salón",
            icono: Building2,
        },
        {
            id: "AGENDA",
            titulo: "Horario y agenda",
            descripcion: "Horas e intervalos",
            icono: CalendarClock,
        },
        {
            id: "COBROS",
            titulo: "Moneda y cobros",
            descripcion: "Crédito y pagos",
            icono: WalletCards,
        },
        {
            id: "POS",
            titulo: "Terminales POS",
            descripcion: "Tarjetas y comisión",
            icono: CreditCard,
        },
        {
            id: "RECIBOS",
            titulo: "Recibos y políticas",
            descripcion: "Mensajes y reglas",
            icono: FileText,
        },
    ];

export default function FormularioConfiguracion({
    configuracionInicial,
    sucursales,
    terminalesIniciales,
}: FormularioConfiguracionProps) {
    const [
        seccionActiva,
        setSeccionActiva,
    ] =
        useState<SeccionId>(
            "GENERAL",
        );

    const [
        formulario,
        setFormulario,
    ] =
        useState<DatosConfiguracion>(
            configuracionInicial,
        );

    const [
        mensaje,
        setMensaje,
    ] =
        useState<MensajeEstado>(
            null,
        );

    const [
        hayCambios,
        setHayCambios,
    ] =
        useState(false);

    const [
        guardando,
        iniciarGuardado,
    ] =
        useTransition();

    const [
        terminales,
        setTerminales,
    ] =
        useState<TerminalPosConfiguracion[]>(
            terminalesIniciales,
        );

    const [
        mostrarFormularioPos,
        setMostrarFormularioPos,
    ] =
        useState(false);

    const [
        terminalEditandoId,
        setTerminalEditandoId,
    ] =
        useState<string | null>(
            null,
        );

    const [
        mensajePos,
        setMensajePos,
    ] =
        useState<MensajeEstado>(
            null,
        );

    const [
        procesandoPos,
        iniciarProcesoPos,
    ] =
        useTransition();

    const [
        formularioPos,
        setFormularioPos,
    ] =
        useState<DatosTerminalPos>({
            nombre: "",
            banco: "",
            sucursalId: "",
            porcentajeComision:
                0,
            estado: "ACTIVO",
        });

    useEffect(() => {
        setHayCambios(
            JSON.stringify(
                formulario,
            ) !==
            JSON.stringify(
                configuracionInicial,
            ),
        );
    }, [
        formulario,
        configuracionInicial,
    ]);

    const resumenHorario =
        useMemo(
            () =>
                `${formatearHora(
                    formulario.horaApertura,
                )} – ${formatearHora(
                    formulario.horaCierre,
                )}`,
            [
                formulario.horaApertura,
                formulario.horaCierre,
            ],
        );

    const terminalesActivas =
        terminales.filter(
            (
                terminal,
            ) =>
                terminal.estado ===
                "ACTIVO",
        ).length;

    function actualizarCampo<
        K extends keyof DatosConfiguracion,
    >(
        campo: K,
        valor: DatosConfiguracion[K],
    ) {
        setFormulario(
            (
                actual,
            ) => ({
                ...actual,
                [campo]:
                    valor,
            }),
        );

        setMensaje(
            null,
        );
    }

    function cambiarMoneda(
        codigo: string,
    ) {
        const moneda =
            monedas.find(
                (
                    elemento,
                ) =>
                    elemento.codigo ===
                    codigo,
            );

        setFormulario(
            (
                actual,
            ) => ({
                ...actual,
                moneda:
                    codigo,
                simboloMoneda:
                    moneda?.simbolo ??
                    actual.simboloMoneda,
            }),
        );

        setMensaje(
            null,
        );
    }

    function restaurarCambios() {
        setFormulario(
            configuracionInicial,
        );

        setMensaje(
            null,
        );
    }

    function enviarFormulario(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setMensaje(
            null,
        );

        iniciarGuardado(
            async () => {
                const resultado =
                    await guardarConfiguracion(
                        formulario,
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
                    setHayCambios(
                        false,
                    );
                }

                window.scrollTo({
                    top:
                        0,
                    behavior:
                        "smooth",
                });
            },
        );
    }

    function limpiarFormularioPos() {
        setFormularioPos({
            nombre: "",
            banco: "",
            sucursalId: "",
            porcentajeComision:
                0,
            estado: "ACTIVO",
        });

        setTerminalEditandoId(
            null,
        );

        setMostrarFormularioPos(
            false,
        );
    }

    function editarTerminalPos(
        terminal: TerminalPosConfiguracion,
    ) {
        setFormularioPos({
            id:
                terminal.id,
            nombre:
                terminal.nombre,
            banco:
                terminal.banco ??
                "",
            sucursalId:
                terminal.sucursal_id ??
                "",
            porcentajeComision:
                Number(
                    terminal.porcentaje_comision,
                ),
            estado:
                terminal.estado,
        });

        setTerminalEditandoId(
            terminal.id,
        );

        setMostrarFormularioPos(
            true,
        );

        setMensajePos(
            null,
        );
    }

    function guardarPos() {
        setMensajePos(
            null,
        );

        iniciarProcesoPos(
            async () => {
                const resultado =
                    await guardarTerminalPos(
                        formularioPos,
                    );

                setMensajePos({
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
                    window.location.reload();
                }
            },
        );
    }

    function cambiarEstadoPos(
        terminal: TerminalPosConfiguracion,
    ) {
        const nuevoEstado =
            terminal.estado ===
                "ACTIVO"
                ? "INACTIVO"
                : "ACTIVO";

        iniciarProcesoPos(
            async () => {
                const resultado =
                    await cambiarEstadoTerminalPos(
                        terminal.id,
                        nuevoEstado,
                    );

                setMensajePos({
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
                    setTerminales(
                        (
                            actuales,
                        ) =>
                            actuales.map(
                                (
                                    item,
                                ) =>
                                    item.id ===
                                        terminal.id
                                        ? {
                                            ...item,
                                            estado:
                                                nuevoEstado,
                                        }
                                        : item,
                            ),
                    );
                }
            },
        );
    }

    function eliminarPos(
        terminal: TerminalPosConfiguracion,
    ) {
        const confirmado =
            window.confirm(
                `¿Deseas eliminar la terminal "${terminal.nombre}"?`,
            );

        if (
            !confirmado
        ) {
            return;
        }

        iniciarProcesoPos(
            async () => {
                const resultado =
                    await eliminarTerminalPos(
                        terminal.id,
                    );

                setMensajePos({
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
                    setTerminales(
                        (
                            actuales,
                        ) =>
                            actuales.filter(
                                (
                                    item,
                                ) =>
                                    item.id !==
                                    terminal.id,
                            ),
                    );
                }
            },
        );
    }

    return (
        <form
            onSubmit={
                enviarFormulario
            }
        >
            <div className="space-y-5">
                {mensaje && (
                    <Mensaje
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

                <section className="salon-panel overflow-hidden border border-border bg-white">
                    <div className="grid xl:grid-cols-[285px_minmax(0,1fr)]">
                        <aside className="border-b border-[#E7ECE9] bg-[#F8FAF8] p-4 lg:border-b-0 lg:border-r">
                            <div className="px-2 pb-4 pt-1">
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8A9690]">
                                    Configuración
                                </p>

                                <h2 className="mt-1 text-lg font-black text-sidebar tracking-tight">
                                    Preferencias del salón
                                </h2>

                                <p className="mt-1 text-xs leading-5 text-[#7A8781]">
                                    Selecciona una categoría para editarla.
                                </p>
                            </div>

                            <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                                {secciones.map(
                                    (
                                        seccion,
                                    ) => (
                                        <BotonSeccion
                                            key={
                                                seccion.id
                                            }
                                            activa={
                                                seccionActiva ===
                                                seccion.id
                                            }
                                            titulo={
                                                seccion.titulo
                                            }
                                            descripcion={
                                                seccion.descripcion
                                            }
                                            icono={
                                                seccion.icono
                                            }
                                            onClick={() =>
                                                setSeccionActiva(
                                                    seccion.id,
                                                )
                                            }
                                        />
                                    ),
                                )}
                            </nav>

                            <div className="mt-4 hidden rounded-2xl border border-[#DFE6E2] bg-white p-4 lg:block">
                                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#8A9690]">
                                    Resumen
                                </p>

                                <div className="mt-3 space-y-3">
                                    <ResumenLateral
                                        titulo="Horario"
                                        valor={
                                            resumenHorario
                                        }
                                    />

                                    <ResumenLateral
                                        titulo="Agenda"
                                        valor={`${formulario.intervaloCitasMinutos} min`}
                                    />

                                    <ResumenLateral
                                        titulo="POS activos"
                                        valor={`${terminalesActivas}`}
                                    />

                                    <ResumenLateral
                                        titulo="Moneda"
                                        valor={
                                            formulario.moneda
                                        }
                                    />
                                </div>
                            </div>
                        </aside>

                        <main className="min-w-0">
                            <CabeceraSeccion
                                seccion={
                                    secciones.find(
                                        (
                                            item,
                                        ) =>
                                            item.id ===
                                            seccionActiva,
                                    ) ??
                                    secciones[0]
                                }
                            />

                            <div className="p-5 sm:p-6 lg:p-7">
                                {seccionActiva ===
                                    "GENERAL" && (
                                        <PanelGeneral
                                            formulario={
                                                formulario
                                            }
                                            actualizarCampo={
                                                actualizarCampo
                                            }
                                        />
                                    )}

                                {seccionActiva ===
                                    "AGENDA" && (
                                        <PanelAgenda
                                            formulario={
                                                formulario
                                            }
                                            actualizarCampo={
                                                actualizarCampo
                                            }
                                        />
                                    )}

                                {seccionActiva ===
                                    "COBROS" && (
                                        <PanelCobros
                                            formulario={
                                                formulario
                                            }
                                            cambiarMoneda={
                                                cambiarMoneda
                                            }
                                            actualizarCampo={
                                                actualizarCampo
                                            }
                                        />
                                    )}

                                {seccionActiva ===
                                    "POS" && (
                                        <PanelPos
                                            sucursales={
                                                sucursales
                                            }
                                            terminales={
                                                terminales
                                            }
                                            mostrarFormularioPos={
                                                mostrarFormularioPos
                                            }
                                            terminalEditandoId={
                                                terminalEditandoId
                                            }
                                            formularioPos={
                                                formularioPos
                                            }
                                            mensajePos={
                                                mensajePos
                                            }
                                            procesandoPos={
                                                procesandoPos
                                            }
                                            setFormularioPos={
                                                setFormularioPos
                                            }
                                            abrirFormulario={() => {
                                                if (
                                                    mostrarFormularioPos
                                                ) {
                                                    limpiarFormularioPos();
                                                } else {
                                                    setMostrarFormularioPos(
                                                        true,
                                                    );
                                                    setMensajePos(
                                                        null,
                                                    );
                                                }
                                            }}
                                            limpiarFormularioPos={
                                                limpiarFormularioPos
                                            }
                                            guardarPos={
                                                guardarPos
                                            }
                                            editarTerminalPos={
                                                editarTerminalPos
                                            }
                                            cambiarEstadoPos={
                                                cambiarEstadoPos
                                            }
                                            eliminarPos={
                                                eliminarPos
                                            }
                                        />
                                    )}

                                {seccionActiva ===
                                    "RECIBOS" && (
                                        <PanelRecibos
                                            formulario={
                                                formulario
                                            }
                                            actualizarCampo={
                                                actualizarCampo
                                            }
                                        />
                                    )}
                            </div>
                        </main>
                    </div>
                </section>

                <div className="sticky bottom-4 z-20 rounded-[22px] border border-border-strong bg-white/95 p-4 shadow-[0_18px_50px_rgba(36,48,44,0.14)] backdrop-blur-xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={[
                                    "flex h-10 w-10 items-center justify-center rounded-2xl",
                                    hayCambios
                                        ? "bg-[#FAF0DC] text-[#A77C2D]"
                                        : "bg-[#E3EEE8] text-[#527865]",
                                ].join(
                                    " ",
                                )}
                            >
                                <ShieldCheck className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-sm font-black text-[#33413B]">
                                    {hayCambios
                                        ? "Tienes cambios pendientes"
                                        : "Todo está guardado"}
                                </p>

                                <p className="mt-0.5 text-xs text-[#7A8781]">
                                    {hayCambios
                                        ? "Guarda antes de salir para aplicar la configuración."
                                        : "La configuración del salón está actualizada."}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={
                                    restaurarCambios
                                }
                                disabled={
                                    !hayCambios ||
                                    guardando
                                }
                                className="salon-action inline-flex items-center justify-center gap-2 border border-border-strong bg-[#F6F8F6] px-4 text-[#52605A] transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Descartar
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    !hayCambios ||
                                    guardando
                                }
                                className="salon-action inline-flex min-w-40 items-center justify-center gap-2 bg-primary px-5 text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                {guardando ? (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}

                                {guardando
                                    ? "Guardando..."
                                    : "Guardar cambios"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}

function PanelGeneral({
    formulario,
    actualizarCampo,
}: {
    formulario: DatosConfiguracion;
    actualizarCampo: <
        K extends keyof DatosConfiguracion,
    >(
        campo: K,
        valor: DatosConfiguracion[K],
    ) => void;
}) {
    return (
        <div className="space-y-6">
            <BloqueIntro
                titulo="Identidad del salón"
                descripcion="Información utilizada en recibos, encabezados y datos generales del sistema."
                icono={
                    Building2
                }
            />

            <div className="grid gap-5 md:grid-cols-2">
                <CampoTexto
                    id="nombreSalon"
                    etiqueta="Nombre del salón"
                    valor={
                        formulario.nombreSalon
                    }
                    placeholder="Ej. Bella Vita Salón"
                    icono={
                        Building2
                    }
                    requerido
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "nombreSalon",
                            valor,
                        )
                    }
                />

                <CampoTexto
                    id="telefono"
                    etiqueta="Teléfono"
                    valor={
                        formulario.telefono
                    }
                    placeholder="Ej. 2222-2222"
                    icono={
                        Phone
                    }
                    tipo="tel"
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "telefono",
                            valor,
                        )
                    }
                />

                <CampoTexto
                    id="whatsapp"
                    etiqueta="WhatsApp"
                    valor={
                        formulario.whatsapp
                    }
                    placeholder="Ej. 8888-8888"
                    icono={
                        MessageCircle
                    }
                    tipo="tel"
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "whatsapp",
                            valor,
                        )
                    }
                />

                <CampoTexto
                    id="correo"
                    etiqueta="Correo electrónico"
                    valor={
                        formulario.correo
                    }
                    placeholder="salon@correo.com"
                    icono={
                        Mail
                    }
                    tipo="email"
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "correo",
                            valor,
                        )
                    }
                />

                <div className="md:col-span-2">
                    <CampoTexto
                        id="direccion"
                        etiqueta="Dirección"
                        valor={
                            formulario.direccion
                        }
                        placeholder="Dirección completa del salón"
                        icono={
                            MapPin
                        }
                        alCambiar={(
                            valor,
                        ) =>
                            actualizarCampo(
                                "direccion",
                                valor,
                            )
                        }
                    />
                </div>
            </div>
        </div>
    );
}

function PanelAgenda({
    formulario,
    actualizarCampo,
}: {
    formulario: DatosConfiguracion;
    actualizarCampo: <
        K extends keyof DatosConfiguracion,
    >(
        campo: K,
        valor: DatosConfiguracion[K],
    ) => void;
}) {
    return (
        <div className="space-y-7">
            <BloqueIntro
                titulo="Horario de operación"
                descripcion="Configura el rango general de atención utilizado por la agenda."
                icono={
                    Clock3
                }
            />

            <div className="grid gap-5 md:grid-cols-2">
                <CampoHora
                    id="horaApertura"
                    etiqueta="Hora de apertura"
                    valor={
                        formulario.horaApertura
                    }
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "horaApertura",
                            valor,
                        )
                    }
                />

                <CampoHora
                    id="horaCierre"
                    etiqueta="Hora de cierre"
                    valor={
                        formulario.horaCierre
                    }
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "horaCierre",
                            valor,
                        )
                    }
                />
            </div>

            <div className="rounded-[24px] border border-[#DFE6E2] bg-[#F8FAF8] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                            División visual
                        </p>

                        <h3 className="mt-1 text-lg font-black text-sidebar tracking-tight">
                            Intervalo de la agenda
                        </h3>

                        <p className="mt-1 max-w-xl text-sm leading-6 text-[#74817B]">
                            Define cada cuánto se muestran espacios de tiempo en la agenda. No cambia la duración de los servicios.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[#D8E2DC] bg-white px-4 py-3 text-center">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#87958D]">
                            Actual
                        </p>

                        <p className="mt-1 text-2xl font-black text-sidebar">
                            {
                                formulario.intervaloCitasMinutos
                            }{" "}
                            min
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    {intervalos.map(
                        (
                            intervalo,
                        ) => {
                            const activo =
                                formulario.intervaloCitasMinutos ===
                                intervalo;

                            return (
                                <button
                                    key={
                                        intervalo
                                    }
                                    type="button"
                                    onClick={() =>
                                        actualizarCampo(
                                            "intervaloCitasMinutos",
                                            intervalo,
                                        )
                                    }
                                    className={[
                                        "rounded-2xl border p-4 text-left transition",
                                        activo
                                            ? "border-[#8FA99D] bg-surface-soft shadow-sm"
                                            : "border-[#DEE5E1] bg-white hover:border-[#B9CBC2]",
                                    ].join(
                                        " ",
                                    )}
                                >
                                    <p
                                        className={[
                                            "text-2xl font-black",
                                            activo
                                                ? "text-primary-strong"
                                                : "text-[#33413B]",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        {
                                            intervalo
                                        }
                                    </p>

                                    <p className="mt-1 text-xs font-bold text-[#7A8781]">
                                        minutos
                                    </p>
                                </button>
                            );
                        },
                    )}
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-white">
                    <div className="border-b border-[#E7ECE9] px-4 py-3">
                        <p className="text-xs font-black text-[#52605A]">
                            Vista previa
                        </p>
                    </div>

                    <div className="flex gap-2 overflow-x-auto p-4">
                        {generarVistaPreviaIntervalo(
                            formulario.intervaloCitasMinutos,
                        ).map(
                            (
                                hora,
                            ) => (
                                <span
                                    key={
                                        hora
                                    }
                                    className="shrink-0 rounded-xl bg-[#F0F4F1] px-3 py-2 text-xs font-bold text-[#52605A]"
                                >
                                    {
                                        hora
                                    }
                                </span>
                            ),
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PanelCobros({
    formulario,
    cambiarMoneda,
    actualizarCampo,
}: {
    formulario: DatosConfiguracion;
    cambiarMoneda: (
        codigo: string,
    ) => void;
    actualizarCampo: <
        K extends keyof DatosConfiguracion,
    >(
        campo: K,
        valor: DatosConfiguracion[K],
    ) => void;
}) {
    return (
        <div className="space-y-7">
            <BloqueIntro
                titulo="Preferencias de cobro"
                descripcion="Configura la moneda y las modalidades permitidas en caja."
                icono={
                    Coins
                }
            />

            <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                    <span className="mb-2 block text-sm font-black text-[#3D4A45]">
                        Moneda principal
                    </span>

                    <div className="relative">
                        <Coins className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />

                        <select
                            value={
                                formulario.moneda
                            }
                            onChange={(
                                event,
                            ) =>
                                cambiarMoneda(
                                    event.target.value,
                                )
                            }
                            className="salon-control w-full appearance-none border border-border-strong bg-white pl-12 pr-10 font-semibold text-foreground outline-none transition focus:border-primary"
                        >
                            {monedas.map(
                                (
                                    moneda,
                                ) => (
                                    <option
                                        key={
                                            moneda.codigo
                                        }
                                        value={
                                            moneda.codigo
                                        }
                                    >
                                        {
                                            moneda.nombre
                                        }{" "}
                                        (
                                        {
                                            moneda.codigo
                                        }
                                        )
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                </label>

                <CampoTexto
                    id="simboloMoneda"
                    etiqueta="Símbolo de moneda"
                    valor={
                        formulario.simboloMoneda
                    }
                    placeholder="C$"
                    icono={
                        Coins
                    }
                    requerido
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "simboloMoneda",
                            valor,
                        )
                    }
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <OpcionInterruptor
                    titulo="Ventas a crédito"
                    descripcion="Permite dejar un saldo pendiente y crear cuentas por cobrar."
                    icono={
                        ReceiptText
                    }
                    activo={
                        formulario.permitirCredito
                    }
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "permitirCredito",
                            valor,
                        )
                    }
                />

                <OpcionInterruptor
                    titulo="Pagos combinados"
                    descripcion="Permite usar más de un método de pago en una misma venta."
                    icono={
                        CreditCard
                    }
                    activo={
                        formulario.permitirPagoCombinado
                    }
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "permitirPagoCombinado",
                            valor,
                        )
                    }
                />
            </div>
        </div>
    );
}

function PanelPos({
    sucursales,
    terminales,
    mostrarFormularioPos,
    terminalEditandoId,
    formularioPos,
    mensajePos,
    procesandoPos,
    setFormularioPos,
    abrirFormulario,
    limpiarFormularioPos,
    guardarPos,
    editarTerminalPos,
    cambiarEstadoPos,
    eliminarPos,
}: {
    sucursales: SucursalConfiguracion[];
    terminales: TerminalPosConfiguracion[];
    mostrarFormularioPos: boolean;
    terminalEditandoId: string | null;
    formularioPos: DatosTerminalPos;
    mensajePos: MensajeEstado;
    procesandoPos: boolean;
    setFormularioPos: React.Dispatch<
        React.SetStateAction<DatosTerminalPos>
    >;
    abrirFormulario: () => void;
    limpiarFormularioPos: () => void;
    guardarPos: () => void;
    editarTerminalPos: (
        terminal: TerminalPosConfiguracion,
    ) => void;
    cambiarEstadoPos: (
        terminal: TerminalPosConfiguracion,
    ) => void;
    eliminarPos: (
        terminal: TerminalPosConfiguracion,
    ) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <BloqueIntro
                    titulo="Terminales POS"
                    descripcion="Administra los dispositivos usados para cobros con tarjeta y su comisión."
                    icono={
                        CreditCard
                    }
                />

                <button
                    type="button"
                    onClick={
                        abrirFormulario
                    }
                    className="salon-action inline-flex shrink-0 items-center justify-center gap-2 bg-sidebar px-5 text-white transition hover:bg-sidebar-hover"
                >
                    {mostrarFormularioPos ? (
                        <X className="h-4 w-4" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}

                    {mostrarFormularioPos
                        ? "Cerrar"
                        : "Agregar POS"}
                </button>
            </div>

            {mensajePos && (
                <Mensaje
                    mensaje={
                        mensajePos
                    }
                />
            )}

            {mostrarFormularioPos && (
                <div className="rounded-[24px] border border-[#D8E2DC] bg-[#F8FAF8] p-5">
                    <div className="mb-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                            {terminalEditandoId
                                ? "Editar terminal"
                                : "Nueva terminal"}
                        </p>

                        <h3 className="mt-1 text-lg font-black text-sidebar tracking-tight">
                            {terminalEditandoId
                                ? "Actualizar POS"
                                : "Configurar POS"}
                        </h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <CampoPosTexto
                            etiqueta="Nombre del POS"
                            valor={
                                formularioPos.nombre
                            }
                            placeholder="Ej. POS BAC"
                            cambiar={(
                                nombre,
                            ) =>
                                setFormularioPos(
                                    (
                                        actual,
                                    ) => ({
                                        ...actual,
                                        nombre,
                                    }),
                                )
                            }
                        />

                        <CampoPosTexto
                            etiqueta="Banco"
                            valor={
                                formularioPos.banco
                            }
                            placeholder="Ej. BAC"
                            cambiar={(
                                banco,
                            ) =>
                                setFormularioPos(
                                    (
                                        actual,
                                    ) => ({
                                        ...actual,
                                        banco,
                                    }),
                                )
                            }
                        />

                        <label className="block">
                            <span className="mb-2 block text-sm font-black text-[#3D4A45]">
                                Sucursal
                            </span>

                            <select
                                value={
                                    formularioPos.sucursalId
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setFormularioPos(
                                        (
                                            actual,
                                        ) => ({
                                            ...actual,
                                            sucursalId:
                                                event.target.value,
                                        }),
                                    )
                                }
                                className="salon-control w-full border border-border-strong bg-white px-4 font-semibold"
                            >
                                <option value="">
                                    Todas las sucursales
                                </option>

                                {sucursales.map(
                                    (
                                        sucursal,
                                    ) => (
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
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-black text-[#3D4A45]">
                                Comisión
                            </span>

                            <div className="relative">
                                <input
                                    type="number"
                                    min={
                                        0
                                    }
                                    max={
                                        100
                                    }
                                    step={
                                        0.01
                                    }
                                    value={
                                        formularioPos.porcentajeComision
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setFormularioPos(
                                            (
                                                actual,
                                            ) => ({
                                                ...actual,
                                                porcentajeComision:
                                                    Number(
                                                        event.target.value,
                                                    ),
                                            }),
                                        )
                                    }
                                    className="salon-control w-full border border-border-strong bg-white px-4 pr-12 text-right"
                                />

                                <Percent className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                            </div>
                        </label>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={
                                limpiarFormularioPos
                            }
                            className="salon-action border border-border-strong bg-white px-4 text-[#52605A]"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            disabled={
                                procesandoPos ||
                                formularioPos.nombre.trim().length <
                                2
                            }
                            onClick={
                                guardarPos
                            }
                            className="salon-action inline-flex items-center gap-2 bg-primary px-5 text-white disabled:opacity-45"
                        >
                            {procesandoPos ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}

                            {terminalEditandoId
                                ? "Actualizar"
                                : "Guardar POS"}
                        </button>
                    </div>
                </div>
            )}

            {terminales.length ===
                0 ? (
                <div className="rounded-[24px] border border-dashed border-border-strong bg-[#FBFCFA] p-10 text-center">
                    <CreditCard className="mx-auto h-9 w-9 text-[#98A19D]" />

                    <p className="mt-3 font-black text-[#33413B]">
                        No hay terminales POS
                    </p>

                    <p className="mt-1 text-sm text-[#76817B]">
                        Agrega la primera para habilitar cobros con tarjeta.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {terminales.map(
                        (
                            terminal,
                        ) => (
                            <article
                                key={
                                    terminal.id
                                }
                                className="salon-panel border border-border bg-white p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                                            <CreditCard className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-black text-foreground">
                                                    {
                                                        terminal.nombre
                                                    }
                                                </p>

                                                <span
                                                    className={[
                                                        "rounded-full px-2.5 py-1 text-[9px] font-black uppercase",
                                                        terminal.estado ===
                                                            "ACTIVO"
                                                            ? "bg-[#E3EEE8] text-[#527865]"
                                                            : "bg-surface-soft text-text-secondary",
                                                    ].join(
                                                        " ",
                                                    )}
                                                >
                                                    {
                                                        terminal.estado
                                                    }
                                                </span>
                                            </div>

                                            <p className="mt-1 text-sm text-text-secondary">
                                                {terminal.banco ??
                                                    "Banco no especificado"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-[#F6F8F6] px-3 py-2 text-right">
                                        <p className="text-xl font-black text-sidebar">
                                            {Number(
                                                terminal.porcentaje_comision,
                                            ).toLocaleString(
                                                "es-NI",
                                                {
                                                    maximumFractionDigits:
                                                        4,
                                                },
                                            )}
                                            %
                                        </p>

                                        <p className="text-xs font-black uppercase text-[#829089]">
                                            Comisión
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F8FAF8] px-3 py-2 text-xs font-semibold text-[#76817B]">
                                    <Store className="h-4 w-4" />

                                    {terminal.sucursales?.nombre ??
                                        "Todas las sucursales"}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            editarTerminalPos(
                                                terminal,
                                            )
                                        }
                                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary-soft px-3 text-xs font-black text-text-secondary"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            procesandoPos
                                        }
                                        onClick={() =>
                                            cambiarEstadoPos(
                                                terminal,
                                            )
                                        }
                                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-surface-soft px-3 text-xs font-black text-[#52605A]"
                                    >
                                        <Power className="h-4 w-4" />

                                        {terminal.estado ===
                                            "ACTIVO"
                                            ? "Desactivar"
                                            : "Activar"}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            procesandoPos
                                        }
                                        onClick={() =>
                                            eliminarPos(
                                                terminal,
                                            )
                                        }
                                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#F8E5E5] px-3 text-xs font-black text-[#A25E5E]"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar
                                    </button>
                                </div>
                            </article>
                        ),
                    )}
                </div>
            )}
        </div>
    );
}

function PanelRecibos({
    formulario,
    actualizarCampo,
}: {
    formulario: DatosConfiguracion;
    actualizarCampo: <
        K extends keyof DatosConfiguracion,
    >(
        campo: K,
        valor: DatosConfiguracion[K],
    ) => void;
}) {
    return (
        <div className="space-y-6">
            <BloqueIntro
                titulo="Comunicación al cliente"
                descripcion="Personaliza los textos que acompañan recibos, confirmaciones y cancelaciones."
                icono={
                    FileText
                }
            />

            <div className="grid gap-5 xl:grid-cols-2">
                <CampoAreaTexto
                    id="mensajeRecibo"
                    etiqueta="Mensaje del recibo"
                    valor={
                        formulario.mensajeRecibo
                    }
                    placeholder="Gracias por preferir nuestros servicios."
                    ayuda="Aparecerá al final de los recibos."
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "mensajeRecibo",
                            valor,
                        )
                    }
                />

                <CampoAreaTexto
                    id="politicaCancelacion"
                    etiqueta="Política de cancelación"
                    valor={
                        formulario.politicaCancelacion
                    }
                    placeholder="Ej. Las citas deben cancelarse con al menos 4 horas de anticipación."
                    ayuda="Podrá mostrarse en confirmaciones y recordatorios."
                    alCambiar={(
                        valor,
                    ) =>
                        actualizarCampo(
                            "politicaCancelacion",
                            valor,
                        )
                    }
                />
            </div>
        </div>
    );
}

function BotonSeccion({
    activa,
    titulo,
    descripcion,
    icono: Icono,
    onClick,
}: {
    activa: boolean;
    titulo: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={
                onClick
            }
            className={[
                "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
                activa
                    ? "border-[#A9BDB3] bg-white shadow-sm"
                    : "border-transparent bg-transparent hover:border-border hover:bg-white/70",
            ].join(
                " ",
            )}
        >
            <span
                className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    activa
                        ? "bg-primary-soft text-primary-strong"
                        : "bg-[#EDEFED] text-[#7B8982]",
                ].join(
                    " ",
                )}
            >
                <Icono className="h-5 w-5" />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-[#33413B]">
                    {
                        titulo
                    }
                </span>

                <span className="mt-0.5 block truncate text-xs text-[#829089]">
                    {
                        descripcion
                    }
                </span>
            </span>

            {activa && (
                <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
            )}
        </button>
    );
}

function CabeceraSeccion({
    seccion,
}: {
    seccion: {
        titulo: string;
        descripcion: string;
        icono: React.ComponentType<{
            className?: string;
        }>;
    };
}) {
    const Icono =
        seccion.icono;

    return (
        <header className="border-b border-[#E7ECE9] bg-white px-5 py-5 sm:px-6 lg:px-7">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sidebar text-white">
                    <Icono className="h-5 w-5" />
                </div>

                <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                        Preferencias
                    </p>

                    <h2 className="mt-0.5 text-xl font-black text-sidebar tracking-tight">
                        {
                            seccion.titulo
                        }
                    </h2>

                    <p className="mt-0.5 text-sm text-[#7A8781]">
                        {
                            seccion.descripcion
                        }
                    </p>
                </div>
            </div>
        </header>
    );
}

function BloqueIntro({
    titulo,
    descripcion,
    icono: Icono,
}: {
    titulo: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-primary-strong">
                <Icono className="h-5 w-5" />
            </div>

            <div>
                <h3 className="font-black text-[#33413B] tracking-tight">
                    {
                        titulo
                    }
                </h3>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-[#74817B]">
                    {
                        descripcion
                    }
                </p>
            </div>
        </div>
    );
}

function ResumenLateral({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#7B8781]">
                {
                    titulo
                }
            </span>

            <strong className="text-xs text-[#33413B]">
                {
                    valor
                }
            </strong>
        </div>
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
    icono: React.ComponentType<{
        className?: string;
    }>;
    tipo?: "text" | "email" | "tel";
    requerido?: boolean;
    alCambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-black text-[#3D4A45]">
                {
                    etiqueta
                }
                {requerido && (
                    <span className="ml-1 text-[#C97878]">
                        *
                    </span>
                )}
            </span>

            <div className="relative">
                <Icono className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />

                <input
                    id={
                        id
                    }
                    type={
                        tipo
                    }
                    value={
                        valor
                    }
                    placeholder={
                        placeholder
                    }
                    required={
                        requerido
                    }
                    onChange={(
                        event,
                    ) =>
                        alCambiar(
                            event.target.value,
                        )
                    }
                    className="salon-control w-full border border-border-strong bg-white pl-12 pr-4 font-semibold text-foreground outline-none transition placeholder:text-[#A2AAA6] focus:border-primary focus:shadow-[0_0_0_4px_rgba(111,143,131,0.10)]"
                />
            </div>
        </label>
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
    alCambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-black text-[#3D4A45]">
                {
                    etiqueta
                }
            </span>

            <div className="relative">
                <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />

                <input
                    id={
                        id
                    }
                    type="time"
                    value={
                        valor
                    }
                    required
                    onChange={(
                        event,
                    ) =>
                        alCambiar(
                            event.target.value,
                        )
                    }
                    className="salon-control w-full border border-border-strong bg-white pl-12 pr-4 text-foreground outline-none transition focus:border-primary"
                />
            </div>
        </label>
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
    alCambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-black text-[#3D4A45]">
                {
                    etiqueta
                }
            </span>

            <textarea
                id={
                    id
                }
                rows={
                    7
                }
                value={
                    valor
                }
                placeholder={
                    placeholder
                }
                onChange={(
                    event,
                ) =>
                    alCambiar(
                        event.target.value,
                    )
                }
                className="salon-control w-full resize-none border border-border-strong bg-white px-4 py-3 leading-6 text-foreground outline-none transition placeholder:text-[#A2AAA6] focus:border-primary"
            />

            <p className="mt-2 text-xs leading-5 text-[#829089]">
                {
                    ayuda
                }
            </p>
        </label>
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
    cambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-black text-[#3D4A45]">
                {
                    etiqueta
                }
            </span>

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
                        event.target.value,
                    )
                }
                className="salon-control w-full border border-border-strong bg-white px-4 font-semibold outline-none transition focus:border-primary"
            />
        </label>
    );
}

function OpcionInterruptor({
    titulo,
    descripcion,
    icono: Icono,
    activo,
    alCambiar,
}: {
    titulo: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    activo: boolean;
    alCambiar: (
        valor: boolean,
    ) => void;
}) {
    return (
        <button
            type="button"
            onClick={() =>
                alCambiar(
                    !activo,
                )
            }
            className={[
                "flex items-start gap-4 rounded-[22px] border p-5 text-left transition",
                activo
                    ? "border-[#AAC0B5] bg-[#F4F8F6]"
                    : "border-border bg-white hover:bg-[#FAFBFA]",
            ].join(
                " ",
            )}
        >
            <span
                className={[
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    activo
                        ? "bg-primary-soft text-primary-strong"
                        : "bg-[#EEF1EF] text-[#7D8983]",
                ].join(
                    " ",
                )}
            >
                <Icono className="h-5 w-5" />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block font-black text-[#33413B]">
                    {
                        titulo
                    }
                </span>

                <span className="mt-1 block text-xs leading-5 text-[#76817B]">
                    {
                        descripcion
                    }
                </span>
            </span>

            <span
                className={[
                    "relative mt-1 h-6 w-11 shrink-0 rounded-full transition",
                    activo
                        ? "bg-primary"
                        : "bg-[#D7DDDA]",
                ].join(
                    " ",
                )}
            >
                <span
                    className={[
                        "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
                        activo
                            ? "left-6"
                            : "left-1",
                    ].join(
                        " ",
                    )}
                />
            </span>
        </button>
    );
}

function Mensaje({
    mensaje,
    cerrar,
}: {
    mensaje: Exclude<
        MensajeEstado,
        null
    >;
    cerrar?: () => void;
}) {
    return (
        <div
            role="alert"
            className={[
                "flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-sm",
                mensaje.tipo ===
                    "EXITO"
                    ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                    : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
            ].join(
                " ",
            )}
        >
            {mensaje.tipo ===
                "EXITO" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <p className="min-w-0 flex-1 text-sm font-bold">
                {
                    mensaje.texto
                }
            </p>

            {cerrar && (
                <button
                    type="button"
                    onClick={
                        cerrar
                    }
                    aria-label="Cerrar mensaje"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

function generarVistaPreviaIntervalo(
    intervalo: number,
) {
    const inicio =
        8 * 60;

    return Array.from(
        {
            length:
                5,
        },
        (
            _,
            indice,
        ) => {
            const total =
                inicio +
                indice *
                intervalo;

            const horas =
                Math.floor(
                    total /
                    60,
                );

            const minutos =
                total %
                60;

            return formatearHora(
                `${String(
                    horas,
                ).padStart(
                    2,
                    "0",
                )}:${String(
                    minutos,
                ).padStart(
                    2,
                    "0",
                )}`,
            );
        },
    );
}

function formatearHora(
    hora: string,
) {
    if (
        !hora
    ) {
        return "—";
    }

    const [
        horaTexto,
        minutoTexto = "00",
    ] =
        hora
            .slice(
                0,
                5,
            )
            .split(
                ":",
            );

    const horaNumero =
        Number(
            horaTexto,
        );

    const periodo =
        horaNumero >=
            12
            ? "p. m."
            : "a. m.";

    const hora12 =
        horaNumero %
        12 ||
        12;

    return `${hora12}:${minutoTexto} ${periodo}`;
}
