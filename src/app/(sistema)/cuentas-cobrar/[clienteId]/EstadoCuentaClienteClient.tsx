"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    CalendarClock,
    CheckCircle2,
    CircleDollarSign,
    CreditCard,
    Eye,
    FileText,
    Phone,
    ReceiptText,
    UserRound,
    WalletCards,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cambiarVencimiento } from "./actions";

export type ClienteEstadoCuenta = {
    id: string;
    codigo_cliente: string | null;
    nombre_completo: string;
    telefono: string | null;
    whatsapp: string | null;
    correo: string | null;
};

export type CuentaClienteDetalle = {
    id: string;
    codigo_cuenta: string;
    sucursal_id: string;
    cliente_id: string;
    venta_id: string | null;
    cita_id: string | null;
    monto_original: number;
    monto_abonado: number;
    saldo_pendiente: number;
    fecha_origen: string;
    fecha_vencimiento: string | null;
    estado: string;
    observaciones: string | null;

    sucursales: {
        nombre: string;
    } | null;

    ventas: {
        id: string;
        codigo_venta: string | null;
        tipo_venta: string;
        total: number;
        monto_pagado: number;
        saldo_pendiente: number;
        estado: string;
        estado_pago: string;
        fecha_venta: string;
    } | null;

    cuentas_cobrar_abonos: {
        id: string;
        monto: number;
        estado: string;
        referencia: string | null;
        observaciones: string | null;
        fecha_abono: string;

        cuentas_cobrar_abono_pagos: {
            id: string;
            metodo_pago: string;
            monto: number;
            monto_recibido: number | null;
            cambio: number;
            porcentaje_comision_pos: number;
            monto_comision_pos: number;
            monto_neto: number | null;
            referencia: string | null;
            banco: string | null;
            observaciones: string | null;
            estado: string;
            fecha_pago: string;

            terminales_pos: {
                nombre: string;
                banco: string | null;
            } | null;
        }[];
    }[];
};

type FiltroEstado =
    | "TODAS"
    | "PENDIENTES"
    | "PAGADAS"
    | "ANULADAS";

export default function EstadoCuentaClienteClient({
    cliente,
    cuentas,
    simboloMoneda,
}: {
    cliente: ClienteEstadoCuenta;
    cuentas: CuentaClienteDetalle[];
    simboloMoneda: string;
}) {
    const router = useRouter();
    const [actualizandoVencimiento, iniciarActualizacionVencimiento] =
        useTransition();

    const [filtro, setFiltro] =
        useState<FiltroEstado>("TODAS");

    const cuentasFiltradas = useMemo(() => {
        return cuentas.filter((cuenta) => {
            const estado =
                estadoCuentaActual(cuenta);

            if (filtro === "PENDIENTES") {
                return [
                    "PENDIENTE",
                    "PARCIAL",
                    "VENCIDA",
                ].includes(estado);
            }

            if (filtro === "PAGADAS") {
                return estado === "PAGADA";
            }

            if (filtro === "ANULADAS") {
                return estado === "ANULADA";
            }

            return true;
        });
    }, [cuentas, filtro]);

    const resumen = useMemo(() => {
        return cuentas.reduce(
            (acumulado, cuenta) => {
                const estado =
                    estadoCuentaActual(cuenta);

                if (estado === "ANULADA") {
                    return acumulado;
                }

                return {
                    deudaOriginal:
                        acumulado.deudaOriginal +
                        Number(
                            cuenta.monto_original,
                        ),
                    abonado:
                        acumulado.abonado +
                        Number(
                            cuenta.monto_abonado,
                        ),
                    pendiente:
                        acumulado.pendiente +
                        Number(
                            cuenta.saldo_pendiente,
                        ),
                    vencido:
                        acumulado.vencido +
                        (estado === "VENCIDA"
                            ? Number(
                                cuenta.saldo_pendiente,
                            )
                            : 0),
                };
            },
            {
                deudaOriginal: 0,
                abonado: 0,
                pendiente: 0,
                vencido: 0,
            },
        );
    }, [cuentas]);

    const abonos = useMemo(() => {
        return cuentas
            .flatMap((cuenta) =>
                cuenta.cuentas_cobrar_abonos
                    .filter(
                        (abono) =>
                            abono.estado ===
                            "APLICADO",
                    )
                    .map((abono) => ({
                        ...abono,
                        cuentaId: cuenta.id,
                        codigoCuenta:
                            cuenta.codigo_cuenta,
                        ventaId:
                            cuenta.venta_id,
                        codigoVenta:
                            cuenta.ventas
                                ?.codigo_venta ??
                            null,
                    })),
            )
            .sort(
                (a, b) =>
                    new Date(
                        b.fecha_abono,
                    ).getTime() -
                    new Date(
                        a.fecha_abono,
                    ).getTime(),
            );
    }, [cuentas]);

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link
                            href="/cuentas-cobrar"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a Cuentas por cobrar
                        </Link>

                        <div className="mt-5 flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <UserRound className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Estado de cuenta
                                </p>

                                <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                    {
                                        cliente.nombre_completo
                                    }
                                </h1>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#CFD9D4]">
                                    {cliente.codigo_cliente && (
                                        <span>
                                            {
                                                cliente.codigo_cliente
                                            }
                                        </span>
                                    )}

                                    {(cliente.telefono ||
                                        cliente.whatsapp) && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Phone className="h-4 w-4" />
                                                {cliente.telefono ||
                                                    cliente.whatsapp}
                                            </span>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#B9C8C1]">
                            Saldo total pendiente
                        </p>
                        <p className="mt-2 text-3xl font-bold">
                            {dinero(
                                resumen.pendiente,
                            )}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Resumen
                    titulo="Deuda original"
                    valor={dinero(
                        resumen.deudaOriginal,
                    )}
                    icono={CircleDollarSign}
                />
                <Resumen
                    titulo="Total abonado"
                    valor={dinero(
                        resumen.abonado,
                    )}
                    icono={CheckCircle2}
                />
                <Resumen
                    titulo="Saldo pendiente"
                    valor={dinero(
                        resumen.pendiente,
                    )}
                    icono={WalletCards}
                />
                <Resumen
                    titulo="Saldo vencido"
                    valor={dinero(
                        resumen.vencido,
                    )}
                    icono={AlertTriangle}
                />
            </section>

            <section className="rounded-3xl border border-[#E3E7E4] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap gap-2">
                    {(
                        [
                            [
                                "TODAS",
                                "Todas",
                            ],
                            [
                                "PENDIENTES",
                                "Pendientes",
                            ],
                            [
                                "PAGADAS",
                                "Pagadas",
                            ],
                            [
                                "ANULADAS",
                                "Anuladas",
                            ],
                        ] as const
                    ).map(
                        ([
                            valor,
                            texto,
                        ]) => (
                            <button
                                key={valor}
                                type="button"
                                onClick={() =>
                                    setFiltro(
                                        valor,
                                    )
                                }
                                className={[
                                    "h-9 rounded-xl px-4 text-sm font-bold transition",
                                    filtro ===
                                        valor
                                        ? "bg-[#26332F] text-white"
                                        : "bg-[#EEF2EF] text-[#52605A] hover:bg-[#E3E8E5]",
                                ].join(
                                    " ",
                                )}
                            >
                                {texto}
                            </button>
                        ),
                    )}
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
                <div className="space-y-6">
                    <Seccion
                        titulo="Deudas del cliente"
                        subtitulo={`${cuentasFiltradas.length} cuenta${cuentasFiltradas.length ===
                                1
                                ? ""
                                : "s"
                            }`}
                    >
                        {cuentasFiltradas.length ===
                            0 ? (
                            <EstadoVacio
                                titulo="No hay cuentas en este filtro"
                                descripcion="Selecciona otro estado para revisar el historial."
                            />
                        ) : (
                            <div className="space-y-4">
                                {cuentasFiltradas.map(
                                    (cuenta) => (
                                        <CuentaCard
                                            key={
                                                cuenta.id
                                            }
                                            cuenta={
                                                cuenta
                                            }
                                            dinero={
                                                dinero
                                            }
                                            actualizandoVencimiento={
                                                actualizandoVencimiento
                                            }
                                            cambiarFecha={(
                                                cuentaId,
                                                fecha,
                                            ) => {
                                                iniciarActualizacionVencimiento(
                                                    async () => {
                                                        const resultado =
                                                            await cambiarVencimiento(
                                                                cuentaId,
                                                                cliente.id,
                                                                fecha || null,
                                                            );

                                                        if (
                                                            !resultado.exito
                                                        ) {
                                                            alert(
                                                                resultado.mensaje,
                                                            );
                                                            return;
                                                        }

                                                        router.refresh();
                                                    },
                                                );
                                            }}
                                        />
                                    ),
                                )}
                            </div>
                        )}
                    </Seccion>

                    <Seccion
                        titulo="Historial de abonos"
                        subtitulo={`${abonos.length} abono${abonos.length ===
                                1
                                ? ""
                                : "s"
                            } aplicado${abonos.length ===
                                1
                                ? ""
                                : "s"
                            }`}
                    >
                        {abonos.length === 0 ? (
                            <EstadoVacio
                                titulo="Todavía no hay abonos"
                                descripcion="Los pagos realizados a las cuentas aparecerán aquí."
                            />
                        ) : (
                            <div className="divide-y divide-[#E8ECE9]">
                                {abonos.map(
                                    (abono) => (
                                        <AbonoFila
                                            key={
                                                abono.id
                                            }
                                            abono={
                                                abono
                                            }
                                            dinero={
                                                dinero
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        )}
                    </Seccion>
                </div>

                <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                    <section className="rounded-3xl border border-[#E3E7E4] bg-white p-6 shadow-sm">
                        <h2 className="font-bold text-[#24302C]">
                            Resumen
                        </h2>

                        <div className="mt-5 space-y-3">
                            <Fila
                                titulo="Deuda acumulada"
                                valor={dinero(
                                    resumen.deudaOriginal,
                                )}
                            />
                            <Fila
                                titulo="Abonos"
                                valor={`- ${dinero(
                                    resumen.abonado,
                                )}`}
                            />

                            <div className="border-t border-[#DDE3DF] pt-3">
                                <Fila
                                    titulo="Saldo actual"
                                    valor={dinero(
                                        resumen.pendiente,
                                    )}
                                    destacado
                                />
                            </div>
                        </div>

                        {resumen.pendiente >
                            0 && (
                                <div className="mt-5 rounded-2xl bg-[#FAF0DC] p-4 text-sm text-[#81652F]">
                                    <p className="font-bold">
                                        Tiene saldo pendiente
                                    </p>
                                    <p className="mt-1 leading-5">
                                        El registro de abonos se
                                        habilitará en el siguiente
                                        paso.
                                    </p>
                                </div>
                            )}
                    </section>

                    <section className="rounded-3xl border border-[#E3E7E4] bg-white p-6 shadow-sm">
                        <h2 className="font-bold text-[#24302C]">
                            Datos del cliente
                        </h2>

                        <div className="mt-5 space-y-3">
                            <Fila
                                titulo="Código"
                                valor={
                                    cliente.codigo_cliente ??
                                    "Sin código"
                                }
                            />
                            <Fila
                                titulo="Teléfono"
                                valor={
                                    cliente.telefono ??
                                    "No registrado"
                                }
                            />
                            <Fila
                                titulo="WhatsApp"
                                valor={
                                    cliente.whatsapp ??
                                    "No registrado"
                                }
                            />
                            <Fila
                                titulo="Correo"
                                valor={
                                    cliente.correo ??
                                    "No registrado"
                                }
                            />
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

function CuentaCard({
    cuenta,
    dinero,
    actualizandoVencimiento,
    cambiarFecha,
}: {
    cuenta: CuentaClienteDetalle;
    dinero: (valor: number) => string;
    actualizandoVencimiento: boolean;
    cambiarFecha: (
        cuentaId: string,
        fecha: string,
    ) => void;
}) {
    const estado =
        estadoCuentaActual(cuenta);

    const porcentaje =
        Number(cuenta.monto_original) > 0
            ? Math.min(
                100,
                Math.max(
                    0,
                    (Number(
                        cuenta.monto_abonado,
                    ) /
                        Number(
                            cuenta.monto_original,
                        )) *
                    100,
                ),
            )
            : 0;

    return (
        <article className="rounded-2xl border border-[#E3E7E4] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#24302C]">
                            {
                                cuenta.codigo_cuenta
                            }
                        </p>
                        <EstadoCuenta
                            estado={estado}
                        />
                    </div>

                    <p className="mt-2 text-sm text-[#6B756F]">
                        {cuenta.sucursales
                            ?.nombre ??
                            "Sucursal"}{" "}
                        ·{" "}
                        {formatearFecha(
                            cuenta.fecha_origen,
                        )}
                    </p>
                </div>

                {cuenta.venta_id && (
                    <Link
                        href={`/caja/ventas/${cuenta.venta_id}`}
                        className="inline-flex h-9 items-center gap-2 self-start rounded-xl bg-[#DCE7E2] px-3 text-xs font-bold text-[#43524B]"
                    >
                        <Eye className="h-4 w-4" />
                        {cuenta.ventas
                            ?.codigo_venta ??
                            "Ver venta"}
                    </Link>
                )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniDato
                    titulo="Deuda"
                    valor={dinero(
                        cuenta.monto_original,
                    )}
                />
                <MiniDato
                    titulo="Abonado"
                    valor={dinero(
                        cuenta.monto_abonado,
                    )}
                />
                <MiniDato
                    titulo="Saldo"
                    valor={dinero(
                        cuenta.saldo_pendiente,
                    )}
                />
            </div>

            <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#6B756F]">
                        Progreso de pago
                    </span>
                    <span className="font-bold text-[#52605A]">
                        {porcentaje.toLocaleString(
                            "es-NI",
                            {
                                maximumFractionDigits: 0,
                            },
                        )}
                        %
                    </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#EEF2EF]">
                    <div
                        className="h-full rounded-full bg-[#6F8F83]"
                        style={{
                            width: `${porcentaje}%`,
                        }}
                    />
                </div>
            </div>

            {[
                "PENDIENTE",
                "PARCIAL",
                "VENCIDA",
            ].includes(estado) &&
                Number(
                    cuenta.saldo_pendiente,
                ) > 0 && (
                    <Link
                        href={`/cuentas-cobrar/${cuenta.cliente_id}/abonar/${cuenta.id}`}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#6F8F83] text-sm font-bold text-white transition hover:bg-[#607F74]"
                    >
                        <WalletCards className="h-4 w-4" />
                        Registrar abono
                    </Link>
                )}

            {estado !== "ANULADA" && (
                <label className="mt-4 block rounded-xl bg-[#FBFCFA] p-3">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#52605A]">
                        <CalendarClock className="h-4 w-4" />
                        Fecha de vencimiento
                    </span>

                    <input
                        type="date"
                        defaultValue={
                            cuenta.fecha_vencimiento ??
                            ""
                        }
                        disabled={
                            actualizandoVencimiento
                        }
                        onBlur={(event) => {
                            const nuevaFecha =
                                event.target.value;

                            if (
                                nuevaFecha !==
                                (cuenta.fecha_vencimiento ??
                                    "")
                            ) {
                                cambiarFecha(
                                    cuenta.id,
                                    nuevaFecha,
                                );
                            }
                        }}
                        className="h-10 w-full rounded-lg border border-[#D4DAD6] bg-white px-3 text-sm disabled:opacity-50"
                    />
                </label>
            )}

            {cuenta.fecha_vencimiento && (
                <div className="mt-3 flex items-center gap-2 text-xs text-[#6B756F]">
                    <CalendarClock className="h-4 w-4" />
                    Vence:{" "}
                    {formatearFechaSimple(
                        cuenta.fecha_vencimiento,
                    )}
                </div>
            )}

            {cuenta.observaciones && (
                <p className="mt-4 rounded-xl bg-[#FBFCFA] p-3 text-sm leading-6 text-[#6B756F]">
                    {cuenta.observaciones}
                </p>
            )}
        </article>
    );
}

type AbonoListado = {
    id: string;
    monto: number;
    referencia: string | null;
    observaciones: string | null;
    fecha_abono: string;
    cuentaId: string;
    codigoCuenta: string;
    ventaId: string | null;
    codigoVenta: string | null;
    cuentas_cobrar_abono_pagos: CuentaClienteDetalle["cuentas_cobrar_abonos"][number]["cuentas_cobrar_abono_pagos"];
};

function AbonoFila({
    abono,
    dinero,
}: {
    abono: AbonoListado;
    dinero: (valor: number) => string;
}) {
    const pagos =
        abono.cuentas_cobrar_abono_pagos.filter(
            (pago) =>
                pago.estado === "APLICADO",
        );

    return (
        <article className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="font-bold text-[#24302C]">
                        {dinero(abono.monto)}
                    </p>
                    <p className="mt-1 text-xs text-[#829089]">
                        {formatearFechaHora(
                            abono.fecha_abono,
                        )}{" "}
                        · {abono.codigoCuenta}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {pagos.map(
                            (pago) => (
                                <span
                                    key={
                                        pago.id
                                    }
                                    className="rounded-full bg-[#EEF2EF] px-2.5 py-1 text-[10px] font-bold text-[#52605A]"
                                >
                                    {pago.metodo_pago ===
                                        "TARJETA" &&
                                        pago.terminales_pos
                                            ?.nombre
                                        ? `Tarjeta · ${pago.terminales_pos.nombre}`
                                        : formatearTexto(
                                            pago.metodo_pago,
                                        )}
                                    {" · "}
                                    {dinero(
                                        pago.monto,
                                    )}
                                </span>
                            ),
                        )}
                    </div>

                    {abono.observaciones && (
                        <p className="mt-2 text-xs text-[#6B756F]">
                            {
                                abono.observaciones
                            }
                        </p>
                    )}
                </div>

                {abono.ventaId && (
                    <Link
                        href={`/caja/ventas/${abono.ventaId}`}
                        className="inline-flex h-9 items-center gap-2 self-start rounded-xl border border-[#DCE3DF] px-3 text-xs font-bold text-[#52605A]"
                    >
                        <ReceiptText className="h-4 w-4" />
                        {abono.codigoVenta ??
                            "Venta"}
                    </Link>
                )}
            </div>
        </article>
    );
}

function estadoCuentaActual(
    cuenta: CuentaClienteDetalle,
) {
    if (
        cuenta.estado === "PAGADA" ||
        cuenta.estado === "ANULADA"
    ) {
        return cuenta.estado;
    }

    const hoy =
        new Date()
            .toISOString()
            .slice(0, 10);

    if (
        cuenta.fecha_vencimiento &&
        cuenta.fecha_vencimiento <
        hoy &&
        Number(
            cuenta.saldo_pendiente,
        ) > 0
    ) {
        return "VENCIDA";
    }

    return cuenta.estado;
}

function EstadoCuenta({
    estado,
}: {
    estado: string;
}) {
    const estilos: Record<
        string,
        string
    > = {
        PENDIENTE:
            "bg-[#F8E5E5] text-[#A25E5E]",
        PARCIAL:
            "bg-[#FAF0DC] text-[#9A742D]",
        PAGADA:
            "bg-[#E3EEE8] text-[#527865]",
        VENCIDA:
            "bg-[#F0DEDE] text-[#934A4A]",
        ANULADA:
            "bg-[#EFE7E1] text-[#8B6754]",
    };

    return (
        <span
            className={[
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                estilos[estado] ??
                "bg-[#EEF2EF] text-[#6B756F]",
            ].join(" ")}
        >
            {formatearTexto(estado)}
        </span>
    );
}

function Resumen({
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
        <article className="rounded-3xl border border-[#E3E7E4] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-[#6B756F]">
                        {titulo}
                    </p>
                    <p className="mt-3 text-xl font-bold text-[#24302C]">
                        {valor}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function Seccion({
    titulo,
    subtitulo,
    children,
}: {
    titulo: string;
    subtitulo?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-sm">
            <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                <h2 className="font-bold text-[#24302C]">
                    {titulo}
                </h2>
                {subtitulo && (
                    <p className="mt-1 text-xs text-[#829089]">
                        {subtitulo}
                    </p>
                )}
            </header>
            <div className="p-5 sm:p-6">
                {children}
            </div>
        </section>
    );
}

function MiniDato({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl bg-[#FBFCFA] p-3">
            <p className="text-[10px] font-bold uppercase text-[#829089]">
                {titulo}
            </p>
            <p className="mt-1 text-sm font-bold text-[#33413B]">
                {valor}
            </p>
        </div>
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
                        : "max-w-[210px] truncate text-right text-sm text-[#33413B]"
                }
                title={valor}
            >
                {valor}
            </strong>
        </div>
    );
}

function EstadoVacio({
    titulo,
    descripcion,
}: {
    titulo: string;
    descripcion: string;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-[#829089]" />
            <p className="mt-3 font-bold text-[#24302C]">
                {titulo}
            </p>
            <p className="mt-1 text-sm text-[#6B756F]">
                {descripcion}
            </p>
        </div>
    );
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
    ).format(new Date(fecha));
}

function formatearFechaHora(
    fecha: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone:
                "America/Managua",
        },
    ).format(new Date(fecha));
}

function formatearFechaSimple(
    fecha: string,
) {
    const [anio, mes, dia] =
        fecha.split("-");

    return `${dia}/${mes}/${anio}`;
}

function formatearTexto(
    valor: string,
) {
    return valor
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letra) =>
            letra.toUpperCase(),
        );
}