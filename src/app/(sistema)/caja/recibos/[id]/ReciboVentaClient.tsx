"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Printer,
} from "lucide-react";

export type VentaRecibo = {
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

type DatosSalon = {
    nombre: string;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
};

export default function ReciboVentaClient({
    venta,
    salon,
    simboloMoneda,
    mensajeRecibo,
}: {
    venta: VentaRecibo;
    salon: DatosSalon;
    simboloMoneda: string;
    mensajeRecibo: string;
}) {
    const detalles = [...venta.venta_detalles].sort(
        (a, b) => a.orden - b.orden,
    );

    const pagos = venta.venta_pagos.filter(
        (pago) => pago.estado === "APLICADO",
    );

    const comisionPosTotal = pagos.reduce(
        (total, pago) =>
            total +
            (pago.metodo_pago === "TARJETA"
                ? Number(
                    pago.monto_comision_pos || 0,
                )
                : 0),
        0,
    );

    const montoNetoPos = pagos.reduce(
        (total, pago) => {
            if (pago.metodo_pago !== "TARJETA") {
                return total;
            }

            return (
                total +
                Number(
                    pago.monto_neto ??
                    Number(pago.monto) -
                    Number(
                        pago.monto_comision_pos ||
                        0,
                    ),
                )
            );
        },
        0,
    );

    const cambioEfectivo = pagos.reduce(
        (total, pago) =>
            total +
            (pago.metodo_pago === "EFECTIVO"
                ? Number(pago.cambio || 0)
                : 0),
        0,
    );

    function imprimir() {
        window.print();
    }

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    return (
        <div className="mx-auto max-w-[780px] space-y-4">
            <section className="no-print flex flex-col gap-3 rounded-2xl bg-[#26332F] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/caja"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Caja
                    </Link>

                    <h1 className="mt-2 text-xl font-bold">
                        Comprobante de venta
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={imprimir}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#26332F]"
                >
                    <Printer className="h-4 w-4" />
                    Imprimir
                </button>
            </section>

            <article className="recibo bg-white p-5 text-[#202622] sm:border sm:border-[#DDE3DF] sm:p-6">
                <header className="border-b border-[#9DA49F] pb-3">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold">
                                {salon.nombre}
                            </h2>

                            <div className="mt-1 space-y-0.5 text-xs text-[#555E59]">
                                {(venta.sucursales?.direccion ||
                                    salon.direccion) && (
                                        <p>
                                            {venta.sucursales
                                                ?.direccion ||
                                                salon.direccion}
                                        </p>
                                    )}

                                {(venta.sucursales?.telefono ||
                                    salon.telefono) && (
                                        <p>
                                            Tel. {venta.sucursales
                                                ?.telefono ||
                                                salon.telefono}
                                        </p>
                                    )}

                                {salon.correo && (
                                    <p>{salon.correo}</p>
                                )}
                            </div>
                        </div>

                        <div className="shrink-0 text-right text-xs">
                            <p className="font-bold">
                                {venta.codigo_venta ??
                                    "Sin codigo"}
                            </p>
                            <p className="mt-1 text-[#555E59]">
                                {formatearFechaHora(
                                    venta.fecha_venta,
                                )}
                            </p>
                            <p className="mt-1 font-semibold">
                                {formatearTexto(
                                    venta.estado_pago,
                                )}
                            </p>
                        </div>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-b border-[#C5CAC7] py-2.5 text-xs">
                    <Dato
                        etiqueta="Cliente"
                        valor={
                            venta.clientes
                                ?.nombre_completo ??
                            "Consumidor final"
                        }
                    />

                    <Dato
                        etiqueta="Sucursal"
                        valor={
                            venta.sucursales?.nombre ??
                            "Sin sucursal"
                        }
                    />

                    {(venta.clientes?.telefono ||
                        venta.clientes?.whatsapp) && (
                            <Dato
                                etiqueta="Telefono"
                                valor={
                                    venta.clientes?.telefono ||
                                    venta.clientes?.whatsapp ||
                                    ""
                                }
                            />
                        )}

                    {venta.clientes
                        ?.codigo_cliente && (
                            <Dato
                                etiqueta="Codigo"
                                valor={
                                    venta.clientes
                                        .codigo_cliente
                                }
                            />
                        )}
                </section>

                <section className="py-2.5">
                    <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide">
                        Detalle
                    </h3>

                    <div className="border-y border-[#9DA49F]">
                        <div className="grid grid-cols-[1fr_46px_84px] gap-2 border-b border-[#C5CAC7] py-1 text-[9px] font-bold uppercase">
                            <span>Servicio</span>
                            <span className="text-center">
                                Cant.
                            </span>
                            <span className="text-right">
                                Total
                            </span>
                        </div>

                        {detalles.map((detalle) => (
                            <div
                                key={detalle.id}
                                className="grid grid-cols-[1fr_46px_84px] gap-2 border-b border-[#E0E3E1] py-1.5 text-[11px] last:border-b-0"
                            >
                                <div>
                                    <p className="font-semibold">
                                        {detalle.descripcion}
                                    </p>

                                    {detalle.trabajadores
                                        ?.nombre_completo && (
                                            <p className="text-[9px] text-[#626A66]">
                                                {
                                                    detalle
                                                        .trabajadores
                                                        .nombre_completo
                                                }
                                            </p>
                                        )}

                                    {Number(
                                        detalle.descuento,
                                    ) > 0 && (
                                            <p className="text-[9px]">
                                                Desc. {dinero(
                                                    detalle.descuento,
                                                )}
                                            </p>
                                        )}
                                </div>

                                <span className="text-center">
                                    {Number(
                                        detalle.cantidad,
                                    )}
                                </span>

                                <span className="text-right font-semibold">
                                    {dinero(detalle.total)}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid gap-4 border-t border-[#C5CAC7] pt-2.5 sm:grid-cols-[1fr_235px]">
                    <section>
                        <h3 className="text-[11px] font-bold uppercase tracking-wide">
                            Pagos
                        </h3>

                        {pagos.length === 0 ? (
                            <p className="mt-1 text-[11px]">
                                Sin pagos registrados.
                            </p>
                        ) : (
                            <div className="mt-1">
                                {pagos.map((pago) => {
                                    const terminal =
                                        pago.terminales_pos;

                                    return (
                                        <div
                                            key={pago.id}
                                            className="border-b border-[#E0E3E1] py-1 text-[11px] last:border-b-0"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-semibold">
                                                    {formatearTexto(
                                                        pago.metodo_pago,
                                                    )}
                                                    {terminal
                                                        ? ` - ${terminal.nombre}`
                                                        : ""}
                                                </span>

                                                <strong>
                                                    {dinero(
                                                        pago.monto,
                                                    )}
                                                </strong>
                                            </div>

                                            {(pago.referencia ||
                                                pago.banco ||
                                                terminal?.banco) && (
                                                    <p className="text-[9px] text-[#626A66]">
                                                        {terminal?.banco ||
                                                            pago.banco ||
                                                            ""}
                                                        {(terminal?.banco ||
                                                            pago.banco) &&
                                                            pago.referencia
                                                            ? " - "
                                                            : ""}
                                                        {pago.referencia ||
                                                            ""}
                                                    </p>
                                                )}

                                            {pago.metodo_pago ===
                                                "EFECTIVO" &&
                                                Number(
                                                    pago.cambio,
                                                ) > 0 && (
                                                    <p className="text-[9px]">
                                                        Recibido {dinero(
                                                            Number(
                                                                pago.monto_recibido ??
                                                                pago.monto,
                                                            ),
                                                        )} - Cambio {dinero(
                                                            pago.cambio,
                                                        )}
                                                    </p>
                                                )}

                                            {pago.metodo_pago ===
                                                "TARJETA" &&
                                                Number(
                                                    pago.monto_comision_pos,
                                                ) > 0 && (
                                                    <p className="text-[9px] text-[#626A66]">
                                                        Comision {Number(
                                                            pago.porcentaje_comision_pos,
                                                        ).toLocaleString(
                                                            "es-NI",
                                                            {
                                                                maximumFractionDigits: 4,
                                                            },
                                                        )}%: {dinero(
                                                            pago.monto_comision_pos,
                                                        )} - Neto {dinero(
                                                            Number(
                                                                pago.monto_neto ??
                                                                Number(
                                                                    pago.monto,
                                                                ) -
                                                                Number(
                                                                    pago.monto_comision_pos,
                                                                ),
                                                            ),
                                                        )}
                                                    </p>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {venta.notas && (
                            <p className="mt-2 text-[10px]">
                                <strong>Nota:</strong>{" "}
                                {venta.notas}
                            </p>
                        )}
                    </section>

                    <section className="text-[11px]">
                        <Fila
                            titulo="Subtotal"
                            valor={dinero(
                                venta.subtotal,
                            )}
                        />

                        {Number(venta.descuento) > 0 && (
                            <Fila
                                titulo="Descuento"
                                valor={`- ${dinero(
                                    venta.descuento,
                                )}`}
                            />
                        )}

                        {Number(venta.impuestos) > 0 && (
                            <Fila
                                titulo="Impuestos"
                                valor={dinero(
                                    venta.impuestos,
                                )}
                            />
                        )}

                        <div className="my-1 border-t border-[#9DA49F]" />

                        <Fila
                            titulo="TOTAL"
                            valor={dinero(venta.total)}
                            destacado
                        />

                        <Fila
                            titulo="Pagado"
                            valor={dinero(
                                venta.monto_pagado,
                            )}
                        />

                        {Number(
                            venta.saldo_pendiente,
                        ) > 0 && (
                                <Fila
                                    titulo="Saldo"
                                    valor={dinero(
                                        venta.saldo_pendiente,
                                    )}
                                    destacado
                                />
                            )}

                        {cambioEfectivo > 0 && (
                            <Fila
                                titulo="Cambio"
                                valor={dinero(
                                    cambioEfectivo,
                                )}
                            />
                        )}

                        {comisionPosTotal > 0 && (
                            <>
                                <div className="my-1 border-t border-dashed border-[#C5CAC7]" />
                                <Fila
                                    titulo="Comision POS"
                                    valor={dinero(
                                        comisionPosTotal,
                                    )}
                                />
                                <Fila
                                    titulo="Neto POS"
                                    valor={dinero(
                                        montoNetoPos,
                                    )}
                                />
                            </>
                        )}
                    </section>
                </div>

                <footer className="mt-3 border-t border-dashed border-[#9DA49F] pt-1.5 text-center text-[9px] text-[#555E59]">
                    {mensajeRecibo}
                </footer>
            </article>

            <style jsx global>{`
                @media print {
                    @page {
                        size: auto;
                        margin: 6mm;
                    }

                    html,
                    body {
                        background: #fff !important;
                    }

                    .no-print,
                    aside,
                    nav,
                    header.sticky {
                        display: none !important;
                    }

                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    .recibo {
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: 0 !important;
                        box-shadow: none !important;
                        color: #000 !important;
                        font-size: 10px !important;
                    }

                    .recibo * {
                        color: #000 !important;
                        background: transparent !important;
                        box-shadow: none !important;
                    }

                    .recibo section,
                    .recibo header,
                    .recibo footer {
                        break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}

function Dato({
    etiqueta,
    valor,
}: {
    etiqueta: string;
    valor: string;
}) {
    return (
        <div>
            <strong>{etiqueta}:</strong>{" "}
            <span>{valor}</span>
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
        <div
            className={[
                "flex items-center justify-between gap-3 py-0.5",
                destacado ? "font-bold" : "",
            ].join(" ")}
        >
            <span>{titulo}</span>
            <span>{valor}</span>
        </div>
    );
}

function formatearFechaHora(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "2-digit",
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