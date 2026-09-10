"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    Boxes,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    FileText,
    LoaderCircle,
    PackageCheck,
    ReceiptText,
    Store,
    Truck,
    Trash2,
    X,
    XCircle,
} from "lucide-react";
import {
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    anularCompra,
    confirmarCompra,
} from "./actions";

export type CompraDetalle = {
    id: string;

    codigoCompra: string;
    numeroFactura:
    | string
    | null;

    fechaCompra: string;

    condicionPago: string;

    fechaVencimiento:
    | string
    | null;

    subtotal: number;
    descuento: number;
    impuestos: number;
    total: number;

    montoPagado: number;
    saldoPendiente: number;

    estadoPago: string;
    estado: string;

    notas:
    | string
    | null;

    fechaConfirmacion:
    | string
    | null;

    proveedorNombre: string;
    proveedorCodigo: string;

    sucursalNombre: string;

    items: {
        id: string;

        productoId: string;
        codigoProducto: string;
        nombre: string;
        unidad: string;

        cantidad: number;
        costoUnitario: number;
        descuento: number;
        subtotal: number;
        total: number;

        lote:
        | string
        | null;

        fechaVencimiento:
        | string
        | null;

        stockAnterior:
        | number
        | null;

        stockNuevo:
        | number
        | null;
    }[];
};

type Mensaje = {
    tipo:
    | "EXITO"
    | "ERROR";

    texto: string;
} | null;

export default function CompraDetalleClient({
    compra,
}: {
    compra: CompraDetalle;
}) {
    const router =
        useRouter();

    const [
        confirmarAbierto,
        setConfirmarAbierto,
    ] = useState(false);

    const [
        mensaje,
        setMensaje,
    ] = useState<Mensaje>(
        null,
    );

    const [
        anularAbierto,
        setAnularAbierto,
    ] = useState(false);

    const [
        motivoAnulacion,
        setMotivoAnulacion,
    ] = useState("");

    const [
        procesando,
        iniciarTransicion,
    ] = useTransition();

    const esBorrador =
        compra.estado ===
        "BORRADOR";

    const confirmada =
        compra.estado ===
        "CONFIRMADA";

    const anulada =
        compra.estado ===
        "ANULADA";

    const puedeAnular =
        !anulada &&
        (
            esBorrador ||
            confirmada
        );

    function ejecutarConfirmacion() {
        iniciarTransicion(
            async () => {
                const resultado =
                    await confirmarCompra(
                        compra.id,
                    );

                setMensaje({
                    tipo:
                        resultado.exito
                            ? "EXITO"
                            : "ERROR",

                    texto:
                        resultado.mensaje,
                });

                if (
                    resultado.exito
                ) {
                    setConfirmarAbierto(
                        false,
                    );

                    router.refresh();
                }
            },
        );
    }

    function ejecutarAnulacion() {
        iniciarTransicion(
            async () => {
                const resultado =
                    await anularCompra(
                        compra.id,
                        motivoAnulacion,
                    );

                setMensaje({
                    tipo:
                        resultado.exito
                            ? "EXITO"
                            : "ERROR",

                    texto:
                        resultado.mensaje,
                });

                if (
                    resultado.exito
                ) {
                    setAnularAbierto(
                        false,
                    );

                    setMotivoAnulacion(
                        "",
                    );

                    router.refresh();
                }
            },
        );
    }

    return (
        <div className="space-y-6">
            {mensaje && (
                <MensajeEstado
                    mensaje={
                        mensaje
                    }
                    cerrar={() =>
                        setMensaje(
                            null,
                        )
                    }
                />
            )}

            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />

                <Link
                    href="/compras"
                    className="relative inline-flex items-center gap-2 text-sm font-semibold text-[#B9C8C1]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Compras
                </Link>

                <div className="relative mt-5 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                            <ReceiptText className="h-7 w-7" />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-3xl font-black sm:text-4xl tracking-tight">
                                    {compra.codigoCompra}
                                </h1>

                                <EstadoCompra
                                    estado={
                                        compra.estado
                                    }
                                />
                            </div>

                            <p className="mt-2 text-sm text-[#CFD9D4]">
                                {compra.numeroFactura
                                    ? `Factura ${compra.numeroFactura}`
                                    : "Sin número de factura"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {puedeAnular && (
                            <button
                                type="button"
                                onClick={() => {
                                    setMotivoAnulacion("");
                                    setAnularAbierto(true);
                                }}
                                className="salon-action inline-flex items-center justify-center gap-2 border border-white/20 bg-white/10 px-5 text-white transition hover:bg-white/15"
                            >
                                <Trash2 className="h-5 w-5" />
                                Anular
                            </button>
                        )}

                        {esBorrador && (
                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmarAbierto(
                                        true,
                                    )
                                }
                                className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-5 text-sidebar transition hover:bg-white"
                            >
                                <PackageCheck className="h-5 w-5" />
                                Confirmar compra
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DatoSuperior
                    icono={
                        Truck
                    }
                    titulo="Proveedor"
                    valor={
                        compra.proveedorNombre
                    }
                />

                <DatoSuperior
                    icono={
                        Store
                    }
                    titulo="Sucursal"
                    valor={
                        compra.sucursalNombre
                    }
                />

                <DatoSuperior
                    icono={
                        CalendarDays
                    }
                    titulo="Fecha"
                    valor={
                        formatearFechaHora(
                            compra.fechaCompra,
                        )
                    }
                />

                <DatoSuperior
                    icono={
                        CircleDollarSign
                    }
                    titulo="Total"
                    valor={
                        formatearDinero(
                            compra.total,
                        )
                    }
                />
            </section>

            {esBorrador && (
                <div className="flex items-start gap-3 rounded-2xl border border-[#E9D7AB] bg-[#FFF8E7] p-4 text-[#7E632A]">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                        <p className="font-bold">
                            Compra pendiente de confirmar
                        </p>

                        <p className="mt-1 text-sm leading-6">
                            El inventario aún no ha cambiado. Al confirmar, las cantidades serán agregadas a la sucursal seleccionada.
                        </p>
                    </div>
                </div>
            )}

            {confirmada && (
                <div className="flex items-start gap-3 rounded-2xl border border-[#CFE0D8] bg-[#E3EEE8] p-4 text-[#3F6657]">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                        <p className="font-bold">
                            Compra confirmada
                        </p>

                        <p className="mt-1 text-sm leading-6">
                            Los productos controlados por inventario ya fueron ingresados al stock.
                        </p>
                    </div>
                </div>
            )}

            {anulada && (
                <div className="flex items-start gap-3 rounded-2xl border border-[#EBCBCB] bg-[#F8E5E5] p-4 text-[#985858]">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                        <p className="font-bold">
                            Compra anulada
                        </p>

                        <p className="mt-1 text-sm leading-6">
                            Si la compra había sido confirmada, sus entradas de inventario fueron revertidas.
                        </p>
                    </div>
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">
                            Productos de la compra
                        </h2>

                        <p className="mt-1 text-sm text-text-secondary">
                            {compra.items.length} producto
                            {compra.items.length ===
                                1
                                ? ""
                                : "s"}{" "}
                            registrado
                            {compra.items.length ===
                                1
                                ? ""
                                : "s"}
                        </p>
                    </div>

                    <div className="mt-5 space-y-3">
                        {compra.items.map(
                            (
                                item,
                            ) => (
                                <article
                                    key={
                                        item.id
                                    }
                                    className="rounded-2xl border border-border bg-[#FBFCFA] p-4"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-bold text-foreground">
                                                {
                                                    item.nombre
                                                }
                                            </p>

                                            <p className="mt-1 text-xs text-[#76817B]">
                                                {
                                                    item.codigoProducto
                                                }
                                                {" · "}
                                                {
                                                    item.unidad
                                                }
                                            </p>

                                            {(item.lote ||
                                                item.fechaVencimiento) && (
                                                    <p className="mt-2 text-xs text-text-secondary">
                                                        {item.lote
                                                            ? `Lote ${item.lote}`
                                                            : ""}
                                                        {item.lote &&
                                                            item.fechaVencimiento
                                                            ? " · "
                                                            : ""}
                                                        {item.fechaVencimiento
                                                            ? `Vence ${formatearFecha(item.fechaVencimiento)}`
                                                            : ""}
                                                    </p>
                                                )}
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[500px]">
                                            <MiniDato
                                                titulo="Cantidad"
                                                valor={`${formatearCantidad(
                                                    item.cantidad,
                                                )} ${item.unidad}`}
                                            />

                                            <MiniDato
                                                titulo="Costo"
                                                valor={formatearDinero(
                                                    item.costoUnitario,
                                                )}
                                            />

                                            <MiniDato
                                                titulo="Total"
                                                valor={formatearDinero(
                                                    item.total,
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {confirmada &&
                                        item.stockAnterior !==
                                        null &&
                                        item.stockNuevo !==
                                        null && (
                                            <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-soft px-3 py-2 text-xs font-semibold text-primary-strong">
                                                <Boxes className="h-4 w-4" />

                                                Stock:
                                                {" "}
                                                {formatearCantidad(
                                                    item.stockAnterior,
                                                )}
                                                {" → "}
                                                {formatearCantidad(
                                                    item.stockNuevo,
                                                )}
                                                {" "}
                                                {
                                                    item.unidad
                                                }
                                            </div>
                                        )}
                                </article>
                            ),
                        )}
                    </div>
                </div>

                <aside className="space-y-5">
                    <div className="salon-panel border border-border bg-white p-5">
                        <h2 className="font-bold text-foreground tracking-tight">
                            Resumen financiero
                        </h2>

                        <div className="mt-5 space-y-3 text-sm">
                            <Linea
                                titulo="Subtotal"
                                valor={
                                    compra.subtotal
                                }
                            />

                            <Linea
                                titulo="Descuento"
                                valor={
                                    -compra.descuento
                                }
                            />

                            <Linea
                                titulo="Impuestos"
                                valor={
                                    compra.impuestos
                                }
                            />

                            <div className="border-t border-border pt-3">
                                <Linea
                                    titulo="TOTAL"
                                    valor={
                                        compra.total
                                    }
                                    fuerte
                                />
                            </div>
                        </div>
                    </div>

                    <div className="salon-panel border border-border bg-white p-5">
                        <h2 className="font-bold text-foreground tracking-tight">
                            Pago
                        </h2>

                        <div className="mt-4 space-y-3">
                            <MiniDato
                                titulo="Condición"
                                valor={formatearCondicion(
                                    compra.condicionPago,
                                )}
                            />

                            {compra.fechaVencimiento && (
                                <MiniDato
                                    titulo="Vencimiento"
                                    valor={formatearFecha(
                                        compra.fechaVencimiento,
                                    )}
                                />
                            )}

                            <MiniDato
                                titulo="Estado de pago"
                                valor={
                                    compra.estadoPago
                                }
                            />
                        </div>
                    </div>

                    {compra.notas && (
                        <div className="salon-panel border border-border bg-white p-5">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />

                                <h2 className="font-bold text-foreground tracking-tight">
                                    Notas
                                </h2>
                            </div>

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                                {
                                    compra.notas
                                }
                            </p>
                        </div>
                    )}
                </aside>
            </section>

            {anularAbierto && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-sidebar/50 p-4 backdrop-blur-sm">
                    <button
                        type="button"
                        aria-label="Cerrar"
                        className="absolute inset-0"
                        onClick={() => {
                            if (!procesando) {
                                setAnularAbierto(false);
                            }
                        }}
                    />

                    <div className="salon-panel relative z-10 w-full max-w-lg bg-white p-6 shadow-2xl">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8E5E5] text-[#A25E5E]">
                            <Trash2 className="h-6 w-6" />
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-foreground tracking-tight">
                            Anular compra
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                            {confirmada
                                ? "Se intentarán retirar del inventario exactamente las cantidades que entraron con esta compra."
                                : "La compra todavía no ha sido confirmada, por lo que no ha modificado el inventario."}
                        </p>

                        {confirmada && (
                            <div className="mt-4 rounded-2xl border border-[#E9D7AB] bg-[#FFF8E7] p-4 text-sm text-[#7E632A]">
                                Si el stock actual no alcanza para retirar lo comprado, la anulación será bloqueada para evitar existencias negativas.
                            </div>
                        )}

                        <label className="mt-5 block text-sm font-bold text-text-secondary">
                            Motivo de anulación
                        </label>

                        <textarea
                            rows={3}
                            value={motivoAnulacion}
                            onChange={(event) =>
                                setMotivoAnulacion(
                                    event.target.value,
                                )
                            }
                            placeholder="Ej. Factura registrada por error..."
                            className="salon-control mt-2 w-full border border-border-strong bg-white px-4 py-3 outline-none focus:border-primary"
                        />

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={procesando}
                                onClick={() =>
                                    setAnularAbierto(false)
                                }
                                className="salon-action border border-border-strong bg-surface-soft px-5 text-text-secondary"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                disabled={
                                    procesando ||
                                    motivoAnulacion.trim().length < 3
                                }
                                onClick={ejecutarAnulacion}
                                className="salon-action inline-flex items-center justify-center gap-2 bg-[#A25E5E] px-5 text-white disabled:opacity-50"
                            >
                                {procesando ? (
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Trash2 className="h-5 w-5" />
                                )}

                                {procesando
                                    ? "Anulando..."
                                    : "Confirmar anulación"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmarAbierto && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-sidebar/50 p-4 backdrop-blur-sm">
                    <button
                        type="button"
                        aria-label="Cerrar"
                        className="absolute inset-0"
                        onClick={() => {
                            if (
                                !procesando
                            ) {
                                setConfirmarAbierto(
                                    false,
                                );
                            }
                        }}
                    />

                    <div className="salon-panel relative z-10 w-full max-w-lg bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                                <PackageCheck className="h-6 w-6" />
                            </div>

                            <button
                                type="button"
                                disabled={
                                    procesando
                                }
                                onClick={() =>
                                    setConfirmarAbierto(
                                        false,
                                    )
                                }
                                className="rounded-xl p-2 text-text-secondary hover:bg-surface-soft"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-foreground tracking-tight">
                            ¿Confirmar esta compra?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                            Se agregarán las cantidades de los productos al inventario de{" "}
                            <strong>
                                {
                                    compra.sucursalNombre
                                }
                            </strong>
                            . Esta acción no debe repetirse.
                        </p>

                        <div className="mt-5 rounded-2xl bg-surface-soft p-4">
                            <p className="text-xs font-bold uppercase text-[#7A8680]">
                                Total de compra
                            </p>

                            <p className="mt-1 text-2xl font-bold text-foreground">
                                {formatearDinero(
                                    compra.total,
                                )}
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={
                                    procesando
                                }
                                onClick={() =>
                                    setConfirmarAbierto(
                                        false,
                                    )
                                }
                                className="salon-action border border-border-strong bg-surface-soft px-5 text-text-secondary"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                disabled={
                                    procesando
                                }
                                onClick={
                                    ejecutarConfirmacion
                                }
                                className="salon-action inline-flex items-center justify-center gap-2 bg-primary px-5 text-white disabled:opacity-50"
                            >
                                {procesando ? (
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                ) : (
                                    <PackageCheck className="h-5 w-5" />
                                )}

                                {procesando
                                    ? "Confirmando..."
                                    : "Sí, confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DatoSuperior({
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
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                    <Icono className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#7A8680]">
                        {titulo}
                    </p>

                    <p className="mt-1 truncate font-bold text-foreground">
                        {valor}
                    </p>
                </div>
            </div>
        </article>
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
        <div className="rounded-xl bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#839089]">
                {titulo}
            </p>

            <p className="mt-1 text-sm font-bold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function EstadoCompra({
    estado,
}: {
    estado: string;
}) {
    const clase =
        estado === "CONFIRMADA"
            ? "bg-[#E3EEE8] text-[#527865]"
            : estado === "ANULADA"
                ? "bg-[#F8E5E5] text-[#A25E5E]"
                : "bg-[#FFF1CC] text-[#8A6A22]";

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${clase}`}
        >
            {estado === "BORRADOR"
                ? "PENDIENTE DE CONFIRMAR"
                : estado}
        </span>
    );
}

function MensajeEstado({
    mensaje,
    cerrar,
}: {
    mensaje: Exclude<
        Mensaje,
        null
    >;

    cerrar: () => void;
}) {
    return (
        <div
            className={[
                "flex items-start gap-3 rounded-2xl border px-4 py-4",
                mensaje.tipo ===
                    "EXITO"
                    ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                    : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
            ].join(" ")}
        >
            {mensaje.tipo ===
                "EXITO" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <p className="min-w-0 flex-1 text-sm font-semibold">
                {mensaje.texto}
            </p>

            <button
                type="button"
                onClick={
                    cerrar
                }
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

function Linea({
    titulo,
    valor,
    fuerte = false,
}: {
    titulo: string;
    valor: number;
    fuerte?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span
                className={
                    fuerte
                        ? "font-bold text-foreground"
                        : "text-text-secondary"
                }
            >
                {titulo}
            </span>

            <strong
                className={
                    fuerte
                        ? "text-lg text-foreground"
                        : "text-[#33413B]"
                }
            >
                {formatearDinero(
                    valor,
                )}
            </strong>
        </div>
    );
}

function formatearDinero(
    valor: number,
) {
    return `C$ ${Number(
        valor,
    ).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    )}`;
}

function formatearCantidad(
    valor: number,
) {
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
    ).format(
        new Date(
            `${fecha}T12:00:00`,
        ),
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
    ).format(
        new Date(fecha),
    );
}

function formatearCondicion(
    condicion: string,
) {
    const nombres: Record<
        string,
        string
    > = {
        CONTADO:
            "Contado",
        CREDITO:
            "Crédito",
        MIXTA:
            "Mixta",
    };

    return (
        nombres[condicion] ??
        condicion
    );
}