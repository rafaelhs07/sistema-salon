"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    CheckCircle2,
    CircleDollarSign,
    CreditCard,
    Landmark,
    LoaderCircle,
    Plus,
    ReceiptText,
    Store,
    Trash2,
    UserRound,
    WalletCards,
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
    registrarAbono,
    type PagoAbonoInput,
} from "./actions";

export type CuentaParaAbono = {
    id: string;
    codigo_cuenta: string;
    salon_id: string;
    sucursal_id: string;
    cliente_id: string;
    venta_id: string | null;
    monto_original: number;
    monto_abonado: number;
    saldo_pendiente: number;
    estado: string;
    fecha_origen: string;
    fecha_vencimiento: string | null;

    clientes: {
        id: string;
        codigo_cliente: string | null;
        nombre_completo: string;
        telefono: string | null;
        whatsapp: string | null;
    } | null;

    sucursales: {
        nombre: string;
    } | null;

    ventas: {
        codigo_venta: string | null;
    } | null;
};

export type CajaAbono = {
    id: string;
    sucursal_id: string;
    fecha_apertura: string;
    estado: string;
    sucursales: {
        nombre: string;
    } | null;
};

export type TerminalPosAbono = {
    id: string;
    sucursal_id: string | null;
    nombre: string;
    banco: string | null;
    porcentaje_comision: number;
    estado: string;
};

type PagoFormulario =
    PagoAbonoInput & {
        idLocal: string;
    };

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

type MetodoVisible =
    | "EFECTIVO"
    | "TARJETA"
    | "TRANSFERENCIA";

const metodosVisibles: Array<{
    valor: MetodoVisible;
    texto: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}> = [
        {
            valor: "EFECTIVO",
            texto: "Efectivo",
            descripcion: "Dinero recibido en caja",
            icono: Banknote,
        },
        {
            valor: "TARJETA",
            texto: "Tarjeta",
            descripcion: "Pago mediante terminal POS",
            icono: CreditCard,
        },
        {
            valor: "TRANSFERENCIA",
            texto: "Transferencia",
            descripcion: "Transferencia bancaria",
            icono: Landmark,
        },
    ];

export default function RegistrarAbonoClient({
    cuenta,
    cajas,
    terminales,
    simboloMoneda,
    permitirPagoCombinado,
}: {
    cuenta: CuentaParaAbono;
    cajas: CajaAbono[];
    terminales: TerminalPosAbono[];
    simboloMoneda: string;
    permitirPagoCombinado: boolean;
}) {
    const router = useRouter();

    const [
        guardando,
        iniciarGuardado,
    ] =
        useTransition();

    const [
        mensaje,
        setMensaje,
    ] =
        useState<Mensaje>(
            null,
        );

    const [
        cajaId,
        setCajaId,
    ] =
        useState(
            cajas[0]?.id ??
            "",
        );

    const [
        referencia,
        setReferencia,
    ] =
        useState("");

    const [
        observaciones,
        setObservaciones,
    ] =
        useState("");

    const [
        pagos,
        setPagos,
    ] =
        useState<
            PagoFormulario[]
        >([
            crearPago(
                "EFECTIVO",
                Number(
                    cuenta.saldo_pendiente,
                ),
            ),
        ]);

    const totalPagos =
        useMemo(
            () =>
                pagos.reduce(
                    (
                        total,
                        pago,
                    ) =>
                        total +
                        Number(
                            pago.monto ||
                            0,
                        ),
                    0,
                ),
            [pagos],
        );

    const saldoInicial =
        Number(
            cuenta.saldo_pendiente,
        );

    const saldoRestante =
        saldoInicial -
        totalPagos;

    const porcentajeAbono =
        saldoInicial > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        totalPagos /
                        saldoInicial
                    ) *
                    100,
                ),
            )
            : 0;

    const terminalesDisponibles =
        terminales.filter(
            (
                terminal,
            ) =>
                terminal.sucursal_id ===
                null ||
                terminal.sucursal_id ===
                cuenta.sucursal_id,
        );

    function dinero(
        valor: number,
    ) {
        return `${simboloMoneda} ${Number(
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

    function agregarPago(
        metodoPago: MetodoVisible,
    ) {
        if (
            !permitirPagoCombinado &&
            pagos.length >=
            1
        ) {
            setPagos([
                crearPago(
                    metodoPago,
                    Math.max(
                        0,
                        saldoInicial,
                    ),
                ),
            ]);
            setMensaje(
                null,
            );
            return;
        }

        const restante =
            Math.max(
                0,
                saldoInicial -
                totalPagos,
            );

        setPagos(
            (
                actuales,
            ) => [
                    ...actuales,
                    crearPago(
                        metodoPago,
                        restante,
                    ),
                ],
        );

        setMensaje(
            null,
        );
    }

    function eliminarPago(
        idLocal: string,
    ) {
        if (
            pagos.length ===
            1
        ) {
            return;
        }

        setPagos(
            (
                actuales,
            ) =>
                actuales.filter(
                    (
                        pago,
                    ) =>
                        pago.idLocal !==
                        idLocal,
                ),
        );
    }

    function actualizarPago(
        idLocal: string,
        cambios: Partial<PagoFormulario>,
    ) {
        setPagos(
            (
                actuales,
            ) =>
                actuales.map(
                    (
                        pago,
                    ) =>
                        pago.idLocal ===
                            idLocal
                            ? {
                                ...pago,
                                ...cambios,
                            }
                            : pago,
                ),
        );

        setMensaje(
            null,
        );
    }

    function cambiarMetodo(
        pago: PagoFormulario,
        metodoPago: PagoFormulario["metodoPago"],
    ) {
        actualizarPago(
            pago.idLocal,
            {
                metodoPago,
                montoRecibido:
                    metodoPago ===
                        "EFECTIVO"
                        ? pago.monto
                        : null,
                terminalPosId:
                    null,
                banco:
                    null,
            },
        );
    }

    function enviar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setMensaje(
            null,
        );

        if (
            !cajaId
        ) {
            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    "No hay una caja abierta para esta sucursal.",
            });
            return;
        }

        if (
            totalPagos <=
            0
        ) {
            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    "El abono debe ser mayor que cero.",
            });
            return;
        }

        if (
            totalPagos >
            saldoInicial +
            0.005
        ) {
            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    "El abono no puede superar el saldo pendiente.",
            });
            return;
        }

        for (
            const pago of
            pagos
        ) {
            if (
                Number(
                    pago.monto,
                ) <=
                0
            ) {
                setMensaje({
                    tipo:
                        "ERROR",
                    texto:
                        "Todos los métodos deben tener un monto mayor que cero.",
                });
                return;
            }

            if (
                pago.metodoPago ===
                "TARJETA" &&
                !pago.terminalPosId
            ) {
                setMensaje({
                    tipo:
                        "ERROR",
                    texto:
                        "Selecciona la terminal POS utilizada.",
                });
                return;
            }

            if (
                pago.metodoPago ===
                "EFECTIVO" &&
                Number(
                    pago.montoRecibido ??
                    pago.monto,
                ) <
                Number(
                    pago.monto,
                )
            ) {
                setMensaje({
                    tipo:
                        "ERROR",
                    texto:
                        "El efectivo recibido no puede ser menor al monto aplicado.",
                });
                return;
            }
        }

        iniciarGuardado(
            async () => {
                const resultado =
                    await registrarAbono(
                        {
                            cuentaId:
                                cuenta.id,
                            clienteId:
                                cuenta.cliente_id,
                            cajaSesionId:
                                cajaId,
                            pagos:
                                pagos.map(
                                    ({
                                        idLocal,
                                        ...pago
                                    }) =>
                                        pago,
                                ),
                            referencia,
                            observaciones,
                        },
                    );

                if (
                    !resultado.exito
                ) {
                    setMensaje({
                        tipo:
                            "ERROR",
                        texto:
                            resultado.mensaje,
                    });
                    return;
                }

                router.push(
                    `/cuentas-cobrar/${cuenta.cliente_id}`,
                );

                router.refresh();
            },
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-secondary/12 blur-3xl" />

                <div className="relative">
                    <Link
                        href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al estado de cuenta
                    </Link>

                    <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                                <CircleDollarSign className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#AFC2B9]">
                                    Cuentas por cobrar
                                </p>

                                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                    Registrar abono
                                </h1>

                                <p className="mt-2 text-sm text-[#CFD9D4]">
                                    {cuenta.clientes
                                        ?.nombre_completo ??
                                        "Cliente"}{" "}
                                    ·{" "}
                                    {
                                        cuenta.codigo_cuenta
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="grid min-w-[300px] grid-cols-2 gap-3">
                            <HeroDato
                                titulo="Saldo pendiente"
                                valor={dinero(
                                    saldoInicial,
                                )}
                            />

                            <HeroDato
                                titulo="Sucursal"
                                valor={
                                    cuenta.sucursales
                                        ?.nombre ??
                                    "Sucursal"
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>

            {mensaje && (
                <div
                    className={[
                        "flex items-start gap-3 rounded-2xl border p-4 shadow-sm",
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

                    <p className="text-sm font-bold">
                        {
                            mensaje.texto
                        }
                    </p>
                </div>
            )}

            <form
                onSubmit={
                    enviar
                }
                className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]"
            >
                <div className="space-y-6">
                    <section className="salon-panel overflow-hidden border border-border bg-white">
                        <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] p-5 sm:p-6">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                                    <WalletCards className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                                        Paso 1
                                    </p>

                                    <h2 className="mt-1 text-lg font-black text-foreground tracking-tight">
                                        ¿Cómo recibiste el abono?
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-[#74817B]">
                                        Selecciona un método de pago. Si el pago combinado está activo puedes usar varios.
                                    </p>
                                </div>
                            </div>
                        </header>

                        <div className="p-5 sm:p-6">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Agregar método
                            </p>

                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                {metodosVisibles.map(
                                    (
                                        metodo,
                                    ) => (
                                        <MetodoCard
                                            key={
                                                metodo.valor
                                            }
                                            texto={
                                                metodo.texto
                                            }
                                            descripcion={
                                                metodo.descripcion
                                            }
                                            icono={
                                                metodo.icono
                                            }
                                            onClick={() =>
                                                agregarPago(
                                                    metodo.valor,
                                                )
                                            }
                                        />
                                    ),
                                )}
                            </div>

                            {!permitirPagoCombinado && (
                                <div className="mt-4 rounded-2xl border border-[#E2E8E4] bg-[#F8FAF8] px-4 py-3 text-xs font-semibold text-text-secondary">
                                    El pago combinado está desactivado. Al elegir otro método se reemplazará el actual.
                                </div>
                            )}

                            <div className="mt-6 space-y-4">
                                {pagos.map(
                                    (
                                        pago,
                                        indice,
                                    ) => (
                                        <PagoCard
                                            key={
                                                pago.idLocal
                                            }
                                            pago={
                                                pago
                                            }
                                            indice={
                                                indice
                                            }
                                            permitirEliminar={
                                                pagos.length >
                                                1
                                            }
                                            terminales={
                                                terminalesDisponibles
                                            }
                                            simboloMoneda={
                                                simboloMoneda
                                            }
                                            actualizar={
                                                actualizarPago
                                            }
                                            cambiarMetodo={
                                                cambiarMetodo
                                            }
                                            eliminar={
                                                eliminarPago
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="salon-panel overflow-hidden border border-border bg-white">
                        <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] p-5 sm:p-6">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Paso 2
                            </p>

                            <h2 className="mt-1 text-lg font-black text-foreground tracking-tight">
                                Información adicional
                            </h2>

                            <p className="mt-1 text-sm text-[#74817B]">
                                Estos datos son opcionales y ayudan a identificar el abono posteriormente.
                            </p>
                        </header>

                        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 block text-sm font-black text-[#3D4A45]">
                                    Referencia general
                                </span>

                                <input
                                    value={
                                        referencia
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setReferencia(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Número de recibo o comprobante"
                                    className="salon-control w-full border border-border-strong bg-white px-4 font-semibold outline-none transition focus:border-primary"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-black text-[#3D4A45]">
                                    Observaciones
                                </span>

                                <textarea
                                    rows={3}
                                    value={
                                        observaciones
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setObservaciones(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Información adicional del abono..."
                                    className="salon-control w-full resize-none border border-border-strong bg-white p-3 outline-none transition focus:border-primary"
                                />
                            </label>
                        </div>
                    </section>
                </div>

                <aside className="xl:sticky xl:top-24 xl:self-start">
                    <section className="salon-panel overflow-hidden border border-border bg-white">
                        <div className="bg-sidebar p-5 text-white">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#AFC2B9]">
                                Resumen
                            </p>

                            <h2 className="mt-1 text-xl font-black tracking-tight">
                                Confirmar abono
                            </h2>

                            <p className="mt-1 text-xs text-[#C7D4CE]">
                                Revisa los montos antes de registrar.
                            </p>
                        </div>

                        <div className="p-5">
                            <div className="rounded-2xl border border-[#DFE6E2] bg-[#F8FAF8] p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary-strong shadow-sm">
                                        <UserRound className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-[#33413B]">
                                            {cuenta.clientes
                                                ?.nombre_completo ??
                                                "Cliente"}
                                        </p>

                                        <p className="mt-0.5 text-xs text-[#7B8781]">
                                            {
                                                cuenta.codigo_cuenta
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <label className="mt-5 block">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#829089]">
                                    Caja
                                </span>

                                <div className="relative">
                                    <Store className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                                    <select
                                        value={
                                            cajaId
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setCajaId(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="salon-control w-full border border-border-strong bg-white pl-11 pr-3 font-semibold"
                                    >
                                        {cajas.length ===
                                            0 ? (
                                            <option value="">
                                                No hay caja abierta
                                            </option>
                                        ) : (
                                            cajas.map(
                                                (
                                                    caja,
                                                ) => (
                                                    <option
                                                        key={
                                                            caja.id
                                                        }
                                                        value={
                                                            caja.id
                                                        }
                                                    >
                                                        {caja
                                                            .sucursales
                                                            ?.nombre ??
                                                            "Caja abierta"}
                                                    </option>
                                                ),
                                            )
                                        )}
                                    </select>
                                </div>
                            </label>

                            <div className="mt-5 space-y-3">
                                <FilaResumen
                                    titulo="Saldo actual"
                                    valor={dinero(
                                        saldoInicial,
                                    )}
                                />

                                <FilaResumen
                                    titulo="Abono"
                                    valor={dinero(
                                        totalPagos,
                                    )}
                                    resaltado
                                />

                                <div className="border-t border-border pt-3">
                                    <FilaResumen
                                        titulo="Saldo después"
                                        valor={dinero(
                                            Math.max(
                                                0,
                                                saldoRestante,
                                            ),
                                        )}
                                        grande
                                    />
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-[#74817B]">
                                        Porcentaje cubierto
                                    </span>

                                    <strong className="text-primary-strong">
                                        {
                                            porcentajeAbono
                                        }
                                        %
                                    </strong>
                                </div>

                                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E4EAE6]">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{
                                            width:
                                                `${Math.min(
                                                    100,
                                                    porcentajeAbono,
                                                )}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {saldoRestante <
                                -0.005 && (
                                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#EBCBCB] bg-[#F8E5E5] p-3 text-xs font-bold text-[#985858]">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                        El abono supera el saldo pendiente.
                                    </div>
                                )}

                            {cajas.length ===
                                0 && (
                                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#E8D9B9] bg-[#FAF0DC] p-3 text-xs font-bold text-[#81652F]">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                        Debes abrir una caja en esta sucursal antes de recibir el abono.
                                    </div>
                                )}

                            <button
                                type="submit"
                                disabled={
                                    guardando ||
                                    !cajaId ||
                                    totalPagos <=
                                    0 ||
                                    saldoRestante <
                                    -0.005
                                }
                                className="mt-5 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-white shadow-sm transition hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                {guardando ? (
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                ) : (
                                    <ReceiptText className="h-5 w-5" />
                                )}

                                {guardando
                                    ? "Registrando..."
                                    : "Registrar abono"}
                            </button>

                            <p className="mt-3 text-center text-xs leading-5 text-[#8A9690]">
                                El abono se registrará en la cuenta del cliente y en la caja seleccionada.
                            </p>
                        </div>
                    </section>
                </aside>
            </form>
        </div>
    );
}

function MetodoCard({
    texto,
    descripcion,
    icono: Icono,
    onClick,
}: {
    texto: string;
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
            className="group rounded-[22px] border border-[#DFE6E2] bg-[#FBFCFA] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#AFC2B8] hover:bg-white hover:shadow-[0_9px_24px_rgba(36,48,44,0.07)]"
        >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong transition group-hover:bg-sidebar group-hover:text-white">
                <Icono className="h-5 w-5" />
            </div>

            <p className="mt-4 font-black text-[#2F3D37]">
                {
                    texto
                }
            </p>

            <p className="mt-1 text-xs leading-5 text-[#7B8781]">
                {
                    descripcion
                }
            </p>
        </button>
    );
}

function PagoCard({
    pago,
    indice,
    permitirEliminar,
    terminales,
    simboloMoneda,
    actualizar,
    cambiarMetodo,
    eliminar,
}: {
    pago: PagoFormulario;
    indice: number;
    permitirEliminar: boolean;
    terminales: TerminalPosAbono[];
    simboloMoneda: string;
    actualizar: (
        idLocal: string,
        cambios: Partial<PagoFormulario>,
    ) => void;
    cambiarMetodo: (
        pago: PagoFormulario,
        metodo: PagoFormulario["metodoPago"],
    ) => void;
    eliminar: (
        idLocal: string,
    ) => void;
}) {
    const terminal =
        terminales.find(
            (
                item,
            ) =>
                item.id ===
                pago.terminalPosId,
        );

    const comision =
        pago.metodoPago ===
            "TARJETA" &&
            terminal
            ? (
                Number(
                    pago.monto,
                ) *
                Number(
                    terminal.porcentaje_comision,
                )
            ) /
            100
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

    const MetodoIcono =
        pago.metodoPago ===
            "EFECTIVO"
            ? Banknote
            : pago.metodoPago ===
                "TARJETA"
                ? CreditCard
                : Landmark;

    return (
        <article className="salon-panel overflow-hidden border border-border bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-[#E9EDEA] bg-[#FBFCFA] px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                        <MetodoIcono className="h-4 w-4" />
                    </div>

                    <div>
                        <p className="text-sm font-black text-[#33413B]">
                            Método{" "}
                            {
                                indice +
                                1
                            }
                        </p>

                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#87958D]">
                            {formatearMetodo(
                                pago.metodoPago,
                            )}
                        </p>
                    </div>
                </div>

                {permitirEliminar && (
                    <button
                        type="button"
                        onClick={() =>
                            eliminar(
                                pago.idLocal,
                            )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-[#A25E5E] transition hover:bg-[#F8E5E5]"
                        aria-label="Eliminar método"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-[#6D7A74]">
                            Método
                        </span>

                        <select
                            value={
                                pago.metodoPago
                            }
                            onChange={(
                                event,
                            ) =>
                                cambiarMetodo(
                                    pago,
                                    event
                                        .target
                                        .value as PagoFormulario["metodoPago"],
                                )
                            }
                            className="salon-control w-full border border-border-strong bg-white px-4 text-[#33413B]"
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
                        </select>
                    </label>

                    <label>
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-[#6D7A74]">
                            Monto aplicado
                        </span>

                        <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#829089]">
                                {
                                    simboloMoneda
                                }
                            </span>

                            <input
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={
                                    pago.monto
                                }
                                onChange={(
                                    event,
                                ) => {
                                    const nuevoMonto =
                                        Number(
                                            event
                                                .target
                                                .value,
                                        );

                                    actualizar(
                                        pago.idLocal,
                                        {
                                            monto:
                                                nuevoMonto,
                                            montoRecibido:
                                                pago.metodoPago ===
                                                    "EFECTIVO"
                                                    ? nuevoMonto
                                                    : pago.montoRecibido,
                                        },
                                    );
                                }}
                                className="salon-control w-full border border-border-strong bg-white pl-12 pr-4 text-right text-sidebar"
                            />
                        </div>
                    </label>
                </div>

                {pago.metodoPago ===
                    "EFECTIVO" && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-[#6D7A74]">
                                    Efectivo recibido
                                </span>

                                <input
                                    type="number"
                                    min={
                                        pago.monto
                                    }
                                    step={0.01}
                                    value={
                                        pago.montoRecibido ??
                                        pago.monto
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        actualizar(
                                            pago.idLocal,
                                            {
                                                montoRecibido:
                                                    Number(
                                                        event
                                                            .target
                                                            .value,
                                                    ),
                                            },
                                        )
                                    }
                                    className="salon-control w-full border border-border-strong bg-white px-4 text-right text-sidebar"
                                />
                            </label>

                            <MiniResultado
                                titulo="Cambio a entregar"
                                valor={`${simboloMoneda} ${cambio.toFixed(
                                    2,
                                )}`}
                                destacado={
                                    cambio >
                                    0
                                }
                            />
                        </div>
                    )}

                {pago.metodoPago ===
                    "TARJETA" && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-[#6D7A74]">
                                    Terminal POS
                                </span>

                                <select
                                    value={
                                        pago.terminalPosId ??
                                        ""
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        actualizar(
                                            pago.idLocal,
                                            {
                                                terminalPosId:
                                                    event
                                                        .target
                                                        .value ||
                                                    null,
                                            },
                                        )
                                    }
                                    className="salon-control w-full border border-border-strong bg-white px-4 text-[#33413B]"
                                >
                                    <option value="">
                                        Selecciona POS
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
                                                ).toLocaleString(
                                                    "es-NI",
                                                    {
                                                        maximumFractionDigits:
                                                            4,
                                                    },
                                                )}
                                                %
                                            </option>
                                        ),
                                    )}
                                </select>
                            </label>

                            <MiniResultado
                                titulo="Comisión estimada"
                                valor={`${simboloMoneda} ${comision.toFixed(
                                    2,
                                )}`}
                            />
                        </div>
                    )}

                {pago.metodoPago ===
                    "TRANSFERENCIA" && (
                        <label className="mt-4 block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-[#6D7A74]">
                                Referencia de transferencia
                            </span>

                            <input
                                value={
                                    pago.referencia ??
                                    ""
                                }
                                onChange={(
                                    event,
                                ) =>
                                    actualizar(
                                        pago.idLocal,
                                        {
                                            referencia:
                                                event
                                                    .target
                                                    .value,
                                        },
                                    )
                                }
                                placeholder="Número de transferencia o comprobante"
                                className="salon-control w-full border border-border-strong bg-white px-4 font-semibold outline-none transition focus:border-primary"
                            />
                        </label>
                    )}
            </div>
        </article>
    );
}

function HeroDato({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#AEC0B7]">
                {
                    titulo
                }
            </p>

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
    resaltado = false,
    grande = false,
}: {
    titulo: string;
    valor: string;
    resaltado?: boolean;
    grande?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span
                className={[
                    "text-sm",
                    grande
                        ? "font-black text-sidebar"
                        : "font-semibold text-text-secondary",
                ].join(
                    " ",
                )}
            >
                {
                    titulo
                }
            </span>

            <strong
                className={[
                    grande
                        ? "text-xl"
                        : "text-sm",
                    resaltado
                        ? "text-primary-strong"
                        : grande
                            ? "text-sidebar"
                            : "text-[#33413B]",
                ].join(
                    " ",
                )}
            >
                {
                    valor
                }
            </strong>
        </div>
    );
}

function MiniResultado({
    titulo,
    valor,
    destacado = false,
}: {
    titulo: string;
    valor: string;
    destacado?: boolean;
}) {
    return (
        <div
            className={[
                "rounded-2xl border p-4",
                destacado
                    ? "border-[#C8DBD1] bg-surface-soft"
                    : "border-border bg-[#FBFCFA]",
            ].join(
                " ",
            )}
        >
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#829089]">
                {
                    titulo
                }
            </p>

            <p className="mt-1 text-base font-black text-[#33413B]">
                {
                    valor
                }
            </p>
        </div>
    );
}

function crearPago(
    metodoPago: PagoFormulario["metodoPago"],
    monto: number,
): PagoFormulario {
    return {
        idLocal:
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random()}`,
        metodoPago,
        monto: Number(
            Math.max(
                0,
                monto,
            ).toFixed(
                2,
            ),
        ),
        montoRecibido:
            metodoPago ===
                "EFECTIVO"
                ? Number(
                    Math.max(
                        0,
                        monto,
                    ).toFixed(
                        2,
                    ),
                )
                : null,
        terminalPosId:
            null,
        referencia:
            null,
        banco:
            null,
        observaciones:
            null,
    };
}

function formatearMetodo(
    metodo: string,
) {
    const nombres: Record<
        string,
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
    ] ?? metodo;
}
