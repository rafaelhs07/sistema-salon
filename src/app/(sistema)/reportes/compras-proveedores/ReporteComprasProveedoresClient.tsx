"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    CircleDollarSign,
    Filter,
    PackageOpen,
    Search,
    Store,
    Truck,
    WalletCards,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import BotonExportarExcel from "@/components/reportes/BotonExportarExcel";

import {
    exportarReporteComprasProveedoresExcel,
} from "./exportarReporteComprasProveedoresExcel";

export type ProveedorReporteFiltro = {
    id: string;
    codigo_proveedor: string;
    nombre: string;
    estado: string;
};

export type SucursalReporteCompras = {
    id: string;
    nombre: string;
};

export type CompraReporteProveedores = {
    id: string;
    codigo_compra: string;
    numero_factura: string | null;
    fecha_compra: string;
    condicion_pago: string;
    subtotal: number;
    descuento: number;
    impuestos: number;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    estado_pago: string;
    estado: string;
    proveedor_id: string;
    sucursal_id: string;

    proveedores: {
        codigo_proveedor: string;
        nombre: string;
    } | null;

    sucursales: {
        nombre: string;
    } | null;

    compra_detalles: {
        id: string;
        producto_id: string;
        cantidad: number;
        costo_unitario: number;
        descuento: number;
        subtotal: number;
        total: number;
        productos: {
            codigo_producto: string;
            nombre: string;
            unidad_medida: string;
        } | null;
    }[];
};

type ResumenProveedor = {
    nombre: string;
    codigo: string;
    compras: number;
    total: number;
    pagado: number;
    pendiente: number;
    porcentaje: number;
};

type ResumenMes = {
    clave: string;
    etiqueta: string;
    total: number;
    pagado: number;
    pendiente: number;
};

export default function ReporteComprasProveedoresClient({
    simboloMoneda,
    compras,
    proveedores,
    sucursales,
}: {
    simboloMoneda: string;
    compras: CompraReporteProveedores[];
    proveedores: ProveedorReporteFiltro[];
    sucursales: SucursalReporteCompras[];
}) {
    const hoy =
        new Date();

    const primerDiaMes =
        new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            1,
        )
            .toISOString()
            .slice(0, 10);

    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        fechaDesde,
        setFechaDesde,
    ] = useState(
        primerDiaMes,
    );

    const [
        fechaHasta,
        setFechaHasta,
    ] = useState(
        hoy
            .toISOString()
            .slice(0, 10),
    );

    const [
        proveedorId,
        setProveedorId,
    ] = useState("");

    const [
        sucursalId,
        setSucursalId,
    ] = useState("");

    const [
        estado,
        setEstado,
    ] = useState("");

    const [
        condicionPago,
        setCondicionPago,
    ] = useState("");

    const [
        exportando,
        setExportando,
    ] = useState(false);

    const estados =
        useMemo(
            () =>
                Array.from(
                    new Set(
                        compras.map(
                            (compra) =>
                                compra.estado,
                        ),
                    ),
                ).sort(),
            [compras],
        );

    const condiciones =
        useMemo(
            () =>
                Array.from(
                    new Set(
                        compras.map(
                            (compra) =>
                                compra.condicion_pago,
                        ),
                    ),
                ).sort(),
            [compras],
        );

    const comprasFiltradas =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            return compras.filter(
                (compra) => {
                    const fecha =
                        compra.fecha_compra.slice(
                            0,
                            10,
                        );

                    const coincideTexto =
                        !texto ||
                        compra.codigo_compra
                            .toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        compra.numero_factura
                            ?.toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        compra.proveedores
                            ?.nombre.toLowerCase()
                            .includes(
                                texto,
                            ) ||
                        compra.compra_detalles.some(
                            (detalle) =>
                                detalle.productos
                                    ?.nombre.toLowerCase()
                                    .includes(
                                        texto,
                                    ) ||
                                detalle.productos
                                    ?.codigo_producto.toLowerCase()
                                    .includes(
                                        texto,
                                    ),
                        );

                    const coincideDesde =
                        !fechaDesde ||
                        fecha >=
                        fechaDesde;

                    const coincideHasta =
                        !fechaHasta ||
                        fecha <=
                        fechaHasta;

                    const coincideProveedor =
                        !proveedorId ||
                        compra.proveedor_id ===
                        proveedorId;

                    const coincideSucursal =
                        !sucursalId ||
                        compra.sucursal_id ===
                        sucursalId;

                    const coincideEstado =
                        !estado ||
                        compra.estado ===
                        estado;

                    const coincideCondicion =
                        !condicionPago ||
                        compra.condicion_pago ===
                        condicionPago;

                    return (
                        coincideTexto &&
                        coincideDesde &&
                        coincideHasta &&
                        coincideProveedor &&
                        coincideSucursal &&
                        coincideEstado &&
                        coincideCondicion
                    );
                },
            );
        }, [
            compras,
            busqueda,
            fechaDesde,
            fechaHasta,
            proveedorId,
            sucursalId,
            estado,
            condicionPago,
        ]);

    const resumen =
        useMemo(() => {
            const confirmadas =
                comprasFiltradas.filter(
                    (compra) =>
                        compra.estado ===
                        "CONFIRMADA",
                );

            const totalComprado =
                confirmadas.reduce(
                    (
                        total,
                        compra,
                    ) =>
                        total +
                        Number(
                            compra.total,
                        ),
                    0,
                );

            const pagado =
                confirmadas.reduce(
                    (
                        total,
                        compra,
                    ) =>
                        total +
                        Number(
                            compra.monto_pagado,
                        ),
                    0,
                );

            const pendiente =
                confirmadas.reduce(
                    (
                        total,
                        compra,
                    ) =>
                        total +
                        Number(
                            compra.saldo_pendiente,
                        ),
                    0,
                );

            const proveedoresUsados =
                new Set(
                    confirmadas.map(
                        (compra) =>
                            compra.proveedor_id,
                    ),
                ).size;

            return {
                compras:
                    comprasFiltradas.length,
                confirmadas:
                    confirmadas.length,
                totalComprado,
                pagado,
                pendiente,
                proveedoresUsados,
            };
        }, [
            comprasFiltradas,
        ]);

    const porProveedor =
        useMemo(
            () =>
                resumirPorProveedor(
                    comprasFiltradas,
                ),
            [
                comprasFiltradas,
            ],
        );

    const porMes =
        useMemo(
            () =>
                resumirPorMes(
                    comprasFiltradas,
                ),
            [
                comprasFiltradas,
            ],
        );

    const porCondicion =
        useMemo(
            () =>
                resumirCondicion(
                    comprasFiltradas,
                ),
            [
                comprasFiltradas,
            ],
        );

    const nombreSucursal =
        sucursalId
            ? sucursales.find(
                (
                    sucursal,
                ) =>
                    sucursal.id ===
                    sucursalId,
            )?.nombre ??
            "Sucursal"
            : "Todas las sucursales";

    const nombreProveedor =
        proveedorId
            ? proveedores.find(
                (
                    proveedor,
                ) =>
                    proveedor.id ===
                    proveedorId,
            )?.nombre ??
            "Proveedor"
            : "Todos los proveedores";

    async function exportarExcel() {
        if (
            exportando
        ) {
            return;
        }

        setExportando(
            true,
        );

        try {
            await exportarReporteComprasProveedoresExcel(
                {
                    simboloMoneda,
                    fechaDesde,
                    fechaHasta,
                    nombreSucursal,
                    nombreProveedor,

                    estado:
                        estado
                            ? formatearEstado(
                                estado,
                            )
                            : "Todos los estados",

                    condicionPago:
                        condicionPago
                            ? formatearCondicion(
                                condicionPago,
                            )
                            : "Todas las condiciones",

                    resumen,
                    compras:
                        comprasFiltradas,
                    porProveedor,
                    porMes,
                    porCondicion,
                },
            );
        } catch (error) {
            console.error(
                "Error exportando reporte de compras y proveedores:",
                error,
            );

            window.alert(
                "No fue posible generar el Excel.",
            );
        } finally {
            setExportando(
                false,
            );
        }
    }

    function limpiarFiltros() {
        setBusqueda("");
        setFechaDesde(
            primerDiaMes,
        );
        setFechaHasta(
            hoy
                .toISOString()
                .slice(0, 10),
        );
        setProveedorId("");
        setSucursalId("");
        setEstado("");
        setCondicionPago("");
    }

    return (
        <div className="space-y-6 pb-8">
            <section className="relative overflow-hidden rounded-[32px] bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/reportes"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Reportes
                    </Link>

                    <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <Truck className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Abastecimiento
                                </p>

                                <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                    Compras y proveedores
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Analiza compras, pagos, saldos pendientes
                                    y concentración de compras por proveedor.
                                </p>
                            </div>
                        </div>

                        <BotonExportarExcel
                            exportando={exportando}
                            onClick={exportarExcel}
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <Kpi
                    titulo="Compras"
                    valor={String(
                        resumen.compras,
                    )}
                    icono={PackageOpen}
                />

                <Kpi
                    titulo="Confirmadas"
                    valor={String(
                        resumen.confirmadas,
                    )}
                    icono={Store}
                />

                <Kpi
                    titulo="Total comprado"
                    valor={moneda(
                        resumen.totalComprado,
                        simboloMoneda,
                    )}
                    icono={CircleDollarSign}
                />

                <Kpi
                    titulo="Pagado"
                    valor={moneda(
                        resumen.pagado,
                        simboloMoneda,
                    )}
                    icono={WalletCards}
                />

                <Kpi
                    titulo="Pendiente"
                    valor={moneda(
                        resumen.pendiente,
                        simboloMoneda,
                    )}
                    icono={WalletCards}
                    alerta
                />

                <Kpi
                    titulo="Proveedores usados"
                    valor={String(
                        resumen.proveedoresUsados,
                    )}
                    icono={Building2}
                />
            </section>

            <section className="rounded-[30px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)] sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#26332F]">
                            Filtros de compras
                        </h2>

                        <p className="mt-1 text-sm text-[#72827A]">
                            Filtra por periodo, proveedor, sucursal y condición de pago.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            limpiarFiltros
                        }
                        className="h-10 rounded-xl border border-[#DCE5E0] px-4 text-sm font-bold text-[#52605A] transition hover:bg-[#EEF2EF]"
                    >
                        Limpiar filtros
                    </button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="relative md:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87948D]" />

                        <input
                            value={
                                busqueda
                            }
                            onChange={(
                                event,
                            ) =>
                                setBusqueda(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Código, factura, proveedor o producto..."
                            className="h-11 w-full rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83] focus:bg-white"
                        />
                    </div>

                    <input
                        type="date"
                        value={
                            fechaDesde
                        }
                        onChange={(
                            event,
                        ) =>
                            setFechaDesde(
                                event
                                    .target
                                    .value,
                            )
                        }
                        className="h-11 rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] px-3 text-sm outline-none focus:border-[#6F8F83]"
                    />

                    <input
                        type="date"
                        value={
                            fechaHasta
                        }
                        onChange={(
                            event,
                        ) =>
                            setFechaHasta(
                                event
                                    .target
                                    .value,
                            )
                        }
                        className="h-11 rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] px-3 text-sm outline-none focus:border-[#6F8F83]"
                    />

                    <Select
                        valor={
                            proveedorId
                        }
                        cambiar={
                            setProveedorId
                        }
                    >
                        <option value="">
                            Todos los proveedores
                        </option>

                        {proveedores.map(
                            (
                                proveedor,
                            ) => (
                                <option
                                    key={
                                        proveedor.id
                                    }
                                    value={
                                        proveedor.id
                                    }
                                >
                                    {
                                        proveedor.nombre
                                    }
                                </option>
                            ),
                        )}
                    </Select>

                    <Select
                        valor={
                            sucursalId
                        }
                        cambiar={
                            setSucursalId
                        }
                    >
                        <option value="">
                            Todas las sucursales
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
                    </Select>

                    <Select
                        valor={
                            estado
                        }
                        cambiar={
                            setEstado
                        }
                    >
                        <option value="">
                            Todos los estados
                        </option>

                        {estados.map(
                            (
                                item,
                            ) => (
                                <option
                                    key={
                                        item
                                    }
                                    value={
                                        item
                                    }
                                >
                                    {formatearEstado(
                                        item,
                                    )}
                                </option>
                            ),
                        )}
                    </Select>

                    <Select
                        valor={
                            condicionPago
                        }
                        cambiar={
                            setCondicionPago
                        }
                    >
                        <option value="">
                            Todas las condiciones
                        </option>

                        {condiciones.map(
                            (
                                item,
                            ) => (
                                <option
                                    key={
                                        item
                                    }
                                    value={
                                        item
                                    }
                                >
                                    {formatearCondicion(
                                        item,
                                    )}
                                </option>
                            ),
                        )}
                    </Select>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <RankingProveedores
                    datos={
                        porProveedor
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />

                <TendenciaMensual
                    datos={
                        porMes
                    }
                    simboloMoneda={
                        simboloMoneda
                    }
                />
            </section>

            <section className="rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
                <h2 className="text-lg font-bold text-[#26332F]">
                    Condiciones de pago
                </h2>

                <p className="mt-1 text-sm text-[#72827A]">
                    Distribución de compras según la forma pactada con el proveedor.
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {porCondicion.length ===
                        0 ? (
                        <p className="md:col-span-3 rounded-2xl bg-[#F7FAF8] px-4 py-8 text-center text-sm text-[#74837C]">
                            Sin datos en el periodo.
                        </p>
                    ) : (
                        porCondicion.map(
                            (
                                item,
                            ) => (
                                <div
                                    key={
                                        item.nombre
                                    }
                                    className="rounded-2xl bg-[#F7FAF8] px-4 py-4"
                                >
                                    <p className="text-sm font-bold text-[#33413B]">
                                        {
                                            item.nombre
                                        }
                                    </p>

                                    <p className="mt-2 text-2xl font-bold text-[#26332F]">
                                        {
                                            item.cantidad
                                        }
                                    </p>

                                    <p className="mt-1 text-xs text-[#7D8A84]">
                                        {moneda(
                                            item.total,
                                            simboloMoneda,
                                        )}
                                    </p>
                                </div>
                            ),
                        )
                    )}
                </div>
            </section>

            <section className="overflow-hidden rounded-[30px] border border-[#DCE5E0] bg-white shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
                <div className="flex items-center justify-between border-b border-[#E7EEEA] px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="font-bold text-[#26332F]">
                            Detalle de compras
                        </h2>

                        <p className="mt-1 text-xs text-[#74837C]">
                            {comprasFiltradas.length} compras encontradas
                        </p>
                    </div>

                    <Filter className="h-5 w-5 text-[#71817A]" />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1480px] w-full">
                        <thead className="bg-[#F7FAF8]">
                            <tr>
                                <Th>Fecha</Th>
                                <Th>Código</Th>
                                <Th>Factura</Th>
                                <Th>Proveedor</Th>
                                <Th>Sucursal</Th>
                                <Th>Condición</Th>
                                <Th>Estado</Th>
                                <Th>Productos</Th>
                                <Th derecha>Total</Th>
                                <Th derecha>Pagado</Th>
                                <Th derecha>Pendiente</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EDF3EF]">
                            {comprasFiltradas.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            11
                                        }
                                        className="px-6 py-14 text-center text-sm text-[#74837C]"
                                    >
                                        No hay compras con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                comprasFiltradas.map(
                                    (
                                        compra,
                                    ) => (
                                        <tr
                                            key={
                                                compra.id
                                            }
                                            className="transition hover:bg-[#FAFCFB]"
                                        >
                                            <Td>
                                                {fecha(
                                                    compra.fecha_compra,
                                                )}
                                            </Td>

                                            <Td>
                                                <span className="font-bold text-[#33413B]">
                                                    {
                                                        compra.codigo_compra
                                                    }
                                                </span>
                                            </Td>

                                            <Td>
                                                {compra.numero_factura ??
                                                    "—"}
                                            </Td>

                                            <Td>
                                                {
                                                    compra.proveedores
                                                        ?.nombre ??
                                                    "Sin proveedor"
                                                }
                                            </Td>

                                            <Td>
                                                {
                                                    compra.sucursales
                                                        ?.nombre ??
                                                    "Sin sucursal"
                                                }
                                            </Td>

                                            <Td>
                                                {formatearCondicion(
                                                    compra.condicion_pago,
                                                )}
                                            </Td>

                                            <Td>
                                                <EstadoBadge
                                                    estado={
                                                        compra.estado
                                                    }
                                                />
                                            </Td>

                                            <Td>
                                                <div className="max-w-[320px]">
                                                    {compra.compra_detalles.length ===
                                                        0
                                                        ? "Sin detalle"
                                                        : compra.compra_detalles
                                                            .map(
                                                                (
                                                                    detalle,
                                                                ) =>
                                                                    `${detalle.productos?.nombre ?? "Producto"} x ${Number(
                                                                        detalle.cantidad,
                                                                    )}`,
                                                            )
                                                            .join(
                                                                ", ",
                                                            )}
                                                </div>
                                            </Td>

                                            <Td derecha>
                                                {moneda(
                                                    Number(
                                                        compra.total,
                                                    ),
                                                    simboloMoneda,
                                                )}
                                            </Td>

                                            <Td derecha>
                                                <span className="font-bold text-[#4F7564]">
                                                    {moneda(
                                                        Number(
                                                            compra.monto_pagado,
                                                        ),
                                                        simboloMoneda,
                                                    )}
                                                </span>
                                            </Td>

                                            <Td derecha>
                                                <span className="font-bold text-[#9A6470]">
                                                    {moneda(
                                                        Number(
                                                            compra.saldo_pendiente,
                                                        ),
                                                        simboloMoneda,
                                                    )}
                                                </span>
                                            </Td>
                                        </tr>
                                    ),
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function Kpi({
    titulo,
    valor,
    icono: Icono,
    alerta = false,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    alerta?: boolean;
}) {
    return (
        <article className="rounded-[26px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.07)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#71817A]">
                        {titulo}
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-[#26332F]">
                        {valor}
                    </p>
                </div>

                <div
                    className={[
                        "flex h-11 w-11 items-center justify-center rounded-2xl",
                        alerta
                            ? "bg-[#F5E8EB] text-[#9A6470]"
                            : "bg-[#EEF4F0] text-[#587064]",
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

function Select({
    valor,
    cambiar,
    children,
}: {
    valor: string;
    cambiar: (
        valor: string,
    ) => void;
    children: React.ReactNode;
}) {
    return (
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
            className="h-11 rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] px-3 text-sm font-medium text-[#43524B] outline-none focus:border-[#6F8F83] focus:bg-white"
        >
            {children}
        </select>
    );
}

function RankingProveedores({
    datos,
    simboloMoneda,
}: {
    datos: ResumenProveedor[];
    simboloMoneda: string;
}) {
    return (
        <article className="rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
            <h2 className="text-lg font-bold text-[#26332F]">
                Compras por proveedor
            </h2>

            <p className="mt-1 text-sm text-[#72827A]">
                Proveedores con mayor volumen de compra.
            </p>

            <div className="mt-6 space-y-4">
                {datos.length ===
                    0 ? (
                    <EstadoVacio />
                ) : (
                    datos
                        .slice(
                            0,
                            8,
                        )
                        .map(
                            (
                                item,
                            ) => (
                                <div
                                    key={
                                        item.codigo
                                    }
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-[#33413B]">
                                                {
                                                    item.nombre
                                                }
                                            </p>

                                            <p className="mt-0.5 text-xs text-[#7D8A84]">
                                                {
                                                    item.compras
                                                }{" "}
                                                compra
                                                {item.compras ===
                                                    1
                                                    ? ""
                                                    : "s"}{" "}
                                                ·{" "}
                                                {item.porcentaje.toFixed(
                                                    1,
                                                )}
                                                %
                                            </p>
                                        </div>

                                        <p className="text-sm font-bold text-[#26332F]">
                                            {moneda(
                                                item.total,
                                                simboloMoneda,
                                            )}
                                        </p>
                                    </div>

                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EEF2EF]">
                                        <div
                                            className="h-full rounded-full bg-[#6F8F83]"
                                            style={{
                                                width: `${Math.max(
                                                    item.porcentaje,
                                                    2,
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ),
                        )
                )}
            </div>
        </article>
    );
}

function TendenciaMensual({
    datos,
    simboloMoneda,
}: {
    datos: ResumenMes[];
    simboloMoneda: string;
}) {
    const maximo =
        Math.max(
            ...datos.map(
                (item) =>
                    item.total,
            ),
            1,
        );

    return (
        <article className="rounded-[28px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
            <h2 className="text-lg font-bold text-[#26332F]">
                Tendencia de compras
            </h2>

            <p className="mt-1 text-sm text-[#72827A]">
                Monto comprado por mes.
            </p>

            <div className="mt-6 overflow-x-auto">
                <div className="grid min-w-[650px] grid-cols-12 gap-2">
                    {datos.map(
                        (
                            item,
                        ) => (
                            <div
                                key={
                                    item.clave
                                }
                            >
                                <div className="flex h-[190px] items-end justify-center rounded-2xl bg-[#F7FAF8] px-2 py-3">
                                    <div
                                        title={`${item.clave}: ${moneda(
                                            item.total,
                                            simboloMoneda,
                                        )}`}
                                        className="w-5 rounded-t-md bg-[#6F8F83]"
                                        style={{
                                            height: `${Math.max(
                                                (
                                                    item.total /
                                                    maximo
                                                ) *
                                                150,
                                                item.total >
                                                    0
                                                    ? 5
                                                    : 1,
                                            )}px`,
                                        }}
                                    />
                                </div>

                                <p className="mt-2 truncate text-center text-[9px] font-bold uppercase text-[#71817A]">
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
    );
}

function EstadoBadge({
    estado,
}: {
    estado: string;
}) {
    const clase =
        estado ===
            "CONFIRMADA"
            ? "bg-[#E3EEE8] text-[#527865]"
            : estado ===
                "ANULADA"
                ? "bg-[#F8E5E5] text-[#A25E5E]"
                : "bg-[#FFF1CC] text-[#8A6A22]";

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${clase}`}
        >
            {formatearEstado(
                estado,
            )}
        </span>
    );
}

function EstadoVacio() {
    return (
        <p className="rounded-2xl bg-[#F7FAF8] px-4 py-8 text-center text-sm text-[#74837C]">
            Sin datos en el periodo seleccionado.
        </p>
    );
}

function Th({
    children,
    derecha = false,
}: {
    children: React.ReactNode;
    derecha?: boolean;
}) {
    return (
        <th
            className={`px-5 py-3 text-xs font-bold uppercase tracking-[0.13em] text-[#789087] ${derecha
                    ? "text-right"
                    : "text-left"
                }`}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    derecha = false,
}: {
    children: React.ReactNode;
    derecha?: boolean;
}) {
    return (
        <td
            className={`px-5 py-4 text-sm text-[#53645C] ${derecha
                    ? "text-right"
                    : "text-left"
                }`}
        >
            {children}
        </td>
    );
}

function resumirPorProveedor(
    compras: CompraReporteProveedores[],
): ResumenProveedor[] {
    const confirmadas =
        compras.filter(
            (compra) =>
                compra.estado ===
                "CONFIRMADA",
        );

    const mapa =
        new Map<
            string,
            ResumenProveedor
        >();

    confirmadas.forEach(
        (
            compra,
        ) => {
            const nombre =
                compra.proveedores
                    ?.nombre ??
                "Sin proveedor";

            const codigo =
                compra.proveedores
                    ?.codigo_proveedor ??
                compra.proveedor_id;

            const actual =
                mapa.get(
                    compra.proveedor_id,
                ) ?? {
                    nombre,
                    codigo,
                    compras: 0,
                    total: 0,
                    pagado: 0,
                    pendiente: 0,
                    porcentaje: 0,
                };

            actual.compras +=
                1;

            actual.total +=
                Number(
                    compra.total,
                );

            actual.pagado +=
                Number(
                    compra.monto_pagado,
                );

            actual.pendiente +=
                Number(
                    compra.saldo_pendiente,
                );

            mapa.set(
                compra.proveedor_id,
                actual,
            );
        },
    );

    const totalGeneral =
        Array.from(
            mapa.values(),
        ).reduce(
            (
                total,
                item,
            ) =>
                total +
                item.total,
            0,
        );

    return Array.from(
        mapa.values(),
    )
        .map(
            (
                item,
            ) => ({
                ...item,
                porcentaje:
                    totalGeneral >
                        0
                        ? (
                            item.total /
                            totalGeneral
                        ) *
                        100
                        : 0,
            }),
        )
        .sort(
            (a, b) =>
                b.total -
                a.total,
        );
}

function resumirPorMes(
    compras: CompraReporteProveedores[],
): ResumenMes[] {
    const mapa =
        new Map<
            string,
            {
                total: number;
                pagado: number;
                pendiente: number;
            }
        >();

    compras
        .filter(
            (compra) =>
                compra.estado ===
                "CONFIRMADA",
        )
        .forEach(
            (
                compra,
            ) => {
                const fecha =
                    new Date(
                        compra.fecha_compra,
                    );

                const clave =
                    `${fecha.getFullYear()}-${String(
                        fecha.getMonth() +
                        1,
                    ).padStart(
                        2,
                        "0",
                    )}`;

                const actual =
                    mapa.get(
                        clave,
                    ) ?? {
                        total: 0,
                        pagado: 0,
                        pendiente: 0,
                    };

                actual.total +=
                    Number(
                        compra.total,
                    );

                actual.pagado +=
                    Number(
                        compra.monto_pagado,
                    );

                actual.pendiente +=
                    Number(
                        compra.saldo_pendiente,
                    );

                mapa.set(
                    clave,
                    actual,
                );
            },
        );

    return Array.from(
        mapa.entries(),
    )
        .sort(
            ([a], [b]) =>
                a.localeCompare(
                    b,
                ),
        )
        .slice(
            -12,
        )
        .map(
            ([
                clave,
                valor,
            ]) => {
                const [
                    anio,
                    mes,
                ] =
                    clave.split(
                        "-",
                    );

                return {
                    clave,
                    etiqueta:
                        new Intl.DateTimeFormat(
                            "es-NI",
                            {
                                month: "short",
                            },
                        ).format(
                            new Date(
                                Number(
                                    anio,
                                ),
                                Number(
                                    mes,
                                ) -
                                1,
                                1,
                            ),
                        ),
                    ...valor,
                };
            },
        );
}

function resumirCondicion(
    compras: CompraReporteProveedores[],
) {
    const mapa =
        new Map<
            string,
            {
                cantidad: number;
                total: number;
            }
        >();

    compras
        .filter(
            (compra) =>
                compra.estado ===
                "CONFIRMADA",
        )
        .forEach(
            (
                compra,
            ) => {
                const nombre =
                    formatearCondicion(
                        compra.condicion_pago,
                    );

                const actual =
                    mapa.get(
                        nombre,
                    ) ?? {
                        cantidad: 0,
                        total: 0,
                    };

                actual.cantidad +=
                    1;

                actual.total +=
                    Number(
                        compra.total,
                    );

                mapa.set(
                    nombre,
                    actual,
                );
            },
        );

    return Array.from(
        mapa.entries(),
    )
        .map(
            ([
                nombre,
                valor,
            ]) => ({
                nombre,
                ...valor,
            }),
        )
        .sort(
            (a, b) =>
                b.total -
                a.total,
        );
}

function formatearEstado(
    valor: string,
) {
    return (
        {
            BORRADOR:
                "Borrador",
            CONFIRMADA:
                "Confirmada",
            ANULADA:
                "Anulada",
        }[valor] ??
        valor
    );
}

function formatearCondicion(
    valor: string,
) {
    return (
        {
            CONTADO:
                "Contado",
            CREDITO:
                "Crédito",
            MIXTA:
                "Mixta",
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

function fecha(
    valor: string,
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
            valor,
        ),
    );
}
