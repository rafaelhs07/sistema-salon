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
    registrarGastoManual,
    type MetodoGastoManual,
} from "./actions";

export type SucursalGasto = {
    id: string;
    nombre: string;
    es_principal?: boolean;
    estado?: string;
};

export type CategoriaGasto = {
    id: string;
    nombre: string;
    descripcion:
    | string
    | null;
    sistema: boolean;
};

export type CajaAbiertaGasto = {
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

export default function NuevoGastoClient({
    simboloMoneda,
    sucursales,
    categorias,
    cajasAbiertas,
    sucursalInicialId,
}: {
    simboloMoneda: string;
    sucursales: SucursalGasto[];
    categorias: CategoriaGasto[];
    cajasAbiertas: CajaAbiertaGasto[];
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
        useState<MetodoGastoManual>(
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
                    await registrarGastoManual(
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
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/finanzas"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Finanzas
                    </Link>

                    <div className="mt-5 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F0DDE1] text-[#7E4F59]">
                            <CircleDollarSign className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#D7BEC4]">
                                Salida del negocio
                            </p>

                            <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                Registrar gasto
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Registra gastos operativos del salón y mantén
                                sincronizados el control financiero y la caja
                                cuando el pago se realice en efectivo.
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
                <section className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div>
                        <h2 className="text-xl font-bold text-sidebar tracking-tight">
                            Datos del gasto
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-[#72827A]">
                            Completa la información del pago o salida.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <CampoSelect
                            titulo="Sucursal"
                            icono={Store}
                            valor={sucursalId}
                            cambiar={setSucursalId}
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
                            icono={ReceiptText}
                            valor={categoriaId}
                            cambiar={setCategoriaId}
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
                            titulo="Método de pago"
                            icono={CreditCard}
                            valor={metodoPago}
                            cambiar={(
                                valor,
                            ) =>
                                setMetodoPago(
                                    valor as MetodoGastoManual,
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
                            simboloMoneda={simboloMoneda}
                            valor={monto}
                            cambiar={setMonto}
                        />

                        <div className="md:col-span-2">
                            <CampoTexto
                                titulo="Concepto"
                                icono={FileText}
                                valor={concepto}
                                cambiar={setConcepto}
                                placeholder="Ej. Pago de energía, compra de papelería..."
                            />
                        </div>

                        <CampoTexto
                            titulo="Referencia"
                            icono={Landmark}
                            valor={referencia}
                            cambiar={setReferencia}
                            placeholder="Factura, transferencia, recibo..."
                        />

                        <div className="md:col-span-2">
                            <label className="block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                                    <FileText className="h-4 w-4 text-secondary" />
                                    Descripción / observaciones
                                </span>

                                <textarea
                                    rows={4}
                                    value={descripcion}
                                    onChange={(
                                        event,
                                    ) =>
                                        setDescripcion(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Información adicional..."
                                    className="salon-control w-full border border-border bg-[#F9FBFA] px-4 py-3 text-[#33413B] outline-none transition focus:border-secondary focus:bg-white"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            href="/finanzas"
                            className="salon-action inline-flex items-center justify-center border border-border bg-white px-5 text-[#52605A] transition hover:bg-surface-soft"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="button"
                            onClick={guardar}
                            disabled={
                                !formularioValido ||
                                procesando
                            }
                            className="salon-action inline-flex items-center justify-center gap-2 bg-[#A66D79] px-6 text-white transition hover:bg-[#935E69] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {procesando ? (
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : (
                                <WalletCards className="h-5 w-5" />
                            )}

                            {procesando
                                ? "Registrando..."
                                : "Registrar gasto"}
                        </button>
                    </div>
                </section>

                <aside className="space-y-5">
                    <article className="salon-panel border border-border bg-white p-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5E8EB] text-[#9B6470]">
                            <Building2 className="h-5 w-5" />
                        </div>

                        <h3 className="mt-4 font-bold text-sidebar tracking-tight">
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
                                    Los gastos en efectivo disminuirán
                                    automáticamente el efectivo esperado.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-3 rounded-2xl border border-[#EBCBCB] bg-[#F8E5E5] p-4">
                                <p className="font-bold text-[#985858]">
                                    Caja cerrada
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[#8D6A6A]">
                                    No puedes registrar gastos en efectivo
                                    hasta abrir una caja.
                                </p>
                            </div>
                        )}
                    </article>

                    <article className="salon-panel border border-border bg-white p-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-soft text-[#52655D]">
                            <Banknote className="h-5 w-5" />
                        </div>

                        <h3 className="mt-4 font-bold text-sidebar tracking-tight">
                            ¿Qué pasará al guardar?
                        </h3>

                        <div className="mt-4 space-y-3 text-sm leading-6 text-[#72827A]">
                            <p>
                                El gasto quedará en el libro financiero.
                            </p>

                            <p>
                                Si es efectivo, también se registrará
                                como salida de la caja abierta.
                            </p>

                            <p>
                                Los demás métodos no modifican el
                                efectivo físico esperado.
                            </p>
                        </div>
                    </article>

                    <article className="rounded-[28px] border border-border bg-sidebar p-5 text-white shadow-[0_12px_35px_rgba(36,48,44,0.12)]">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4B8BE]">
                            Gasto a registrar
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
                            {categoria?.nombre ??
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
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                <Icono className="h-4 w-4 text-secondary" />
                {titulo}
            </span>

            <select
                value={valor}
                onChange={(
                    event,
                ) =>
                    cambiar(
                        event
                            .target
                            .value,
                    )
                }
                className="salon-control w-full border border-border bg-[#F9FBFA] px-4 font-medium text-[#33413B] outline-none transition focus:border-secondary focus:bg-white"
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
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                <Icono className="h-4 w-4 text-secondary" />
                {titulo}
            </span>

            <input
                value={valor}
                onChange={(
                    event,
                ) =>
                    cambiar(
                        event
                            .target
                            .value,
                    )
                }
                placeholder={placeholder}
                className="salon-control w-full border border-border bg-[#F9FBFA] px-4 text-[#33413B] outline-none transition focus:border-secondary focus:bg-white"
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
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                <CircleDollarSign className="h-4 w-4 text-secondary" />
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
                    value={valor}
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
                    className="salon-control w-full border border-border bg-[#F9FBFA] pl-14 pr-4 text-sidebar outline-none transition focus:border-secondary focus:bg-white"
                />
            </div>
        </label>
    );
}