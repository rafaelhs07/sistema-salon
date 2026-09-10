"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    CircleDollarSign,
    Eye,
    FileText,
    Mail,
    Phone,
    ReceiptText,
    Store,
    UserRound,
    WalletCards,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";
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

    const [
        actualizandoVencimiento,
        iniciarActualizacionVencimiento,
    ] = useTransition();

    const [
        filtro,
        setFiltro,
    ] =
        useState<FiltroEstado>(
            "TODAS",
        );

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
                        cuentaId:
                            cuenta.id,
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

    const porcentajeRecuperado =
        resumen.deudaOriginal > 0
            ? Math.min(
                100,
                Math.round(
                    (resumen.abonado /
                        resumen.deudaOriginal) *
                    100,
                ),
            )
            : 0;

    const cuentasPendientes =
        cuentas.filter((cuenta) =>
            [
                "PENDIENTE",
                "PARCIAL",
                "VENCIDA",
            ].includes(
                estadoCuentaActual(cuenta),
            ),
        ).length;

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    return (
        <div className="space-y-6 pb-10">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-secondary/12 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/cuentas-cobrar"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Cuentas por cobrar
                    </Link>

                    <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                                <UserRound className="h-7 w-7" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#AFC2B9]">
                                    Estado de cuenta
                                </p>

                                <h1 className="mt-1 truncate text-3xl font-black tracking-tight sm:text-4xl">
                                    {cliente.nombre_completo}
                                </h1>

                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#CFD9D4]">
                                    {cliente.codigo_cliente && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <ReceiptText className="h-4 w-4" />
                                            {cliente.codigo_cliente}
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

                                    {cliente.correo && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <Mail className="h-4 w-4" />
                                            {cliente.correo}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[570px]">
                            <HeroDato
                                titulo="Saldo pendiente"
                                valor={dinero(
                                    resumen.pendiente,
                                )}
                                icono={WalletCards}
                            />

                            <HeroDato
                                titulo="Vencido"
                                valor={dinero(
                                    resumen.vencido,
                                )}
                                icono={AlertTriangle}
                                alerta
                            />

                            <HeroDato
                                titulo="Cuentas abiertas"
                                valor={String(
                                    cuentasPendientes,
                                )}
                                icono={FileText}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]">
                <div className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Recuperación
                            </p>

                            <h2 className="mt-1 text-xl font-black text-foreground tracking-tight">
                                Progreso de pago del cliente
                            </h2>

                            <p className="mt-1 text-sm text-[#74817B]">
                                Qué parte de la deuda acumulada ya fue cubierta.
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-3xl font-black text-sidebar">
                                {porcentajeRecuperado}%
                            </p>
                            <p className="text-xs font-bold text-[#829089]">
                                recuperado
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E6ECE8]">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                                width: `${porcentajeRecuperado}%`,
                            }}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <MiniDato
                            titulo="Deuda original"
                            valor={dinero(
                                resumen.deudaOriginal,
                            )}
                        />

                        <MiniDato
                            titulo="Total abonado"
                            valor={dinero(
                                resumen.abonado,
                            )}
                        />

                        <MiniDato
                            titulo="Pendiente"
                            valor={dinero(
                                resumen.pendiente,
                            )}
                            destacado
                        />
                    </div>
                </div>

                <div className="rounded-[28px] border border-[#E4E9E6] bg-[#F8FAF8] p-5 shadow-[0_10px_28px_rgba(36,48,44,0.04)] sm:p-6">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                        Perfil financiero
                    </p>

                    <h2 className="mt-1 text-lg font-black text-foreground tracking-tight">
                        Datos rápidos
                    </h2>

                    <div className="mt-5 space-y-3">
                        <DatoCliente
                            titulo="Código"
                            valor={
                                cliente.codigo_cliente ??
                                "Sin código"
                            }
                        />
                        <DatoCliente
                            titulo="Teléfono"
                            valor={
                                cliente.telefono ??
                                "No registrado"
                            }
                        />
                        <DatoCliente
                            titulo="WhatsApp"
                            valor={
                                cliente.whatsapp ??
                                "No registrado"
                            }
                        />
                        <DatoCliente
                            titulo="Correo"
                            valor={
                                cliente.correo ??
                                "No registrado"
                            }
                        />
                    </div>
                </div>
            </section>

            <section className="salon-panel overflow-hidden border border-border bg-white">
                <div className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Cuentas
                            </p>

                            <h2 className="mt-1 text-lg font-black text-foreground tracking-tight">
                                Historial de saldos
                            </h2>
                        </div>

                        <div className="flex gap-2 overflow-x-auto">
                            {(
                                [
                                    ["TODAS", "Todas"],
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
                                ([valor, texto]) => (
                                    <button
                                        key={valor}
                                        type="button"
                                        onClick={() =>
                                            setFiltro(
                                                valor,
                                            )
                                        }
                                        className={[
                                            "h-9 shrink-0 rounded-xl px-4 text-xs font-black transition",
                                            filtro ===
                                                valor
                                                ? "bg-sidebar text-white"
                                                : "bg-surface-soft text-[#52605A] hover:bg-[#E3E8E5]",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        {texto}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6">
                    {cuentasFiltradas.length ===
                        0 ? (
                        <EstadoVacio
                            titulo="No hay cuentas en este filtro"
                            descripcion="Selecciona otro estado para revisar el historial."
                        />
                    ) : (
                        <div className="grid gap-4 xl:grid-cols-2">
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
                                                            fecha ||
                                                            null,
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
                </div>
            </section>

            <section className="salon-panel overflow-hidden border border-border bg-white">
                <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#87958D]">
                        Movimientos
                    </p>

                    <h2 className="mt-1 text-lg font-black text-foreground tracking-tight">
                        Historial de abonos
                    </h2>

                    <p className="mt-1 text-xs text-[#829089]">
                        {abonos.length} abono
                        {abonos.length === 1
                            ? ""
                            : "s"}{" "}
                        aplicado
                        {abonos.length === 1
                            ? ""
                            : "s"}
                    </p>
                </header>

                <div className="p-5 sm:p-6">
                    {abonos.length === 0 ? (
                        <EstadoVacio
                            titulo="Todavía no hay abonos"
                            descripcion="Los pagos realizados a las cuentas aparecerán aquí."
                        />
                    ) : (
                        <div className="space-y-3">
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
                </div>
            </section>
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
        Number(
            cuenta.monto_original,
        ) > 0
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
        <article className="salon-panel overflow-hidden border border-border bg-white">
            <div className="border-b border-[#E9EDEA] bg-[#FBFCFA] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-foreground">
                                {cuenta.codigo_cuenta}
                            </p>

                            <EstadoCuenta
                                estado={estado}
                            />
                        </div>

                        <p className="mt-2 text-xs font-semibold text-[#74817B]">
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
                            className="inline-flex h-9 items-center gap-2 self-start rounded-xl bg-primary-soft px-3 text-xs font-black text-text-secondary"
                        >
                            <Eye className="h-4 w-4" />
                            {cuenta.ventas
                                ?.codigo_venta ??
                                "Ver venta"}
                        </Link>
                    )}
                </div>
            </div>

            <div className="p-4 sm:p-5">
                <div className="grid grid-cols-3 gap-3">
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
                        destacado
                    />
                </div>

                <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-text-secondary">
                            Progreso de pago
                        </span>
                        <span className="font-black text-primary-strong">
                            {porcentaje.toLocaleString(
                                "es-NI",
                                {
                                    maximumFractionDigits:
                                        0,
                                },
                            )}
                            %
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
                        <div
                            className="h-full rounded-full bg-primary"
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
                            className="salon-action mt-4 inline-flex w-full items-center justify-center gap-2 bg-primary text-white transition hover:bg-primary-hover"
                        >
                            <WalletCards className="h-4 w-4" />
                            Registrar abono
                        </Link>
                    )}

                {estado !== "ANULADA" && (
                    <label className="mt-4 block rounded-2xl border border-border bg-[#F8FAF8] p-4">
                        <span className="mb-2 flex items-center gap-2 text-xs font-black text-[#52605A]">
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
                                    event.target
                                        .value;

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
                            className="salon-control w-full border border-border-strong bg-white px-3 font-semibold disabled:opacity-50"
                        />
                    </label>
                )}

                {cuenta.observaciones && (
                    <p className="mt-4 rounded-2xl bg-[#FBFCFA] p-3 text-sm leading-6 text-text-secondary">
                        {cuenta.observaciones}
                    </p>
                )}
            </div>
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
                pago.estado ===
                "APLICADO",
        );

    return (
        <article className="salon-panel border border-border bg-white p-4 transition hover:border-[#CAD6D0]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E3EEE8] text-[#527865]">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-lg font-black text-foreground">
                            {dinero(
                                abono.monto,
                            )}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#829089]">
                            {formatearFechaHora(
                                abono.fecha_abono,
                            )}{" "}
                            ·{" "}
                            {abono.codigoCuenta}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {pagos.map(
                                (pago) => (
                                    <span
                                        key={
                                            pago.id
                                        }
                                        className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-black text-[#52605A]"
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
                            <p className="mt-3 text-xs leading-5 text-text-secondary">
                                {
                                    abono.observaciones
                                }
                            </p>
                        )}
                    </div>
                </div>

                {abono.ventaId && (
                    <Link
                        href={`/caja/ventas/${abono.ventaId}`}
                        className="inline-flex h-9 items-center gap-2 self-start rounded-xl border border-border-strong px-3 text-xs font-black text-[#52605A]"
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

function HeroDato({
    titulo,
    valor,
    icono: Icono,
    alerta = false,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    alerta?: boolean;
}) {
    return (
        <div
            className={[
                "rounded-2xl border p-4 backdrop-blur-sm",
                alerta
                    ? "border-[#D6A9AE]/20 bg-secondary/10"
                    : "border-white/10 bg-white/[0.06]",
            ].join(" ")}
        >
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#AEC0B7]">
                    {titulo}
                </p>

                <Icono className="h-4 w-4 text-primary-soft" />
            </div>

            <p className="mt-2 truncate text-lg font-black text-white">
                {valor}
            </p>
        </div>
    );
}

function MiniDato({
    titulo,
    valor,
    destacado = false,
}: {
    titulo: string;
    valor: string;
    destacado?: boolean;
}) {
    return (
        <div className="rounded-2xl bg-[#F7F9F7] p-3">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#87958D]">
                {titulo}
            </p>

            <p
                className={[
                    "mt-1 text-sm font-black",
                    destacado
                        ? "text-[#9A6267]"
                        : "text-[#33413B]",
                ].join(" ")}
            >
                {valor}
            </p>
        </div>
    );
}

function DatoCliente({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-[#E7ECE9] pb-3 last:border-0 last:pb-0">
            <span className="text-xs font-semibold text-[#7B8781]">
                {titulo}
            </span>

            <strong
                className="max-w-[190px] truncate text-right text-xs text-[#33413B]"
                title={valor}
            >
                {valor}
            </strong>
        </div>
    );
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
                "rounded-full px-2.5 py-1 text-[10px] font-black uppercase",
                estilos[estado] ??
                "bg-surface-soft text-text-secondary",
            ].join(" ")}
        >
            {formatearTexto(
                estado,
            )}
        </span>
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
        <div className="rounded-2xl border border-dashed border-border-strong bg-[#FBFCFA] p-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-[#829089]" />

            <p className="mt-3 font-black text-foreground">
                {titulo}
            </p>

            <p className="mt-1 text-sm text-text-secondary">
                {descripcion}
            </p>
        </div>
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
