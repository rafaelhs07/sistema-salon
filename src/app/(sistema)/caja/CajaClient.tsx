"use client";

import {
    ArrowDownUp,
    Banknote,
    BarChart3,
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
    ReceiptText,
    ShoppingBasket,
    Sparkles,
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
import {
    useRouter,
} from "next/navigation";
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
    const router =
        useRouter();

    const [
        mensaje,
        setMensaje,
    ] =
        useState<Mensaje>(
            null,
        );

    const [
        mostrarFormulario,
        setMostrarFormulario,
    ] =
        useState(
            cajasIniciales.length ===
            0,
        );

    const [
        guardando,
        iniciarGuardado,
    ] =
        useTransition();

    const [
        formulario,
        setFormulario,
    ] =
        useState<DatosAperturaCaja>({
            sucursalId:
                sucursalInicialId,
            montoInicial:
                0,
            observaciones:
                "",
        });

    const sucursalesDisponibles =
        useMemo(
            () =>
                sucursales.filter(
                    (
                        sucursal,
                    ) =>
                        !cajasIniciales.some(
                            (
                                caja,
                            ) =>
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
            [
                cajasIniciales,
            ],
        );

    const totalVentasEfectivo =
        useMemo(
            () =>
                cajasIniciales.reduce(
                    (
                        total,
                        caja,
                    ) =>
                        total +
                        Number(
                            caja.total_ventas_efectivo,
                        ),
                    0,
                ),
            [
                cajasIniciales,
            ],
        );

    const totalOtrosPagos =
        useMemo(
            () =>
                cajasIniciales.reduce(
                    (
                        total,
                        caja,
                    ) =>
                        total +
                        Number(
                            caja.total_ventas_otros,
                        ),
                    0,
                ),
            [
                cajasIniciales,
            ],
        );

    function actualizar<
        K extends keyof DatosAperturaCaja,
    >(
        campo: K,
        valor: DatosAperturaCaja[K],
    ) {
        setFormulario(
            (
                actual,
            ) => ({
                ...actual,
                [campo]:
                    valor,
            }),
        );

        setMensaje(
            null,
        );
    }

    function enviar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setMensaje(
            null,
        );

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
        <div className="space-y-6 pb-10">
            <section className="relative overflow-hidden rounded-[36px] bg-[#26332F] p-6 text-white shadow-[0_24px_70px_rgba(36,48,44,0.18)] sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#6F8F83]/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-[#C79AA1]/12 blur-3xl" />

                <div className="relative grid gap-7 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-[#D8E3DE]">
                            <Sparkles className="h-3.5 w-3.5" />
                            Operación del día
                        </div>

                        <div className="mt-5 flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <WalletCards className="h-7 w-7" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                                    Caja y ventas
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CFD9D4] sm:text-base">
                                    Cobra citas, registra ventas y controla el efectivo de cada sucursal desde un solo lugar.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <HeroDato
                            titulo="Cajas"
                            valor={String(
                                cajasIniciales.length,
                            )}
                            icono={
                                LockKeyhole
                            }
                        />

                        <HeroDato
                            titulo="Efectivo"
                            valor={formatearDinero(
                                totalEfectivoActual,
                            )}
                            icono={
                                Banknote
                            }
                        />

                        <HeroDato
                            titulo="Ventas efectivo"
                            valor={formatearDinero(
                                totalVentasEfectivo,
                            )}
                            icono={
                                CircleDollarSign
                            }
                        />

                        <HeroDato
                            titulo="Otros pagos"
                            valor={formatearDinero(
                                totalOtrosPagos,
                            )}
                            icono={
                                Landmark
                            }
                        />
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

            <section className="grid gap-4 md:grid-cols-3">
                <AccionPrincipal
                    href="/caja/cobrar"
                    titulo="Cobrar cita"
                    descripcion="Cobra una cita finalizada y registra su método de pago."
                    icono={
                        ReceiptText
                    }
                    destacada
                />

                <AccionPrincipal
                    href="/caja/venta-directa"
                    titulo="Venta directa"
                    descripcion="Registra servicios sin una cita previa."
                    icono={
                        CircleDollarSign
                    }
                />

                <AccionPrincipal
                    href="/caja/venta-productos"
                    titulo="Venta de productos"
                    descripcion="Vende productos y descuenta stock automáticamente."
                    icono={
                        ShoppingBasket
                    }
                />
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaResumen
                    titulo="Cajas abiertas"
                    valor={String(
                        cajasIniciales.length,
                    )}
                    descripcion={
                        cajasIniciales.length >
                            0
                            ? "Hay operación activa"
                            : "Aún no hay apertura"
                    }
                    icono={
                        LockKeyhole
                    }
                />

                <TarjetaResumen
                    titulo="Sucursales disponibles"
                    valor={String(
                        sucursalesDisponibles.length,
                    )}
                    descripcion="Disponibles para apertura"
                    icono={
                        Store
                    }
                />

                <TarjetaResumen
                    titulo="Efectivo esperado"
                    valor={formatearDinero(
                        totalEfectivoActual,
                    )}
                    descripcion="Según movimientos registrados"
                    icono={
                        Banknote
                    }
                />

                <TarjetaResumen
                    titulo="Estado operativo"
                    valor={
                        cajasIniciales.length >
                            0
                            ? "Operando"
                            : "Sin apertura"
                    }
                    descripcion={
                        cajasIniciales.length >
                            0
                            ? "Caja lista para ventas"
                            : "Abre una caja para comenzar"
                    }
                    icono={
                        TrendingUp
                    }
                />
            </section>

            <section className="overflow-hidden rounded-[28px] border border-[#E1E7E3] bg-white shadow-[0_10px_28px_rgba(36,48,44,0.06)]">
                <header className="flex flex-col gap-4 border-b border-[#E8ECE9] bg-[#FBFCFA] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                            Accesos rápidos
                        </p>

                        <h2 className="mt-1 text-lg font-black text-[#24302C]">
                            Gestión de caja
                        </h2>

                        <p className="mt-1 text-sm text-[#74817B]">
                            Historiales, reportes y movimientos de la jornada.
                        </p>
                    </div>

                    {sucursalesDisponibles.length >
                        0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setMostrarFormulario(
                                        (
                                            actual,
                                        ) =>
                                            !actual,
                                    )
                                }
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#26332F] px-5 text-sm font-black text-white transition hover:bg-[#34463F]"
                            >
                                {mostrarFormulario ? (
                                    <X className="h-4 w-4" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}

                                {mostrarFormulario
                                    ? "Ocultar apertura"
                                    : "Abrir nueva caja"}
                            </button>
                        )}
                </header>

                <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                    <AccesoSecundario
                        href="/caja/ventas"
                        titulo="Historial de ventas"
                        icono={
                            History
                        }
                    />

                    <AccesoSecundario
                        href="/caja/historial-movimientos"
                        titulo="Movimientos"
                        icono={
                            ArrowDownUp
                        }
                    />

                    <AccesoSecundario
                        href="/caja/cierres"
                        titulo="Cierres"
                        icono={
                            LockKeyhole
                        }
                    />

                    <AccesoSecundario
                        href="/caja/reportes"
                        titulo="Reportes"
                        icono={
                            BarChart3
                        }
                    />
                </div>
            </section>

            {mostrarFormulario &&
                sucursalesDisponibles.length >
                0 && (
                    <section className="overflow-hidden rounded-[28px] border border-[#DCE5E0] bg-white shadow-[0_12px_34px_rgba(36,48,44,0.07)]">
                        <header className="flex items-center gap-3 border-b border-[#E7ECE9] bg-[#F7FAF8] px-5 py-5 sm:px-6">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                                <Landmark className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#87958D]">
                                    Inicio de jornada
                                </p>

                                <h2 className="mt-1 font-black text-[#24302C]">
                                    Apertura de caja
                                </h2>

                                <p className="mt-1 text-xs text-[#76817B]">
                                    Registra el fondo inicial antes de comenzar a vender.
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
                                <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#43524B]">
                                    <MessageSquareText className="h-4 w-4 text-[#6F8F83]" />
                                    Observaciones
                                </span>

                                <textarea
                                    rows={
                                        3
                                    }
                                    value={
                                        formulario.observaciones
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        actualizar(
                                            "observaciones",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ejemplo: fondo inicial entregado por administración."
                                    className="w-full resize-none rounded-2xl border border-[#D4DAD6] bg-[#F9FBF9] px-4 py-3 text-sm outline-none transition focus:border-[#6F8F83] focus:bg-white"
                                />
                            </label>

                            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#C8D9D1] bg-[#F0F5F2] p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-black text-[#43524B]">
                                        Caja lista para iniciar
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-[#6B756F]">
                                        El monto inicial formará parte del efectivo esperado al realizar el cierre.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        guardando ||
                                        !formulario.sucursalId
                                    }
                                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#6F8F83] px-5 text-sm font-black text-white transition hover:bg-[#607F74] disabled:cursor-not-allowed disabled:bg-[#AAB9B3]"
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
                sucursales.length >
                0 && (
                    <div className="rounded-2xl border border-[#CFE0D8] bg-[#EAF2EE] p-4 text-[#3F6657]">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                            <div>
                                <p className="font-black">
                                    Todas las sucursales tienen caja abierta
                                </p>

                                <p className="mt-1 text-sm">
                                    Puedes continuar registrando ventas y movimientos normalmente.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            <section className="overflow-hidden rounded-[30px] border border-[#E1E7E3] bg-white shadow-[0_10px_28px_rgba(36,48,44,0.06)]">
                <header className="flex flex-col gap-3 border-b border-[#E8ECE9] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                            Operación activa
                        </p>

                        <h2 className="mt-1 text-xl font-black text-[#24302C]">
                            Cajas abiertas
                        </h2>

                        <p className="mt-1 text-sm text-[#6B756F]">
                            Revisa el estado de cada sucursal y accede a sus operaciones.
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-[#EAF1ED] px-3 py-1.5 text-xs font-black text-[#5D796C]">
                        {cajasIniciales.length} activa
                        {cajasIniciales.length ===
                            1
                            ? ""
                            : "s"}
                    </span>
                </header>

                <div className="p-5 sm:p-6">
                    {cajasIniciales.length ===
                        0 ? (
                        <EstadoVacio />
                    ) : (
                        <div className="grid gap-5 xl:grid-cols-2">
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

function AccionPrincipal({
    href,
    titulo,
    descripcion,
    icono: Icono,
    destacada = false,
}: {
    href: string;
    titulo: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    destacada?: boolean;
}) {
    return (
        <Link
            href={
                href
            }
            className={[
                "group relative overflow-hidden rounded-[26px] border p-5 transition hover:-translate-y-1",
                destacada
                    ? "border-[#26332F] bg-[#26332F] text-white shadow-[0_16px_36px_rgba(36,48,44,0.16)]"
                    : "border-[#DDE5E1] bg-white text-[#26332F] shadow-[0_10px_28px_rgba(36,48,44,0.05)]",
            ].join(
                " ",
            )}
        >
            <div
                className={[
                    "flex h-12 w-12 items-center justify-center rounded-2xl",
                    destacada
                        ? "bg-[#DCE7E2] text-[#26332F]"
                        : "bg-[#EEF3F0] text-[#607C6F]",
                ].join(
                    " ",
                )}
            >
                <Icono className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-lg font-black">
                {
                    titulo
                }
            </h3>

            <p
                className={[
                    "mt-2 text-sm leading-6",
                    destacada
                        ? "text-[#CFD9D4]"
                        : "text-[#74817B]",
                ].join(
                    " ",
                )}
            >
                {
                    descripcion
                }
            </p>

            <div
                className={[
                    "mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em]",
                    destacada
                        ? "text-[#DCE7E2]"
                        : "text-[#6F8F83]",
                ].join(
                    " ",
                )}
            >
                Ir ahora
                <span className="transition group-hover:translate-x-1">
                    →
                </span>
            </div>
        </Link>
    );
}

function AccesoSecundario({
    href,
    titulo,
    icono: Icono,
}: {
    href: string;
    titulo: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <Link
            href={
                href
            }
            className="flex items-center gap-3 rounded-2xl border border-[#E1E7E3] bg-[#FBFCFA] p-4 transition hover:border-[#BFD0C7] hover:bg-[#F4F8F6]"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1ED] text-[#5D796C]">
                <Icono className="h-4 w-4" />
            </div>

            <p className="text-sm font-black text-[#3E4D46]">
                {
                    titulo
                }
            </p>
        </Link>
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
        <article className="overflow-hidden rounded-[26px] border border-[#DCE5E0] bg-[#FBFCFA]">
            <div className="border-b border-[#E4EAE6] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                            <Building2 className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-lg font-black text-[#24302C]">
                                {caja
                                    .sucursales
                                    ?.nombre ??
                                    "Sucursal"}
                            </p>

                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#76817B]">
                                <Clock3 className="h-3.5 w-3.5" />
                                Abierta{" "}
                                {formatearFechaHora(
                                    caja.fecha_apertura,
                                )}
                            </p>
                        </div>
                    </div>

                    <span className="rounded-full bg-[#E3EEE8] px-3 py-1 text-[10px] font-black uppercase text-[#527865]">
                        Operando
                    </span>
                </div>

                <div className="mt-5 rounded-2xl bg-[#26332F] p-4 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AFC2B9]">
                        Efectivo esperado
                    </p>

                    <p className="mt-2 text-3xl font-black">
                        {formatearDinero(
                            efectivoEsperado,
                        )}
                    </p>

                    <p className="mt-1 text-xs text-[#C9D6D0]">
                        Según apertura, ventas, ingresos y egresos registrados.
                    </p>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                    <DatoCaja
                        titulo="Monto inicial"
                        valor={formatearDinero(
                            caja.monto_inicial,
                        )}
                    />

                    <DatoCaja
                        titulo="Ventas efectivo"
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
                        negativo
                    />
                </div>

                {caja.observaciones_apertura && (
                    <div className="mt-4 rounded-2xl border border-[#E4EAE6] bg-white p-3 text-sm leading-6 text-[#6B756F]">
                        {
                            caja.observaciones_apertura
                        }
                    </div>
                )}

                <div className="mt-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.13em] text-[#87958D]">
                        Vender
                    </p>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <Link
                            href="/caja/cobrar"
                            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#26332F] px-4 text-center text-sm font-black text-white transition hover:bg-[#34463F]"
                        >
                            Cobrar cita
                        </Link>

                        <Link
                            href="/caja/venta-directa"
                            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#6F8F83] px-4 text-center text-sm font-black text-white transition hover:bg-[#607F74]"
                        >
                            Venta directa
                        </Link>

                        <Link
                            href="/caja/venta-productos"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#C79AA1] px-4 text-center text-sm font-black text-white transition hover:bg-[#B98991]"
                        >
                            <ShoppingBasket className="h-4 w-4" />
                            Productos
                        </Link>
                    </div>
                </div>

                <div className="mt-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.13em] text-[#87958D]">
                        Administrar caja
                    </p>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <Link
                            href={`/caja/movimientos/${caja.id}`}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCE3DF] bg-white px-3 text-center text-xs font-black text-[#52605A] transition hover:bg-[#EEF2EF]"
                        >
                            <ArrowDownUp className="h-4 w-4" />
                            Ingreso / egreso
                        </Link>

                        <Link
                            href="/caja/ventas"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCE3DF] bg-white px-3 text-center text-xs font-black text-[#52605A] transition hover:bg-[#EEF2EF]"
                        >
                            <History className="h-4 w-4" />
                            Historial
                        </Link>

                        <Link
                            href={`/caja/cierre/${caja.id}`}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#E7BDBD] bg-[#F8E5E5] px-3 text-center text-xs font-black text-[#985858] transition hover:bg-[#F3D8D8]"
                        >
                            <LockKeyhole className="h-4 w-4" />
                            Cerrar caja
                        </Link>
                    </div>
                </div>
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
            <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#43524B]">
                <Store className="h-4 w-4 text-[#6F8F83]" />
                Sucursal
            </span>

            <select
                value={
                    valor
                }
                required
                onChange={(
                    event,
                ) =>
                    cambiar(
                        event.target.value,
                    )
                }
                className="h-12 w-full rounded-2xl border border-[#D4DAD6] bg-[#F9FBF9] px-4 text-sm font-semibold outline-none transition focus:border-[#6F8F83] focus:bg-white"
            >
                <option value="">
                    Seleccionar sucursal
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
            <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#43524B]">
                <Banknote className="h-4 w-4 text-[#6F8F83]" />
                Efectivo inicial
            </span>

            <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#6B756F]">
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
                                event.target.value,
                            ),
                        )
                    }
                    className="h-12 w-full rounded-2xl border border-[#D4DAD6] bg-[#F9FBF9] pl-12 pr-4 text-right font-black outline-none transition focus:border-[#6F8F83] focus:bg-white"
                />
            </div>
        </label>
    );
}

function TarjetaResumen({
    titulo,
    valor,
    descripcion,
    icono: Icono,
}: {
    titulo: string;
    valor: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <article className="rounded-[24px] border border-[#E3E7E4] bg-white p-5 shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#829089]">
                        {
                            titulo
                        }
                    </p>

                    <p className="mt-3 text-2xl font-black text-[#24302C]">
                        {
                            valor
                        }
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#829089]">
                        {
                            descripcion
                        }
                    </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function HeroDato({
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
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[#AEC0B7]">
                <Icono className="h-3.5 w-3.5" />

                <p className="text-[9px] font-black uppercase tracking-[0.12em]">
                    {
                        titulo
                    }
                </p>
            </div>

            <p className="mt-2 truncate text-sm font-black text-white">
                {
                    valor
                }
            </p>
        </div>
    );
}

function DatoCaja({
    titulo,
    valor,
    negativo = false,
}: {
    titulo: string;
    valor: string;
    negativo?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-[#E6EBE8] bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#829089]">
                {
                    titulo
                }
            </p>

            <p
                className={[
                    "mt-1 font-black",
                    negativo
                        ? "text-[#9A6267]"
                        : "text-[#33413B]",
                ].join(
                    " ",
                )}
            >
                {
                    valor
                }
            </p>
        </div>
    );
}

function EstadoVacio() {
    return (
        <div className="rounded-[26px] border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-12 text-center">
            <Clock3 className="mx-auto h-9 w-9 text-[#829089]" />

            <h3 className="mt-4 font-black text-[#24302C]">
                No hay cajas abiertas
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B756F]">
                Abre una caja para comenzar a registrar cobros, ventas, ingresos y egresos.
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
            ].join(
                " ",
            )}
        >
            {mensaje.tipo ===
                "EXITO" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
                <XCircle className="h-5 w-5 shrink-0" />
            )}

            <p className="min-w-0 flex-1 text-sm font-bold">
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
            minimumFractionDigits:
                2,
            maximumFractionDigits:
                2,
        },
    )}`;
}

function formatearFechaHora(
    fecha: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            day:
                "2-digit",
            month:
                "short",
            year:
                "numeric",
            hour:
                "numeric",
            minute:
                "2-digit",
            timeZone:
                "America/Managua",
        },
    ).format(
        new Date(
            fecha,
        ),
    );
}
