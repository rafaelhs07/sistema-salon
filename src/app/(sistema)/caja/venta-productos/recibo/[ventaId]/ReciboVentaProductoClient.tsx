"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Printer,
    ShoppingBasket,
} from "lucide-react";

export type DatosReciboProducto = {
    venta: {
        id: string;
        codigoVenta: string;
        subtotal: number;
        descuento: number;
        impuestos: number;
        total: number;
        montoPagado: number;
        saldoPendiente: number;
        cambio: number;
        estadoPago: string;
        estado: string;
        notas: string | null;
        creadoEn: string;
    };

    detalles: {
        id: string;
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        descuento: number;
        subtotal: number;
        total: number;
    }[];

    pagos: {
        id: string;
        metodo: string;
        monto: number;
        montoRecibido: number | null;
        cambio: number;
        referencia: string | null;
        terminalNombre: string | null;
        banco: string | null;
        comisionPos: number;
    }[];

    sucursal: {
        nombre: string;
    };

    cliente: {
        nombre: string;
        telefono: string | null;
        whatsapp: string | null;
    } | null;

    salon: {
        nombre: string;
        telefono: string | null;
        whatsapp: string | null;
        direccion: string | null;
    };

    simboloMoneda: string;
    mensajeRecibo: string;
};

export default function ReciboVentaProductoClient({
    datos,
}: {
    datos: DatosReciboProducto;
}) {
    function dinero(valor: number) {
        return `${datos.simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    return (
        <div className="mx-auto max-w-[760px] space-y-4 print:max-w-none print:space-y-0">
            <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                <Link
                    href="/caja"
                    className="inline-flex h-9 items-center gap-2 text-sm font-semibold text-[#52605A]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Link>

                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/caja/ventas/${datos.venta.id}`}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D6DDD9] bg-white px-3 text-sm font-semibold text-[#405049]"
                    >
                        Ver detalle / anular
                    </Link>

                    <Link
                        href="/caja/venta-productos"
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D6DDD9] bg-white px-3 text-sm font-semibold text-[#405049]"
                    >
                        <ShoppingBasket className="h-4 w-4" />
                        Nueva venta
                    </Link>

                    <button
                        type="button"
                        onClick={() =>
                            window.print()
                        }
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#26332F] px-3 text-sm font-semibold text-white"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </button>
                </div>
            </div>

            <article className="bg-white text-[#202623] print:text-black">
                <header className="border-b border-[#D7DDD9] pb-3 print:pb-2">
                    <div className="flex items-start justify-between gap-5">
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold leading-tight print:text-lg">
                                {datos.salon.nombre}
                            </h1>

                            {datos.salon.direccion && (
                                <p className="mt-1 text-[11px] leading-4 text-[#68736D] print:text-black">
                                    {datos.salon.direccion}
                                </p>
                            )}

                            <p className="mt-1 text-[11px] leading-4 text-[#68736D] print:text-black">
                                {[
                                    datos.salon.telefono
                                        ? `Tel. ${datos.salon.telefono}`
                                        : null,
                                    datos.salon.whatsapp
                                        ? `WhatsApp ${datos.salon.whatsapp}`
                                        : null,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#6C7771] print:text-black">
                                Recibo
                            </p>

                            <p className="mt-1 text-sm font-bold">
                                {datos.venta.codigoVenta}
                            </p>

                            <p className="mt-1 text-[10px] text-[#6C7771] print:text-black">
                                {formatearFechaHora(
                                    datos.venta.creadoEn,
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1 text-[11px] sm:grid-cols-3 print:grid-cols-3">
                        <DatoSimple
                            titulo="Sucursal"
                            valor={
                                datos.sucursal.nombre
                            }
                        />

                        <DatoSimple
                            titulo="Cliente"
                            valor={
                                datos.cliente?.nombre ??
                                "Consumidor final"
                            }
                        />

                        <DatoSimple
                            titulo="Estado"
                            valor={textoEstadoPago(
                                datos.venta.estadoPago,
                            )}
                        />
                    </div>
                </header>

                <section className="pt-3 print:pt-2">
                    <table className="w-full table-fixed border-collapse">
                        <thead>
                            <tr className="border-b border-[#D7DDD9] text-[10px] font-bold uppercase text-[#68736D] print:text-black">
                                <th className="w-[48%] pb-1.5 text-left">
                                    Producto
                                </th>

                                <th className="w-[14%] pb-1.5 text-right">
                                    Cant.
                                </th>

                                <th className="w-[18%] pb-1.5 text-right">
                                    Precio
                                </th>

                                <th className="w-[20%] pb-1.5 text-right">
                                    Total
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {datos.detalles.map(
                                (detalle) => (
                                    <tr
                                        key={detalle.id}
                                        className="border-b border-[#ECEFED] text-[11px]"
                                    >
                                        <td className="py-1.5 pr-2 align-top font-medium">
                                            <span className="block leading-4">
                                                {detalle.descripcion}
                                            </span>
                                        </td>

                                        <td className="py-1.5 text-right align-top">
                                            {cantidad(
                                                detalle.cantidad,
                                            )}
                                        </td>

                                        <td className="py-1.5 text-right align-top">
                                            {dinero(
                                                detalle.precioUnitario,
                                            )}
                                        </td>

                                        <td className="py-1.5 text-right align-top font-semibold">
                                            {dinero(
                                                detalle.total,
                                            )}
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>

                    <div className="ml-auto mt-3 w-full max-w-[300px] space-y-1 text-[11px]">
                        <LineaTotal
                            titulo="Subtotal"
                            valor={dinero(
                                datos.venta.subtotal,
                            )}
                        />

                        {datos.venta.descuento >
                            0 && (
                                <LineaTotal
                                    titulo="Descuento"
                                    valor={`- ${dinero(
                                        datos.venta.descuento,
                                    )}`}
                                />
                            )}

                        {datos.venta.impuestos >
                            0 && (
                                <LineaTotal
                                    titulo="Impuestos"
                                    valor={dinero(
                                        datos.venta.impuestos,
                                    )}
                                />
                            )}

                        <div className="mt-1 border-t border-[#BFC8C3] pt-1.5">
                            <LineaTotal
                                titulo="TOTAL"
                                valor={dinero(
                                    datos.venta.total,
                                )}
                                fuerte
                            />
                        </div>
                    </div>
                </section>

                <section className="mt-3 border-t border-[#D7DDD9] pt-2 print:mt-2">
                    <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
                        <div>
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#68736D] print:text-black">
                                Pagos
                            </h2>

                            <div className="mt-1.5 space-y-1">
                                {datos.pagos.map(
                                    (pago) => (
                                        <div
                                            key={pago.id}
                                            className="flex items-start justify-between gap-3 text-[11px]"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium">
                                                    {textoMetodo(
                                                        pago.metodo,
                                                    )}
                                                </p>

                                                {(pago.terminalNombre ||
                                                    pago.referencia) && (
                                                        <p className="truncate text-[10px] text-[#68736D] print:text-black">
                                                            {pago.terminalNombre
                                                                ? `${pago.terminalNombre}${pago.banco
                                                                    ? ` · ${pago.banco}`
                                                                    : ""
                                                                }`
                                                                : pago.referencia}
                                                        </p>
                                                    )}
                                            </div>

                                            <strong className="shrink-0">
                                                {dinero(
                                                    pago.monto,
                                                )}
                                            </strong>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        <div className="text-[11px]">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#68736D] print:text-black">
                                Resumen de cobro
                            </h2>

                            <div className="mt-1.5 space-y-1">
                                <LineaTotal
                                    titulo="Pagado"
                                    valor={dinero(
                                        datos.venta.montoPagado,
                                    )}
                                />

                                {datos.venta.saldoPendiente >
                                    0 && (
                                        <LineaTotal
                                            titulo="Pendiente"
                                            valor={dinero(
                                                datos.venta.saldoPendiente,
                                            )}
                                        />
                                    )}

                                {datos.venta.cambio >
                                    0 && (
                                        <LineaTotal
                                            titulo="Cambio"
                                            valor={dinero(
                                                datos.venta.cambio,
                                            )}
                                        />
                                    )}
                            </div>
                        </div>
                    </div>
                </section>

                {(datos.venta.notas ||
                    datos.mensajeRecibo) && (
                        <footer className="mt-3 border-t border-[#D7DDD9] pt-2 text-center print:mt-2">
                            {datos.venta.notas && (
                                <p className="text-[10px] leading-4 text-[#68736D] print:text-black">
                                    {datos.venta.notas}
                                </p>
                            )}

                            <p className="mt-1 text-[11px] font-semibold">
                                {datos.mensajeRecibo}
                            </p>
                        </footer>
                    )}
            </article>

            <style jsx global>{`
                @media print {
                    @page {
                        size: auto;
                        margin: 7mm;
                    }

                    html,
                    body {
                        background: #ffffff !important;
                    }

                    body {
                        font-size: 10px !important;
                    }

                    nav,
                    aside,
                    header[data-app-header],
                    [data-sidebar],
                    [data-app-shell-sidebar],
                    [data-app-shell-header] {
                        display: none !important;
                    }

                    * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

function DatoSimple({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="min-w-0">
            <span className="font-semibold">
                {titulo}:
            </span>{" "}
            <span className="text-[#56615B] print:text-black">
                {valor}
            </span>
        </div>
    );
}

function LineaTotal({
    titulo,
    valor,
    fuerte = false,
}: {
    titulo: string;
    valor: string;
    fuerte?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span
                className={
                    fuerte
                        ? "font-bold"
                        : ""
                }
            >
                {titulo}
            </span>

            <strong
                className={
                    fuerte
                        ? "text-sm"
                        : ""
                }
            >
                {valor}
            </strong>
        </div>
    );
}

function textoMetodo(
    metodo: string,
) {
    const metodos: Record<
        string,
        string
    > = {
        EFECTIVO: "Efectivo",
        TARJETA: "Tarjeta / POS",
        TRANSFERENCIA:
            "Transferencia",
        DEPOSITO: "Depósito",
        CREDITO: "Crédito",
        OTRO: "Otro",
    };

    return (
        metodos[metodo] ??
        metodo
    );
}

function textoEstadoPago(
    estado: string,
) {
    const estados: Record<
        string,
        string
    > = {
        PAGADA: "Pagada",
        PARCIAL: "Parcial",
        PENDIENTE: "Pendiente",
    };

    return (
        estados[estado] ??
        estado
    );
}

function cantidad(valor: number) {
    return Number(
        valor,
    ).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
        },
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