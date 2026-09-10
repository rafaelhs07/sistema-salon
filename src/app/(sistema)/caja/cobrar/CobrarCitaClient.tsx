"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    CalendarDays,
    Check,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    CreditCard,
    Landmark,
    LoaderCircle,
    ArrowRightLeft,
    MessageSquareText,
    Plus,
    ReceiptText,
    Search,
    Store,
    Trash2,
    UserRound,
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
    useRouter,
} from "next/navigation";

import {
    cobrarCita,
    type DatosCobroCita,
    type MetodoPagoVenta,
    type PagoVentaEntrada,
} from "./actions";

export type CajaDisponible = {
    id: string;
    sucursal_id: string;
    fecha_apertura: string;
    monto_inicial: number;
    estado: string;
    sucursales: {
        nombre: string;
    } | null;
};

export type TerminalPosDisponible = {
    id: string;
    nombre: string;
    banco: string | null;
    sucursal_id: string | null;
    porcentaje_comision: number;
    estado: string;
};

export type CitaCobrable = {
    id: string;
    codigo_cita: string | null;
    cliente_id: string;
    sucursal_id: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    subtotal: number;
    descuento: number;
    total: number;
    estado: string;
    clientes: {
        nombre_completo: string;
        codigo_cliente: string | null;
        telefono: string | null;
        whatsapp: string | null;
    } | null;
    sucursales: {
        nombre: string;
    } | null;
    cita_servicios: {
        id: string;
        nombre_servicio: string;
        precio_unitario: number;
        descuento: number;
        total: number;
        duracion_minutos: number;
        hora_inicio: string;
        hora_fin: string;
        estado: string;
        trabajadores: {
            nombre_completo: string;
        } | null;
    }[];
};

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

export default function CobrarCitaClient({
    cajas,
    citas,
    terminales,
    permitirCredito,
    permitirPagoCombinado,
    citaInicialId,
}: {
    cajas: CajaDisponible[];
    citas: CitaCobrable[];
    terminales: TerminalPosDisponible[];
    permitirCredito: boolean;
    permitirPagoCombinado: boolean;
    citaInicialId: string;
}) {
    const router =
        useRouter();

    const [
        busqueda,
        setBusqueda,
    ] =
        useState("");

    const [
        citaId,
        setCitaId,
    ] =
        useState("");

    const [
        mensaje,
        setMensaje,
    ] =
        useState<Mensaje>(
            null,
        );

    const [
        guardando,
        iniciarGuardado,
    ] =
        useTransition();

    const [
        formulario,
        setFormulario,
    ] =
        useState<DatosCobroCita>({
            citaId: "",
            cajaSesionId:
                cajas.length ===
                    1
                    ? cajas[0].id
                    : "",
            descuento: 0,
            notas: "",
            pagos: [],
        });

    const citaSeleccionada =
        citas.find(
            (
                cita,
            ) =>
                cita.id ===
                citaId,
        );

    useEffect(() => {
        if (
            !citaInicialId
        ) {
            return;
        }

        const citaInicial =
            citas.find(
                (
                    cita,
                ) =>
                    cita.id ===
                    citaInicialId,
            );

        if (
            citaInicial
        ) {
            seleccionarCita(
                citaInicial,
            );
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        citaInicialId,
    ]);

    const citasFiltradas =
        useMemo(
            () => {
                const texto =
                    busqueda
                        .trim()
                        .toLowerCase();

                return citas.filter(
                    (
                        cita,
                    ) => {
                        const cajaDisponible =
                            cajas.some(
                                (
                                    caja,
                                ) =>
                                    caja.sucursal_id ===
                                    cita.sucursal_id,
                            );

                        if (
                            !cajaDisponible
                        ) {
                            return false;
                        }

                        return (
                            !texto ||
                            cita.codigo_cita
                                ?.toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            cita.clientes?.nombre_completo
                                .toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            cita.clientes?.codigo_cliente
                                ?.toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            cita.clientes?.telefono
                                ?.toLowerCase()
                                .includes(
                                    texto,
                                ) ||
                            cita.clientes?.whatsapp
                                ?.toLowerCase()
                                .includes(
                                    texto,
                                )
                        );
                    },
                );
            },
            [
                busqueda,
                cajas,
                citas,
            ],
        );

    const subtotal =
        useMemo(
            () => {
                if (
                    !citaSeleccionada
                ) {
                    return 0;
                }

                const totalServicios =
                    citaSeleccionada.cita_servicios
                        .filter(
                            (
                                servicio,
                            ) =>
                                servicio.estado !==
                                "CANCELADO",
                        )
                        .reduce(
                            (
                                total,
                                servicio,
                            ) =>
                                total +
                                Number(
                                    servicio.total,
                                ),
                            0,
                        );

                return totalServicios >
                    0
                    ? totalServicios
                    : Number(
                        citaSeleccionada.total,
                    );
            },
            [
                citaSeleccionada,
            ],
        );

    const total =
        Math.max(
            0,
            subtotal -
            formulario.descuento,
        );

    const totalPagos =
        formulario.pagos.reduce(
            (
                suma,
                pago,
            ) =>
                suma +
                Number(
                    pago.monto ||
                    0,
                ),
            0,
        );

    const saldo =
        Math.max(
            0,
            total -
            totalPagos,
        );

    const comisionTotal =
        formulario.pagos.reduce(
            (
                suma,
                pago,
            ) => {
                if (
                    pago.metodoPago !==
                    "TARJETA"
                ) {
                    return suma;
                }

                const terminal =
                    terminales.find(
                        (
                            item,
                        ) =>
                            item.id ===
                            pago.terminalPosId,
                    );

                return (
                    suma +
                    Number(
                        pago.monto ||
                        0,
                    ) *
                    (
                        Number(
                            terminal?.porcentaje_comision ??
                            0,
                        ) /
                        100
                    )
                );
            },
            0,
        );

    const cajaSeleccionada =
        cajas.find(
            (
                caja,
            ) =>
                caja.id ===
                formulario.cajaSesionId,
        ) ??
        null;

    function seleccionarCita(
        cita: CitaCobrable,
    ) {
        const caja =
            cajas.find(
                (
                    item,
                ) =>
                    item.sucursal_id ===
                    cita.sucursal_id,
            ) ??
            null;

        setCitaId(
            cita.id,
        );

        setFormulario({
            citaId:
                cita.id,
            cajaSesionId:
                caja?.id ??
                "",
            descuento:
                0,
            notas:
                "",
            pagos:
                [],
        });

        setMensaje(
            null,
        );
    }

    function actualizar<
        K extends keyof DatosCobroCita,
    >(
        campo: K,
        valor: DatosCobroCita[K],
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

    function agregarPago() {
        if (
            !permitirPagoCombinado &&
            formulario.pagos.length >
            0
        ) {
            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    "Los pagos combinados están desactivados en Configuración.",
            });

            return;
        }

        const montoSugerido =
            saldo;

        actualizar(
            "pagos",
            [
                ...formulario.pagos,
                {
                    metodoPago:
                        "EFECTIVO",
                    monto:
                        montoSugerido,
                    montoRecibido:
                        montoSugerido,
                    terminalPosId:
                        null,
                    referencia:
                        "",
                    banco:
                        "",
                    observaciones:
                        "",
                },
            ],
        );
    }

    function actualizarPago(
        indice: number,
        cambios: Partial<PagoVentaEntrada>,
    ) {
        actualizar(
            "pagos",
            formulario.pagos.map(
                (
                    pago,
                    posicion,
                ) =>
                    posicion ===
                        indice
                        ? {
                            ...pago,
                            ...cambios,
                        }
                        : pago,
            ),
        );
    }

    function eliminarPago(
        indice: number,
    ) {
        actualizar(
            "pagos",
            formulario.pagos.filter(
                (
                    _,
                    posicion,
                ) =>
                    posicion !==
                    indice,
            ),
        );
    }

    function enviar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            !citaSeleccionada
        ) {
            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    "Selecciona una cita finalizada.",
            });

            return;
        }

        if (
            formulario.descuento >
            subtotal
        ) {
            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    "El descuento no puede superar el subtotal.",
            });

            return;
        }

        if (
            totalPagos >
            total
        ) {
            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    "Los pagos aplicados no pueden superar el total.",
            });

            return;
        }

        if (
            !permitirCredito &&
            saldo >
            0
        ) {
            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    "Las ventas a crédito están desactivadas. Debes completar el pago.",
            });

            return;
        }

        if (
            formulario.pagos.some(
                (
                    pago,
                ) =>
                    pago.metodoPago ===
                    "TARJETA" &&
                    !pago.terminalPosId,
            )
        ) {
            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    "Selecciona la terminal POS en todos los pagos con tarjeta.",
            });

            return;
        }

        iniciarGuardado(
            async () => {
                const resultado =
                    await cobrarCita(
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
                    if (
                        resultado.ventaId
                    ) {
                        router.push(
                            `/caja/recibos/${resultado.ventaId}`,
                        );
                    } else {
                        router.push(
                            "/caja",
                        );
                    }

                    router.refresh();
                }
            },
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <section className="relative overflow-hidden rounded-[34px] bg-[#26332F] p-6 text-white shadow-[0_20px_60px_rgba(36,48,44,0.18)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#6F8F83]/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#C79AA1]/12 blur-3xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Link
                            href="/caja"
                            className="inline-flex items-center gap-2 text-sm font-bold text-[#C7D4CE] transition hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a Caja
                        </Link>

                        <div className="mt-6 flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <ReceiptText className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#AFC2B9]">
                                    Punto de cobro
                                </p>

                                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                    Cobrar cita
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CFD9D4] sm:text-base">
                                    Selecciona la cita, aplica pagos y confirma el cobro desde una sola pantalla.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
                        <HeroDato
                            titulo="Citas"
                            valor={String(
                                citasFiltradas.length,
                            )}
                            icono={
                                CalendarDays
                            }
                        />

                        <HeroDato
                            titulo="Caja"
                            valor={
                                cajaSeleccionada
                                    ?.sucursales
                                    ?.nombre ??
                                "—"
                            }
                            icono={
                                Store
                            }
                        />

                        <HeroDato
                            titulo="Pagado"
                            valor={formatearDinero(
                                totalPagos,
                            )}
                            icono={
                                CheckCircle2
                            }
                        />

                        <HeroDato
                            titulo="Saldo"
                            valor={formatearDinero(
                                saldo,
                            )}
                            icono={
                                CircleDollarSign
                            }
                        />
                    </div>
                </div>
            </section>

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

            {cajas.length ===
                0 ? (
                <AvisoSinCaja />
            ) : (
                <form
                    onSubmit={
                        enviar
                    }
                >
                    <div className="grid gap-6 2xl:grid-cols-[350px_minmax(0,1fr)_380px]">
                        <section className="overflow-hidden rounded-[28px] border border-[#E1E7E3] bg-white shadow-[0_10px_28px_rgba(36,48,44,0.06)]">
                            <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                                            Paso 1
                                        </p>

                                        <h2 className="mt-1 font-black text-[#24302C]">
                                            Elegir cita
                                        </h2>
                                    </div>

                                    <span className="rounded-full bg-[#EAF1ED] px-3 py-1 text-[10px] font-black text-[#5D796C]">
                                        {
                                            citasFiltradas.length
                                        } disponibles
                                    </span>
                                </div>

                                <div className="relative mt-4">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                                    <input
                                        value={
                                            busqueda
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setBusqueda(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Cliente, código o teléfono..."
                                        className="h-11 w-full rounded-2xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#6F8F83] focus:shadow-[0_0_0_4px_rgba(111,143,131,0.08)]"
                                    />
                                </div>
                            </header>

                            <div className="max-h-[720px] overflow-y-auto p-3">
                                {citasFiltradas.length ===
                                    0 ? (
                                    <div className="p-9 text-center">
                                        <CalendarDays className="mx-auto h-8 w-8 text-[#98A19D]" />

                                        <p className="mt-3 text-sm font-bold text-[#52605A]">
                                            No hay citas disponibles.
                                        </p>
                                    </div>
                                ) : (
                                    citasFiltradas.map(
                                        (
                                            cita,
                                        ) => {
                                            const activa =
                                                citaId ===
                                                cita.id;

                                            return (
                                                <button
                                                    key={
                                                        cita.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        seleccionarCita(
                                                            cita,
                                                        )
                                                    }
                                                    className={[
                                                        "mb-2 w-full rounded-2xl border p-4 text-left transition",
                                                        activa
                                                            ? "border-[#90AD9F] bg-[#EAF2EE] shadow-sm"
                                                            : "border-[#E3E7E4] bg-white hover:border-[#C9D6D0] hover:bg-[#F7F9F7]",
                                                    ].join(
                                                        " ",
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate font-black text-[#24302C]">
                                                                {cita
                                                                    .clientes
                                                                    ?.nombre_completo ??
                                                                    "Cliente"}
                                                            </p>

                                                            <p className="mt-1 text-xs font-bold text-[#6F8F83]">
                                                                {cita.codigo_cita ??
                                                                    "Sin código"}
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={[
                                                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                                                                activa
                                                                    ? "bg-[#6F8F83] text-white"
                                                                    : "bg-[#EEF3F0] text-[#6F8F83]",
                                                            ].join(
                                                                " ",
                                                            )}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 flex items-center gap-3 text-xs text-[#6B756F]">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <CalendarDays className="h-3.5 w-3.5" />
                                                            {formatearFecha(
                                                                cita.fecha,
                                                            )}
                                                        </span>

                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Clock3 className="h-3.5 w-3.5" />
                                                            {formatearHora(
                                                                cita.hora_inicio,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 flex items-end justify-between gap-3">
                                                        <p className="text-xs text-[#76817B]">
                                                            {cita
                                                                .sucursales
                                                                ?.nombre ??
                                                                "Sin sucursal"}
                                                        </p>

                                                        <p className="font-black text-[#33413B]">
                                                            {formatearDinero(
                                                                cita.total,
                                                            )}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        },
                                    )
                                )}
                            </div>
                        </section>

                        <div className="min-w-0 space-y-6">
                            {!citaSeleccionada ? (
                                <EstadoSeleccion />
                            ) : (
                                <>
                                    <Seccion
                                        paso="Paso 2"
                                        titulo="Detalle de la cita"
                                        icono={
                                            UserRound
                                        }
                                    >
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            <Dato
                                                titulo="Cliente"
                                                valor={
                                                    citaSeleccionada
                                                        .clientes
                                                        ?.nombre_completo ??
                                                    "Sin cliente"
                                                }
                                            />

                                            <Dato
                                                titulo="Código"
                                                valor={
                                                    citaSeleccionada.codigo_cita ??
                                                    "Sin código"
                                                }
                                            />

                                            <Dato
                                                titulo="Fecha"
                                                valor={formatearFecha(
                                                    citaSeleccionada.fecha,
                                                )}
                                            />

                                            <Dato
                                                titulo="Horario"
                                                valor={`${formatearHora(
                                                    citaSeleccionada.hora_inicio,
                                                )} – ${formatearHora(
                                                    citaSeleccionada.hora_fin,
                                                )}`}
                                            />

                                            <Dato
                                                titulo="Sucursal"
                                                valor={
                                                    citaSeleccionada
                                                        .sucursales
                                                        ?.nombre ??
                                                    "Sin sucursal"
                                                }
                                            />

                                            <Dato
                                                titulo="Caja"
                                                valor={
                                                    cajaSeleccionada
                                                        ?.sucursales
                                                        ?.nombre ??
                                                    "Sin caja"
                                                }
                                            />
                                        </div>

                                        <div className="mt-5 space-y-3">
                                            {citaSeleccionada.cita_servicios
                                                .filter(
                                                    (
                                                        servicio,
                                                    ) =>
                                                        servicio.estado !==
                                                        "CANCELADO",
                                                )
                                                .map(
                                                    (
                                                        servicio,
                                                    ) => (
                                                        <article
                                                            key={
                                                                servicio.id
                                                            }
                                                            className="flex flex-col gap-3 rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4 sm:flex-row sm:items-center sm:justify-between"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="font-black text-[#24302C]">
                                                                    {
                                                                        servicio.nombre_servicio
                                                                    }
                                                                </p>

                                                                <p className="mt-1 text-sm text-[#6B756F]">
                                                                    {servicio
                                                                        .trabajadores
                                                                        ?.nombre_completo ??
                                                                        "Sin trabajador"}
                                                                </p>

                                                                <p className="mt-1 text-xs text-[#89958F]">
                                                                    {formatearHora(
                                                                        servicio.hora_inicio,
                                                                    )}{" "}
                                                                    –{" "}
                                                                    {formatearHora(
                                                                        servicio.hora_fin,
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <strong className="shrink-0 text-lg text-[#33413B]">
                                                                {formatearDinero(
                                                                    servicio.total,
                                                                )}
                                                            </strong>
                                                        </article>
                                                    ),
                                                )}
                                        </div>
                                    </Seccion>

                                    <Seccion
                                        paso="Paso 3"
                                        titulo={
                                            formulario.pagos.length > 1
                                                ? "Pago combinado"
                                                : "Método de pago"
                                        }
                                        icono={CreditCard}
                                    >
                                        <div className="rounded-[24px] border border-[#DCE5E0] bg-[#F7FAF8] p-4">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#E4EEE9] text-[#5D796C]">
                                                            <ArrowRightLeft className="h-4 w-4" />
                                                        </span>

                                                        <div>
                                                            <p className="text-sm font-black text-[#34423C]">
                                                                {formulario.pagos.length > 1
                                                                    ? "Pago combinado activo"
                                                                    : "Distribución del pago"}
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-[#7D8983]">
                                                                {permitirPagoCombinado
                                                                    ? "Puedes usar varios métodos en una sola venta."
                                                                    : "Solo se permite un método de pago."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-[#7B8781]">
                                                        Pagado
                                                    </p>

                                                    <p className="text-xl font-black text-[#26332F]">
                                                        {formatearDinero(totalPagos)}
                                                        <span className="ml-1 text-sm font-bold text-[#8A9690]">
                                                            / {formatearDinero(total)}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#E5ECE8]">
                                                <div
                                                    className="h-full rounded-full bg-[#6F8F83] transition-all duration-300"
                                                    style={{
                                                        width: `${total > 0
                                                            ? Math.min(100, (totalPagos / total) * 100)
                                                            : 0}%`,
                                                    }}
                                                />
                                            </div>

                                            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                                                <span className="font-bold text-[#718078]">
                                                    {total > 0
                                                        ? `${Math.min(100, Math.round((totalPagos / total) * 100))}% cubierto`
                                                        : "0% cubierto"}
                                                </span>

                                                <span
                                                    className={[
                                                        "font-black",
                                                        saldo > 0
                                                            ? "text-[#9A6267]"
                                                            : "text-[#557866]",
                                                    ].join(" ")}
                                                >
                                                    {saldo > 0
                                                        ? `Falta ${formatearDinero(saldo)}`
                                                        : "Pago completo"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.13em] text-[#87958D]">
                                                Agregar método
                                            </p>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                {[
                                                    {
                                                        metodo: "EFECTIVO" as MetodoPagoVenta,
                                                        titulo: "Efectivo",
                                                        icono: Banknote,
                                                    },
                                                    {
                                                        metodo: "TARJETA" as MetodoPagoVenta,
                                                        titulo: "Tarjeta",
                                                        icono: CreditCard,
                                                    },
                                                    {
                                                        metodo: "TRANSFERENCIA" as MetodoPagoVenta,
                                                        titulo: "Transferencia",
                                                        icono: Landmark,
                                                    },
                                                ].map((opcion) => {
                                                    const Icono = opcion.icono;

                                                    const deshabilitado =
                                                        saldo <= 0 ||
                                                        (!permitirPagoCombinado &&
                                                            formulario.pagos.length > 0);

                                                    return (
                                                        <button
                                                            key={opcion.metodo}
                                                            type="button"
                                                            disabled={deshabilitado}
                                                            onClick={() => {
                                                                const montoSugerido = saldo;

                                                                actualizar("pagos", [
                                                                    ...formulario.pagos,
                                                                    {
                                                                        metodoPago: opcion.metodo,
                                                                        monto: montoSugerido,
                                                                        montoRecibido:
                                                                            opcion.metodo === "EFECTIVO"
                                                                                ? montoSugerido
                                                                                : null,
                                                                        terminalPosId: null,
                                                                        referencia: "",
                                                                        banco: "",
                                                                        observaciones: "",
                                                                    },
                                                                ]);
                                                            }}
                                                            className="group flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#DCE4DF] bg-white px-4 py-4 text-center transition hover:-translate-y-0.5 hover:border-[#AFC3B9] hover:bg-[#F7FAF8] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                                                        >
                                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF3F0] text-[#607C6F] transition group-hover:bg-[#DCE7E2]">
                                                                <Icono className="h-4 w-4" />
                                                            </span>

                                                            <span className="text-sm font-black leading-tight text-[#425149]">
                                                                {opcion.titulo}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {formulario.pagos.length === 0 ? (
                                            <div className="mt-5 rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-8 text-center">
                                                <WalletCards className="mx-auto h-7 w-7 text-[#87948D]" />

                                                <p className="mt-3 text-sm font-black text-[#56645D]">
                                                    Selecciona un método para comenzar.
                                                </p>

                                                <p className="mt-1 text-xs text-[#87938D]">
                                                    El monto se sugerirá automáticamente con el saldo pendiente.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="mt-5 space-y-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#87958D]">
                                                        Pagos aplicados
                                                    </p>

                                                    <span className="rounded-full bg-[#EAF1ED] px-3 py-1 text-[10px] font-black text-[#5D796C]">
                                                        {formulario.pagos.length} método
                                                        {formulario.pagos.length === 1 ? "" : "s"}
                                                    </span>
                                                </div>

                                                {formulario.pagos.map(
                                                    (
                                                        pago,
                                                        indice,
                                                    ) => (
                                                        <PagoEditor
                                                            key={indice}
                                                            indice={indice}
                                                            pago={pago}
                                                            terminales={terminales.filter(
                                                                (terminal) =>
                                                                    !terminal.sucursal_id ||
                                                                    terminal.sucursal_id ===
                                                                    citaSeleccionada.sucursal_id,
                                                            )}
                                                            saldoDisponible={Math.max(
                                                                0,
                                                                total -
                                                                formulario.pagos.reduce(
                                                                    (
                                                                        suma,
                                                                        item,
                                                                        posicion,
                                                                    ) =>
                                                                        posicion === indice
                                                                            ? suma
                                                                            : suma +
                                                                            Number(
                                                                                item.monto ||
                                                                                0,
                                                                            ),
                                                                    0,
                                                                ),
                                                            )}
                                                            actualizar={(cambios) =>
                                                                actualizarPago(indice, cambios)
                                                            }
                                                            eliminar={() =>
                                                                eliminarPago(indice)
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </Seccion>

                                    <Seccion
                                        paso="Opcional"
                                        titulo="Notas de la venta"
                                        icono={
                                            MessageSquareText
                                        }
                                    >
                                        <textarea
                                            rows={
                                                3
                                            }
                                            value={
                                                formulario.notas
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                actualizar(
                                                    "notas",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Observaciones adicionales..."
                                            className="w-full resize-none rounded-2xl border border-[#D4DAD6] bg-[#FBFCFA] px-4 py-3 text-sm outline-none transition focus:border-[#6F8F83] focus:bg-white"
                                        />
                                    </Seccion>
                                </>
                            )}
                        </div>

                        <aside className="2xl:sticky 2xl:top-24 2xl:self-start">
                            <section className="overflow-hidden rounded-[30px] border border-[#DCE5E0] bg-white shadow-[0_18px_45px_rgba(36,48,44,0.10)]">
                                <header className="bg-[#26332F] px-6 py-5 text-white">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#AFC2B9]">
                                        Resumen de cobro
                                    </p>

                                    <div className="mt-2 flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-[#C9D6D0]">
                                                Total a pagar
                                            </p>

                                            <p className="mt-1 text-3xl font-black">
                                                {formatearDinero(
                                                    total,
                                                )}
                                            </p>
                                        </div>

                                        <ReceiptText className="h-8 w-8 text-[#DCE7E2]" />
                                    </div>
                                </header>

                                <div className="p-6">
                                    <div className="space-y-4">
                                        <FilaResumen
                                            titulo="Subtotal"
                                            valor={
                                                subtotal
                                            }
                                        />

                                        <label className="block rounded-2xl bg-[#F7F9F7] p-4">
                                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#7E8A84]">
                                                Descuento
                                            </span>

                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-[#76817B]">
                                                    C$
                                                </span>

                                                <input
                                                    type="number"
                                                    min={
                                                        0
                                                    }
                                                    max={
                                                        subtotal
                                                    }
                                                    step={
                                                        0.01
                                                    }
                                                    value={
                                                        formulario.descuento
                                                    }
                                                    disabled={
                                                        !citaSeleccionada
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        actualizar(
                                                            "descuento",
                                                            Number(
                                                                event.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white pl-10 pr-3 text-right font-black outline-none focus:border-[#6F8F83]"
                                                />
                                            </div>
                                        </label>

                                        <div className="border-t border-[#E3E7E4]" />

                                        <FilaResumen
                                            titulo="Total"
                                            valor={
                                                total
                                            }
                                            destacado
                                        />

                                        <FilaResumen
                                            titulo="Pagado"
                                            valor={
                                                totalPagos
                                            }
                                        />

                                        <FilaResumen
                                            titulo="Comisión POS"
                                            valor={
                                                comisionTotal
                                            }
                                        />

                                        <FilaResumen
                                            titulo="Ingreso neto"
                                            valor={
                                                totalPagos -
                                                comisionTotal
                                            }
                                        />

                                        <div
                                            className={[
                                                "rounded-2xl border p-4",
                                                saldo >
                                                    0
                                                    ? "border-[#E7CACB] bg-[#F9EEEE]"
                                                    : "border-[#CFE0D8] bg-[#EAF2EE]",
                                            ].join(
                                                " ",
                                            )}
                                        >
                                            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7B8781]">
                                                {saldo >
                                                    0
                                                    ? "Saldo pendiente"
                                                    : "Pago completo"}
                                            </p>

                                            <p
                                                className={[
                                                    "mt-1 text-2xl font-black",
                                                    saldo >
                                                        0
                                                        ? "text-[#9A6267]"
                                                        : "text-[#557866]",
                                                ].join(
                                                    " ",
                                                )}
                                            >
                                                {formatearDinero(
                                                    saldo,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={
                                            guardando ||
                                            !citaSeleccionada ||
                                            !formulario.cajaSesionId ||
                                            totalPagos >
                                            total
                                        }
                                        className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#6F8F83] px-5 font-black text-white shadow-[0_12px_26px_rgba(111,143,131,0.22)] transition hover:-translate-y-0.5 hover:bg-[#607F74] disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-[#AAB9B3]"
                                    >
                                        {guardando ? (
                                            <LoaderCircle className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <CircleDollarSign className="h-5 w-5" />
                                        )}

                                        {guardando
                                            ? "Registrando..."
                                            : saldo >
                                                0
                                                ? "Registrar con saldo"
                                                : "Confirmar cobro"}
                                    </button>

                                    <p className="mt-3 text-center text-xs leading-5 text-[#76817B]">
                                        El cobro quedará asociado a la caja abierta de la sucursal.
                                    </p>
                                </div>
                            </section>
                        </aside>
                    </div>
                </form>
            )}
        </div>
    );
}

function PagoEditor({
    indice,
    pago,
    terminales,
    saldoDisponible,
    actualizar,
    eliminar,
}: {
    indice: number;
    pago: PagoVentaEntrada;
    terminales: TerminalPosDisponible[];
    saldoDisponible: number;
    actualizar: (
        cambios: Partial<PagoVentaEntrada>,
    ) => void;
    eliminar: () => void;
}) {
    const terminalSeleccionada =
        terminales.find(
            (
                terminal,
            ) =>
                terminal.id ===
                pago.terminalPosId,
        );

    const comision =
        pago.metodoPago ===
            "TARJETA"
            ? Number(
                pago.monto ||
                0,
            ) *
            (
                Number(
                    terminalSeleccionada?.porcentaje_comision ??
                    0,
                ) /
                100
            )
            : 0;

    const cambio =
        pago.metodoPago ===
            "EFECTIVO"
            ? Math.max(
                0,
                Number(
                    pago.montoRecibido ??
                    0,
                ) -
                Number(
                    pago.monto,
                ),
            )
            : 0;

    return (
        <article className="rounded-2xl border border-[#DFE6E2] bg-[#FBFCFA] p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1ED] text-[#5D796C]">
                        {pago.metodoPago ===
                            "EFECTIVO" ? (
                            <Banknote className="h-4 w-4" />
                        ) : pago.metodoPago ===
                            "TARJETA" ? (
                            <CreditCard className="h-4 w-4" />
                        ) : (
                            <Landmark className="h-4 w-4" />
                        )}
                    </div>

                    <div>
                        <p className="text-sm font-black text-[#24302C]">
                            Pago {indice +
                                1}
                        </p>

                        <p className="text-xs text-[#829089]">
                            {textoMetodoPago(
                                pago.metodoPago,
                            )}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={
                        eliminar
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8E5E5] text-[#A25E5E] transition hover:bg-[#F2DADA]"
                    aria-label="Eliminar pago"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <CampoMetodoPago
                    valor={
                        pago.metodoPago
                    }
                    cambiar={(
                        metodoPago,
                    ) =>
                        actualizar({
                            metodoPago,
                            terminalPosId:
                                null,
                            banco:
                                "",
                            montoRecibido:
                                metodoPago ===
                                    "EFECTIVO"
                                    ? pago.monto
                                    : null,
                        })
                    }
                />

                <CampoDinero
                    etiqueta="Monto aplicado"
                    valor={
                        pago.monto
                    }
                    maximo={
                        saldoDisponible
                    }
                    cambiar={(
                        monto,
                    ) =>
                        actualizar({
                            monto,
                            montoRecibido:
                                pago.metodoPago ===
                                    "EFECTIVO"
                                    ? Math.max(
                                        Number(
                                            pago.montoRecibido ??
                                            0,
                                        ),
                                        monto,
                                    )
                                    : null,
                        })
                    }
                />

                {pago.metodoPago ===
                    "EFECTIVO" && (
                        <>
                            <CampoDinero
                                etiqueta="Efectivo recibido"
                                valor={Number(
                                    pago.montoRecibido ??
                                    pago.monto,
                                )}
                                minimo={
                                    pago.monto
                                }
                                cambiar={(
                                    montoRecibido,
                                ) =>
                                    actualizar({
                                        montoRecibido,
                                    })
                                }
                            />

                            <Dato
                                titulo="Cambio"
                                valor={formatearDinero(
                                    cambio,
                                )}
                            />
                        </>
                    )}

                {pago.metodoPago ===
                    "TARJETA" && (
                        <>
                            <label className="block">
                                <span className="mb-2 block text-sm font-bold text-[#3D4A45]">
                                    Terminal POS
                                </span>

                                <select
                                    value={
                                        pago.terminalPosId ??
                                        ""
                                    }
                                    required
                                    onChange={(
                                        event,
                                    ) => {
                                        const terminal =
                                            terminales.find(
                                                (
                                                    item,
                                                ) =>
                                                    item.id ===
                                                    event.target.value,
                                            );

                                        actualizar({
                                            terminalPosId:
                                                event.target.value ||
                                                null,
                                            banco:
                                                terminal?.banco ??
                                                "",
                                        });
                                    }}
                                    className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
                                >
                                    <option value="">
                                        Seleccionar POS
                                    </option>

                                    {terminales.map(
                                        (
                                            terminal,
                                        ) => (
                                            <option
                                                key={
                                                    terminal.id
                                                }
                                                value={
                                                    terminal.id
                                                }
                                            >
                                                {
                                                    terminal.nombre
                                                }{" "}
                                                ·{" "}
                                                {Number(
                                                    terminal.porcentaje_comision,
                                                )}
                                                %
                                            </option>
                                        ),
                                    )}
                                </select>
                            </label>

                            <Dato
                                titulo="Comisión POS"
                                valor={formatearDinero(
                                    comision,
                                )}
                            />

                            <Dato
                                titulo="Ingreso neto"
                                valor={formatearDinero(
                                    Number(
                                        pago.monto,
                                    ) -
                                    comision,
                                )}
                            />

                            <CampoTexto
                                etiqueta="Referencia"
                                valor={
                                    pago.referencia ??
                                    ""
                                }
                                cambiar={(
                                    referencia,
                                ) =>
                                    actualizar({
                                        referencia,
                                    })
                                }
                            />
                        </>
                    )}

                {[
                    "TRANSFERENCIA",
                    "DEPOSITO",
                ].includes(
                    pago.metodoPago,
                ) && (
                        <>
                            <CampoTexto
                                etiqueta="Banco"
                                valor={
                                    pago.banco ??
                                    ""
                                }
                                cambiar={(
                                    banco,
                                ) =>
                                    actualizar({
                                        banco,
                                    })
                                }
                            />

                            <CampoTexto
                                etiqueta="Referencia"
                                valor={
                                    pago.referencia ??
                                    ""
                                }
                                cambiar={(
                                    referencia,
                                ) =>
                                    actualizar({
                                        referencia,
                                    })
                                }
                            />
                        </>
                    )}

                {pago.metodoPago ===
                    "OTRO" && (
                        <CampoTexto
                            etiqueta="Observación"
                            valor={
                                pago.observaciones ??
                                ""
                            }
                            cambiar={(
                                observaciones,
                            ) =>
                                actualizar({
                                    observaciones,
                                })
                            }
                        />
                    )}
            </div>
        </article>
    );
}

function CampoMetodoPago({
    valor,
    cambiar,
}: {
    valor: MetodoPagoVenta;
    cambiar: (
        valor: MetodoPagoVenta,
    ) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#3D4A45]">
                Método
            </span>

            <select
                value={
                    valor
                }
                onChange={(
                    event,
                ) =>
                    cambiar(
                        event.target.value as MetodoPagoVenta,
                    )
                }
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
            >
                <option value="EFECTIVO">
                    Efectivo
                </option>

                <option value="TARJETA">
                    Tarjeta / POS
                </option>

                <option value="TRANSFERENCIA">
                    Transferencia
                </option>

                <option value="DEPOSITO">
                    Depósito
                </option>

                <option value="OTRO">
                    Otro
                </option>
            </select>
        </label>
    );
}

function CampoDinero({
    etiqueta,
    valor,
    cambiar,
    minimo = 0.01,
    maximo,
}: {
    etiqueta: string;
    valor: number;
    cambiar: (
        valor: number,
    ) => void;
    minimo?: number;
    maximo?: number;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#3D4A45]">
                {
                    etiqueta
                }
            </span>

            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#76817B]">
                    C$
                </span>

                <input
                    type="number"
                    min={
                        minimo
                    }
                    max={
                        maximo
                    }
                    step={
                        0.01
                    }
                    value={
                        valor
                    }
                    onChange={(
                        event,
                    ) =>
                        cambiar(
                            Number(
                                event.target.value,
                            ),
                        )
                    }
                    className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-12 pr-4 text-right font-bold"
                />
            </div>
        </label>
    );
}

function CampoTexto({
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
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#3D4A45]">
                {
                    etiqueta
                }
            </span>

            <input
                value={
                    valor
                }
                onChange={(
                    event,
                ) =>
                    cambiar(
                        event.target.value,
                    )
                }
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
            />
        </label>
    );
}

function Seccion({
    paso,
    titulo,
    icono: Icono,
    children,
}: {
    paso: string;
    titulo: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-[28px] border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <header className="flex items-center gap-3 border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>

                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#87958D]">
                        {
                            paso
                        }
                    </p>

                    <h2 className="font-black text-[#24302C]">
                        {
                            titulo
                        }
                    </h2>
                </div>
            </header>

            <div className="p-5">
                {
                    children
                }
            </div>
        </section>
    );
}

function Dato({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#829089]">
                {
                    titulo
                }
            </p>

            <p className="mt-2 text-sm font-bold text-[#33413B]">
                {
                    valor
                }
            </p>
        </div>
    );
}

function HeroDato({
    titulo,
    valor,
    icono: Icono,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <div className="flex items-center gap-2 text-[#AEC0B7]">
                <Icono className="h-3.5 w-3.5" />

                <p className="text-[9px] font-black uppercase tracking-[0.12em]">
                    {
                        titulo
                    }
                </p>
            </div>

            <p className="mt-2 truncate text-sm font-black text-white">
                {
                    valor
                }
            </p>
        </div>
    );
}

function FilaResumen({
    titulo,
    valor,
    destacado = false,
}: {
    titulo: string;
    valor: number;
    destacado?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span
                className={
                    destacado
                        ? "font-black text-[#24302C]"
                        : "text-sm text-[#6B756F]"
                }
            >
                {
                    titulo
                }
            </span>

            <strong
                className={
                    destacado
                        ? "text-xl text-[#24302C]"
                        : "text-sm text-[#33413B]"
                }
            >
                {formatearDinero(
                    valor,
                )}
            </strong>
        </div>
    );
}

function EstadoSeleccion() {
    return (
        <div className="rounded-[28px] border border-dashed border-[#CDD8D2] bg-[#FBFCFA] p-12 text-center">
            <UserRound className="mx-auto h-10 w-10 text-[#98A19D]" />

            <h2 className="mt-4 font-black text-[#24302C]">
                Selecciona una cita
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B756F]">
                Escoge una cita finalizada de la columna izquierda para comenzar el cobro.
            </p>
        </div>
    );
}

function AvisoSinCaja() {
    return (
        <div className="rounded-[28px] border border-[#EBCBCB] bg-[#F8E5E5] p-6 text-[#985858]">
            <div className="flex items-start gap-3">
                <Landmark className="mt-0.5 h-6 w-6 shrink-0" />

                <div>
                    <h2 className="font-black">
                        No hay una caja abierta
                    </h2>

                    <p className="mt-2 text-sm leading-6">
                        Debes abrir la caja de la sucursal antes de registrar un cobro.
                    </p>

                    <Link
                        href="/caja"
                        className="mt-4 inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-black text-[#985858]"
                    >
                        Ir a apertura de caja
                    </Link>
                </div>
            </div>
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
                "flex items-start gap-3 rounded-2xl border px-4 py-4",
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
                <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
                <XCircle className="h-5 w-5 shrink-0" />
            )}

            <p className="min-w-0 flex-1 text-sm font-bold">
                {
                    mensaje.texto
                }
            </p>

            <button
                type="button"
                onClick={
                    cerrar
                }
                aria-label="Cerrar mensaje"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

function textoMetodoPago(
    metodo: MetodoPagoVenta,
) {
    const nombres: Record<
        MetodoPagoVenta,
        string
    > = {
        EFECTIVO:
            "Efectivo",
        TARJETA:
            "Tarjeta / POS",
        TRANSFERENCIA:
            "Transferencia",
        DEPOSITO:
            "Depósito",
        OTRO:
            "Otro",
    };

    return nombres[
        metodo
    ];
}

function formatearDinero(
    valor: number,
) {
    return `C$ ${Number(
        valor,
    ).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits:
                2,
            maximumFractionDigits:
                2,
        },
    )}`;
}

function formatearFecha(
    fecha: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone:
                "America/Managua",
        },
    ).format(
        new Date(
            `${fecha}T12:00:00-06:00`,
        ),
    );
}

function formatearHora(
    hora: string,
) {
    const [
        hora24,
        minuto = "00",
    ] =
        hora
            .slice(
                0,
                5,
            )
            .split(
                ":",
            )
            .map(
                Number,
            );

    const periodo =
        hora24 >=
            12
            ? "p. m."
            : "a. m.";

    const hora12 =
        hora24 %
        12 ||
        12;

    return `${hora12}:${String(
        minuto,
    ).padStart(
        2,
        "0",
    )} ${periodo}`;
}
