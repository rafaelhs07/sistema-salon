"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    CreditCard,
    Landmark,
    LoaderCircle,
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
import { useRouter } from "next/navigation";

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
    const router = useRouter();

    const [busqueda, setBusqueda] =
        useState("");
    const [citaId, setCitaId] = useState("");
    const [mensaje, setMensaje] =
        useState<Mensaje>(null);
    const [guardando, iniciarGuardado] =
        useTransition();

    const [formulario, setFormulario] =
        useState<DatosCobroCita>({
            citaId: "",
            cajaSesionId:
                cajas.length === 1
                    ? cajas[0].id
                    : "",
            descuento: 0,
            notas: "",
            pagos: [],
        });

    const citaSeleccionada = citas.find(
        (cita) => cita.id === citaId,
    );

    useEffect(() => {
        if (!citaInicialId) return;

        const citaInicial = citas.find(
            (cita) => cita.id === citaInicialId,
        );

        if (citaInicial) {
            seleccionarCita(citaInicial);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [citaInicialId]);


    const citasFiltradas = useMemo(() => {
        const texto =
            busqueda.trim().toLowerCase();

        return citas.filter((cita) => {
            const cajaDisponible =
                cajas.some(
                    (caja) =>
                        caja.sucursal_id ===
                        cita.sucursal_id,
                );

            if (!cajaDisponible) {
                return false;
            }

            return (
                !texto ||
                cita.codigo_cita
                    ?.toLowerCase()
                    .includes(texto) ||
                cita.clientes?.nombre_completo
                    .toLowerCase()
                    .includes(texto) ||
                cita.clientes?.codigo_cliente
                    ?.toLowerCase()
                    .includes(texto) ||
                cita.clientes?.telefono
                    ?.toLowerCase()
                    .includes(texto) ||
                cita.clientes?.whatsapp
                    ?.toLowerCase()
                    .includes(texto)
            );
        });
    }, [busqueda, cajas, citas]);

    const subtotal = useMemo(() => {
        if (!citaSeleccionada) return 0;

        const totalServicios =
            citaSeleccionada.cita_servicios
                .filter(
                    (servicio) =>
                        servicio.estado !==
                        "CANCELADO",
                )
                .reduce(
                    (total, servicio) =>
                        total +
                        Number(servicio.total),
                    0,
                );

        return totalServicios > 0
            ? totalServicios
            : Number(
                citaSeleccionada.total,
            );
    }, [citaSeleccionada]);

    const total = Math.max(
        0,
        subtotal - formulario.descuento,
    );

    const totalPagos =
        formulario.pagos.reduce(
            (suma, pago) =>
                suma + Number(pago.monto || 0),
            0,
        );

    const saldo = Math.max(
        0,
        total - totalPagos,
    );

    const comisionTotal = formulario.pagos.reduce(
        (suma, pago) => {
            if (pago.metodoPago !== "TARJETA") {
                return suma;
            }

            const terminal = terminales.find(
                (item) =>
                    item.id === pago.terminalPosId,
            );

            return (
                suma +
                Number(pago.monto || 0) *
                (Number(
                    terminal?.porcentaje_comision ??
                    0,
                ) /
                    100)
            );
        },
        0,
    );

    function seleccionarCita(cita: CitaCobrable) {
        const caja =
            cajas.find(
                (item) =>
                    item.sucursal_id ===
                    cita.sucursal_id,
            ) ?? null;

        setCitaId(cita.id);
        setFormulario({
            citaId: cita.id,
            cajaSesionId: caja?.id ?? "",
            descuento: 0,
            notas: "",
            pagos: [],
        });
        setMensaje(null);
    }

    function actualizar<
        K extends keyof DatosCobroCita,
    >(
        campo: K,
        valor: DatosCobroCita[K],
    ) {
        setFormulario((actual) => ({
            ...actual,
            [campo]: valor,
        }));
        setMensaje(null);
    }

    function agregarPago() {
        if (
            !permitirPagoCombinado &&
            formulario.pagos.length > 0
        ) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Los pagos combinados están desactivados en Configuración.",
            });
            return;
        }

        const montoSugerido = saldo;

        actualizar("pagos", [
            ...formulario.pagos,
            {
                metodoPago: "EFECTIVO",
                monto: montoSugerido,
                montoRecibido:
                    montoSugerido,
                terminalPosId: null,
                referencia: "",
                banco: "",
                observaciones: "",
            },
        ]);
    }

    function actualizarPago(
        indice: number,
        cambios: Partial<PagoVentaEntrada>,
    ) {
        actualizar(
            "pagos",
            formulario.pagos.map(
                (pago, posicion) =>
                    posicion === indice
                        ? {
                            ...pago,
                            ...cambios,
                        }
                        : pago,
            ),
        );
    }

    function eliminarPago(indice: number) {
        actualizar(
            "pagos",
            formulario.pagos.filter(
                (_, posicion) =>
                    posicion !== indice,
            ),
        );
    }

    function enviar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!citaSeleccionada) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Selecciona una cita finalizada.",
            });
            return;
        }

        if (
            formulario.descuento > subtotal
        ) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "El descuento no puede superar el subtotal.",
            });
            return;
        }

        if (totalPagos > total) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Los pagos aplicados no pueden superar el total.",
            });
            return;
        }

        if (!permitirCredito && saldo > 0) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Las ventas a crédito están desactivadas. Debes completar el pago.",
            });
            return;
        }

        if (
            formulario.pagos.some(
                (pago) =>
                    pago.metodoPago === "TARJETA" &&
                    !pago.terminalPosId,
            )
        ) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Selecciona la terminal POS en todos los pagos con tarjeta.",
            });
            return;
        }

        iniciarGuardado(async () => {
            const resultado =
                await cobrarCita(formulario);

            setMensaje({
                tipo: resultado.exito
                    ? "EXITO"
                    : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                if (resultado.ventaId) {
                    router.push(
                        `/caja/recibos/${resultado.ventaId}`,
                    );
                } else {
                    router.push("/caja");
                }

                router.refresh();
            }
        });
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/caja"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Caja
                    </Link>

                    <div className="mt-6 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                            <ReceiptText className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Cobro de servicios
                            </p>

                            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                                Cobrar cita
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Selecciona una cita finalizada y registra
                                uno o varios pagos manuales.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() =>
                        setMensaje(null)
                    }
                />
            )}

            {cajas.length === 0 ? (
                <AvisoSinCaja />
            ) : (
                <form onSubmit={enviar}>
                    <div className="grid gap-6 xl:grid-cols-[390px_1fr_350px]">
                        <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                            <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] p-5">
                                <h2 className="font-bold text-[#24302C]">
                                    Citas finalizadas
                                </h2>

                                <div className="relative mt-4">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                                    <input
                                        value={busqueda}
                                        onChange={(event) =>
                                            setBusqueda(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Cliente, código o teléfono..."
                                        className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83]"
                                    />
                                </div>
                            </header>

                            <div className="max-h-[690px] overflow-y-auto p-3">
                                {citasFiltradas.length ===
                                    0 ? (
                                    <div className="p-8 text-center">
                                        <CalendarDays className="mx-auto h-8 w-8 text-[#98A19D]" />
                                        <p className="mt-3 text-sm font-semibold text-[#52605A]">
                                            No hay citas disponibles.
                                        </p>
                                    </div>
                                ) : (
                                    citasFiltradas.map(
                                        (cita) => (
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
                                                    citaId ===
                                                        cita.id
                                                        ? "border-[#9FB7AC] bg-[#EAF1ED]"
                                                        : "border-[#E3E7E4] bg-white hover:bg-[#F4F7F5]",
                                                ].join(
                                                    " ",
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate font-bold text-[#24302C]">
                                                            {cita
                                                                .clientes
                                                                ?.nombre_completo ??
                                                                "Cliente"}
                                                        </p>

                                                        <p className="mt-1 text-xs font-semibold text-[#6F8F83]">
                                                            {cita.codigo_cita ??
                                                                "Sin código"}
                                                        </p>
                                                    </div>

                                                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#5B8A72]" />
                                                </div>

                                                <p className="mt-3 text-xs text-[#6B756F]">
                                                    {formatearFecha(
                                                        cita.fecha,
                                                    )}{" "}
                                                    ·{" "}
                                                    {formatearHora(
                                                        cita.hora_inicio,
                                                    )}
                                                </p>

                                                <p className="mt-1 text-xs text-[#76817B]">
                                                    {cita
                                                        .sucursales
                                                        ?.nombre ??
                                                        "Sin sucursal"}
                                                </p>

                                                <p className="mt-3 font-bold text-[#33413B]">
                                                    {formatearDinero(
                                                        cita.total,
                                                    )}
                                                </p>
                                            </button>
                                        ),
                                    )
                                )}
                            </div>
                        </section>

                        <div className="space-y-6">
                            {!citaSeleccionada ? (
                                <EstadoSeleccion />
                            ) : (
                                <>
                                    <Seccion
                                        titulo="Cita seleccionada"
                                        icono={
                                            UserRound
                                        }
                                    >
                                        <div className="grid gap-4 sm:grid-cols-2">
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
                                                    cajas.find(
                                                        (
                                                            caja,
                                                        ) =>
                                                            caja.id ===
                                                            formulario.cajaSesionId,
                                                    )
                                                        ?.sucursales
                                                        ?.nombre ??
                                                    "Sin caja"
                                                }
                                            />
                                        </div>
                                    </Seccion>

                                    <Seccion
                                        titulo="Servicios realizados"
                                        icono={
                                            WalletCards
                                        }
                                    >
                                        <div className="space-y-3">
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
                                                            className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4"
                                                        >
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div>
                                                                    <p className="font-bold text-[#24302C]">
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

                                                                    <p className="mt-2 text-xs text-[#76817B]">
                                                                        {formatearHora(
                                                                            servicio.hora_inicio,
                                                                        )}{" "}
                                                                        –{" "}
                                                                        {formatearHora(
                                                                            servicio.hora_fin,
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <strong className="text-[#33413B]">
                                                                    {formatearDinero(
                                                                        servicio.total,
                                                                    )}
                                                                </strong>
                                                            </div>
                                                        </article>
                                                    ),
                                                )}
                                        </div>
                                    </Seccion>

                                    <Seccion
                                        titulo={
                                            formulario.pagos.length > 1
                                                ? "Pagos · Mixto"
                                                : "Pagos"
                                        }
                                        icono={
                                            CreditCard
                                        }
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm text-[#6B756F]">
                                                {permitirPagoCombinado
                                                    ? "Puedes combinar varios métodos."
                                                    : "Solo se permite un método de pago."}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={
                                                    agregarPago
                                                }
                                                disabled={
                                                    saldo <= 0 ||
                                                    (!permitirPagoCombinado &&
                                                        formulario.pagos.length > 0)
                                                }
                                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B] disabled:opacity-50"
                                            >
                                                <Plus className="h-4 w-4" />
                                                {formulario.pagos.length > 0
                                                    ? "Agregar otro método"
                                                    : "Agregar pago"}
                                            </button>
                                        </div>

                                        {formulario
                                            .pagos
                                            .length ===
                                            0 ? (
                                            <div className="mt-4 rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-6 text-center text-sm text-[#6B756F]">
                                                Puedes dejar la
                                                venta pendiente o
                                                agregar uno o varios
                                                pagos.
                                            </div>
                                        ) : (
                                            <div className="mt-4 space-y-4">
                                                {formulario.pagos.map(
                                                    (
                                                        pago,
                                                        indice,
                                                    ) => (
                                                        <PagoEditor
                                                            key={
                                                                indice
                                                            }
                                                            indice={
                                                                indice
                                                            }
                                                            pago={
                                                                pago
                                                            }
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
                                                                        posicion ===
                                                                            indice
                                                                            ? suma
                                                                            : suma +
                                                                            Number(
                                                                                item.monto ||
                                                                                0,
                                                                            ),
                                                                    0,
                                                                ),
                                                            )}
                                                            actualizar={(
                                                                cambios,
                                                            ) =>
                                                                actualizarPago(
                                                                    indice,
                                                                    cambios,
                                                                )
                                                            }
                                                            eliminar={() =>
                                                                eliminarPago(
                                                                    indice,
                                                                )
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </Seccion>

                                    <Seccion
                                        titulo="Notas de la venta"
                                        icono={
                                            MessageSquareText
                                        }
                                    >
                                        <textarea
                                            rows={4}
                                            value={
                                                formulario.notas
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                actualizar(
                                                    "notas",
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="Observaciones adicionales..."
                                            className="w-full rounded-xl border border-[#D4DAD6] bg-white px-4 py-3 outline-none focus:border-[#6F8F83]"
                                        />
                                    </Seccion>
                                </>
                            )}
                        </div>

                        <aside className="xl:sticky xl:top-24 xl:self-start">
                            <section className="rounded-3xl border border-[#E3E7E4] bg-white p-6 shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                                <h2 className="text-xl font-bold text-[#24302C]">
                                    Resumen
                                </h2>

                                <div className="mt-5 space-y-4">
                                    <FilaResumen
                                        titulo="Subtotal"
                                        valor={
                                            subtotal
                                        }
                                    />

                                    <label className="block">
                                        <span className="mb-2 block text-sm text-[#6B756F]">
                                            Descuento
                                        </span>

                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#76817B]">
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
                                                            event
                                                                .target
                                                                .value,
                                                        ),
                                                    )
                                                }
                                                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-12 pr-4 text-right font-semibold"
                                            />
                                        </div>
                                    </label>

                                    <div className="border-t border-[#E3E7E4]" />

                                    <FilaResumen
                                        titulo="Total"
                                        valor={total}
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
                                        valor={comisionTotal}
                                    />

                                    <FilaResumen
                                        titulo="Ingreso neto"
                                        valor={totalPagos - comisionTotal}
                                    />

                                    <FilaResumen
                                        titulo="Saldo"
                                        valor={
                                            saldo
                                        }
                                        alerta={
                                            saldo > 0
                                        }
                                    />
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
                                    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6F8F83] px-5 font-bold text-white transition hover:bg-[#607F74] disabled:cursor-not-allowed disabled:bg-[#AAB9B3]"
                                >
                                    {guardando ? (
                                        <LoaderCircle className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <CircleDollarSign className="h-5 w-5" />
                                    )}

                                    {guardando
                                        ? "Registrando..."
                                        : saldo > 0
                                            ? "Registrar con saldo"
                                            : "Confirmar cobro"}
                                </button>

                                <p className="mt-3 text-center text-xs leading-5 text-[#76817B]">
                                    Los pagos y movimientos se
                                    registrarán en la caja abierta
                                    de la sucursal.
                                </p>
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
            (terminal) =>
                terminal.id === pago.terminalPosId,
        );

    const comision =
        pago.metodoPago === "TARJETA"
            ? Number(pago.monto || 0) *
            (Number(
                terminalSeleccionada?.porcentaje_comision ??
                0,
            ) /
                100)
            : 0;

    const cambio =
        pago.metodoPago === "EFECTIVO"
            ? Math.max(
                0,
                Number(
                    pago.montoRecibido ?? 0,
                ) - Number(pago.monto),
            )
            : 0;

    return (
        <article className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4">
            <div className="flex items-center justify-between">
                <p className="font-bold text-[#24302C]">
                    Pago {indice + 1}
                </p>

                <button
                    type="button"
                    onClick={eliminar}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8E5E5] text-[#A25E5E]"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <CampoMetodoPago
                    valor={pago.metodoPago}
                    cambiar={(
                        metodoPago,
                    ) =>
                        actualizar({
                            metodoPago,
                            terminalPosId: null,
                            banco: "",
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
                    valor={pago.monto}
                    maximo={
                        saldoDisponible
                    }
                    cambiar={(monto) =>
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

                {pago.metodoPago === "TARJETA" && (
                    <>
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                                Terminal POS
                            </span>

                            <select
                                value={pago.terminalPosId ?? ""}
                                required
                                onChange={(event) => {
                                    const terminal = terminales.find(
                                        (item) =>
                                            item.id === event.target.value,
                                    );

                                    actualizar({
                                        terminalPosId:
                                            event.target.value || null,
                                        banco: terminal?.banco ?? "",
                                    });
                                }}
                                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4"
                            >
                                <option value="">
                                    Seleccionar POS
                                </option>

                                {terminales.map((terminal) => (
                                    <option
                                        key={terminal.id}
                                        value={terminal.id}
                                    >
                                        {terminal.nombre} ·{" "}
                                        {Number(
                                            terminal.porcentaje_comision,
                                        )}%
                                    </option>
                                ))}
                            </select>
                        </label>

                        <Dato
                            titulo="Comisión POS"
                            valor={formatearDinero(comision)}
                        />

                        <Dato
                            titulo="Ingreso neto"
                            valor={formatearDinero(
                                Number(pago.monto) - comision,
                            )}
                        />

                        <CampoTexto
                            etiqueta="Referencia"
                            valor={pago.referencia ?? ""}
                            cambiar={(referencia) =>
                                actualizar({ referencia })
                            }
                        />
                    </>
                )}

                {[
                    "TRANSFERENCIA",
                    "DEPOSITO",
                ].includes(pago.metodoPago) && (
                        <>
                            <CampoTexto
                                etiqueta="Banco"
                                valor={pago.banco ?? ""}
                                cambiar={(banco) =>
                                    actualizar({ banco })
                                }
                            />

                            <CampoTexto
                                etiqueta="Referencia"
                                valor={pago.referencia ?? ""}
                                cambiar={(referencia) =>
                                    actualizar({ referencia })
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
            <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                Método
            </span>

            <select
                value={valor}
                onChange={(event) =>
                    cambiar(
                        event.target
                            .value as MetodoPagoVenta,
                    )
                }
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4"
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
    cambiar: (valor: number) => void;
    minimo?: number;
    maximo?: number;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </span>

            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#76817B]">
                    C$
                </span>

                <input
                    type="number"
                    min={minimo}
                    max={maximo}
                    step={0.01}
                    value={valor}
                    onChange={(event) =>
                        cambiar(
                            Number(
                                event.target.value,
                            ),
                        )
                    }
                    className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-12 pr-4 text-right font-semibold"
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
    cambiar: (valor: string) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </span>

            <input
                value={valor}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4"
            />
        </label>
    );
}

function Seccion({
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
        <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <header className="flex items-center gap-3 border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>

                <h2 className="font-bold text-[#24302C]">
                    {titulo}
                </h2>
            </header>

            <div className="p-5">
                {children}
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
            <p className="text-xs font-bold uppercase text-[#829089]">
                {titulo}
            </p>

            <p className="mt-2 text-sm font-semibold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function FilaResumen({
    titulo,
    valor,
    destacado = false,
    alerta = false,
}: {
    titulo: string;
    valor: number;
    destacado?: boolean;
    alerta?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span
                className={
                    destacado
                        ? "font-bold text-[#24302C]"
                        : "text-sm text-[#6B756F]"
                }
            >
                {titulo}
            </span>

            <strong
                className={
                    alerta
                        ? "text-[#A25E5E]"
                        : destacado
                            ? "text-xl text-[#24302C]"
                            : "text-sm text-[#33413B]"
                }
            >
                {formatearDinero(valor)}
            </strong>
        </div>
    );
}

function EstadoSeleccion() {
    return (
        <div className="rounded-3xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-12 text-center">
            <UserRound className="mx-auto h-10 w-10 text-[#98A19D]" />

            <h2 className="mt-4 font-bold text-[#24302C]">
                Selecciona una cita
            </h2>

            <p className="mt-2 text-sm text-[#6B756F]">
                Busca al cliente y selecciona la cita
                finalizada que deseas cobrar.
            </p>
        </div>
    );
}

function AvisoSinCaja() {
    return (
        <div className="rounded-3xl border border-[#EBCBCB] bg-[#F8E5E5] p-6 text-[#985858]">
            <div className="flex items-start gap-3">
                <Landmark className="mt-0.5 h-6 w-6 shrink-0" />

                <div>
                    <h2 className="font-bold">
                        No hay una caja abierta
                    </h2>

                    <p className="mt-2 text-sm leading-6">
                        Debes abrir la caja de la sucursal antes
                        de registrar un cobro.
                    </p>

                    <Link
                        href="/caja"
                        className="mt-4 inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-bold text-[#985858]"
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

function formatearDinero(valor: number) {
    return `C$ ${Number(valor).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    )}`;
}

function formatearFecha(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Managua",
    }).format(
        new Date(
            `${fecha}T12:00:00-06:00`,
        ),
    );
}

function formatearHora(hora: string) {
    const [hora24, minuto = "00"] =
        hora
            .slice(0, 5)
            .split(":")
            .map(Number);

    const periodo =
        hora24 >= 12 ? "p. m." : "a. m.";
    const hora12 = hora24 % 12 || 12;

    return `${hora12}:${String(
        minuto,
    ).padStart(2, "0")} ${periodo}`;
}