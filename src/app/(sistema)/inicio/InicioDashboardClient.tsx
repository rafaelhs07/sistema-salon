"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    PackageSearch,
    ReceiptText,
    Scissors,
    ShoppingBag,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Truck,
    UserPlus,
    Users,
    WalletCards,
} from "lucide-react";
import {
    useMemo,
} from "react";

export type MovimientoDashboard = {
    id: string;
    tipo:
    | "INGRESO"
    | "GASTO";
    monto: number;
    fecha_movimiento: string;
    concepto: string;
    estado: string;
};

export type VentaDashboard = {
    id: string;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    estado: string;
    estado_pago: string;
    fecha_venta: string;
    tipo_venta: string;
};

export type CitaHoyDashboard = {
    id: string;
    codigo_cita: string | null;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    total: number;

    clientes: {
        nombre_completo: string;
    } | null;

    cita_servicios: {
        nombre_servicio: string;
        trabajadores: {
            nombre_completo: string;
        } | null;
    }[];
};

export type ProductoAlertaDashboard = {
    id: string;
    codigo_producto: string;
    nombre: string;
    stock: number;
    stock_minimo: number;
    controla_stock: boolean;
    estado: string;
};

export type DatosDashboard = {
    salonNombre: string;
    simboloMoneda: string;
    clientesTotal: number;
    comprasMes: number;

    movimientos: MovimientoDashboard[];
    ventas: VentaDashboard[];

    citasHoy: CitaHoyDashboard[];

    citasMes: {
        id: string;
        fecha: string;
        estado: string;
        total: number;
    }[];

    productosAlerta: ProductoAlertaDashboard[];
};

type TendenciaMes = {
    clave: string;
    etiqueta: string;
    ingresos: number;
    gastos: number;
    utilidad: number;
};

export default function InicioDashboardClient({
    datos,
}: {
    datos: DatosDashboard;
}) {
    const hoy =
        new Date();

    const hoyISO =
        fechaLocalISO(
            hoy,
        );

    const inicioMesISO =
        fechaLocalISO(
            new Date(
                hoy.getFullYear(),
                hoy.getMonth(),
                1,
            ),
        );

    const movimientosMes =
        useMemo(
            () =>
                datos.movimientos.filter(
                    (
                        movimiento,
                    ) =>
                        movimiento.fecha_movimiento.slice(
                            0,
                            10,
                        ) >=
                        inicioMesISO,
                ),
            [
                datos.movimientos,
                inicioMesISO,
            ],
        );

    const ventasMes =
        useMemo(
            () =>
                datos.ventas.filter(
                    (
                        venta,
                    ) =>
                        venta.estado ===
                        "ACTIVA" &&
                        venta.fecha_venta.slice(
                            0,
                            10,
                        ) >=
                        inicioMesISO,
                ),
            [
                datos.ventas,
                inicioMesISO,
            ],
        );

    const ingresosMes =
        movimientosMes
            .filter(
                (
                    movimiento,
                ) =>
                    movimiento.tipo ===
                    "INGRESO",
            )
            .reduce(
                (
                    total,
                    movimiento,
                ) =>
                    total +
                    Number(
                        movimiento.monto,
                    ),
                0,
            );

    const gastosMes =
        movimientosMes
            .filter(
                (
                    movimiento,
                ) =>
                    movimiento.tipo ===
                    "GASTO",
            )
            .reduce(
                (
                    total,
                    movimiento,
                ) =>
                    total +
                    Number(
                        movimiento.monto,
                    ),
                0,
            );

    const utilidadMes =
        ingresosMes -
        gastosMes;

    const ventasMonto =
        ventasMes.reduce(
            (
                total,
                venta,
            ) =>
                total +
                Number(
                    venta.total,
                ),
            0,
        );

    const saldoPendiente =
        ventasMes.reduce(
            (
                total,
                venta,
            ) =>
                total +
                Number(
                    venta.saldo_pendiente,
                ),
            0,
        );

    const citasMes =
        datos.citasMes.filter(
            (
                cita,
            ) =>
                cita.fecha >=
                inicioMesISO,
        );

    const citasFinalizadas =
        citasMes.filter(
            (
                cita,
            ) =>
                cita.estado ===
                "FINALIZADA",
        ).length;

    const citasCanceladas =
        citasMes.filter(
            (
                cita,
            ) =>
                [
                    "CANCELADA",
                    "NO_ASISTIO",
                ].includes(
                    cita.estado,
                ),
        ).length;

    const tasaFinalizacion =
        citasMes.length >
            0
            ? (
                citasFinalizadas /
                citasMes.length
            ) *
            100
            : 0;

    const tendencia =
        useMemo(
            () =>
                construirTendencia(
                    datos.movimientos,
                ),
            [
                datos.movimientos,
            ],
        );

    const pulso =
        calcularPulso(
            utilidadMes,
            ingresosMes,
            datos.productosAlerta.length,
            citasMes.length,
            citasCanceladas,
        );

    const maximoTendencia =
        Math.max(
            ...tendencia.flatMap(
                (
                    item,
                ) => [
                        item.ingresos,
                        item.gastos,
                    ],
            ),
            1,
        );

    const proximasCitas =
        datos.citasHoy
            .filter(
                (
                    cita,
                ) =>
                    ![
                        "CANCELADA",
                        "NO_ASISTIO",
                    ].includes(
                        cita.estado,
                    ),
            )
            .slice(
                0,
                6,
            );

    return (
        <div className="mx-auto max-w-[1750px] space-y-6 pb-8">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />

                <div className="relative grid gap-7 xl:grid-cols-[1.35fr_0.65fr] xl:items-end">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-primary-soft">
                            <Sparkles className="h-3.5 w-3.5" />
                            Centro de control
                        </div>

                        <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight sm:text-4xl">
                            {saludoActual()},{" "}
                            <span className="text-primary-soft">
                                {datos.salonNombre}
                            </span>
                        </h1>

                        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#C8D4CE] sm:text-base">
                            Todo lo importante del salón en una sola vista:
                            dinero, agenda, clientes e inventario.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <AccesoRapido
                                href="/agenda"
                                texto="Ver agenda"
                                icono={CalendarDays}
                                claro
                            />

                            <AccesoRapido
                                href="/caja/venta-directa"
                                texto="Nueva venta"
                                icono={ShoppingBag}
                            />

                            <AccesoRapido
                                href="/clientes"
                                texto="Nuevo cliente"
                                icono={UserPlus}
                            />
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-[#BCCBC4]">
                                    Pulso del salón
                                </p>

                                <p className="mt-2 text-4xl font-bold">
                                    {pulso.puntaje}
                                    <span className="text-lg text-[#B8C7C0]">
                                        /100
                                    </span>
                                </p>
                            </div>

                            <div
                                className={`rounded-2xl px-3 py-2 text-xs font-bold ${pulso.clase}`}
                            >
                                {pulso.etiqueta}
                            </div>
                        </div>

                        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-primary-soft"
                                style={{
                                    width: `${pulso.puntaje}%`,
                                }}
                            />
                        </div>

                        <p className="mt-4 text-sm leading-6 text-[#C8D4CE]">
                            {pulso.mensaje}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Kpi
                    titulo="Ingresos del mes"
                    valor={moneda(
                        ingresosMes,
                        datos.simboloMoneda,
                    )}
                    detalle="Movimientos aplicados"
                    icono={TrendingUp}
                    positivo
                />

                <Kpi
                    titulo="Utilidad"
                    valor={moneda(
                        utilidadMes,
                        datos.simboloMoneda,
                    )}
                    detalle={`${margen(
                        utilidadMes,
                        ingresosMes,
                    ).toFixed(
                        1,
                    )}% de margen`}
                    icono={CircleDollarSign}
                    positivo={
                        utilidadMes >=
                        0
                    }
                />

                <Kpi
                    titulo="Ventas del mes"
                    valor={moneda(
                        ventasMonto,
                        datos.simboloMoneda,
                    )}
                    detalle={`${ventasMes.length} ventas activas`}
                    icono={ReceiptText}
                    positivo
                />

                <Kpi
                    titulo="Por cobrar"
                    valor={moneda(
                        saldoPendiente,
                        datos.simboloMoneda,
                    )}
                    detalle="Saldo pendiente de ventas"
                    icono={WalletCards}
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">
                                Hoy
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-sidebar tracking-tight">
                                Agenda de hoy
                            </h2>

                            <p className="mt-1 text-sm text-[#72827A]">
                                {datos.citasHoy.length} cita
                                {datos.citasHoy.length ===
                                    1
                                    ? ""
                                    : "s"}{" "}
                                programadas para{" "}
                                {formatearFechaHumana(
                                    hoyISO,
                                )}.
                            </p>
                        </div>

                        <Link
                            href="/agenda"
                            className="inline-flex items-center gap-2 text-sm font-bold text-[#587064] transition hover:text-sidebar"
                        >
                            Ver agenda
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="mt-6 space-y-3">
                        {proximasCitas.length ===
                            0 ? (
                            <div className="rounded-2xl bg-[#F7FAF8] px-5 py-10 text-center">
                                <CalendarDays className="mx-auto h-7 w-7 text-[#8A9992]" />

                                <p className="mt-3 font-bold text-text-secondary">
                                    No hay citas activas hoy
                                </p>

                                <p className="mt-1 text-sm text-[#7C8983]">
                                    Un buen momento para organizar el día.
                                </p>
                            </div>
                        ) : (
                            proximasCitas.map(
                                (
                                    cita,
                                    indice,
                                ) => (
                                    <div
                                        key={
                                            cita.id
                                        }
                                        className="group flex items-center gap-4 rounded-2xl border border-transparent bg-[#F8FAF8] px-4 py-3 transition hover:border-border hover:bg-white"
                                    >
                                        <div className="min-w-[76px]">
                                            <p className="text-sm font-bold text-sidebar">
                                                {hora12(
                                                    cita.hora_inicio,
                                                )}
                                            </p>

                                            <p className="mt-0.5 text-xs font-semibold uppercase text-[#87938D]">
                                                {duracionCita(
                                                    cita.hora_inicio,
                                                    cita.hora_fin,
                                                )}
                                            </p>
                                        </div>

                                        <div className="h-9 w-1 rounded-full bg-primary" />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-[#33413B]">
                                                {cita.clientes
                                                    ?.nombre_completo ??
                                                    "Cliente"}
                                            </p>

                                            <p className="mt-0.5 truncate text-xs text-[#7B8982]">
                                                {cita.cita_servicios
                                                    .map(
                                                        (
                                                            servicio,
                                                        ) =>
                                                            servicio.nombre_servicio,
                                                    )
                                                    .join(
                                                        ", ",
                                                    ) ||
                                                    "Servicio"}
                                            </p>
                                        </div>

                                        <EstadoCita
                                            estado={
                                                cita.estado
                                            }
                                        />
                                    </div>
                                ),
                            )
                        )}
                    </div>
                </article>

                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">
                        Atención
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-sidebar tracking-tight">
                        Lo que necesita acción
                    </h2>

                    <div className="mt-5 space-y-3">
                        <Alerta
                            icono={PackageSearch}
                            titulo="Inventario crítico"
                            valor={`${datos.productosAlerta.length}`}
                            descripcion="productos en mínimo o agotados"
                            href="/inventario"
                            urgente={
                                datos.productosAlerta.length >
                                0
                            }
                        />

                        <Alerta
                            icono={WalletCards}
                            titulo="Saldo por cobrar"
                            valor={moneda(
                                saldoPendiente,
                                datos.simboloMoneda,
                            )}
                            descripcion="pendiente en ventas del mes"
                            href="/cuentas-cobrar"
                            urgente={
                                saldoPendiente >
                                0
                            }
                        />

                        <Alerta
                            icono={CalendarDays}
                            titulo="Cancelaciones"
                            valor={String(
                                citasCanceladas,
                            )}
                            descripcion="canceladas o no asistidas este mes"
                            href="/reportes/citas-servicios"
                            urgente={
                                citasCanceladas >
                                0
                            }
                        />
                    </div>
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">
                                Tendencia
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-sidebar tracking-tight">
                                Ingresos vs gastos
                            </h2>

                            <p className="mt-1 text-sm text-[#72827A]">
                                Últimos 6 meses.
                            </p>
                        </div>

                        <div className="flex gap-4 text-xs font-semibold text-[#6E7C75]">
                            <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                                Ingresos
                            </span>

                            <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                                Gastos
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <div className="grid min-w-[680px] grid-cols-6 gap-3">
                            {tendencia.map(
                                (
                                    item,
                                ) => (
                                    <div
                                        key={
                                            item.clave
                                        }
                                        className="min-w-0"
                                    >
                                        <div className="flex h-[220px] items-end justify-center gap-2 rounded-2xl bg-[#F7FAF8] px-2 py-4">
                                            <div
                                                title={`Ingresos: ${moneda(
                                                    item.ingresos,
                                                    datos.simboloMoneda,
                                                )}`}
                                                className="w-5 rounded-t-md bg-primary"
                                                style={{
                                                    height: `${Math.max(
                                                        (
                                                            item.ingresos /
                                                            maximoTendencia
                                                        ) *
                                                        170,
                                                        item.ingresos >
                                                            0
                                                            ? 5
                                                            : 1,
                                                    )}px`,
                                                }}
                                            />

                                            <div
                                                title={`Gastos: ${moneda(
                                                    item.gastos,
                                                    datos.simboloMoneda,
                                                )}`}
                                                className="w-5 rounded-t-md bg-secondary"
                                                style={{
                                                    height: `${Math.max(
                                                        (
                                                            item.gastos /
                                                            maximoTendencia
                                                        ) *
                                                        170,
                                                        item.gastos >
                                                            0
                                                            ? 5
                                                            : 1,
                                                    )}px`,
                                                }}
                                            />
                                        </div>

                                        <p className="mt-2 text-center text-xs font-bold uppercase text-[#71817A]">
                                            {
                                                item.etiqueta
                                            }
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </article>

                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">
                        Operación
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-sidebar tracking-tight">
                        Rendimiento del mes
                    </h2>

                    <div className="mt-6 space-y-5">
                        <Progreso
                            titulo="Citas finalizadas"
                            valor={
                                citasFinalizadas
                            }
                            total={
                                citasMes.length
                            }
                            porcentaje={
                                tasaFinalizacion
                            }
                        />

                        <Progreso
                            titulo="Ventas cobradas"
                            valor={Math.round(
                                ventasMes.reduce(
                                    (
                                        total,
                                        venta,
                                    ) =>
                                        total +
                                        Number(
                                            venta.monto_pagado,
                                        ),
                                    0,
                                ),
                            )}
                            total={Math.round(
                                ventasMonto,
                            )}
                            porcentaje={
                                ventasMonto >
                                    0
                                    ? (
                                        ventasMes.reduce(
                                            (
                                                total,
                                                venta,
                                            ) =>
                                                total +
                                                Number(
                                                    venta.monto_pagado,
                                                ),
                                            0,
                                        ) /
                                        ventasMonto
                                    ) *
                                    100
                                    : 0
                            }
                            moneda
                            simbolo={
                                datos.simboloMoneda
                            }
                        />

                        <Progreso
                            titulo="Cobertura de gastos"
                            valor={Math.round(
                                ingresosMes,
                            )}
                            total={Math.round(
                                gastosMes,
                            )}
                            porcentaje={
                                gastosMes >
                                    0
                                    ? Math.min(
                                        (
                                            ingresosMes /
                                            gastosMes
                                        ) *
                                        100,
                                        100,
                                    )
                                    : ingresosMes >
                                        0
                                        ? 100
                                        : 0
                            }
                            moneda
                            simbolo={
                                datos.simboloMoneda
                            }
                        />
                    </div>
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                <ResumenMini
                    titulo="Clientes"
                    valor={datos.clientesTotal.toLocaleString(
                        "es-NI",
                    )}
                    detalle="registrados en el salón"
                    icono={Users}
                    href="/clientes"
                />

                <ResumenMini
                    titulo="Compras del mes"
                    valor={moneda(
                        datos.comprasMes,
                        datos.simboloMoneda,
                    )}
                    detalle="compras confirmadas"
                    icono={Truck}
                    href="/reportes/compras-proveedores"
                />

                <ResumenMini
                    titulo="Productos críticos"
                    valor={String(
                        datos.productosAlerta.length,
                    )}
                    detalle="requieren revisión"
                    icono={AlertTriangle}
                    href="/reportes/inventario"
                />
            </section>

            {datos.productosAlerta.length >
                0 && (
                    <section className="salon-panel border border-border bg-white p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#789087]">
                                    Inventario
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-sidebar tracking-tight">
                                    Productos que conviene reponer
                                </h2>
                            </div>

                            <Link
                                href="/reportes/inventario"
                                className="inline-flex items-center gap-2 text-sm font-bold text-[#587064]"
                            >
                                Ver reporte
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {datos.productosAlerta.map(
                                (
                                    producto,
                                ) => (
                                    <div
                                        key={
                                            producto.id
                                        }
                                        className="rounded-2xl bg-[#F8FAF8] px-4 py-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-[#33413B]">
                                                    {
                                                        producto.nombre
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-[#7C8983]">
                                                    {
                                                        producto.codigo_producto
                                                    }
                                                </p>
                                            </div>

                                            <span
                                                className={[
                                                    "rounded-full px-2.5 py-1 text-[10px] font-bold",
                                                    Number(
                                                        producto.stock,
                                                    ) <=
                                                        0
                                                        ? "bg-[#F5E8EB] text-[#9A6470]"
                                                        : "bg-[#FFF4D8] text-[#8A6A28]",
                                                ].join(
                                                    " ",
                                                )}
                                            >
                                                {Number(
                                                    producto.stock,
                                                ) <=
                                                    0
                                                    ? "Agotado"
                                                    : "Bajo"}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex items-end justify-between">
                                            <div>
                                                <p className="text-xs text-[#7D8983]">
                                                    Stock
                                                </p>

                                                <p className="mt-1 text-2xl font-bold text-sidebar">
                                                    {
                                                        producto.stock
                                                    }
                                                </p>
                                            </div>

                                            <p className="text-xs font-semibold text-[#7D8983]">
                                                mín.{" "}
                                                {
                                                    producto.stock_minimo
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </section>
                )}
        </div>
    );
}

function Kpi({
    titulo,
    valor,
    detalle,
    icono: Icono,
    positivo = false,
}: {
    titulo: string;
    valor: string;
    detalle: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    positivo?: boolean;
}) {
    return (
        <article className="salon-panel group border border-border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(36,48,44,0.10)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-[#71817A]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-sidebar">
                        {valor}
                    </p>

                    <p className="mt-2 text-xs text-[#87938D]">
                        {detalle}
                    </p>
                </div>

                <div
                    className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                        positivo
                            ? "bg-[#E3EEE8] text-[#4F7564]"
                            : "bg-surface-soft text-[#587064]",
                    ].join(
                        " ",
                    )}
                >
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function AccesoRapido({
    href,
    texto,
    icono: Icono,
    claro = false,
}: {
    href: string;
    texto: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    claro?: boolean;
}) {
    return (
        <Link
            href={href}
            className={[
                "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition",
                claro
                    ? "bg-primary-soft text-sidebar hover:bg-white"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
            ].join(
                " ",
            )}
        >
            <Icono className="h-4 w-4" />
            {texto}
        </Link>
    );
}

function Alerta({
    icono: Icono,
    titulo,
    valor,
    descripcion,
    href,
    urgente,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    titulo: string;
    valor: string;
    descripcion: string;
    href: string;
    urgente: boolean;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-4 rounded-2xl bg-[#F8FAF8] px-4 py-3 transition hover:bg-[#F1F5F2]"
        >
            <div
                className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    urgente
                        ? "bg-[#F5E8EB] text-[#9A6470]"
                        : "bg-[#E5EFEA] text-[#527262]",
                ].join(
                    " ",
                )}
            >
                <Icono className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#33413B]">
                    {titulo}
                </p>

                <p className="mt-0.5 text-xs text-[#7C8983]">
                    {descripcion}
                </p>
            </div>

            <p className="text-sm font-bold text-sidebar">
                {valor}
            </p>
        </Link>
    );
}

function Progreso({
    titulo,
    valor,
    total,
    porcentaje,
    moneda: esMoneda = false,
    simbolo = "C$",
}: {
    titulo: string;
    valor: number;
    total: number;
    porcentaje: number;
    moneda?: boolean;
    simbolo?: string;
}) {
    const seguro =
        Math.max(
            0,
            Math.min(
                porcentaje,
                100,
            ),
        );

    return (
        <div>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-[#33413B]">
                        {titulo}
                    </p>

                    <p className="mt-1 text-xs text-[#7D8A84]">
                        {esMoneda
                            ? `${moneda(
                                valor,
                                simbolo,
                            )} de ${moneda(
                                total,
                                simbolo,
                            )}`
                            : `${valor} de ${total}`}
                    </p>
                </div>

                <p className="text-sm font-bold text-sidebar">
                    {porcentaje.toFixed(
                        1,
                    )}
                    %
                </p>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EDF2EF]">
                <div
                    className="h-full rounded-full bg-primary"
                    style={{
                        width: `${seguro}%`,
                    }}
                />
            </div>
        </div>
    );
}

function ResumenMini({
    titulo,
    valor,
    detalle,
    icono: Icono,
    href,
}: {
    titulo: string;
    valor: string;
    detalle: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between gap-4 rounded-[26px] border border-border bg-[#FBFCFA] px-5 py-4 transition hover:bg-white hover:shadow-[0_12px_30px_rgba(36,48,44,0.08)]"
        >
            <div>
                <p className="text-xs font-semibold text-[#7B8982]">
                    {titulo}
                </p>

                <p className="mt-1 text-xl font-bold text-sidebar">
                    {valor}
                </p>

                <p className="mt-1 text-xs text-[#87938D]">
                    {detalle}
                </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F0EC] text-[#587064]">
                <Icono className="h-5 w-5" />
            </div>
        </Link>
    );
}

function EstadoCita({
    estado,
}: {
    estado: string;
}) {
    const clase =
        estado ===
            "FINALIZADA"
            ? "bg-[#E3EEE8] text-[#4F7564]"
            : estado ===
                "CONFIRMADA"
                ? "bg-[#E8EEF4] text-[#526B82]"
                : estado ===
                    "EN_PROCESO"
                    ? "bg-[#FFF4D8] text-[#8A6A28]"
                    : "bg-[#EEF1EF] text-[#66756E]";

    return (
        <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${clase}`}
        >
            {formatearEstado(
                estado,
            )}
        </span>
    );
}

function calcularPulso(
    utilidad: number,
    ingresos: number,
    productosCriticos: number,
    citas: number,
    canceladas: number,
) {
    let puntaje =
        75;

    if (
        ingresos >
        0
    ) {
        const margenActual =
            utilidad /
            ingresos;

        puntaje +=
            margenActual >
                0.3
                ? 12
                : margenActual >
                    0
                    ? 5
                    : -15;
    }

    puntaje -=
        Math.min(
            productosCriticos *
            2,
            16,
        );

    if (
        citas >
        0
    ) {
        const tasaCancelacion =
            canceladas /
            citas;

        puntaje -=
            Math.min(
                tasaCancelacion *
                25,
                15,
            );
    }

    puntaje =
        Math.max(
            0,
            Math.min(
                Math.round(
                    puntaje,
                ),
                100,
            ),
        );

    if (
        puntaje >=
        85
    ) {
        return {
            puntaje,
            etiqueta:
                "Excelente",
            clase:
                "bg-[#DCE7E2] text-[#26332F]",
            mensaje:
                "El negocio muestra un comportamiento saludable. Mantén el ritmo y revisa las oportunidades de crecimiento.",
        };
    }

    if (
        puntaje >=
        65
    ) {
        return {
            puntaje,
            etiqueta:
                "Estable",
            clase:
                "bg-[#FFF4D8] text-[#745A26]",
            mensaje:
                "La operación se ve estable, aunque hay algunos puntos que conviene vigilar para mantener el control.",
        };
    }

    return {
        puntaje,
        etiqueta:
            "Atención",
        clase:
            "bg-[#F3DDE1] text-[#8E5964]",
        mensaje:
            "Hay señales que requieren revisión. Mira inventario, gastos, cobros y cancelaciones para detectar la causa.",
    };
}

function construirTendencia(
    movimientos: MovimientoDashboard[],
): TendenciaMes[] {
    const hoy =
        new Date();

    const meses =
        Array.from(
            {
                length: 6,
            },
            (
                _,
                indice,
            ) =>
                new Date(
                    hoy.getFullYear(),
                    hoy.getMonth() -
                    (5 -
                        indice),
                    1,
                ),
        );

    return meses.map(
        (
            fecha,
        ) => {
            const clave =
                `${fecha.getFullYear()}-${String(
                    fecha.getMonth() +
                    1,
                ).padStart(
                    2,
                    "0",
                )}`;

            const delMes =
                movimientos.filter(
                    (
                        movimiento,
                    ) =>
                        movimiento.fecha_movimiento.slice(
                            0,
                            7,
                        ) ===
                        clave,
                );

            const ingresos =
                delMes
                    .filter(
                        (
                            movimiento,
                        ) =>
                            movimiento.tipo ===
                            "INGRESO",
                    )
                    .reduce(
                        (
                            total,
                            movimiento,
                        ) =>
                            total +
                            Number(
                                movimiento.monto,
                            ),
                        0,
                    );

            const gastos =
                delMes
                    .filter(
                        (
                            movimiento,
                        ) =>
                            movimiento.tipo ===
                            "GASTO",
                    )
                    .reduce(
                        (
                            total,
                            movimiento,
                        ) =>
                            total +
                            Number(
                                movimiento.monto,
                            ),
                        0,
                    );

            return {
                clave,
                etiqueta:
                    new Intl.DateTimeFormat(
                        "es-NI",
                        {
                            month:
                                "short",
                        },
                    ).format(
                        fecha,
                    ),
                ingresos,
                gastos,
                utilidad:
                    ingresos -
                    gastos,
            };
        },
    );
}

function margen(
    utilidad: number,
    ingresos: number,
) {
    return ingresos >
        0
        ? (
            utilidad /
            ingresos
        ) *
        100
        : 0;
}

function saludoActual() {
    const hora =
        Number(
            new Intl.DateTimeFormat(
                "en-US",
                {
                    hour:
                        "2-digit",
                    hour12:
                        false,
                    timeZone:
                        "America/Managua",
                },
            ).format(
                new Date(),
            ),
        );

    if (
        hora <
        12
    ) {
        return "Buenos días";
    }

    if (
        hora <
        18
    ) {
        return "Buenas tardes";
    }

    return "Buenas noches";
}

function fechaLocalISO(
    fecha: Date,
) {
    return [
        fecha.getFullYear(),
        String(
            fecha.getMonth() +
            1,
        ).padStart(
            2,
            "0",
        ),
        String(
            fecha.getDate(),
        ).padStart(
            2,
            "0",
        ),
    ].join(
        "-",
    );
}

function formatearFechaHumana(
    valor: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            weekday:
                "long",
            day:
                "numeric",
            month:
                "long",
        },
    ).format(
        new Date(
            `${valor}T12:00:00`,
        ),
    );
}

function hora12(
    valor: string,
) {
    const [
        hora,
        minuto,
    ] =
        valor.split(
            ":",
        );

    const fecha =
        new Date();

    fecha.setHours(
        Number(
            hora,
        ),
        Number(
            minuto,
        ),
        0,
        0,
    );

    return new Intl.DateTimeFormat(
        "es-NI",
        {
            hour:
                "numeric",
            minute:
                "2-digit",
            hour12:
                true,
        },
    ).format(
        fecha,
    );
}

function duracionCita(
    inicio: string,
    fin: string,
) {
    const [
        h1,
        m1,
    ] =
        inicio.split(
            ":",
        );

    const [
        h2,
        m2,
    ] =
        fin.split(
            ":",
        );

    const minutos =
        Number(
            h2,
        ) *
        60 +
        Number(
            m2,
        ) -
        (Number(
            h1,
        ) *
            60 +
            Number(
                m1,
            ));

    return `${Math.max(
        minutos,
        0,
    )} min`;
}

function formatearEstado(
    valor: string,
) {
    return (
        {
            PENDIENTE:
                "Pendiente",
            CONFIRMADA:
                "Confirmada",
            EN_ESPERA:
                "En espera",
            EN_PROCESO:
                "En proceso",
            FINALIZADA:
                "Finalizada",
            CANCELADA:
                "Cancelada",
            NO_ASISTIO:
                "No asistió",
            REPROGRAMADA:
                "Reprogramada",
        }[valor] ??
        valor
    );
}

function moneda(
    valor: number,
    simbolo: string,
) {
    return `${simbolo} ${Number(
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
