"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    CalendarClock,
    CreditCard,
    FileText,
    ReceiptText,
    Store,
    WalletCards,
} from "lucide-react";

export type MovimientoDetalle = {
    id: string;
    sucursal_id: string;
    caja_sesion_id: string;
    venta_id: string | null;
    pago_id: string | null;
    tipo: string;
    naturaleza: string;
    metodo_pago: string | null;
    concepto: string;
    monto: number;
    referencia: string | null;
    observaciones: string | null;
    fecha_movimiento: string;

    sucursales: {
        nombre: string;
        direccion: string | null;
        telefono: string | null;
    } | null;

    ventas: {
        id: string;
        codigo_venta: string | null;
        tipo_venta: string;
        total: number;
        estado: string;
        estado_pago: string;
    } | null;

    cajas_sesiones: {
        id: string;
        estado: string;
        fecha_apertura: string;
        fecha_cierre: string | null;
    } | null;
};

export default function DetalleMovimientoClient({
    movimiento,
    simboloMoneda,
}: {
    movimiento: MovimientoDetalle;
    simboloMoneda: string;
}) {
    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(valor).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    return (
        <div className="space-y-6">
            <section className="rounded-3xl bg-[#26332F] p-6 text-white sm:p-8">
                <Link
                    href="/caja/historial-movimientos"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a movimientos
                </Link>

                <p className="mt-5 text-sm font-semibold text-[#B9C8C1]">
                    Movimiento de caja
                </p>

                <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                    {movimiento.concepto}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                        {formatearTexto(movimiento.tipo)}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                        {formatearTexto(movimiento.naturaleza)}
                    </span>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Dato
                    titulo="Monto"
                    valor={`${movimiento.naturaleza === "SALIDA" ? "- " : "+ "}${dinero(
                        movimiento.monto,
                    )}`}
                    icono={WalletCards}
                />
                <Dato
                    titulo="Fecha"
                    valor={formatearFechaHora(
                        movimiento.fecha_movimiento,
                    )}
                    icono={CalendarClock}
                />
                <Dato
                    titulo="Sucursal"
                    valor={
                        movimiento.sucursales?.nombre ??
                        "Sucursal"
                    }
                    icono={Store}
                />
                <Dato
                    titulo="Método"
                    valor={
                        movimiento.metodo_pago
                            ? formatearTexto(
                                movimiento.metodo_pago,
                            )
                            : "No aplica"
                    }
                    icono={Banknote}
                />
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
                <Seccion titulo="Información">
                    <div className="space-y-4">
                        <Fila
                            titulo="Tipo"
                            valor={formatearTexto(
                                movimiento.tipo,
                            )}
                        />
                        <Fila
                            titulo="Naturaleza"
                            valor={formatearTexto(
                                movimiento.naturaleza,
                            )}
                        />
                        <Fila
                            titulo="Referencia"
                            valor={
                                movimiento.referencia ??
                                "No registrada"
                            }
                        />
                        <Fila
                            titulo="Caja"
                            valor={
                                movimiento.cajas_sesiones
                                    ?.estado
                                    ? formatearTexto(
                                        movimiento
                                            .cajas_sesiones
                                            .estado,
                                    )
                                    : "Sin sesión"
                            }
                        />
                    </div>
                </Seccion>

                <Seccion titulo="Registro relacionado">
                    {movimiento.venta_id &&
                        movimiento.ventas ? (
                        <div>
                            <p className="text-sm text-[#6B756F]">
                                Este movimiento está relacionado
                                con una venta.
                            </p>

                            <div className="mt-4 rounded-2xl bg-[#FBFCFA] p-4">
                                <p className="font-bold text-[#24302C]">
                                    {movimiento.ventas
                                        .codigo_venta ??
                                        "Venta"}
                                </p>

                                <p className="mt-1 text-sm text-[#6B756F]">
                                    Total:{" "}
                                    {dinero(
                                        movimiento.ventas
                                            .total,
                                    )}
                                </p>

                                <Link
                                    href={`/caja/ventas/${movimiento.venta_id}`}
                                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B]"
                                >
                                    <ReceiptText className="h-4 w-4" />
                                    Ver venta
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-[#6B756F]">
                            Movimiento independiente, sin venta
                            relacionada.
                        </p>
                    )}
                </Seccion>
            </div>

            {movimiento.observaciones && (
                <Seccion titulo="Observaciones">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[#52605A]">
                        {movimiento.observaciones}
                    </p>
                </Seccion>
            )}
        </div>
    );
}

function Dato({
    titulo,
    valor,
    icono: Icono,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{ className?: string }>;
}) {
    return (
        <article className="rounded-3xl border border-[#E3E7E4] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-bold uppercase text-[#829089]">
                        {titulo}
                    </p>
                    <p className="mt-1 font-bold text-[#24302C]">
                        {valor}
                    </p>
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
        <section className="rounded-3xl border border-[#E3E7E4] bg-white shadow-sm">
            <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4">
                <h2 className="font-bold text-[#24302C]">
                    {titulo}
                </h2>
            </header>
            <div className="p-5">{children}</div>
        </section>
    );
}

function Fila({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-[#6B756F]">
                {titulo}
            </span>
            <strong className="text-sm text-[#33413B]">
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
        .replace(/^\w/, (letra) => letra.toUpperCase());
}