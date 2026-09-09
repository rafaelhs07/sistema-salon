"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    Building2,
    CheckCircle2,
    CircleDollarSign,
    CreditCard,
    FileText,
    Landmark,
    LoaderCircle,
    ReceiptText,
    Store,
    WalletCards,
    XCircle,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    registrarIngresoManual,
    type MetodoIngresoManual,
} from "./actions";

export type SucursalIngreso = {
    id: string;
    nombre: string;
    es_principal?: boolean;
    estado?: string;
};

export type CategoriaIngreso = {
    id: string;
    nombre: string;
    descripcion:
    | string
    | null;
    sistema: boolean;
};

export type CajaAbiertaIngreso = {
    id: string;
    sucursal_id: string;
    fecha_apertura: string;
    estado: string;
};

type Mensaje = {
    tipo:
    | "EXITO"
    | "ERROR";
    texto: string;
} | null;

export default function NuevoIngresoClient({
    simboloMoneda,
    sucursales,
    categorias,
    cajasAbiertas,
    sucursalInicialId,
}: {
    simboloMoneda: string;
    sucursales: SucursalIngreso[];
    categorias: CategoriaIngreso[];
    cajasAbiertas: CajaAbiertaIngreso[];
    sucursalInicialId: string;
}) {
    const router =
        useRouter();

    const [
        sucursalId,
        setSucursalId,
    ] = useState(
        sucursalInicialId,
    );

    const [
        categoriaId,
        setCategoriaId,
    ] = useState(
        categorias[0]?.id ??
        "",
    );

    const [
        metodoPago,
        setMetodoPago,
    ] =
        useState<MetodoIngresoManual>(
            "EFECTIVO",
        );

    const [
        concepto,
        setConcepto,
    ] = useState("");

    const [
        monto,
        setMonto,
    ] = useState("");

    const [
        referencia,
        setReferencia,
    ] = useState("");

    const [
        descripcion,
        setDescripcion,
    ] = useState("");

    const [
        mensaje,
        setMensaje,
    ] = useState<Mensaje>(
        null,
    );

    const [
        procesando,
        iniciarTransicion,
    ] = useTransition();

    const cajaAbierta =
        useMemo(
            () =>
                cajasAbiertas.find(
                    (caja) =>
                        caja.sucursal_id ===
                        sucursalId,
                ) ??
                null,
            [
                cajasAbiertas,
                sucursalId,
            ],
        );

    const categoria =
        categorias.find(
            (item) =>
                item.id ===
                categoriaId,
        );

    const montoNumero =
        Number(monto);

    const requiereCaja =
        metodoPago ===
        "EFECTIVO";

    const formularioValido =
        Boolean(
            sucursalId,
        ) &&
        Boolean(
            categoriaId,
        ) &&
        concepto.trim().length >=
        3 &&
        Number.isFinite(
            montoNumero,
        ) &&
        montoNumero >
        0 &&
        (
            !requiereCaja ||
            Boolean(
                cajaAbierta,
            )
        );

    function guardar() {
        if (
            !formularioValido ||
            procesando
        ) {
            return;
        }

        setMensaje(null);

        iniciarTransicion(
            async () => {
                const resultado =
                    await registrarIngresoManual(
                        {
                            sucursalId,
                            categoriaId,
                            metodoPago,
                            concepto,
                            monto:
                                montoNumero,
                            referencia,
                            descripcion,
                        },
                    );

                if (
                    !resultado.exito
                ) {
                    setMensaje({
                        tipo: "ERROR",
                        texto:
                            resultado.mensaje,
                    });

                    return;
                }

                setMensaje({
                    tipo: "EXITO",
                    texto:
                        resultado.mensaje,
                });

                setConcepto("");
                setMonto("");
                setReferencia("");
                setDescripcion("");

                router.refresh();
            },
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <section className="relative overflow-hidden rounded-[32px] bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/finanzas"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Finanzas
                    </Link>

                    <div className="mt-5 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                            <CircleDollarSign className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Entrada adicional
                            </p>

                            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                Registrar ingreso
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Registra ingresos que no provienen directamente
                                de una venta del sistema, manteniendo la caja
                                y el libro financiero sincronizados.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {mensaje && (
                <div
                    className={[
                        "flex items-start gap-3 rounded-2xl border p-4",
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

                    <p className="text-sm font-semibold">
                        {mensaje.texto}
                    </p>
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section className="rounded-[30px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)] sm:p-6">
                    <div>
                        <h2 className="text-xl font-bold text-[#26332F]">
                            Datos del ingreso
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-[#72827A]">
                            Completa la información principal del movimiento.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <CampoSelect
                            titulo="Sucursal"
                            icono={
                                Store
                            }
                            valor={
                                sucursalId
                            }
                            cambiar={
                                setSucursalId
                            }
                        >
                            <option value="">
                                Selecciona una sucursal
                            </option>

                            {sucursales.map(
                                (
                                    sucursal,
                                ) => (
                                    <option
                                        key={
                                            sucursal.id
                                        }
                                        value={
                                            sucursal.id
                                        }
                                    >
                                        {
                                            sucursal.nombre
                                        }
                                    </option>
                                ),
                            )}
                        </CampoSelect>

                        <CampoSelect
                            titulo="Categoría"
                            icono={
                                ReceiptText
                            }
                            valor={
                                categoriaId
                            }
                            cambiar={
                                setCategoriaId
                            }
                        >
                            <option value="">
                                Selecciona una categoría
                            </option>

                            {categorias.map(
                                (
                                    categoria,
                                ) => (
                                    <option
                                        key={
                                            categoria.id
                                        }
                                        value={
                                            categoria.id
                                        }
                                    >
                                        {
                                            categoria.nombre
                                        }
                                    </option>
                                ),
                            )}
                        </CampoSelect>

                        <CampoSelect
                            titulo="Método de ingreso"
                            icono={
                                CreditCard
                            }
                            valor={
                                metodoPago
                            }
                            cambiar={(
                                valor,
                            ) =>
                                setMetodoPago(
                                    valor as MetodoIngresoManual,
                                )
                            }
                        >
                            <option value="EFECTIVO">
                                Efectivo
                            </option>

                            <option value="TARJETA">
                                Tarjeta
                            </option>

                            <option value="TRANSFERENCIA">
                                Transferencia
                            </option>

                            <option value="DEPOSITO">
                                Depósito
                            </option>

                            <option value="CHEQUE">
                                Cheque
                            </option>

                            <option value="OTRO">
                                Otro
                            </option>
                        </CampoSelect>

                        <CampoMonto
                            simboloMoneda={
                                simboloMoneda
                            }
                            valor={
                                monto
                            }
                            cambiar={
                                setMonto
                            }
                        />

                        <div className="md:col-span-2">
                            <CampoTexto
                                titulo="Concepto"
                                icono={
                                    FileText
                                }
                                valor={
                                    concepto
                                }
                                cambiar={
                                    setConcepto
                                }
                                placeholder="Ej. Alquiler de espacio, venta extraordinaria..."
                            />
                        </div>

                        <CampoTexto
                            titulo="Referencia"
                            icono={
                                Landmark
                            }
                            valor={
                                referencia
                            }
                            cambiar={
                                setReferencia
                            }
                            placeholder="Opcional"
                        />

                        <div className="md:col-span-2">
                            <label className="block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#43524B]">
                                    <FileText className="h-4 w-4 text-[#6F8F83]" />
                                    Descripción / observaciones
                                </span>

                                <textarea
                                    rows={4}
                                    value={
                                        descripcion
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setDescripcion(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Agrega información adicional si es necesario..."
                                    className="w-full rounded-2xl border border-[#DCE5E0] bg-[#F9FBFA] px-4 py-3 text-sm text-[#33413B] outline-none transition focus:border-[#6F8F83] focus:bg-white"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            href="/finanzas"
                            className="inline-flex h-12 items-center justify-center rounded-xl border border-[#DCE5E0] bg-white px-5 text-sm font-bold text-[#52605A] transition hover:bg-[#EEF2EF]"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="button"
                            onClick={
                                guardar
                            }
                            disabled={
                                !formularioValido ||
                                procesando
                            }
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#6F8F83] px-6 text-sm font-bold text-white transition hover:bg-[#607F74] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {procesando ? (
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : (
                                <WalletCards className="h-5 w-5" />
                            )}

                            {procesando
                                ? "Registrando..."
                                : "Registrar ingreso"}
                        </button>
                    </div>
                </section>

                <aside className="space-y-5">
                    <article className="rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E5F0EB] text-[#4F7564]">
                            <Building2 className="h-5 w-5" />
                        </div>

                        <h3 className="mt-4 font-bold text-[#26332F]">
                            Estado de caja
                        </h3>

                        {!sucursalId ? (
                            <p className="mt-2 text-sm leading-6 text-[#72827A]">
                                Selecciona una sucursal para comprobar su caja.
                            </p>
                        ) : cajaAbierta ? (
                            <div className="mt-3 rounded-2xl border border-[#CFE0D8] bg-[#E7F0EB] p-4">
                                <p className="font-bold text-[#456655]">
                                    Caja abierta
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[#60766B]">
                                    Los ingresos en efectivo se agregarán
                                    automáticamente al efectivo esperado.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-3 rounded-2xl border border-[#EBCBCB] bg-[#F8E5E5] p-4">
                                <p className="font-bold text-[#985858]">
                                    Caja cerrada
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[#8D6A6A]">
                                    No puedes registrar efectivo en esta
                                    sucursal hasta abrir una caja.
                                </p>
                            </div>
                        )}
                    </article>

                    <article className="rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4F0] text-[#52655D]">
                            <Banknote className="h-5 w-5" />
                        </div>

                        <h3 className="mt-4 font-bold text-[#26332F]">
                            ¿Qué pasará al guardar?
                        </h3>

                        <div className="mt-4 space-y-3 text-sm leading-6 text-[#72827A]">
                            <p>
                                Se registrará como un ingreso manual dentro
                                del libro financiero.
                            </p>

                            <p>
                                Si seleccionas efectivo, también quedará
                                registrado en la caja abierta de la sucursal.
                            </p>

                            <p>
                                Otros métodos no modifican el efectivo físico
                                esperado de caja.
                            </p>
                        </div>
                    </article>

                    <article className="rounded-[28px] border border-[#DCE5E0] bg-[#26332F] p-5 text-white shadow-[0_12px_35px_rgba(36,48,44,0.12)]">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#AFC0B8]">
                            Resumen
                        </p>

                        <p className="mt-3 text-3xl font-bold">
                            {simboloMoneda}{" "}
                            {Number.isFinite(
                                montoNumero,
                            )
                                ? montoNumero.toLocaleString(
                                    "es-NI",
                                    {
                                        minimumFractionDigits:
                                            2,
                                        maximumFractionDigits:
                                            2,
                                    },
                                )
                                : "0.00"}
                        </p>

                        <p className="mt-2 text-sm text-[#CFD9D4]">
                            {categoria
                                ?.nombre ??
                                "Sin categoría seleccionada"}
                        </p>
                    </article>
                </aside>
            </div>
        </div>
    );
}

function CampoSelect({
    titulo,
    icono: Icono,
    valor,
    cambiar,
    children,
}: {
    titulo: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    valor: string;
    cambiar: (
        valor: string,
    ) => void;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#43524B]">
                <Icono className="h-4 w-4 text-[#6F8F83]" />
                {titulo}
            </span>

            <select
                value={
                    valor
                }
                onChange={(
                    event,
                ) =>
                    cambiar(
                        event
                            .target
                            .value,
                    )
                }
                className="h-12 w-full rounded-2xl border border-[#DCE5E0] bg-[#F9FBFA] px-4 text-sm font-medium text-[#33413B] outline-none transition focus:border-[#6F8F83] focus:bg-white"
            >
                {children}
            </select>
        </label>
    );
}

function CampoTexto({
    titulo,
    icono: Icono,
    valor,
    cambiar,
    placeholder,
}: {
    titulo: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    valor: string;
    cambiar: (
        valor: string,
    ) => void;
    placeholder: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#43524B]">
                <Icono className="h-4 w-4 text-[#6F8F83]" />
                {titulo}
            </span>

            <input
                value={
                    valor
                }
                onChange={(
                    event,
                ) =>
                    cambiar(
                        event
                            .target
                            .value,
                    )
                }
                placeholder={
                    placeholder
                }
                className="h-12 w-full rounded-2xl border border-[#DCE5E0] bg-[#F9FBFA] px-4 text-sm text-[#33413B] outline-none transition focus:border-[#6F8F83] focus:bg-white"
            />
        </label>
    );
}

function CampoMonto({
    simboloMoneda,
    valor,
    cambiar,
}: {
    simboloMoneda: string;
    valor: string;
    cambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#43524B]">
                <CircleDollarSign className="h-4 w-4 text-[#6F8F83]" />
                Monto
            </span>

            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#52605A]">
                    {simboloMoneda}
                </span>

                <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                        valor
                    }
                    onChange={(
                        event,
                    ) =>
                        cambiar(
                            event
                                .target
                                .value,
                        )
                    }
                    placeholder="0.00"
                    className="h-12 w-full rounded-2xl border border-[#DCE5E0] bg-[#F9FBFA] pl-14 pr-4 text-sm font-bold text-[#26332F] outline-none transition focus:border-[#6F8F83] focus:bg-white"
                />
            </div>
        </label>
    );
}