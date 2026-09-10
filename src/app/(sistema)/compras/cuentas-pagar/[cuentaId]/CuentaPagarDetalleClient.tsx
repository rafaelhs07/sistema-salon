"use client";

import Link from "next/link";
import {
    ArrowLeft,
    BadgeCheck,
    CalendarClock,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    LoaderCircle,
    Mail,
    MessageCircle,
    Phone,
    ReceiptText,
    Truck,
    WalletCards,
    X,
    XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarAbonoProveedor, type MetodoPagoProveedor } from "./actions";

export type CuentaPagarDetalle = {
    id: string;
    proveedorNombre: string;
    proveedorCodigo: string;
    proveedorContacto: string | null;
    proveedorTelefono: string | null;
    proveedorWhatsapp: string | null;
    proveedorCorreo: string | null;
    compraId: string;
    codigoCompra: string;
    numeroFactura: string | null;
    condicionPago: string;
    montoOriginal: number;
    totalAbonado: number;
    saldoPendiente: number;
    fechaOrigen: string;
    fechaVencimiento: string | null;
    estado: string;
    observaciones: string | null;
    abonos: {
        id: string;
        monto: number;
        metodoPago: string;
        referencia: string | null;
        observaciones: string | null;
        estado: string;
        fechaAbono: string;
    }[];
};

export default function CuentaPagarDetalleClient({ cuenta }: { cuenta: CuentaPagarDetalle }) {
    const router = useRouter();
    const [abierto, setAbierto] = useState(false);
    const [monto, setMonto] = useState(cuenta.saldoPendiente);
    const [metodo, setMetodo] = useState<MetodoPagoProveedor>("TRANSFERENCIA");
    const [referencia, setReferencia] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [mensaje, setMensaje] = useState<{ tipo: "EXITO" | "ERROR"; texto: string } | null>(null);
    const [procesando, startTransition] = useTransition();

    const permiteAbono =
        cuenta.saldoPendiente > 0 &&
        !["PAGADA", "ANULADA"].includes(cuenta.estado);

    function abrirPago(total = false) {
        setMonto(total ? cuenta.saldoPendiente : cuenta.saldoPendiente);
        setMetodo("TRANSFERENCIA");
        setReferencia("");
        setObservaciones("");
        setMensaje(null);
        setAbierto(true);
    }

    function guardar() {
        startTransition(async () => {
            const r = await registrarAbonoProveedor({
                cuentaId: cuenta.id,
                monto,
                metodoPago: metodo,
                referencia,
                observaciones,
            });

            if (!r.exito) {
                setMensaje({ tipo: "ERROR", texto: r.mensaje });
                return;
            }

            setMensaje({ tipo: "EXITO", texto: r.mensaje });
            setAbierto(false);
            router.refresh();
        });
    }

    return (
        <div className="mx-auto max-w-[1600px] space-y-6">
            {mensaje && (
                <div className={[
                    "flex items-start gap-3 rounded-2xl border p-4",
                    mensaje.tipo === "EXITO"
                        ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                        : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]"
                ].join(" ")}>
                    {mensaje.tipo === "EXITO" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    <p className="flex-1 text-sm font-semibold">{mensaje.texto}</p>
                </div>
            )}

            <section className="salon-hero bg-sidebar p-6 text-white sm:p-8">
                <Link href="/compras/cuentas-pagar" className="inline-flex items-center gap-2 text-sm font-semibold text-[#B9C8C1]">
                    <ArrowLeft className="h-4 w-4" />
                    Cuentas por pagar
                </Link>

                <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                            <Truck className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-3xl font-black sm:text-4xl tracking-tight">{cuenta.proveedorNombre}</h1>
                                <EstadoCuenta estado={cuenta.estado} />
                            </div>
                            <p className="mt-2 text-sm text-[#CFD9D4]">
                                {cuenta.codigoCompra}{cuenta.numeroFactura ? ` · Factura ${cuenta.numeroFactura}` : ""}
                            </p>
                        </div>
                    </div>

                    {permiteAbono && (
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => abrirPago(false)} className="salon-action inline-flex items-center gap-2 border border-white/20 bg-white/10 px-5">
                                <WalletCards className="h-5 w-5" />
                                Registrar abono
                            </button>
                            <button onClick={() => abrirPago(true)} className="salon-action inline-flex items-center gap-2 bg-primary-soft px-5 text-sidebar">
                                <BadgeCheck className="h-5 w-5" />
                                Pagar todo
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Resumen titulo="Monto original" valor={dinero(cuenta.montoOriginal)} icono={ReceiptText} />
                <Resumen titulo="Total abonado" valor={dinero(cuenta.totalAbonado)} icono={CheckCircle2} />
                <Resumen titulo="Saldo pendiente" valor={dinero(cuenta.saldoPendiente)} icono={CircleDollarSign} />
                <Resumen titulo="Vencimiento" valor={cuenta.fechaVencimiento ? fecha(cuenta.fechaVencimiento) : "Sin fecha"} icono={CalendarClock} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-foreground tracking-tight">Historial de pagos</h2>
                    <p className="mt-1 text-sm text-text-secondary">Abonos realizados a esta cuenta.</p>

                    {cuenta.abonos.length === 0 ? (
                        <div className="mt-5 rounded-2xl border border-dashed border-border-strong bg-[#FBFCFA] p-10 text-center">
                            <Clock3 className="mx-auto h-8 w-8 text-[#829089]" />
                            <p className="mt-3 font-bold text-[#33413B]">Aún no hay abonos</p>
                        </div>
                    ) : (
                        <div className="mt-5 space-y-3">
                            {cuenta.abonos.map((a) => (
                                <article key={a.id} className="rounded-2xl border border-border bg-[#FBFCFA] p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-foreground">{metodoNombre(a.metodoPago)}</p>
                                            <p className="mt-1 text-xs text-[#76817B]">{fechaHora(a.fechaAbono)}</p>
                                            {a.referencia && <p className="mt-1 text-xs text-text-secondary">Ref. {a.referencia}</p>}
                                        </div>
                                        <p className="text-lg font-bold text-primary-strong">{dinero(a.monto)}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                <aside className="space-y-5">
                    <div className="salon-panel border border-border bg-white p-5">
                        <h2 className="font-bold text-foreground tracking-tight">Proveedor</h2>
                        <div className="mt-4 space-y-3">
                            <Dato icono={Phone} titulo="Teléfono" valor={cuenta.proveedorTelefono || "No registrado"} />
                            <Dato icono={MessageCircle} titulo="WhatsApp" valor={cuenta.proveedorWhatsapp || "No registrado"} />
                            <Dato icono={Mail} titulo="Correo" valor={cuenta.proveedorCorreo || "No registrado"} />
                        </div>
                    </div>

                    <div className="salon-panel border border-border bg-white p-5">
                        <h2 className="font-bold text-foreground tracking-tight">Compra asociada</h2>
                        <p className="mt-3 text-sm font-semibold text-[#33413B]">{cuenta.codigoCompra}</p>
                        <Link href={`/compras/${cuenta.compraId}`} className="salon-action mt-4 inline-flex w-full items-center justify-center bg-surface-soft text-text-secondary">
                            Ver compra
                        </Link>
                    </div>
                </aside>
            </section>

            {abierto && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-sidebar/50 p-4 backdrop-blur-sm">
                    <button className="absolute inset-0" onClick={() => !procesando && setAbierto(false)} aria-label="Cerrar" />
                    <div className="salon-panel relative z-10 w-full max-w-xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-primary">Pago a proveedor</p>
                                <h2 className="mt-1 text-xl font-bold text-foreground tracking-tight">Registrar abono</h2>
                            </div>
                            <button onClick={() => setAbierto(false)} disabled={procesando} className="rounded-xl p-2 text-text-secondary hover:bg-surface-soft">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-5 rounded-2xl bg-surface-soft p-4">
                            <p className="text-xs font-bold uppercase text-[#7A8680]">Saldo pendiente</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{dinero(cuenta.saldoPendiente)}</p>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <Campo etiqueta="Monto" tipo="number" valor={String(monto)} cambiar={(v) => setMonto(Number(v))} />
                            <div>
                                <label className="mb-2 block text-xs font-bold text-[#52605A]">Método</label>
                                <select value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPagoProveedor)} className="salon-control w-full border border-border-strong bg-white px-4">
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TARJETA">Tarjeta</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="DEPOSITO">Depósito</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="OTRO">Otro</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <Campo etiqueta="Referencia" valor={referencia} cambiar={setReferencia} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-xs font-bold text-[#52605A]">Observaciones</label>
                                <textarea rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="salon-control w-full border border-border-strong px-4 py-3" />
                            </div>
                        </div>

                        <button
                            onClick={guardar}
                            disabled={procesando || monto <= 0 || monto > cuenta.saldoPendiente}
                            className="salon-action mt-6 inline-flex w-full items-center justify-center gap-2 bg-primary px-5 text-white disabled:opacity-50"
                        >
                            {procesando && <LoaderCircle className="h-5 w-5 animate-spin" />}
                            {procesando ? "Registrando..." : "Registrar pago"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Resumen({ titulo, valor, icono: Icono }: { titulo: string; valor: string; icono: React.ComponentType<{ className?: string }> }) {
    return <article className="salon-panel border border-border bg-white p-5"><p className="text-sm text-text-secondary">{titulo}</p><div className="mt-3 flex items-center justify-between gap-3"><p className="text-2xl font-bold text-foreground">{valor}</p><Icono className="h-5 w-5 text-primary-strong" /></div></article>;
}
function Dato({ icono: Icono, titulo, valor }: { icono: React.ComponentType<{ className?: string }>; titulo: string; valor: string }) {
    return <div className="rounded-xl bg-[#FBFCFA] p-3"><div className="flex items-center gap-2 text-[#7A8680]"><Icono className="h-4 w-4" /><span className="text-xs font-bold">{titulo}</span></div><p className="mt-1 text-sm font-semibold text-[#33413B]">{valor}</p></div>;
}
function Campo({ etiqueta, valor, cambiar, tipo = "text" }: { etiqueta: string; valor: string; cambiar: (v: string) => void; tipo?: string }) {
    return <div><label className="mb-2 block text-xs font-bold text-[#52605A]">{etiqueta}</label><input type={tipo} min={tipo === "number" ? "0.01" : undefined} step={tipo === "number" ? "0.01" : undefined} value={valor} onChange={(e) => cambiar(e.target.value)} className="salon-control w-full border border-border-strong px-4" /></div>;
}
function EstadoCuenta({ estado }: { estado: string }) {
    const c = estado === "PAGADA" ? "bg-[#E3EEE8] text-[#527865]" : estado === "VENCIDA" ? "bg-[#F8E5E5] text-[#A25E5E]" : estado === "PARCIAL" ? "bg-[#E8EDF4] text-[#5C6F88]" : "bg-[#FFF1CC] text-[#8A6A22]";
    return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${c}`}>{estado}</span>;
}
const dinero = (n: number) => `C$ ${Number(n).toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fecha = (s: string) => new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Managua" }).format(new Date(`${s}T12:00:00`));
const fechaHora = (s: string) => new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Managua" }).format(new Date(s));
const metodoNombre = (m: string) => ({ EFECTIVO: "Efectivo", TARJETA: "Tarjeta", TRANSFERENCIA: "Transferencia", DEPOSITO: "Depósito", CHEQUE: "Cheque", OTRO: "Otro" }[m] ?? m);