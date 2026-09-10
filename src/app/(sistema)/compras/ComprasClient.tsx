"use client";

import Link from "next/link";
import {
    ArrowRight,
    Building2,
    CircleDollarSign,
    ClipboardList,
    PackagePlus,
    ReceiptText,
    Store,
    Truck,
} from "lucide-react";

export type ResumenCompras = {
    proveedoresActivos: number;
    comprasConfirmadas: number;
    cuentasPendientes: number;
    saldoPendiente: number;
};

export default function ComprasClient({
    resumen,
}: {
    resumen: ResumenCompras;
}) {
    return (
        <div className="space-y-6">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />

                <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />

                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                            <PackagePlus className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Abastecimiento del salón
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                Compras
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Gestiona proveedores, compras,
                                entradas de inventario y pagos
                                pendientes desde un solo lugar.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B9C8C1]">
                            Estado del módulo
                        </p>

                        <p className="mt-2 text-lg font-bold">
                            Módulo operativo
                        </p>

                        <p className="mt-1 text-xs text-[#CFD9D4]">
                            Proveedores, compras, historial y cuentas por pagar disponibles.
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ResumenCard
                    titulo="Proveedores activos"
                    valor={String(
                        resumen.proveedoresActivos,
                    )}
                    descripcion="Disponibles para nuevas compras"
                    icono={Truck}
                />

                <ResumenCard
                    titulo="Compras confirmadas"
                    valor={String(
                        resumen.comprasConfirmadas,
                    )}
                    descripcion="Compras registradas"
                    icono={ReceiptText}
                />

                <ResumenCard
                    titulo="Cuentas pendientes"
                    valor={String(
                        resumen.cuentasPendientes,
                    )}
                    descripcion="Deudas abiertas con proveedores"
                    icono={ClipboardList}
                />

                <ResumenCard
                    titulo="Saldo por pagar"
                    valor={`C$ ${Number(
                        resumen.saldoPendiente,
                    ).toLocaleString(
                        "es-NI",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        },
                    )}`}
                    descripcion="Total pendiente"
                    icono={CircleDollarSign}
                />
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
                <AccesoModulo
                    href="/compras/proveedores"
                    titulo="Proveedores"
                    descripcion="Directorio comercial, contactos y condiciones de pago."
                    detalle="Disponible ahora"
                    icono={Building2}
                    activo
                />

                <AccesoModulo
                    href="/compras/nueva"
                    titulo="Nueva compra"
                    descripcion="Registrar múltiples productos, costos, factura y condición de pago."
                    detalle="Disponible ahora"
                    icono={PackagePlus}
                    activo
                />

                <AccesoModulo
                    href="/compras/historial"
                    titulo="Historial de compras"
                    descripcion="Consultar compras por proveedor, sucursal, fecha y estado."
                    detalle="Disponible ahora"
                    icono={ReceiptText}
                    activo
                />

                <AccesoModulo
                    href="/compras/cuentas-pagar"
                    titulo="Cuentas por pagar"
                    descripcion="Deudas con proveedores, vencimientos y saldos pendientes."
                    detalle="Disponible ahora"
                    icono={CircleDollarSign}
                    activo
                />
            </section>

            <section className="salon-panel border border-border bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                            <Store className="h-6 w-6" />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">
                                Flujo de compras
                            </h2>

                            <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
                                El inventario solo aumentará cuando confirmes la compra.
                                Primero registras y revisas los datos; después confirmas la entrada al stock.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2 text-xs text-[#52605A] sm:grid-cols-3">
                        <Paso numero="1" texto="Registrar compra" />
                        <Paso numero="2" texto="Confirmar" />
                        <Paso numero="3" texto="Aumentar stock" />
                    </div>
                </div>
            </section>
        </div>
    );
}

function ResumenCard({
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
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-text-secondary">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold text-foreground">
                        {valor}
                    </p>

                    <p className="mt-1 text-xs text-[#8A948F]">
                        {descripcion}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function AccesoModulo({
    href,
    titulo,
    descripcion,
    detalle,
    icono: Icono,
    activo = false,
}: {
    href?: string;
    titulo: string;
    descripcion: string;
    detalle: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    activo?: boolean;
}) {
    const contenido = (
        <div
            className={[
                "group relative overflow-hidden rounded-[28px] border p-6 transition",
                activo
                    ? "border-[#CBD9D2] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)] hover:-translate-y-0.5 hover:shadow-lg"
                    : "border-border bg-[#F8FAF8]",
            ].join(" ")}
        >
            <div className="flex items-start gap-4">
                <div
                    className={[
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                        activo
                            ? "bg-sidebar text-white"
                            : "bg-[#E5EAE7] text-[#8A948F]",
                    ].join(" ")}
                >
                    <Icono className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <h3
                            className={[
                                "text-lg font-bold",
                                activo
                                    ? "text-foreground"
                                    : "text-[#6C7771]",
                            ].join(" ")}
                        >
                            {titulo}
                        </h3>

                        {activo && (
                            <ArrowRight className="h-5 w-5 shrink-0 text-primary transition group-hover:translate-x-1" />
                        )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                        {descripcion}
                    </p>

                    <span
                        className={[
                            "mt-4 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                            activo
                                ? "bg-[#E3EEE8] text-[#527865]"
                                : "bg-[#ECEFED] text-[#8A948F]",
                        ].join(" ")}
                    >
                        {detalle}
                    </span>
                </div>
            </div>
        </div>
    );

    if (activo && href) {
        return (
            <Link href={href}>
                {contenido}
            </Link>
        );
    }

    return contenido;
}

function Paso({
    numero,
    texto,
}: {
    numero: string;
    texto: string;
}) {
    return (
        <div className="flex items-center gap-2 rounded-xl bg-surface-soft px-3 py-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white font-bold text-primary-strong">
                {numero}
            </span>

            <span className="font-semibold">
                {texto}
            </span>
        </div>
    );
}