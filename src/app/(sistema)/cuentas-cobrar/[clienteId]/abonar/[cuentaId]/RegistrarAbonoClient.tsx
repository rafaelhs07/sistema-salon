"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    CheckCircle2,
    CreditCard,
    Landmark,
    LoaderCircle,
    Plus,
    ReceiptText,
    Store,
    Trash2,
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

const metodos = [
    {
        valor: "EFECTIVO",
        texto: "Efectivo",
        icono: Banknote,
    },
    {
        valor: "TARJETA",
        texto: "Tarjeta / POS",
        icono: CreditCard,
    },
    {
        valor: "TRANSFERENCIA",
        texto: "Transferencia",
        icono: Landmark,
    },
    {
        valor: "DEPOSITO",
        texto: "Depósito",
        icono: Landmark,
    },
    {
        valor: "OTRO",
        texto: "Otro",
        icono: WalletCards,
    },
] as const;

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
    const [guardando, iniciarGuardado] =
        useTransition();
    const [mensaje, setMensaje] =
        useState<Mensaje>(null);

    const [cajaId, setCajaId] =
        useState(cajas[0]?.id ?? "");
    const [referencia, setReferencia] =
        useState("");
    const [observaciones, setObservaciones] =
        useState("");

    const [pagos, setPagos] =
        useState<PagoFormulario[]>([
            crearPago(
                "EFECTIVO",
                Number(
                    cuenta.saldo_pendiente,
                ),
            ),
        ]);

    const totalPagos = useMemo(
        () =>
            pagos.reduce(
                (total, pago) =>
                    total +
                    Number(
                        pago.monto || 0,
                    ),
                0,
            ),
        [pagos],
    );

    const saldoRestante =
        Number(
            cuenta.saldo_pendiente,
        ) - totalPagos;

    const terminalesDisponibles =
        terminales.filter(
            (terminal) =>
                terminal.sucursal_id ===
                null ||
                terminal.sucursal_id ===
                cuenta.sucursal_id,
        );

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function agregarPago() {
        if (!permitirPagoCombinado) {
            return;
        }

        const restante = Math.max(
            0,
            Number(
                cuenta.saldo_pendiente,
            ) - totalPagos,
        );

        setPagos((actuales) => [
            ...actuales,
            crearPago(
                "EFECTIVO",
                restante,
            ),
        ]);
    }

    function eliminarPago(
        idLocal: string,
    ) {
        if (pagos.length === 1) {
            return;
        }

        setPagos((actuales) =>
            actuales.filter(
                (pago) =>
                    pago.idLocal !== idLocal,
            ),
        );
    }

    function actualizarPago(
        idLocal: string,
        cambios: Partial<PagoFormulario>,
    ) {
        setPagos((actuales) =>
            actuales.map((pago) =>
                pago.idLocal === idLocal
                    ? {
                        ...pago,
                        ...cambios,
                    }
                    : pago,
            ),
        );
        setMensaje(null);
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
                terminalPosId: null,
                banco: null,
            },
        );
    }

    function enviar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setMensaje(null);

        if (!cajaId) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "No hay una caja abierta para esta sucursal.",
            });
            return;
        }

        if (totalPagos <= 0) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "El abono debe ser mayor que cero.",
            });
            return;
        }

        if (
            totalPagos >
            Number(
                cuenta.saldo_pendiente,
            ) +
            0.005
        ) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "El abono no puede superar el saldo pendiente.",
            });
            return;
        }

        for (const pago of pagos) {
            if (
                Number(pago.monto) <= 0
            ) {
                setMensaje({
                    tipo: "ERROR",
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
                    tipo: "ERROR",
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
                    tipo: "ERROR",
                    texto:
                        "El efectivo recibido no puede ser menor al monto aplicado.",
                });
                return;
            }
        }

        iniciarGuardado(async () => {
            const resultado =
                await registrarAbono({
                    cuentaId:
                        cuenta.id,
                    clienteId:
                        cuenta.cliente_id,
                    cajaSesionId:
                        cajaId,
                    pagos: pagos.map(
                        ({
                            idLocal,
                            ...pago
                        }) => pago,
                    ),
                    referencia,
                    observaciones,
                });

            if (!resultado.exito) {
                setMensaje({
                    tipo: "ERROR",
                    texto:
                        resultado.mensaje,
                });
                return;
            }

            router.push(
                `/cuentas-cobrar/${cuenta.cliente_id}`,
            );
            router.refresh();
        });
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al estado de cuenta
                    </Link>

                    <p className="mt-5 text-sm font-semibold text-[#B9C8C1]">
                        Cuentas por cobrar
                    </p>

                    <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                        Registrar abono
                    </h1>

                    <p className="mt-3 text-[#CFD9D4]">
                        {cuenta.clientes
                            ?.nombre_completo ??
                            "Cliente"}{" "}
                        · {cuenta.codigo_cuenta}
                    </p>
                </div>
            </section>

            {mensaje && (
                <div
                    className={[
                        "flex items-start gap-3 rounded-2xl border p-4",
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

                    <p className="text-sm font-semibold">
                        {mensaje.texto}
                    </p>
                </div>
            )}

            <section className="grid gap-4 sm:grid-cols-3">
                <Resumen
                    titulo="Deuda original"
                    valor={dinero(
                        cuenta.monto_original,
                    )}
                />
                <Resumen
                    titulo="Ya abonado"
                    valor={dinero(
                        cuenta.monto_abonado,
                    )}
                />
                <Resumen
                    titulo="Saldo pendiente"
                    valor={dinero(
                        cuenta.saldo_pendiente,
                    )}
                    destacado
                />
            </section>

            <form
                onSubmit={enviar}
                className="grid gap-6 xl:grid-cols-[1fr_360px]"
            >
                <div className="space-y-6">
                    <section className="rounded-3xl border border-[#E3E7E4] bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="font-bold text-[#24302C]">
                                    Métodos de pago
                                </h2>
                                <p className="mt-1 text-sm text-[#6B756F]">
                                    Puedes distribuir el
                                    abono entre varios métodos.
                                </p>
                            </div>

                            {permitirPagoCombinado && (
                                <button
                                    type="button"
                                    onClick={
                                        agregarPago
                                    }
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar método
                                </button>
                            )}
                        </div>

                        <div className="mt-5 space-y-4">
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
                    </section>

                    <section className="rounded-3xl border border-[#E3E7E4] bg-white p-6 shadow-sm">
                        <h2 className="font-bold text-[#24302C]">
                            Información adicional
                        </h2>

                        <label className="mt-5 block">
                            <span className="mb-2 block text-sm font-bold text-[#3D4A45]">
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
                                placeholder="Número de recibo, comprobante..."
                                className="h-11 w-full rounded-xl border border-[#D4DAD6] px-4 text-sm outline-none focus:border-[#6F8F83]"
                            />
                        </label>

                        <label className="mt-4 block">
                            <span className="mb-2 block text-sm font-bold text-[#3D4A45]">
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
                                className="w-full rounded-xl border border-[#D4DAD6] p-3 text-sm outline-none focus:border-[#6F8F83]"
                            />
                        </label>
                    </section>
                </div>

                <aside className="xl:sticky xl:top-24 xl:self-start">
                    <section className="rounded-3xl border border-[#E3E7E4] bg-white p-6 shadow-sm">
                        <h2 className="font-bold text-[#24302C]">
                            Resumen del abono
                        </h2>

                        <label className="mt-5 block">
                            <span className="mb-2 block text-sm font-bold text-[#3D4A45]">
                                Caja
                            </span>

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
                                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 text-sm"
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
                        </label>

                        <div className="mt-5 space-y-3">
                            <Fila
                                titulo="Saldo actual"
                                valor={dinero(
                                    cuenta.saldo_pendiente,
                                )}
                            />
                            <Fila
                                titulo="Abono"
                                valor={dinero(
                                    totalPagos,
                                )}
                            />

                            <div className="border-t border-[#DDE3DF] pt-3">
                                <Fila
                                    titulo="Saldo después"
                                    valor={dinero(
                                        Math.max(
                                            0,
                                            saldoRestante,
                                        ),
                                    )}
                                    destacado
                                />
                            </div>
                        </div>

                        {saldoRestante <
                            -0.005 && (
                                <div className="mt-4 rounded-xl bg-[#F8E5E5] p-3 text-xs font-semibold text-[#985858]">
                                    El abono supera el
                                    saldo pendiente.
                                </div>
                            )}

                        {cajas.length ===
                            0 && (
                                <div className="mt-4 rounded-xl bg-[#FAF0DC] p-3 text-xs font-semibold text-[#81652F]">
                                    Debes abrir una caja
                                    en esta sucursal antes
                                    de recibir el abono.
                                </div>
                            )}

                        <button
                            type="submit"
                            disabled={
                                guardando ||
                                !cajaId ||
                                totalPagos <= 0 ||
                                saldoRestante <
                                -0.005
                            }
                            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6F8F83] font-bold text-white transition hover:bg-[#607F74] disabled:cursor-not-allowed disabled:opacity-50"
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
                    </section>
                </aside>
            </form>
        </div>
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
        metodo:
            PagoFormulario["metodoPago"],
    ) => void;
    eliminar: (
        idLocal: string,
    ) => void;
}) {
    const terminal =
        terminales.find(
            (item) =>
                item.id ===
                pago.terminalPosId,
        );

    const comision =
        pago.metodoPago ===
            "TARJETA" &&
            terminal
            ? Number(pago.monto) *
            Number(
                terminal.porcentaje_comision,
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

    return (
        <article className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-[#24302C]">
                    Pago {indice + 1}
                </p>

                {permitirEliminar && (
                    <button
                        type="button"
                        onClick={() =>
                            eliminar(
                                pago.idLocal,
                            )
                        }
                        className="rounded-lg p-2 text-[#A25E5E] hover:bg-[#F8E5E5]"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label>
                    <span className="mb-1 block text-xs font-bold text-[#52605A]">
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
                        className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 text-sm"
                    >
                        {metodos.map(
                            (metodo) => (
                                <option
                                    key={
                                        metodo.valor
                                    }
                                    value={
                                        metodo.valor
                                    }
                                >
                                    {
                                        metodo.texto
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </label>

                <label>
                    <span className="mb-1 block text-xs font-bold text-[#52605A]">
                        Monto
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
                        ) =>
                            actualizar(
                                pago.idLocal,
                                {
                                    monto: Number(
                                        event
                                            .target
                                            .value,
                                    ),
                                    montoRecibido:
                                        pago.metodoPago ===
                                            "EFECTIVO"
                                            ? Number(
                                                event
                                                    .target
                                                    .value,
                                            )
                                            : pago.montoRecibido,
                                },
                            )
                        }
                        className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 text-right text-sm font-bold"
                    />
                </label>
            </div>

            {pago.metodoPago ===
                "EFECTIVO" && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label>
                            <span className="mb-1 block text-xs font-bold text-[#52605A]">
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
                                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 text-right text-sm"
                            />
                        </label>

                        <MiniResultado
                            titulo="Cambio"
                            valor={`${simboloMoneda} ${cambio.toFixed(
                                2,
                            )}`}
                        />
                    </div>
                )}

            {pago.metodoPago ===
                "TARJETA" && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label>
                            <span className="mb-1 block text-xs font-bold text-[#52605A]">
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
                                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 text-sm"
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
                                            }
                                            {" · "}
                                            {Number(
                                                terminal.porcentaje_comision,
                                            ).toLocaleString(
                                                "es-NI",
                                                {
                                                    maximumFractionDigits: 4,
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

            {[
                "TRANSFERENCIA",
                "DEPOSITO",
                "OTRO",
            ].includes(
                pago.metodoPago,
            ) && (
                    <label className="mt-3 block">
                        <span className="mb-1 block text-xs font-bold text-[#52605A]">
                            Referencia
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
                            placeholder="Número de transferencia o comprobante..."
                            className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 text-sm"
                        />
                    </label>
                )}
        </article>
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
            Math.max(0, monto).toFixed(2),
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
        terminalPosId: null,
        referencia: null,
        banco: null,
        observaciones: null,
    };
}

function Resumen({
    titulo,
    valor,
    destacado = false,
}: {
    titulo: string;
    valor: string;
    destacado?: boolean;
}) {
    return (
        <article
            className={[
                "rounded-3xl border p-5 shadow-sm",
                destacado
                    ? "border-[#BFD1C8] bg-[#EAF2EE]"
                    : "border-[#E3E7E4] bg-white",
            ].join(" ")}
        >
            <p className="text-sm text-[#6B756F]">
                {titulo}
            </p>

            <p className="mt-3 text-xl font-bold text-[#24302C]">
                {valor}
            </p>
        </article>
    );
}

function Fila({
    titulo,
    valor,
    destacado = false,
}: {
    titulo: string;
    valor: string;
    destacado?: boolean;
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
                    destacado
                        ? "text-xl text-[#24302C]"
                        : "text-sm text-[#33413B]"
                }
            >
                {valor}
            </strong>
        </div>
    );
}

function MiniResultado({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl border border-[#E3E7E4] bg-white p-3">
            <p className="text-[10px] font-bold uppercase text-[#829089]">
                {titulo}
            </p>

            <p className="mt-1 text-sm font-bold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}