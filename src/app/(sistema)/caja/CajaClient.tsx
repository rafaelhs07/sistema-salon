"use client";

import {
    ArrowDownUp,
    Banknote,
    Building2,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    History,
    Landmark,
    ListFilter,
    LoaderCircle,
    LockKeyhole,
    MessageSquareText,
    Plus,
    ShoppingBasket,
    Store,
    TrendingUp,
    WalletCards,
    X,
    XCircle,
} from "lucide-react";
import {
    FormEvent,
    useMemo,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
    abrirCaja,
    type DatosAperturaCaja,
} from "./actions";

export type SucursalCaja = {
    id: string;
    nombre: string;
    es_principal: boolean;
    estado: string;
};

export type CajaAbierta = {
    id: string;
    sucursal_id: string;
    usuario_apertura_id: string | null;
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

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

export default function CajaClient({
    sucursales,
    cajasIniciales,
    sucursalInicialId,
}: {
    sucursales: SucursalCaja[];
    cajasIniciales: CajaAbierta[];
    sucursalInicialId: string;
}) {
    const router = useRouter();

    const [mensaje, setMensaje] =
        useState<Mensaje>(null);

    const [
        mostrarFormulario,
        setMostrarFormulario,
    ] = useState(
        cajasIniciales.length === 0,
    );

    const [guardando, iniciarGuardado] =
        useTransition();

    const [formulario, setFormulario] =
        useState<DatosAperturaCaja>({
            sucursalId:
                sucursalInicialId,
            montoInicial: 0,
            observaciones: "",
        });

    const sucursalesDisponibles =
        useMemo(
            () =>
                sucursales.filter(
                    (sucursal) =>
                        !cajasIniciales.some(
                            (caja) =>
                                caja.sucursal_id ===
                                sucursal.id,
                        ),
                ),
            [
                cajasIniciales,
                sucursales,
            ],
        );

    const totalEfectivoActual =
        useMemo(
            () =>
                cajasIniciales.reduce(
                    (
                        total,
                        caja,
                    ) =>
                        total +
                        Number(
                            caja.monto_inicial,
                        ) +
                        Number(
                            caja.total_ventas_efectivo,
                        ) +
                        Number(
                            caja.total_ingresos_manuales,
                        ) -
                        Number(
                            caja.total_egresos,
                        ),
                    0,
                ),
            [cajasIniciales],
        );

    function actualizar<
        K extends keyof DatosAperturaCaja,
    >(
        campo: K,
        valor: DatosAperturaCaja[K],
    ) {
        setFormulario(
            (actual) => ({
                ...actual,
                [campo]: valor,
            }),
        );

        setMensaje(null);
    }

    function enviar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setMensaje(null);

        iniciarGuardado(
            async () => {
                const resultado =
                    await abrirCaja(
                        formulario,
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
                    setMostrarFormulario(
                        false,
                    );

                    router.refresh();
                }
            },
        );
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                            <WalletCards className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Control de efectivo
                            </p>

                            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                                Caja y ventas
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Abre la caja de
                                cada sucursal y
                                controla el
                                efectivo
                                disponible
                                durante la
                                jornada.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/caja/reportes"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 font-bold text-white transition hover:bg-white/15"
                        >
                            <TrendingUp className="h-5 w-5" />
                            Reportes
                        </Link>

                        <Link
                            href="/caja/cierres"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 font-bold text-white transition hover:bg-white/15"
                        >
                            <History className="h-5 w-5" />
                            Historial de
                            cierres
                        </Link>

                        <Link
                            href="/caja/historial-movimientos"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 font-bold text-white transition hover:bg-white/15"
                        >
                            <ListFilter className="h-5 w-5" />
                            Movimientos
                        </Link>

                        {sucursalesDisponibles.length >
                            0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setMostrarFormulario(
                                            (
                                                mostrar,
                                            ) =>
                                                !mostrar,
                                        )
                                    }
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#DCE7E2] px-5 font-bold text-[#26332F] transition hover:bg-white"
                                >
                                    {mostrarFormulario ? (
                                        <X className="h-5 w-5" />
                                    ) : (
                                        <Plus className="h-5 w-5" />
                                    )}

                                    {mostrarFormulario
                                        ? "Cerrar formulario"
                                        : "Abrir caja"}
                                </button>
                            )}
                    </div>
                </div>
            </section>

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

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaResumen
                    titulo="Cajas abiertas"
                    valor={String(
                        cajasIniciales.length,
                    )}
                    icono={
                        LockKeyhole
                    }
                />

                <TarjetaResumen
                    titulo="Sucursales disponibles"
                    valor={String(
                        sucursalesDisponibles.length,
                    )}
                    icono={Store}
                />

                <TarjetaResumen
                    titulo="Efectivo estimado"
                    valor={formatearDinero(
                        totalEfectivoActual,
                    )}
                    icono={Banknote}
                />

                <TarjetaResumen
                    titulo="Estado"
                    valor={
                        cajasIniciales.length >
                            0
                            ? "Operando"
                            : "Sin apertura"
                    }
                    icono={
                        CircleDollarSign
                    }
                />
            </section>

            {mostrarFormulario &&
                sucursalesDisponibles.length >
                0 && (
                    <section className="rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                        <header className="flex items-center gap-3 border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE7E2] text-[#527064]">
                                <Landmark className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-[#24302C]">
                                    Apertura
                                    de caja
                                </h2>

                                <p className="mt-0.5 text-xs text-[#76817B]">
                                    Registra el
                                    efectivo
                                    disponible al
                                    comenzar la
                                    jornada.
                                </p>
                            </div>
                        </header>

                        <form
                            onSubmit={
                                enviar
                            }
                            className="p-5 sm:p-6"
                        >
                            <div className="grid gap-5 lg:grid-cols-2">
                                <CampoSucursal
                                    valor={
                                        formulario.sucursalId
                                    }
                                    sucursales={
                                        sucursalesDisponibles
                                    }
                                    cambiar={(
                                        valor,
                                    ) =>
                                        actualizar(
                                            "sucursalId",
                                            valor,
                                        )
                                    }
                                />

                                <CampoMonto
                                    valor={
                                        formulario.montoInicial
                                    }
                                    cambiar={(
                                        valor,
                                    ) =>
                                        actualizar(
                                            "montoInicial",
                                            valor,
                                        )
                                    }
                                />
                            </div>

                            <label className="mt-5 block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#3D4A45]">
                                    <MessageSquareText className="h-4 w-4 text-[#6F8F83]" />
                                    Observaciones
                                </span>

                                <textarea
                                    rows={
                                        4
                                    }
                                    value={
                                        formulario.observaciones
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        actualizar(
                                            "observaciones",
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Ejemplo: fondo inicial entregado por administración."
                                    className="w-full rounded-xl border border-[#D4DAD6] bg-white px-4 py-3 outline-none focus:border-[#6F8F83]"
                                />
                            </label>

                            <div className="mt-6 rounded-2xl border border-[#C8D9D1] bg-[#F0F5F2] p-4">
                                <p className="text-sm font-semibold text-[#43524B]">
                                    La caja
                                    quedará
                                    abierta
                                    para la
                                    sucursal
                                    seleccionada.
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[#6B756F]">
                                    El monto
                                    inicial se
                                    incluirá en
                                    el efectivo
                                    esperado al
                                    momento de
                                    realizar el
                                    cierre.
                                </p>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={
                                        guardando ||
                                        !formulario.sucursalId
                                    }
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#6F8F83] px-6 font-bold text-white transition hover:bg-[#607F74] disabled:cursor-not-allowed disabled:bg-[#AAB9B3]"
                                >
                                    {guardando ? (
                                        <LoaderCircle className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-5 w-5" />
                                    )}

                                    {guardando
                                        ? "Abriendo..."
                                        : "Confirmar apertura"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

            {sucursalesDisponibles.length ===
                0 &&
                sucursales.length > 0 && (
                    <div className="rounded-2xl border border-[#CFE0D8] bg-[#E3EEE8] p-4 text-[#3F6657]">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                            <div>
                                <p className="font-bold">
                                    Todas las
                                    sucursales
                                    tienen una
                                    caja abierta
                                </p>

                                <p className="mt-1 text-sm">
                                    No es
                                    necesario
                                    realizar
                                    otra
                                    apertura
                                    por el
                                    momento.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            <section className="rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-[#24302C]">
                        Cajas abiertas
                    </h2>

                    <p className="mt-1 text-sm text-[#6B756F]">
                        Sesiones
                        activas
                        disponibles
                        para registrar
                        ventas y
                        movimientos.
                    </p>
                </header>

                <div className="p-5 sm:p-6">
                    {cajasIniciales.length ===
                        0 ? (
                        <EstadoVacio />
                    ) : (
                        <div className="grid gap-4 xl:grid-cols-2">
                            {cajasIniciales.map(
                                (
                                    caja,
                                ) => (
                                    <TarjetaCaja
                                        key={
                                            caja.id
                                        }
                                        caja={
                                            caja
                                        }
                                    />
                                ),
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function TarjetaCaja({
    caja,
}: {
    caja: CajaAbierta;
}) {
    const efectivoEsperado =
        Number(
            caja.monto_inicial,
        ) +
        Number(
            caja.total_ventas_efectivo,
        ) +
        Number(
            caja.total_ingresos_manuales,
        ) -
        Number(
            caja.total_egresos,
        );

    return (
        <article className="rounded-2xl border border-[#DCE3DF] bg-[#FBFCFA] p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                        <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="font-bold text-[#24302C]">
                            {caja
                                .sucursales
                                ?.nombre ??
                                "Sucursal"}
                        </p>

                        <p className="mt-1 text-xs text-[#76817B]">
                            Abierta{" "}
                            {formatearFechaHora(
                                caja.fecha_apertura,
                            )}
                        </p>
                    </div>
                </div>

                <span className="rounded-full bg-[#E3EEE8] px-3 py-1 text-[10px] font-bold uppercase text-[#527865]">
                    Abierta
                </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DatoCaja
                    titulo="Monto inicial"
                    valor={formatearDinero(
                        caja.monto_inicial,
                    )}
                />

                <DatoCaja
                    titulo="Ventas en efectivo"
                    valor={formatearDinero(
                        caja.total_ventas_efectivo,
                    )}
                />

                <DatoCaja
                    titulo="Otros ingresos"
                    valor={formatearDinero(
                        caja.total_ingresos_manuales,
                    )}
                />

                <DatoCaja
                    titulo="Egresos"
                    valor={formatearDinero(
                        caja.total_egresos,
                    )}
                />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#26332F] p-4 text-white">
                <span className="text-sm text-[#CFD9D4]">
                    Efectivo
                    esperado
                </span>

                <strong className="text-lg">
                    {formatearDinero(
                        efectivoEsperado,
                    )}
                </strong>
            </div>

            {caja.observaciones_apertura && (
                <p className="mt-4 text-sm leading-6 text-[#6B756F]">
                    {
                        caja.observaciones_apertura
                    }
                </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                    href="/caja/cobrar"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#C8D9D1] bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B] transition hover:border-[#9FB7AC] hover:bg-[#CFE0D8]"
                >
                    Cobrar cita
                </Link>

                <Link
                    href="/caja/venta-directa"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#6F8F83] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#607F74] hover:shadow-md"
                >
                    Venta directa
                </Link>

                <Link
                    href="/caja/venta-productos"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#C79AA1] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#B98991] hover:shadow-md"
                >
                    <ShoppingBasket className="h-4 w-4" />
                    Venta de productos
                </Link>

                <Link
                    href="/caja/ventas"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE3DF] bg-white px-4 text-sm font-bold text-[#52605A] transition hover:bg-[#EEF2EF]"
                >
                    <History className="h-4 w-4" />
                    Historial
                </Link>

                <Link
                    href={`/caja/movimientos/${caja.id}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE3DF] bg-white px-4 text-sm font-bold text-[#52605A] transition hover:bg-[#EEF2EF]"
                >
                    <ArrowDownUp className="h-4 w-4" />
                    Ingreso /
                    egreso
                </Link>

                <Link
                    href={`/caja/cierre/${caja.id}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E7BDBD] bg-[#F8E5E5] px-4 text-sm font-bold text-[#985858] transition hover:bg-[#F3D8D8]"
                >
                    <LockKeyhole className="h-4 w-4" />
                    Cerrar caja
                </Link>
            </div>
        </article>
    );
}

function CampoSucursal({
    valor,
    sucursales,
    cambiar,
}: {
    valor: string;
    sucursales: SucursalCaja[];
    cambiar: (
        valor: string,
    ) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#3D4A45]">
                <Store className="h-4 w-4 text-[#6F8F83]" />
                Sucursal
            </span>

            <select
                value={valor}
                required
                onChange={(
                    event,
                ) =>
                    cambiar(
                        event.target
                            .value,
                    )
                }
                className="h-12 w-full rounded-xl border border-[#D4DAD6] bg-white px-4 outline-none focus:border-[#6F8F83]"
            >
                <option value="">
                    Seleccionar
                    sucursal
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
                            {sucursal.es_principal
                                ? " · Principal"
                                : ""}
                        </option>
                    ),
                )}
            </select>
        </label>
    );
}

function CampoMonto({
    valor,
    cambiar,
}: {
    valor: number;
    cambiar: (
        valor: number,
    ) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#3D4A45]">
                <Banknote className="h-4 w-4 text-[#6F8F83]" />
                Efectivo
                inicial
            </span>

            <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#6B756F]">
                    C$
                </span>

                <input
                    type="number"
                    min={
                        0
                    }
                    step={
                        0.01
                    }
                    value={
                        valor
                    }
                    required
                    onChange={(
                        event,
                    ) =>
                        cambiar(
                            Number(
                                event
                                    .target
                                    .value,
                            ),
                        )
                    }
                    className="h-12 w-full rounded-xl border border-[#D4DAD6] bg-white pl-12 pr-4 text-right font-semibold outline-none focus:border-[#6F8F83]"
                />
            </div>
        </label>
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
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-[#6B756F]">
                        {
                            titulo
                        }
                    </p>

                    <p className="mt-3 text-2xl font-bold text-[#24302C]">
                        {
                            valor
                        }
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function DatoCaja({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-[#76817B]">
                {titulo}
            </p>

            <p className="mt-1 font-bold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function EstadoVacio() {
    return (
        <div className="rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-12 text-center">
            <Clock3 className="mx-auto h-9 w-9 text-[#829089]" />

            <h3 className="mt-4 font-bold text-[#24302C]">
                No hay cajas
                abiertas
            </h3>

            <p className="mt-2 text-sm text-[#6B756F]">
                Realiza la
                apertura antes
                de registrar
                ventas, ingresos
                o egresos.
            </p>
        </div>
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
                <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
                <XCircle className="h-5 w-5 shrink-0" />
            )}

            <p className="min-w-0 flex-1 text-sm font-semibold">
                {
                    mensaje.texto
                }
            </p>

            <button
                type="button"
                onClick={
                    cerrar
                }
                aria-label="Cerrar mensaje"
            >
                <X className="h-5 w-5" />
            </button>
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
        new Date(
            fecha,
        ),
    );
}