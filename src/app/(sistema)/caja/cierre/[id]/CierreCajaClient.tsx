"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    CreditCard,
    LoaderCircle,
    LockKeyhole,
    ReceiptText,
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

import { cerrarCaja } from "./actions";

export type CajaParaCierre = {
    id: string;
    sucursal_id: string;
    fecha_apertura: string;
    monto_inicial: number;
    total_ventas_efectivo: number;
    total_ventas_otros: number;
    total_ingresos_manuales: number;
    total_egresos: number;
    estado: string;
    observaciones_apertura: string | null;
    sucursales: {
        nombre: string;
    } | null;
};

export type MovimientoCajaCierre = {
    id: string;
    tipo: string;
    naturaleza: string;
    metodo_pago: string | null;
    concepto: string;
    monto: number;
    fecha_movimiento: string;
};

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

export default function CierreCajaClient({
    caja,
    movimientos,
    simboloMoneda,
}: {
    caja: CajaParaCierre;
    movimientos: MovimientoCajaCierre[];
    simboloMoneda: string;
}) {
    const router = useRouter();

    const efectivoEsperado = useMemo(
        () =>
            Number(caja.monto_inicial) +
            Number(caja.total_ventas_efectivo) +
            Number(
                caja.total_ingresos_manuales,
            ) -
            Number(caja.total_egresos),
        [caja],
    );

    const [montoContado, setMontoContado] =
        useState(efectivoEsperado);
    const [observaciones, setObservaciones] =
        useState("");
    const [confirmacion, setConfirmacion] =
        useState(false);
    const [mensaje, setMensaje] =
        useState<Mensaje>(null);
    const [cerrando, iniciarCierre] =
        useTransition();

    const diferencia =
        Number(montoContado || 0) -
        efectivoEsperado;

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function enviar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setMensaje(null);

        if (!confirmacion) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Confirma que verificaste el efectivo contado.",
            });
            return;
        }

        iniciarCierre(async () => {
            const resultado = await cerrarCaja(
                caja.id,
                montoContado,
                observaciones,
            );

            if (!resultado.exito) {
                setMensaje({
                    tipo: "ERROR",
                    texto: resultado.mensaje,
                });
                return;
            }

            setMensaje({
                tipo: "EXITO",
                texto:
                    "Caja cerrada correctamente.",
            });

            router.push("/caja");
            router.refresh();
        });
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/caja"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Caja
                    </Link>

                    <div className="mt-5 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                            <LockKeyhole className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Fin de jornada
                            </p>

                            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                Cierre de caja
                            </h1>

                            <p className="mt-3 text-[#CFD9D4]">
                                {caja.sucursales?.nombre ??
                                    "Sucursal"}{" "}
                                · abierta{" "}
                                {formatearFechaHora(
                                    caja.fecha_apertura,
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {mensaje && (
                <div
                    className={[
                        "flex items-start gap-3 rounded-2xl border px-4 py-4",
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

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Resumen
                    titulo="Monto inicial"
                    valor={dinero(
                        caja.monto_inicial,
                    )}
                    icono={Banknote}
                />

                <Resumen
                    titulo="Ventas efectivo"
                    valor={dinero(
                        caja.total_ventas_efectivo,
                    )}
                    icono={CircleDollarSign}
                />

                <Resumen
                    titulo="Otros pagos"
                    valor={dinero(
                        caja.total_ventas_otros,
                    )}
                    icono={CreditCard}
                />

                <Resumen
                    titulo="Ingresos manuales"
                    valor={dinero(
                        caja.total_ingresos_manuales,
                    )}
                    icono={WalletCards}
                />

                <Resumen
                    titulo="Egresos"
                    valor={dinero(
                        caja.total_egresos,
                    )}
                    icono={ReceiptText}
                />
            </section>

            <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
                <section className="rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                    <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] p-5 sm:p-6">
                        <h2 className="font-bold text-[#24302C]">
                            Movimientos recientes
                        </h2>
                        <p className="mt-1 text-sm text-[#6B756F]">
                            Últimos movimientos registrados
                            durante esta sesión.
                        </p>
                    </header>

                    <div className="p-5 sm:p-6">
                        {movimientos.length === 0 ? (
                            <p className="text-sm text-[#6B756F]">
                                No hay movimientos registrados.
                            </p>
                        ) : (
                            <div className="divide-y divide-[#E8ECE9]">
                                {movimientos.map(
                                    (movimiento) => (
                                        <div
                                            key={
                                                movimiento.id
                                            }
                                            className="flex items-start justify-between gap-4 py-3"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-[#33413B]">
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
                    </div>
                </section>

                <aside className="xl:sticky xl:top-24 xl:self-start">
                    <form
                        onSubmit={enviar}
                        className="rounded-3xl border border-[#E3E7E4] bg-white p-6 shadow-[0_8px_24px_rgba(36,48,44,0.05)]"
                    >
                        <h2 className="text-lg font-bold text-[#24302C]">
                            Arqueo de efectivo
                        </h2>

                        <div className="mt-5 rounded-2xl bg-[#26332F] p-5 text-white">
                            <p className="text-sm text-[#CFD9D4]">
                                Efectivo esperado
                            </p>
                            <p className="mt-2 text-3xl font-bold">
                                {dinero(
                                    efectivoEsperado,
                                )}
                            </p>
                        </div>

                        <label className="mt-5 block">
                            <span className="mb-2 block text-sm font-bold text-[#3D4A45]">
                                Efectivo contado
                            </span>

                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={montoContado}
                                onChange={(event) =>
                                    setMontoContado(
                                        Number(
                                            event.target.value,
                                        ),
                                    )
                                }
                                className="h-12 w-full rounded-xl border border-[#D4DAD6] px-4 text-right text-lg font-bold outline-none focus:border-[#6F8F83]"
                            />
                        </label>

                        <div
                            className={[
                                "mt-4 rounded-2xl border p-4",
                                Math.abs(diferencia) <
                                    0.005
                                    ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                                    : "border-[#E8D9B5] bg-[#FAF0DC] text-[#81652F]",
                            ].join(" ")}
                        >
                            <div className="flex items-center gap-2">
                                {Math.abs(diferencia) <
                                    0.005 ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5" />
                                )}

                                <span className="text-sm font-bold">
                                    Diferencia
                                </span>
                            </div>

                            <p className="mt-2 text-xl font-bold">
                                {diferencia > 0
                                    ? "+"
                                    : ""}
                                {dinero(diferencia)}
                            </p>

                            {diferencia < -0.005 && (
                                <p className="mt-1 text-xs">
                                    Hay un faltante de efectivo.
                                </p>
                            )}

                            {diferencia > 0.005 && (
                                <p className="mt-1 text-xs">
                                    Hay un sobrante de efectivo.
                                </p>
                            )}
                        </div>

                        <label className="mt-5 block">
                            <span className="mb-2 block text-sm font-bold text-[#3D4A45]">
                                Observaciones
                            </span>
                            <textarea
                                rows={3}
                                value={observaciones}
                                onChange={(event) =>
                                    setObservaciones(
                                        event.target.value,
                                    )
                                }
                                placeholder="Ejemplo: diferencia revisada con administración."
                                className="w-full rounded-xl border border-[#D4DAD6] px-4 py-3 text-sm outline-none focus:border-[#6F8F83]"
                            />
                        </label>

                        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-[#FBFCFA] p-4">
                            <input
                                type="checkbox"
                                checked={confirmacion}
                                onChange={(event) =>
                                    setConfirmacion(
                                        event.target.checked,
                                    )
                                }
                                className="mt-1 h-4 w-4"
                            />
                            <span className="text-sm leading-6 text-[#52605A]">
                                Confirmo que el efectivo fue
                                contado y que deseo cerrar esta
                                caja.
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={
                                cerrando ||
                                !confirmacion ||
                                !Number.isFinite(
                                    montoContado,
                                ) ||
                                montoContado < 0
                            }
                            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6F8F83] font-bold text-white transition hover:bg-[#607F74] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {cerrando ? (
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : (
                                <LockKeyhole className="h-5 w-5" />
                            )}
                            {cerrando
                                ? "Cerrando..."
                                : "Cerrar caja"}
                        </button>
                    </form>
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