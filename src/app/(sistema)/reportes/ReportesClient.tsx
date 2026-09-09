"use client";

import Link from "next/link";
import {
    ArrowRight,
    ArrowRightLeft,
    BarChart3,
    CalendarDays,
    Boxes,
    CircleDollarSign,
    ClipboardList,
    CreditCard,
    FileSpreadsheet,
    PackageSearch,
    ReceiptText,
    ShoppingBag,
    Store,
    TrendingUp,
    Users,
    WalletCards,
} from "lucide-react";

export type ResumenCentroReportes = {
    ingresosMes: number;
    gastosMes: number;
    utilidadMes: number;
    ventasMes: number;
    comprasMes: number;
    clientes: number;
    productos: number;
};

export default function ReportesClient({
    simboloMoneda,
    resumen,
}: {
    simboloMoneda: string;
    resumen: ResumenCentroReportes;
}) {
    return (
        <div className="space-y-6 pb-8">
            <section className="relative overflow-hidden rounded-[32px] bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <ClipboardList className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Análisis del negocio
                                </p>

                                <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                    Centro de reportes
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Consulta resultados financieros, ventas,
                                    compras, inventario y comportamiento del salón
                                    desde un mismo lugar.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/finanzas/resumen"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#DCE7E2] px-5 text-sm font-bold text-[#26332F] transition hover:bg-white"
                    >
                        <FileSpreadsheet className="h-5 w-5" />
                        Estado financiero
                    </Link>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    titulo="Ingresos del mes"
                    valor={moneda(
                        resumen.ingresosMes,
                        simboloMoneda,
                    )}
                    descripcion="Entradas financieras aplicadas"
                    icono={TrendingUp}
                />

                <KpiCard
                    titulo="Gastos del mes"
                    valor={moneda(
                        resumen.gastosMes,
                        simboloMoneda,
                    )}
                    descripcion="Salidas financieras aplicadas"
                    icono={WalletCards}
                />

                <KpiCard
                    titulo="Utilidad del mes"
                    valor={moneda(
                        resumen.utilidadMes,
                        simboloMoneda,
                    )}
                    descripcion="Ingresos menos gastos"
                    icono={CircleDollarSign}
                />

                <KpiCard
                    titulo="Ventas del mes"
                    valor={String(
                        resumen.ventasMes,
                    )}
                    descripcion="Ventas activas registradas"
                    icono={ShoppingBag}
                />
            </section>

            <section>
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-[#26332F]">
                        Reportes disponibles
                    </h2>

                    <p className="mt-1 text-sm text-[#72827A]">
                        Accede a la información que ya está registrada en el sistema.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <ReporteCard
                        titulo="Reporte financiero"
                        descripcion="Ingresos, gastos, utilidad, categorías, métodos de pago y detalle financiero."
                        href="/reportes/financiero"
                        icono={BarChart3}
                    />

                    <ReporteCard
                        titulo="Historial financiero"
                        descripcion="Todos los movimientos con filtros por fecha, sucursal, categoría y origen."
                        href="/finanzas/historial"
                        icono={ReceiptText}
                    />

                    <ReporteCard
                        titulo="Reporte de ventas"
                        descripcion="Analiza ventas, cobros, saldos pendientes, tipos de venta y métodos de pago."
                        href="/reportes/ventas"
                        icono={CreditCard}
                    />

                    <ReporteCard
                        titulo="Citas y servicios"
                        descripcion="Analiza citas, estados, servicios realizados y carga de trabajo por trabajador."
                        href="/reportes/citas-servicios"
                        icono={CalendarDays}
                    />

                    <ReporteCard
                        titulo="Reporte de clientes"
                        descripcion="Frecuencia, compras, pagos, saldos pendientes y clientes de mayor valor."
                        href="/reportes/clientes"
                        icono={Users}
                    />

                    <ReporteCard
                        titulo="Reporte de inventario"
                        descripcion="Stock, productos críticos, valor invertido y valor potencial de venta."
                        href="/reportes/inventario"
                        icono={Boxes}
                    />

                    <ReporteCard
                        titulo="Compras y proveedores"
                        descripcion="Compras, pagos, saldos pendientes, productos adquiridos y concentración por proveedor."
                        href="/reportes/compras-proveedores"
                        icono={Store}
                    />

                    <ReporteCard
                        titulo="Comparativos"
                        descripcion="Compara dos periodos y analiza cambios en ventas, utilidad, citas, compras y clientes."
                        href="/reportes/comparativos"
                        icono={ArrowRightLeft}
                    />



                    <ReporteCard
                        titulo="Cuentas por cobrar"
                        descripcion="Saldos pendientes, abonos realizados y recuperación de crédito."
                        href="/cuentas-cobrar"
                        icono={PackageSearch}
                    />
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <MiniDato
                    titulo="Clientes registrados"
                    valor={String(
                        resumen.clientes,
                    )}
                    icono={Users}
                />

                <MiniDato
                    titulo="Productos activos"
                    valor={String(
                        resumen.productos,
                    )}
                    icono={Boxes}
                />

                <MiniDato
                    titulo="Compras confirmadas este mes"
                    valor={String(
                        resumen.comprasMes,
                    )}
                    icono={Store}
                />
            </section>
        </div>
    );
}

function KpiCard({
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
        <article className="rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-[#71817A]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold text-[#26332F]">
                        {valor}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#839089]">
                        {descripcion}
                    </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4F0] text-[#587064]">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function ReporteCard({
    titulo,
    descripcion,
    href,
    icono: Icono,
}: {
    titulo: string;
    descripcion: string;
    href: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <Link
            href={href}
            className="group rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.07)] transition hover:-translate-y-0.5 hover:border-[#BFCFC7] hover:shadow-[0_16px_40px_rgba(36,48,44,0.10)]"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E7EFEA] text-[#516D60]">
                    <Icono className="h-5 w-5" />
                </div>

                <ArrowRight className="h-5 w-5 text-[#94A29B] transition group-hover:translate-x-1 group-hover:text-[#52675E]" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-[#26332F]">
                {titulo}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#72827A]">
                {descripcion}
            </p>
        </Link>
    );
}

function MiniDato({
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
        <article className="flex items-center justify-between gap-4 rounded-2xl border border-[#DCE5E0] bg-[#FBFCFA] px-5 py-4">
            <div>
                <p className="text-xs font-semibold text-[#7B8982]">
                    {titulo}
                </p>

                <p className="mt-1 text-xl font-bold text-[#26332F]">
                    {valor}
                </p>
            </div>

            <Icono className="h-5 w-5 text-[#789087]" />
        </article>
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
