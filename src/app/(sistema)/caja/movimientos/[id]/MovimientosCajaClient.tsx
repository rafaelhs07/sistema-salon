"use client";

import Link from "next/link";
import {
    ArrowDownCircle,
    ArrowLeft,
    ArrowUpCircle,
    Banknote,
    CheckCircle2,
    LoaderCircle,
    ReceiptText,
    XCircle,
} from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
    registrarMovimientoManual,
    type DatosMovimientoManual,
} from "./actions";

export type CajaMovimiento = {
    id: string;
    sucursal_id: string;
    fecha_apertura: string;
    monto_inicial: number;
    total_ventas_efectivo: number;
    total_ventas_otros: number;
    total_ingresos_manuales: number;
    total_egresos: number;
    estado: string;
    sucursales: { nombre: string } | null;
};

export type MovimientoCajaManual = {
    id: string;
    tipo: string;
    naturaleza: string;
    metodo_pago: string | null;
    concepto: string;
    monto: number;
    referencia: string | null;
    observaciones: string | null;
    fecha_movimiento: string;
};

export default function MovimientosCajaClient({
    caja,
    movimientos,
    simboloMoneda,
}: {
    caja: CajaMovimiento;
    movimientos: MovimientoCajaManual[];
    simboloMoneda: string;
}) {
    const router = useRouter();
    const [guardando, iniciarGuardado] = useTransition();
    const [mensaje, setMensaje] = useState<{
        tipo: "EXITO" | "ERROR";
        texto: string;
    } | null>(null);

    const [formulario, setFormulario] =
        useState<DatosMovimientoManual>({
            cajaSesionId: caja.id,
            tipo: "INGRESO",
            monto: 0,
            concepto: "",
            referencia: "",
            observaciones: "",
        });

    const efectivoEsperado =
        Number(caja.monto_inicial) +
        Number(caja.total_ventas_efectivo) +
        Number(caja.total_ingresos_manuales) -
        Number(caja.total_egresos);

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(valor).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMensaje(null);

        iniciarGuardado(async () => {
            const resultado = await registrarMovimientoManual(formulario);

            setMensaje({
                tipo: resultado.exito ? "EXITO" : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                setFormulario((actual) => ({
                    ...actual,
                    monto: 0,
                    concepto: "",
                    referencia: "",
                    observaciones: "",
                }));
                router.refresh();
            }
        });
    }

    return (
        <div className="space-y-6">
            <section className="salon-hero bg-sidebar p-6 text-white sm:p-8">
                <Link
                    href="/caja"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Caja
                </Link>

                <h1 className="mt-5 text-3xl font-black sm:text-4xl tracking-tight">
                    Ingresos y egresos
                </h1>

                <p className="mt-2 text-[#CFD9D4]">
                    {caja.sucursales?.nombre ?? "Sucursal"} · Efectivo esperado:{" "}
                    <strong>{dinero(efectivoEsperado)}</strong>
                </p>
            </section>

            {mensaje && (
                <div
                    className={[
                        "flex items-center gap-3 rounded-2xl border p-4",
                        mensaje.tipo === "EXITO"
                            ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                            : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
                    ].join(" ")}
                >
                    {mensaje.tipo === "EXITO" ? (
                        <CheckCircle2 className="h-5 w-5" />
                    ) : (
                        <XCircle className="h-5 w-5" />
                    )}
                    <p className="text-sm font-semibold">{mensaje.texto}</p>
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
                <form
                    onSubmit={enviar}
                    className="salon-panel border border-border bg-white p-6 shadow-sm"
                >
                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                        Nuevo movimiento
                    </h2>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                        {(["INGRESO", "EGRESO"] as const).map((tipo) => (
                            <button
                                key={tipo}
                                type="button"
                                onClick={() =>
                                    setFormulario((actual) => ({
                                        ...actual,
                                        tipo,
                                    }))
                                }
                                className={[
                                    "h-11 rounded-xl border text-sm font-bold",
                                    formulario.tipo === tipo
                                        ? tipo === "INGRESO"
                                            ? "border-[#AFC9BD] bg-[#E3EEE8] text-[#3F6657]"
                                            : "border-[#E7BDBD] bg-[#F8E5E5] text-[#985858]"
                                        : "border-border-strong bg-white text-text-secondary",
                                ].join(" ")}
                            >
                                {tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                            </button>
                        ))}
                    </div>

                    <label className="mt-4 block">
                        <span className="mb-2 block text-sm font-bold">Monto</span>
                        <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={formulario.monto}
                            onChange={(e) =>
                                setFormulario((a) => ({
                                    ...a,
                                    monto: Number(e.target.value),
                                }))
                            }
                            className="salon-control w-full border border-border-strong px-4 text-right"
                        />
                    </label>

                    <label className="mt-4 block">
                        <span className="mb-2 block text-sm font-bold">Concepto</span>
                        <input
                            value={formulario.concepto}
                            onChange={(e) =>
                                setFormulario((a) => ({
                                    ...a,
                                    concepto: e.target.value,
                                }))
                            }
                            placeholder="Ejemplo: compra de insumos"
                            className="salon-control w-full border border-border-strong px-4"
                        />
                    </label>

                    <label className="mt-4 block">
                        <span className="mb-2 block text-sm font-bold">
                            Referencia opcional
                        </span>
                        <input
                            value={formulario.referencia}
                            onChange={(e) =>
                                setFormulario((a) => ({
                                    ...a,
                                    referencia: e.target.value,
                                }))
                            }
                            className="salon-control w-full border border-border-strong px-4"
                        />
                    </label>

                    <label className="mt-4 block">
                        <span className="mb-2 block text-sm font-bold">
                            Observaciones
                        </span>
                        <textarea
                            rows={3}
                            value={formulario.observaciones}
                            onChange={(e) =>
                                setFormulario((a) => ({
                                    ...a,
                                    observaciones: e.target.value,
                                }))
                            }
                            className="salon-control w-full border border-border-strong p-3"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={
                            guardando ||
                            formulario.monto <= 0 ||
                            formulario.concepto.trim().length < 3
                        }
                        className={[
                            "mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl font-bold text-white disabled:opacity-50",
                            formulario.tipo === "INGRESO"
                                ? "bg-primary"
                                : "bg-[#A25E5E]",
                        ].join(" ")}
                    >
                        {guardando ? (
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                        ) : formulario.tipo === "INGRESO" ? (
                            <ArrowDownCircle className="h-5 w-5" />
                        ) : (
                            <ArrowUpCircle className="h-5 w-5" />
                        )}
                        Registrar {formulario.tipo === "INGRESO" ? "ingreso" : "egreso"}
                    </button>
                </form>

                <section className="salon-panel border border-border bg-white p-6 shadow-sm">
                    <h2 className="font-bold text-foreground tracking-tight">
                        Movimientos manuales
                    </h2>

                    {movimientos.length === 0 ? (
                        <div className="mt-5 rounded-2xl border border-dashed border-border-strong p-10 text-center">
                            <ReceiptText className="mx-auto h-8 w-8 text-[#829089]" />
                            <p className="mt-3 text-sm text-text-secondary">
                                No hay movimientos manuales.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 divide-y divide-[#E8ECE9]">
                            {movimientos.map((m) => (
                                <div
                                    key={m.id}
                                    className="flex items-start justify-between gap-4 py-4"
                                >
                                    <div>
                                        <p className="font-semibold text-[#33413B]">
                                            {m.concepto}
                                        </p>
                                        <p className="mt-1 text-xs text-[#829089]">
                                            {new Intl.DateTimeFormat("es-NI", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "numeric",
                                                minute: "2-digit",
                                                timeZone: "America/Managua",
                                            }).format(new Date(m.fecha_movimiento))}
                                        </p>
                                        {m.observaciones && (
                                            <p className="mt-1 text-xs text-text-secondary">
                                                {m.observaciones}
                                            </p>
                                        )}
                                    </div>

                                    <strong
                                        className={
                                            m.tipo === "INGRESO"
                                                ? "text-[#3F6657]"
                                                : "text-[#A25E5E]"
                                        }
                                    >
                                        {m.tipo === "INGRESO" ? "+ " : "- "}
                                        {dinero(m.monto)}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}