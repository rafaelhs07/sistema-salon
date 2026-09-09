"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    CalendarClock,
    CircleDollarSign,
    CreditCard,
    MapPin,
    ReceiptText,
    UserRound,
    WalletCards,
    X,
    XCircle,
    LoaderCircle,
} from "lucide-react";
import {
    FormEvent,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { anularVenta } from "./actions";

export type VentaDetalle = {
    id: string;
    codigo_venta: string | null;
    tipo_venta: string;
    subtotal: number;
    descuento: number;
    impuestos: number;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    cambio_entregado: number;
    estado_pago: string;
    estado: string;
    notas: string | null;
    fecha_venta: string;
    cliente_id: string | null;
    cita_id: string | null;
    sucursal_id: string;
    caja_sesion_id: string;
    motivo_anulacion: string | null;
    fecha_anulacion: string | null;

    cajas_sesiones: {
        estado: string;
        fecha_apertura: string;
        fecha_cierre: string | null;
    } | null;

    clientes: {
        id: string;
        codigo_cliente: string | null;
        nombre_completo: string;
        telefono: string | null;
        whatsapp: string | null;
        correo: string | null;
    } | null;

    sucursales: {
        nombre: string;
        direccion: string | null;
        telefono: string | null;
    } | null;

    venta_detalles: {
        id: string;
        tipo_item: string;
        descripcion: string;
        cantidad: number;
        precio_unitario: number;
        descuento: number;
        subtotal: number;
        total: number;
        tipo_comision: string | null;
        valor_comision: number | null;
        monto_comision: number | null;
        orden: number;
        trabajadores: {
            nombre_completo: string;
        } | null;
    }[];

    venta_pagos: {
        id: string;
        metodo_pago: string;
        monto: number;
        monto_recibido: number | null;
        cambio: number;
        terminal_pos_id: string | null;
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
};

export default function DetalleVentaClient({
    venta,
    simboloMoneda,
}: {
    venta: VentaDetalle;
    simboloMoneda: string;
}) {
    const router = useRouter();
    const [mostrarAnulacion, setMostrarAnulacion] =
        useState(false);
    const [motivoAnulacion, setMotivoAnulacion] =
        useState("");
    const [errorAnulacion, setErrorAnulacion] =
        useState<string | null>(null);
    const [anulando, iniciarAnulacion] =
        useTransition();

    const detalles = [...venta.venta_detalles].sort(
        (a, b) => a.orden - b.orden,
    );

    const pagosAplicados = venta.venta_pagos.filter(
        (pago) => pago.estado === "APLICADO",
    );

    const comisionPosTotal =
        pagosAplicados.reduce(
            (total, pago) =>
                total +
                Number(
                    pago.monto_comision_pos || 0,
                ),
            0,
        );

    const totalNetoPagos =
        pagosAplicados.reduce(
            (total, pago) =>
                total +
                Number(
                    pago.monto_neto ??
                    pago.monto,
                ),
            0,
        );

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function confirmarAnulacion(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setErrorAnulacion(null);

        if (motivoAnulacion.trim().length < 5) {
            setErrorAnulacion(
                "Escribe un motivo de al menos 5 caracteres.",
            );
            return;
        }

        iniciarAnulacion(async () => {
            const resultado = await anularVenta(
                venta.id,
                motivoAnulacion,
            );

            if (!resultado.exito) {
                setErrorAnulacion(resultado.mensaje);
                return;
            }

            setMostrarAnulacion(false);
            router.refresh();
        });
    }

    const puedeAnular =
        venta.estado === "ACTIVA" &&
        (!venta.caja_sesion_id ||
            venta.cajas_sesiones?.estado === "ABIERTA");

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link
                            href="/caja/ventas"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver al historial
                        </Link>

                        <div className="mt-5 flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <ReceiptText className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Detalle administrativo
                                </p>

                                <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                    {venta.codigo_venta ??
                                        "Venta"}
                                </h1>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <EstadoPago
                                        estado={
                                            venta.estado_pago
                                        }
                                    />
                                    <EstadoVenta
                                        estado={
                                            venta.estado
                                        }
                                    />
                                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                                        {venta.tipo_venta ===
                                            "CITA"
                                            ? "Cobro de cita"
                                            : venta.tipo_venta ===
                                                "DIRECTA"
                                                ? "Venta directa"
                                                : formatearTexto(
                                                    venta.tipo_venta,
                                                )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {venta.estado === "ACTIVA" && (
                            <Link
                                href={`/caja/recibos/${venta.id}`}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#DCE7E2] px-5 text-sm font-bold text-[#26332F] transition hover:bg-white"
                            >
                                <ReceiptText className="h-4 w-4" />
                                Ver recibo
                            </Link>
                        )}

                        {venta.estado === "ACTIVA" && (
                            <button
                                type="button"
                                disabled={!puedeAnular}
                                onClick={() => {
                                    setErrorAnulacion(null);
                                    setMostrarAnulacion(true);
                                }}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E7BDBD] bg-[#F8E5E5] px-5 text-sm font-bold text-[#985858] transition hover:bg-[#F3D8D8] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <XCircle className="h-4 w-4" />
                                Anular venta
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaResumen
                    titulo="Total venta"
                    valor={dinero(venta.total)}
                    icono={CircleDollarSign}
                />
                <TarjetaResumen
                    titulo="Monto pagado"
                    valor={dinero(
                        venta.monto_pagado,
                    )}
                    icono={WalletCards}
                />
                <TarjetaResumen
                    titulo="Saldo pendiente"
                    valor={dinero(
                        venta.saldo_pendiente,
                    )}
                    icono={CreditCard}
                />
                <TarjetaResumen
                    titulo="Comisión POS"
                    valor={dinero(
                        comisionPosTotal,
                    )}
                    icono={CreditCard}
                />
            </section>

            {venta.estado === "ANULADA" && (
                <section className="rounded-2xl border border-[#EBCBCB] bg-[#F8E5E5] p-5 text-[#7F4E4E]">
                    <div className="flex items-start gap-3">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-bold">
                                Venta anulada
                            </p>
                            <p className="mt-1 text-sm">
                                {venta.motivo_anulacion ??
                                    "Sin motivo registrado."}
                            </p>
                            {venta.fecha_anulacion && (
                                <p className="mt-2 text-xs">
                                    Anulada:{" "}
                                    {formatearFechaHora(
                                        venta.fecha_anulacion,
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {venta.estado === "ACTIVA" &&
                venta.caja_sesion_id &&
                venta.cajas_sesiones?.estado !== "ABIERTA" && (
                    <section className="rounded-2xl border border-[#E8D9B5] bg-[#FAF0DC] p-5 text-[#81652F]">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                            <div>
                                <p className="font-bold">
                                    Caja cerrada
                                </p>
                                <p className="mt-1 text-sm">
                                    Esta venta pertenece a una caja cerrada.
                                    Para proteger el cierre histórico, no puede
                                    anularse desde este flujo.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                <div className="space-y-6">
                    <Seccion
                        titulo="Información de la venta"
                    >
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Dato
                                icono={CalendarClock}
                                titulo="Fecha"
                                valor={formatearFechaHora(
                                    venta.fecha_venta,
                                )}
                            />
                            <Dato
                                icono={MapPin}
                                titulo="Sucursal"
                                valor={
                                    venta.sucursales
                                        ?.nombre ??
                                    "Sin sucursal"
                                }
                            />
                            <Dato
                                icono={ReceiptText}
                                titulo="Origen"
                                valor={
                                    venta.cita_id
                                        ? "Cita"
                                        : "Venta directa"
                                }
                            />
                        </div>
                    </Seccion>

                    <Seccion titulo="Cliente">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Dato
                                icono={UserRound}
                                titulo="Nombre"
                                valor={
                                    venta.clientes
                                        ?.nombre_completo ??
                                    "Consumidor final"
                                }
                            />
                            <Dato
                                icono={UserRound}
                                titulo="Código"
                                valor={
                                    venta.clientes
                                        ?.codigo_cliente ??
                                    "No aplica"
                                }
                            />
                            <Dato
                                icono={UserRound}
                                titulo="Teléfono"
                                valor={
                                    venta.clientes
                                        ?.telefono ||
                                    venta.clientes
                                        ?.whatsapp ||
                                    "No registrado"
                                }
                            />
                        </div>
                    </Seccion>

                    <Seccion titulo="Servicios / productos">
                        {detalles.length === 0 ? (
                            <p className="text-sm text-[#6B756F]">
                                La venta no tiene detalles
                                registrados.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px]">
                                    <thead className="bg-[#FBFCFA] text-left text-xs uppercase text-[#76817B]">
                                        <tr>
                                            <Th>
                                                Descripción
                                            </Th>
                                            <Th>
                                                Trabajador
                                            </Th>
                                            <Th>
                                                Cantidad
                                            </Th>
                                            <Th>
                                                Precio
                                            </Th>
                                            <Th>
                                                Descuento
                                            </Th>
                                            <Th>
                                                Total
                                            </Th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[#E8ECE9]">
                                        {detalles.map(
                                            (detalle) => (
                                                <tr
                                                    key={
                                                        detalle.id
                                                    }
                                                    className="text-sm"
                                                >
                                                    <Td>
                                                        <p className="font-semibold text-[#24302C]">
                                                            {
                                                                detalle.descripcion
                                                            }
                                                        </p>
                                                        <p className="mt-1 text-xs text-[#829089]">
                                                            {formatearTexto(
                                                                detalle.tipo_item,
                                                            )}
                                                        </p>
                                                    </Td>
                                                    <Td>
                                                        {detalle
                                                            .trabajadores
                                                            ?.nombre_completo ??
                                                            "Sin trabajador"}
                                                    </Td>
                                                    <Td>
                                                        {Number(
                                                            detalle.cantidad,
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        {dinero(
                                                            detalle.precio_unitario,
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        {dinero(
                                                            detalle.descuento,
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        <strong>
                                                            {dinero(
                                                                detalle.total,
                                                            )}
                                                        </strong>
                                                    </Td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Seccion>

                    <Seccion titulo="Pagos registrados">
                        {pagosAplicados.length ===
                            0 ? (
                            <p className="text-sm text-[#6B756F]">
                                No hay pagos aplicados.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {pagosAplicados.map(
                                    (pago) => (
                                        <PagoDetalle
                                            key={
                                                pago.id
                                            }
                                            pago={pago}
                                            dinero={dinero}
                                        />
                                    ),
                                )}
                            </div>
                        )}
                    </Seccion>

                    {venta.notas && (
                        <Seccion titulo="Notas">
                            <p className="whitespace-pre-wrap text-sm leading-6 text-[#52605A]">
                                {venta.notas}
                            </p>
                        </Seccion>
                    )}
                </div>

                <aside className="xl:sticky xl:top-24 xl:self-start">
                    <section className="rounded-3xl border border-[#E3E7E4] bg-white p-6 shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                        <h2 className="text-lg font-bold text-[#24302C]">
                            Resumen financiero
                        </h2>

                        <div className="mt-5 space-y-3">
                            <Fila
                                titulo="Subtotal"
                                valor={dinero(
                                    venta.subtotal,
                                )}
                            />

                            {Number(
                                venta.descuento,
                            ) > 0 && (
                                    <Fila
                                        titulo="Descuento"
                                        valor={`- ${dinero(
                                            venta.descuento,
                                        )}`}
                                    />
                                )}

                            {Number(
                                venta.impuestos,
                            ) > 0 && (
                                    <Fila
                                        titulo="Impuestos"
                                        valor={dinero(
                                            venta.impuestos,
                                        )}
                                    />
                                )}

                            <div className="border-t border-[#DDE3DF]" />

                            <Fila
                                titulo="Total"
                                valor={dinero(
                                    venta.total,
                                )}
                                destacado
                            />

                            <Fila
                                titulo="Pagado"
                                valor={dinero(
                                    venta.monto_pagado,
                                )}
                            />

                            <Fila
                                titulo="Saldo pendiente"
                                valor={dinero(
                                    venta.saldo_pendiente,
                                )}
                            />

                            {Number(
                                venta.cambio_entregado,
                            ) > 0 && (
                                    <Fila
                                        titulo="Cambio entregado"
                                        valor={dinero(
                                            venta.cambio_entregado,
                                        )}
                                    />
                                )}

                            {comisionPosTotal >
                                0 && (
                                    <>
                                        <div className="border-t border-dashed border-[#DDE3DF]" />
                                        <Fila
                                            titulo="Comisión POS"
                                            valor={dinero(
                                                comisionPosTotal,
                                            )}
                                        />
                                        <Fila
                                            titulo="Neto pagos"
                                            valor={dinero(
                                                totalNetoPagos,
                                            )}
                                        />
                                    </>
                                )}
                        </div>

                        {venta.estado === "ACTIVA" && (
                            <Link
                                href={`/caja/recibos/${venta.id}`}
                                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6F8F83] text-sm font-bold text-white transition hover:bg-[#607F74]"
                            >
                                <ReceiptText className="h-4 w-4" />
                                Abrir recibo
                            </Link>
                        )}
                    </section>
                </aside>
            </div>
            {mostrarAnulacion && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-[#A25E5E]">
                                    Acción irreversible
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-[#24302C]">
                                    Anular venta
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-[#6B756F]">
                                    Se anularán los pagos y se crearán
                                    movimientos compensatorios. Los registros
                                    originales se conservarán para auditoría.
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={anulando}
                                onClick={() =>
                                    setMostrarAnulacion(false)
                                }
                                className="rounded-xl bg-[#EEF2EF] p-2 text-[#52605A]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={confirmarAnulacion}
                            className="mt-5"
                        >
                            <label className="block">
                                <span className="mb-2 block text-sm font-bold text-[#3D4A45]">
                                    Motivo de la anulación
                                </span>
                                <textarea
                                    rows={4}
                                    autoFocus
                                    value={motivoAnulacion}
                                    onChange={(event) => {
                                        setMotivoAnulacion(
                                            event.target.value,
                                        );
                                        setErrorAnulacion(null);
                                    }}
                                    placeholder="Ejemplo: cobro registrado por error."
                                    className="w-full rounded-xl border border-[#D4DAD6] px-4 py-3 text-sm outline-none focus:border-[#A25E5E]"
                                />
                            </label>

                            {errorAnulacion && (
                                <div className="mt-3 rounded-xl bg-[#F8E5E5] px-4 py-3 text-sm font-semibold text-[#985858]">
                                    {errorAnulacion}
                                </div>
                            )}

                            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={anulando}
                                    onClick={() =>
                                        setMostrarAnulacion(false)
                                    }
                                    className="h-11 rounded-xl border border-[#DCE3DF] px-5 text-sm font-bold text-[#52605A]"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        anulando ||
                                        motivoAnulacion.trim().length < 5
                                    }
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#A25E5E] px-5 text-sm font-bold text-white disabled:opacity-50"
                                >
                                    {anulando ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    {anulando
                                        ? "Anulando..."
                                        : "Confirmar anulación"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function PagoDetalle({
    pago,
    dinero,
}: {
    pago: VentaDetalle["venta_pagos"][number];
    dinero: (valor: number) => string;
}) {
    const terminal =
        pago.terminales_pos;

    return (
        <article className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#24302C]">
                            {formatearTexto(
                                pago.metodo_pago,
                            )}
                        </span>

                        {terminal && (
                            <span className="rounded-full bg-[#DCE7E2] px-2.5 py-1 text-[10px] font-bold text-[#43524B]">
                                {terminal.nombre}
                            </span>
                        )}
                    </div>

                    <p className="mt-1 text-xs text-[#76817B]">
                        {formatearFechaHora(
                            pago.fecha_pago,
                        )}
                    </p>

                    {(terminal?.banco ||
                        pago.banco ||
                        pago.referencia) && (
                            <p className="mt-2 text-xs text-[#52605A]">
                                {terminal?.banco ||
                                    pago.banco ||
                                    ""}
                                {(terminal?.banco ||
                                    pago.banco) &&
                                    pago.referencia
                                    ? " · "
                                    : ""}
                                {pago.referencia || ""}
                            </p>
                        )}

                    {pago.observaciones && (
                        <p className="mt-2 text-xs text-[#6B756F]">
                            {pago.observaciones}
                        </p>
                    )}
                </div>

                <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-[#24302C]">
                        {dinero(pago.monto)}
                    </p>

                    {pago.metodo_pago ===
                        "TARJETA" &&
                        Number(
                            pago.monto_comision_pos,
                        ) > 0 && (
                            <div className="mt-2 text-xs text-[#6B756F]">
                                <p>
                                    Comisión{" "}
                                    {Number(
                                        pago.porcentaje_comision_pos,
                                    ).toLocaleString(
                                        "es-NI",
                                        {
                                            maximumFractionDigits: 4,
                                        },
                                    )}
                                    %:{" "}
                                    {dinero(
                                        pago.monto_comision_pos,
                                    )}
                                </p>
                                <p className="mt-1 font-semibold">
                                    Neto:{" "}
                                    {dinero(
                                        Number(
                                            pago.monto_neto ??
                                            pago.monto -
                                            pago.monto_comision_pos,
                                        ),
                                    )}
                                </p>
                            </div>
                        )}

                    {pago.metodo_pago ===
                        "EFECTIVO" &&
                        Number(pago.cambio) >
                        0 && (
                            <div className="mt-2 text-xs text-[#6B756F]">
                                <p>
                                    Recibido:{" "}
                                    {dinero(
                                        Number(
                                            pago.monto_recibido ??
                                            pago.monto,
                                        ),
                                    )}
                                </p>
                                <p className="mt-1 font-semibold">
                                    Cambio:{" "}
                                    {dinero(
                                        pago.cambio,
                                    )}
                                </p>
                            </div>
                        )}
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
        <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                <h2 className="font-bold text-[#24302C]">
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
    icono: Icono,
    titulo,
    valor,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-2xl bg-[#FBFCFA] p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#DCE7E2] text-[#527064]">
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

function TarjetaResumen({
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
        <article className="rounded-3xl border border-[#E3E7E4] bg-white p-5 shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <div className="flex items-start justify-between gap-3">
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

function EstadoPago({
    estado,
}: {
    estado: string;
}) {
    const estilos: Record<string, string> = {
        PAGADA:
            "bg-[#E3EEE8] text-[#527865]",
        PARCIAL:
            "bg-[#FAF0DC] text-[#9A742D]",
        PENDIENTE:
            "bg-[#F8E5E5] text-[#A25E5E]",
    };

    return (
        <span
            className={[
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase",
                estilos[estado] ??
                "bg-[#EEF2EF] text-[#6B756F]",
            ].join(" ")}
        >
            {formatearTexto(estado)}
        </span>
    );
}

function EstadoVenta({
    estado,
}: {
    estado: string;
}) {
    return (
        <span
            className={[
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase",
                estado === "ACTIVA"
                    ? "bg-white/15 text-white"
                    : "bg-[#F8E5E5] text-[#A25E5E]",
            ].join(" ")}
        >
            {formatearTexto(estado)}
        </span>
    );
}

function Th({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="px-4 py-3 font-bold">
            {children}
        </th>
    );
}

function Td({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <td className="px-4 py-4 align-top text-[#33413B]">
            {children}
        </td>
    );
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