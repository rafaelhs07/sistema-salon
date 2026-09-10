"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    CheckCircle2,
    Clock3,
    CreditCard,
    History,
    ReceiptText,
    Store,
    WalletCards,
} from "lucide-react";

export type CajaCierreDetalle = {
    id: string;
    sucursal_id: string;
    fecha_apertura: string;
    fecha_cierre: string | null;
    monto_inicial: number;
    total_ventas_efectivo: number;
    total_ventas_otros: number;
    total_ingresos_manuales: number;
    total_egresos: number;
    monto_esperado: number;
    monto_contado: number;
    diferencia: number;
    estado: string;
    observaciones_apertura: string | null;
    observaciones_cierre: string | null;
    sucursales: {
        nombre: string;
        direccion: string | null;
        telefono: string | null;
    } | null;
};

export type MovimientoCierreDetalle = {
    id: string;
    tipo: string;
    naturaleza: string;
    metodo_pago: string | null;
    concepto: string;
    monto: number;
    referencia: string | null;
    observaciones: string | null;
    fecha_movimiento: string;
    venta_id: string | null;
};

export default function DetalleCierreClient({
    caja,
    movimientos,
    simboloMoneda,
}: {
    caja: CajaCierreDetalle;
    movimientos: MovimientoCierreDetalle[];
    simboloMoneda: string;
}) {
    const diferencia = Number(
        caja.diferencia || 0,
    );

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
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/caja/cierres"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al historial
                    </Link>

                    <div className="mt-5 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                            <History className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Cierre histórico
                            </p>

                            <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                {caja.sucursales?.nombre ??
                                    "Caja cerrada"}
                            </h1>

                            <p className="mt-3 text-[#CFD9D4]">
                                {caja.fecha_cierre
                                    ? `Cerrada ${formatearFechaHora(
                                        caja.fecha_cierre,
                                    )}`
                                    : "Sin fecha de cierre"}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Resumen
                    titulo="Efectivo esperado"
                    valor={dinero(
                        caja.monto_esperado,
                    )}
                    icono={WalletCards}
                />

                <Resumen
                    titulo="Efectivo contado"
                    valor={dinero(
                        caja.monto_contado,
                    )}
                    icono={Banknote}
                />

                <Resumen
                    titulo="Diferencia"
                    valor={`${diferencia > 0 ? "+" : ""}${dinero(
                        diferencia,
                    )}`}
                    icono={
                        Math.abs(diferencia) <
                            0.005
                            ? CheckCircle2
                            : AlertTriangle
                    }
                />

                <Resumen
                    titulo="Estado"
                    valor={
                        Math.abs(diferencia) <
                            0.005
                            ? "Cuadrada"
                            : diferencia < 0
                                ? "Faltante"
                                : "Sobrante"
                    }
                    icono={History}
                />
            </section>

            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                    <Seccion titulo="Datos del cierre">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Dato
                                titulo="Sucursal"
                                valor={
                                    caja.sucursales
                                        ?.nombre ??
                                    "Sin sucursal"
                                }
                                icono={Store}
                            />
                            <Dato
                                titulo="Apertura"
                                valor={formatearFechaHora(
                                    caja.fecha_apertura,
                                )}
                                icono={Clock3}
                            />
                            <Dato
                                titulo="Cierre"
                                valor={
                                    caja.fecha_cierre
                                        ? formatearFechaHora(
                                            caja.fecha_cierre,
                                        )
                                        : "Sin fecha"
                                }
                                icono={Clock3}
                            />
                        </div>
                    </Seccion>

                    <Seccion titulo="Movimientos de la sesión">
                        {movimientos.length ===
                            0 ? (
                            <p className="text-sm text-text-secondary">
                                No hay movimientos
                                registrados.
                            </p>
                        ) : (
                            <div className="divide-y divide-[#E8ECE9]">
                                {movimientos.map(
                                    (movimiento) => (
                                        <div
                                            key={
                                                movimiento.id
                                            }
                                            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
                                        >
                                            <div>
                                                <p className="font-semibold text-[#33413B]">
                                                    {
                                                        movimiento.concepto
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-[#829089]">
                                                    {formatearTexto(
                                                        movimiento.tipo,
                                                    )}
                                                    {movimiento.metodo_pago
                                                        ? ` · ${formatearTexto(
                                                            movimiento.metodo_pago,
                                                        )}`
                                                        : ""}
                                                    {" · "}
                                                    {formatearFechaHora(
                                                        movimiento.fecha_movimiento,
                                                    )}
                                                </p>

                                                {movimiento.observaciones && (
                                                    <p className="mt-1 text-xs text-text-secondary">
                                                        {
                                                            movimiento.observaciones
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <strong
                                                className={
                                                    movimiento.naturaleza ===
                                                        "SALIDA"
                                                        ? "text-[#A25E5E]"
                                                        : "text-[#3F6657]"
                                                }
                                            >
                                                {movimiento.naturaleza ===
                                                    "SALIDA"
                                                    ? "- "
                                                    : "+ "}
                                                {dinero(
                                                    movimiento.monto,
                                                )}
                                            </strong>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </Seccion>

                    {(caja.observaciones_apertura ||
                        caja.observaciones_cierre) && (
                            <Seccion titulo="Observaciones">
                                <div className="space-y-4">
                                    {caja.observaciones_apertura && (
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#829089]">
                                                Apertura
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-[#52605A]">
                                                {
                                                    caja.observaciones_apertura
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {caja.observaciones_cierre && (
                                        <div>
                                            <p className="text-xs font-bold uppercase text-[#829089]">
                                                Cierre
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-[#52605A]">
                                                {
                                                    caja.observaciones_cierre
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Seccion>
                        )}
                </div>

                <aside className="xl:sticky xl:top-24 xl:self-start">
                    <section className="salon-panel border border-border bg-white p-6">
                        <h2 className="text-lg font-bold text-foreground tracking-tight">
                            Resumen de caja
                        </h2>

                        <div className="mt-5 space-y-3">
                            <Fila
                                titulo="Monto inicial"
                                valor={dinero(
                                    caja.monto_inicial,
                                )}
                            />

                            <Fila
                                titulo="Ventas efectivo"
                                valor={dinero(
                                    caja.total_ventas_efectivo,
                                )}
                            />

                            <Fila
                                titulo="Otros pagos"
                                valor={dinero(
                                    caja.total_ventas_otros,
                                )}
                            />

                            <Fila
                                titulo="Ingresos manuales"
                                valor={dinero(
                                    caja.total_ingresos_manuales,
                                )}
                            />

                            <Fila
                                titulo="Egresos"
                                valor={`- ${dinero(
                                    caja.total_egresos,
                                )}`}
                            />

                            <div className="border-t border-[#DDE3DF] pt-3">
                                <Fila
                                    titulo="Esperado"
                                    valor={dinero(
                                        caja.monto_esperado,
                                    )}
                                    destacado
                                />
                            </div>

                            <Fila
                                titulo="Contado"
                                valor={dinero(
                                    caja.monto_contado,
                                )}
                            />

                            <Fila
                                titulo="Diferencia"
                                valor={`${diferencia > 0 ? "+" : ""}${dinero(
                                    diferencia,
                                )}`}
                                destacado
                            />
                        </div>

                        <div
                            className={[
                                "mt-5 rounded-2xl border p-4",
                                Math.abs(diferencia) <
                                    0.005
                                    ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                                    : diferencia < 0
                                        ? "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]"
                                        : "border-[#E8D9B5] bg-[#FAF0DC] text-[#81652F]",
                            ].join(" ")}
                        >
                            <p className="text-sm font-bold">
                                {Math.abs(diferencia) <
                                    0.005
                                    ? "Caja cuadrada"
                                    : diferencia < 0
                                        ? "Faltante de caja"
                                        : "Sobrante de caja"}
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
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
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-text-secondary">
                        {titulo}
                    </p>
                    <p className="mt-3 text-xl font-bold text-foreground">
                        {valor}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function Seccion({
    titulo,
    children,
}: {
    titulo: string;
    children: React.ReactNode;
}) {
    return (
        <section className="salon-panel overflow-hidden border border-border bg-white">
            <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                <h2 className="font-bold text-foreground tracking-tight">
                    {titulo}
                </h2>
            </header>
            <div className="p-5 sm:p-6">
                {children}
            </div>
        </section>
    );
}

function Dato({
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
        <div className="rounded-2xl bg-[#FBFCFA] p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                    <Icono className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase text-[#829089]">
                        {titulo}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#33413B]">
                        {valor}
                    </p>
                </div>
            </div>
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
                        ? "font-bold text-foreground"
                        : "text-sm text-text-secondary"
                }
            >
                {titulo}
            </span>
            <strong
                className={
                    destacado
                        ? "text-lg text-foreground"
                        : "text-sm text-[#33413B]"
                }
            >
                {valor}
            </strong>
        </div>
    );
}

function formatearFechaHora(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Managua",
    }).format(new Date(fecha));
}

function formatearTexto(valor: string) {
    return valor
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letra) =>
            letra.toUpperCase(),
        );
}