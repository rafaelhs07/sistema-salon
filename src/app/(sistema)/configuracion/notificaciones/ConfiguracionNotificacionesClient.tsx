"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    BellRing,
    Boxes,
    CalendarClock,
    CheckCircle2,
    Clock3,
    LoaderCircle,
    Save,
    ShieldAlert,
    WalletCards,
} from "lucide-react";
import {
    useState,
    useTransition,
} from "react";

import {
    guardarConfiguracionNotificaciones,
} from "./actions";

export type ConfiguracionNotificaciones = {
    salon_id: string;
    citas_proximas: boolean;
    minutos_cita_proxima: number;
    cita_sin_confirmar: boolean;
    cita_finalizada_sin_cobrar: boolean;
    stock_bajo: boolean;
    stock_agotado: boolean;
    caja_abierta_dia_anterior: boolean;
    diferencia_caja: boolean;
    cuenta_cobrar_vencida: boolean;
    cuenta_pagar_vencida: boolean;
};

type ClaveBoolean =
    | "citas_proximas"
    | "cita_sin_confirmar"
    | "cita_finalizada_sin_cobrar"
    | "stock_bajo"
    | "stock_agotado"
    | "caja_abierta_dia_anterior"
    | "diferencia_caja"
    | "cuenta_cobrar_vencida"
    | "cuenta_pagar_vencida";

export default function ConfiguracionNotificacionesClient({
    inicial,
}: {
    inicial: ConfiguracionNotificaciones;
}) {
    const [
        configuracion,
        setConfiguracion,
    ] = useState(
        inicial,
    );

    const [
        mensaje,
        setMensaje,
    ] = useState<{
        tipo:
        | "EXITO"
        | "ERROR";
        texto: string;
    } | null>(
        null,
    );

    const [
        guardando,
        iniciarTransicion,
    ] = useTransition();

    function cambiarBooleano(
        clave: ClaveBoolean,
    ) {
        setConfiguracion(
            (
                actual,
            ) => ({
                ...actual,
                [clave]:
                    !actual[
                    clave
                    ],
            }),
        );
    }

    function guardar() {
        setMensaje(
            null,
        );

        iniciarTransicion(
            async () => {
                const resultado =
                    await guardarConfiguracionNotificaciones(
                        {
                            citas_proximas:
                                configuracion.citas_proximas,
                            minutos_cita_proxima:
                                configuracion.minutos_cita_proxima,
                            cita_sin_confirmar:
                                configuracion.cita_sin_confirmar,
                            cita_finalizada_sin_cobrar:
                                configuracion.cita_finalizada_sin_cobrar,
                            stock_bajo:
                                configuracion.stock_bajo,
                            stock_agotado:
                                configuracion.stock_agotado,
                            caja_abierta_dia_anterior:
                                configuracion.caja_abierta_dia_anterior,
                            diferencia_caja:
                                configuracion.diferencia_caja,
                            cuenta_cobrar_vencida:
                                configuracion.cuenta_cobrar_vencida,
                            cuenta_pagar_vencida:
                                configuracion.cuenta_pagar_vencida,
                        },
                    );

                setMensaje({
                    tipo:
                        resultado.exito
                            ? "EXITO"
                            : "ERROR",
                    texto:
                        resultado.mensaje,
                });
            },
        );
    }

    const activas =
        [
            configuracion.citas_proximas,
            configuracion.cita_sin_confirmar,
            configuracion.cita_finalizada_sin_cobrar,
            configuracion.stock_bajo,
            configuracion.stock_agotado,
            configuracion.caja_abierta_dia_anterior,
            configuracion.diferencia_caja,
            configuracion.cuenta_cobrar_vencida,
            configuracion.cuenta_pagar_vencida,
        ].filter(
            Boolean,
        ).length;

    return (
        <div className="space-y-6 pb-8">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/configuracion"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a configuración
                    </Link>

                    <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                                <BellRing className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Preferencias del salón
                                </p>

                                <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                    Configuración de notificaciones
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Decide qué avisos son importantes para tu operación
                                    y evita llenar la campana con información innecesaria.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B9C8C1]">
                                Alertas activas
                            </p>

                            <p className="mt-1 text-3xl font-bold">
                                {activas}
                                <span className="text-base text-[#B9C8C1]">
                                    /9
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {mensaje && (
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
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    )}

                    <p className="text-sm font-semibold">
                        {
                            mensaje.texto
                        }
                    </p>
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-2">
                <BloqueConfiguracion
                    titulo="Citas"
                    descripcion="Seguimiento de agenda y cobros pendientes."
                    icono={CalendarClock}
                >
                    <Opcion
                        titulo="Citas próximas"
                        descripcion="Avisar antes de que una cita comience."
                        activa={
                            configuracion.citas_proximas
                        }
                        cambiar={() =>
                            cambiarBooleano(
                                "citas_proximas",
                            )
                        }
                    />

                    <div className="rounded-2xl bg-[#F7FAF8] px-4 py-4">
                        <label className="text-sm font-bold text-[#33413B]">
                            Anticipación de cita próxima
                        </label>

                        <p className="mt-1 text-xs leading-5 text-[#7A8781]">
                            Entre 5 y 240 minutos.
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                            <input
                                type="number"
                                min={
                                    5
                                }
                                max={
                                    240
                                }
                                value={
                                    configuracion.minutos_cita_proxima
                                }
                                disabled={
                                    !configuracion.citas_proximas
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setConfiguracion(
                                        (
                                            actual,
                                        ) => ({
                                            ...actual,
                                            minutos_cita_proxima:
                                                Number(
                                                    event.target.value,
                                                ),
                                        }),
                                    )
                                }
                                className="salon-control w-28 border border-border-strong bg-white px-3 text-[#33413B] outline-none disabled:bg-[#EEF1EF] disabled:text-[#9AA39E]"
                            />

                            <span className="text-sm font-semibold text-[#74817B]">
                                minutos antes
                            </span>
                        </div>
                    </div>

                    <Opcion
                        titulo="Citas sin confirmar"
                        descripcion="Avisar cuando una cita cercana sigue pendiente."
                        activa={
                            configuracion.cita_sin_confirmar
                        }
                        cambiar={() =>
                            cambiarBooleano(
                                "cita_sin_confirmar",
                            )
                        }
                    />

                    <Opcion
                        titulo="Cita finalizada sin cobrar"
                        descripcion="Avisar cuando una cita terminó pero aún no está completamente cobrada."
                        activa={
                            configuracion.cita_finalizada_sin_cobrar
                        }
                        cambiar={() =>
                            cambiarBooleano(
                                "cita_finalizada_sin_cobrar",
                            )
                        }
                    />
                </BloqueConfiguracion>

                <BloqueConfiguracion
                    titulo="Inventario"
                    descripcion="Alertas para evitar faltantes de productos."
                    icono={Boxes}
                >
                    <Opcion
                        titulo="Stock bajo"
                        descripcion="Avisar cuando la existencia llega al mínimo configurado."
                        activa={
                            configuracion.stock_bajo
                        }
                        cambiar={() =>
                            cambiarBooleano(
                                "stock_bajo",
                            )
                        }
                    />

                    <Opcion
                        titulo="Producto agotado"
                        descripcion="Avisar cuando la existencia llega a cero."
                        activa={
                            configuracion.stock_agotado
                        }
                        cambiar={() =>
                            cambiarBooleano(
                                "stock_agotado",
                            )
                        }
                        importante
                    />
                </BloqueConfiguracion>

                <BloqueConfiguracion
                    titulo="Caja"
                    descripcion="Situaciones que requieren revisión del cierre."
                    icono={ShieldAlert}
                >
                    <Opcion
                        titulo="Caja abierta del día anterior"
                        descripcion="Avisar cuando una sesión de caja sigue abierta al día siguiente."
                        activa={
                            configuracion.caja_abierta_dia_anterior
                        }
                        cambiar={() =>
                            cambiarBooleano(
                                "caja_abierta_dia_anterior",
                            )
                        }
                        importante
                    />

                    <Opcion
                        titulo="Diferencias de caja"
                        descripcion="Avisar cuando el monto contado no coincide con lo esperado."
                        activa={
                            configuracion.diferencia_caja
                        }
                        cambiar={() =>
                            cambiarBooleano(
                                "diferencia_caja",
                            )
                        }
                    />
                </BloqueConfiguracion>

                <BloqueConfiguracion
                    titulo="Cuentas y finanzas"
                    descripcion="Seguimiento de saldos que ya vencieron."
                    icono={WalletCards}
                >
                    <Opcion
                        titulo="Cuenta por cobrar vencida"
                        descripcion="Avisar cuando un cliente mantiene saldo después de la fecha de vencimiento."
                        activa={
                            configuracion.cuenta_cobrar_vencida
                        }
                        cambiar={() =>
                            cambiarBooleano(
                                "cuenta_cobrar_vencida",
                            )
                        }
                        importante
                    />

                    <Opcion
                        titulo="Cuenta por pagar vencida"
                        descripcion="Avisar cuando una obligación con proveedor supera su vencimiento."
                        activa={
                            configuracion.cuenta_pagar_vencida
                        }
                        cambiar={() =>
                            cambiarBooleano(
                                "cuenta_pagar_vencida",
                            )
                        }
                        importante
                    />
                </BloqueConfiguracion>
            </section>

            <section className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-[24px] border border-[#D9E1DD] bg-white/95 p-4 shadow-[0_16px_45px_rgba(36,48,44,0.14)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                    <div>
                        <p className="text-sm font-bold text-[#33413B]">
                            Los cambios aplican a nuevas notificaciones
                        </p>

                        <p className="mt-1 text-xs text-[#7A8781]">
                            Las notificaciones ya creadas se mantienen como parte del historial.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    disabled={
                        guardando
                    }
                    onClick={
                        guardar
                    }
                    className="salon-action inline-flex shrink-0 items-center justify-center gap-2 bg-sidebar px-6 text-white transition hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {guardando ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}

                    {guardando
                        ? "Guardando..."
                        : "Guardar configuración"}
                </button>
            </section>
        </div>
    );
}

function BloqueConfiguracion({
    titulo,
    descripcion,
    icono: Icono,
    children,
}: {
    titulo: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    children: React.ReactNode;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5 sm:p-6">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                    <Icono className="h-5 w-5" />
                </div>

                <div>
                    <h2 className="text-lg font-bold text-sidebar tracking-tight">
                        {titulo}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-[#75827C]">
                        {descripcion}
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {children}
            </div>
        </article>
    );
}

function Opcion({
    titulo,
    descripcion,
    activa,
    cambiar,
    importante = false,
}: {
    titulo: string;
    descripcion: string;
    activa: boolean;
    cambiar: () => void;
    importante?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={
                cambiar
            }
            className="flex w-full items-center gap-4 rounded-2xl bg-[#F7FAF8] px-4 py-4 text-left transition hover:bg-surface-soft"
        >
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#33413B]">
                        {titulo}
                    </p>

                    {importante && (
                        <span className="rounded-full bg-[#F7E8EA] px-2 py-0.5 text-xs font-bold uppercase text-[#96616B]">
                            Importante
                        </span>
                    )}
                </div>

                <p className="mt-1 text-xs leading-5 text-[#7B8982]">
                    {descripcion}
                </p>
            </div>

            <span
                className={[
                    "relative h-7 w-12 shrink-0 rounded-full transition",
                    activa
                        ? "bg-primary"
                        : "bg-[#D7DDDA]",
                ].join(
                    " ",
                )}
            >
                <span
                    className={[
                        "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all",
                        activa
                            ? "left-6"
                            : "left-1",
                    ].join(
                        " ",
                    )}
                />
            </span>
        </button>
    );
}
