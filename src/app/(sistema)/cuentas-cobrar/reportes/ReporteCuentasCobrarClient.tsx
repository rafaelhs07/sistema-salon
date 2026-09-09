"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    ReceiptText,
    Search,
    Store,
    TrendingDown,
    TrendingUp,
    UserRound,
    WalletCards,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SucursalReporte = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type CuentaReporte = {
    id: string;
    codigo_cuenta: string;
    sucursal_id: string;
    cliente_id: string;
    venta_id: string | null;
    monto_original: number;
    monto_abonado: number;
    saldo_pendiente: number;
    fecha_origen: string;
    fecha_vencimiento: string | null;
    estado: string;

    clientes: {
        id: string;
        codigo_cliente: string | null;
        nombre_completo: string;
        telefono: string | null;
        whatsapp: string | null;
    } | null;

    sucursales: {
        nombre: string;
    } | null;

    ventas: {
        codigo_venta: string | null;
    } | null;
};

export default function ReporteCuentasCobrarClient({
    cuentas,
    sucursales,
    simboloMoneda,
}: {
    cuentas: CuentaReporte[];
    sucursales: SucursalReporte[];
    simboloMoneda: string;
}) {
    const [busqueda, setBusqueda] = useState("");
    const [sucursalId, setSucursalId] = useState("");
    const [estado, setEstado] = useState("");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    const cuentasFiltradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return cuentas.filter((cuenta) => {
            const fecha = cuenta.fecha_origen.slice(0, 10);

            const coincideTexto =
                !texto ||
                cuenta.codigo_cuenta
                    .toLowerCase()
                    .includes(texto) ||
                cuenta.clientes?.nombre_completo
                    .toLowerCase()
                    .includes(texto) ||
                cuenta.clientes?.codigo_cliente
                    ?.toLowerCase()
                    .includes(texto) ||
                cuenta.ventas?.codigo_venta
                    ?.toLowerCase()
                    .includes(texto);

            return (
                coincideTexto &&
                (!sucursalId ||
                    cuenta.sucursal_id === sucursalId) &&
                (!estado ||
                    cuenta.estado === estado) &&
                (!fechaDesde || fecha >= fechaDesde) &&
                (!fechaHasta || fecha <= fechaHasta)
            );
        });
    }, [
        busqueda,
        cuentas,
        estado,
        fechaDesde,
        fechaHasta,
        sucursalId,
    ]);

    const resumen = useMemo(() => {
        return cuentasFiltradas.reduce(
            (acc, cuenta) => {
                if (cuenta.estado === "ANULADA") {
                    return acc;
                }

                const saldo = Number(cuenta.saldo_pendiente || 0);
                const original = Number(cuenta.monto_original || 0);
                const abonado = Number(cuenta.monto_abonado || 0);

                return {
                    cantidad: acc.cantidad + 1,
                    original: acc.original + original,
                    abonado: acc.abonado + abonado,
                    pendiente: acc.pendiente + saldo,
                    vencido:
                        acc.vencido +
                        (cuenta.estado === "VENCIDA"
                            ? saldo
                            : 0),
                    pagadas:
                        acc.pagadas +
                        (cuenta.estado === "PAGADA" ? 1 : 0),
                    vencidas:
                        acc.vencidas +
                        (cuenta.estado === "VENCIDA" ? 1 : 0),
                };
            },
            {
                cantidad: 0,
                original: 0,
                abonado: 0,
                pendiente: 0,
                vencido: 0,
                pagadas: 0,
                vencidas: 0,
            },
        );
    }, [cuentasFiltradas]);

    const clientesAgrupados = useMemo(() => {
        const mapa = new Map<
            string,
            {
                clienteId: string;
                nombre: string;
                codigo: string | null;
                saldo: number;
                cuentas: number;
                vencido: number;
            }
        >();

        for (const cuenta of cuentasFiltradas) {
            if (
                cuenta.estado === "ANULADA" ||
                Number(cuenta.saldo_pendiente) <= 0
            ) {
                continue;
            }

            const actual =
                mapa.get(cuenta.cliente_id) ?? {
                    clienteId: cuenta.cliente_id,
                    nombre:
                        cuenta.clientes
                            ?.nombre_completo ??
                        "Cliente",
                    codigo:
                        cuenta.clientes
                            ?.codigo_cliente ??
                        null,
                    saldo: 0,
                    cuentas: 0,
                    vencido: 0,
                };

            actual.saldo += Number(
                cuenta.saldo_pendiente,
            );
            actual.cuentas += 1;

            if (cuenta.estado === "VENCIDA") {
                actual.vencido += Number(
                    cuenta.saldo_pendiente,
                );
            }

            mapa.set(
                cuenta.cliente_id,
                actual,
            );
        }

        return Array.from(mapa.values()).sort(
            (a, b) => b.saldo - a.saldo,
        );
    }, [cuentasFiltradas]);

    const cuentasVencidas = useMemo(
        () =>
            cuentasFiltradas
                .filter(
                    (cuenta) =>
                        cuenta.estado === "VENCIDA" &&
                        Number(
                            cuenta.saldo_pendiente,
                        ) > 0,
                )
                .sort((a, b) => {
                    const fa =
                        a.fecha_vencimiento ?? "9999-12-31";
                    const fb =
                        b.fecha_vencimiento ?? "9999-12-31";

                    return fa.localeCompare(fb);
                }),
        [cuentasFiltradas],
    );

    const porcentajeRecuperado =
        resumen.original > 0
            ? (resumen.abonado /
                resumen.original) *
            100
            : 0;

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(valor).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function limpiarFiltros() {
        setBusqueda("");
        setSucursalId("");
        setEstado("");
        setFechaDesde("");
        setFechaHasta("");
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/cuentas-cobrar"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Cuentas por cobrar
                    </Link>

                    <div className="mt-5 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                            <BarChart3 className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Finanzas
                            </p>

                            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                Reporte de cuentas por cobrar
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Analiza saldos pendientes,
                                vencimientos y recuperación de
                                cartera por cliente y sucursal.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Resumen
                    titulo="Deuda original"
                    valor={dinero(resumen.original)}
                    icono={CircleDollarSign}
                />
                <Resumen
                    titulo="Recuperado"
                    valor={dinero(resumen.abonado)}
                    icono={TrendingUp}
                />
                <Resumen
                    titulo="Pendiente"
                    valor={dinero(resumen.pendiente)}
                    icono={WalletCards}
                />
                <Resumen
                    titulo="Vencido"
                    valor={dinero(resumen.vencido)}
                    icono={AlertTriangle}
                />
                <Resumen
                    titulo="% recuperado"
                    valor={`${porcentajeRecuperado.toLocaleString(
                        "es-NI",
                        {
                            maximumFractionDigits: 1,
                        },
                    )}%`}
                    icono={CheckCircle2}
                />
            </section>

            <section className="rounded-3xl border border-[#E3E7E4] bg-white p-5 shadow-sm sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="relative sm:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder="Cliente, cuenta o venta..."
                            className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm"
                        />
                    </div>

                    <div className="relative">
                        <Store className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                        <select
                            value={sucursalId}
                            onChange={(event) =>
                                setSucursalId(
                                    event.target.value,
                                )
                            }
                            className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm"
                        >
                            <option value="">
                                Todas las sucursales
                            </option>
                            {sucursales.map((sucursal) => (
                                <option
                                    key={sucursal.id}
                                    value={sucursal.id}
                                >
                                    {sucursal.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <select
                        value={estado}
                        onChange={(event) =>
                            setEstado(
                                event.target.value,
                            )
                        }
                        className="h-11 rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
                    >
                        <option value="">
                            Todos los estados
                        </option>
                        <option value="PENDIENTE">
                            Pendiente
                        </option>
                        <option value="PARCIAL">
                            Parcial
                        </option>
                        <option value="VENCIDA">
                            Vencida
                        </option>
                        <option value="PAGADA">
                            Pagada
                        </option>
                        <option value="ANULADA">
                            Anulada
                        </option>
                    </select>

                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#EEF2EF] px-4 text-sm font-bold text-[#52605A]"
                    >
                        <X className="h-4 w-4" />
                        Limpiar
                    </button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Fecha
                        titulo="Desde"
                        valor={fechaDesde}
                        cambiar={setFechaDesde}
                    />
                    <Fecha
                        titulo="Hasta"
                        valor={fechaHasta}
                        cambiar={setFechaHasta}
                    />
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
                <Seccion titulo="Clientes con mayor saldo">
                    {clientesAgrupados.length === 0 ? (
                        <Vacio texto="No hay clientes con saldo pendiente." />
                    ) : (
                        <div className="space-y-3">
                            {clientesAgrupados
                                .slice(0, 10)
                                .map((cliente, index) => (
                                    <Link
                                        key={cliente.clienteId}
                                        href={`/cuentas-cobrar/${cliente.clienteId}`}
                                        className="flex items-center justify-between rounded-2xl bg-[#FBFCFA] p-4 transition hover:bg-[#F3F5F2]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCE7E2] text-sm font-bold text-[#527064]">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#24302C]">
                                                    {cliente.nombre}
                                                </p>
                                                <p className="mt-1 text-xs text-[#829089]">
                                                    {cliente.cuentas} cuenta
                                                    {cliente.cuentas === 1
                                                        ? ""
                                                        : "s"}
                                                    {cliente.vencido > 0
                                                        ? ` · Vencido ${dinero(
                                                            cliente.vencido,
                                                        )}`
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>

                                        <strong className="text-[#A25E5E]">
                                            {dinero(cliente.saldo)}
                                        </strong>
                                    </Link>
                                ))}
                        </div>
                    )}
                </Seccion>

                <Seccion titulo="Indicadores">
                    <div className="space-y-4">
                        <Indicador
                            titulo="Cuentas analizadas"
                            valor={String(resumen.cantidad)}
                        />
                        <Indicador
                            titulo="Cuentas pagadas"
                            valor={String(resumen.pagadas)}
                        />
                        <Indicador
                            titulo="Cuentas vencidas"
                            valor={String(resumen.vencidas)}
                        />
                        <Indicador
                            titulo="Recuperación"
                            valor={`${porcentajeRecuperado.toLocaleString(
                                "es-NI",
                                {
                                    maximumFractionDigits: 1,
                                },
                            )}%`}
                        />
                    </div>

                    <div className="mt-5">
                        <div className="h-3 overflow-hidden rounded-full bg-[#EEF2EF]">
                            <div
                                className="h-full rounded-full bg-[#6F8F83]"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            porcentajeRecuperado,
                                        ),
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </Seccion>
            </div>

            <Seccion titulo="Cuentas vencidas">
                {cuentasVencidas.length === 0 ? (
                    <Vacio texto="No hay cuentas vencidas en el filtro seleccionado." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px]">
                            <thead className="bg-[#FBFCFA] text-left text-xs uppercase text-[#76817B]">
                                <tr>
                                    <Th>Cliente</Th>
                                    <Th>Cuenta</Th>
                                    <Th>Sucursal</Th>
                                    <Th>Vencimiento</Th>
                                    <Th>Deuda</Th>
                                    <Th>Abonado</Th>
                                    <Th>Saldo</Th>
                                    <Th>Acción</Th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#E8ECE9]">
                                {cuentasVencidas.map((cuenta) => (
                                    <tr
                                        key={cuenta.id}
                                        className="text-sm text-[#33413B]"
                                    >
                                        <Td>
                                            <p className="font-bold text-[#24302C]">
                                                {cuenta.clientes
                                                    ?.nombre_completo ??
                                                    "Cliente"}
                                            </p>
                                        </Td>
                                        <Td>{cuenta.codigo_cuenta}</Td>
                                        <Td>
                                            {cuenta.sucursales?.nombre ??
                                                "Sucursal"}
                                        </Td>
                                        <Td>
                                            {cuenta.fecha_vencimiento
                                                ? formatearFechaSimple(
                                                    cuenta.fecha_vencimiento,
                                                )
                                                : "Sin fecha"}
                                        </Td>
                                        <Td>
                                            {dinero(
                                                cuenta.monto_original,
                                            )}
                                        </Td>
                                        <Td>
                                            {dinero(
                                                cuenta.monto_abonado,
                                            )}
                                        </Td>
                                        <Td>
                                            <strong className="text-[#A25E5E]">
                                                {dinero(
                                                    cuenta.saldo_pendiente,
                                                )}
                                            </strong>
                                        </Td>
                                        <Td>
                                            <Link
                                                href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                                                className="inline-flex h-9 items-center rounded-xl bg-[#26332F] px-3 text-xs font-bold text-white"
                                            >
                                                Estado de cuenta
                                            </Link>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Seccion>
        </div>
    );
}

function Resumen({
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
        <article className="rounded-3xl border border-[#E3E7E4] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-[#6B756F]">
                        {titulo}
                    </p>
                    <p className="mt-3 text-xl font-bold text-[#24302C]">
                        {valor}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function Seccion({
    titulo,
    children,
}: {
    titulo: string;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-sm">
            <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                <h2 className="font-bold text-[#24302C]">
                    {titulo}
                </h2>
            </header>

            <div className="p-5 sm:p-6">
                {children}
            </div>
        </section>
    );
}

function Indicador({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="flex items-center justify-between rounded-2xl bg-[#FBFCFA] p-4">
            <span className="text-sm text-[#6B756F]">
                {titulo}
            </span>
            <strong className="text-[#24302C]">
                {valor}
            </strong>
        </div>
    );
}

function Fecha({
    titulo,
    valor,
    cambiar,
}: {
    titulo: string;
    valor: string;
    cambiar: (valor: string) => void;
}) {
    return (
        <label>
            <span className="mb-1 block text-[10px] font-bold uppercase text-[#829089]">
                {titulo}
            </span>
            <input
                type="date"
                value={valor}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="h-10 w-full rounded-xl border border-[#D4DAD6] px-3 text-sm"
            />
        </label>
    );
}

function Vacio({
    texto,
}: {
    texto: string;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-8 text-center text-sm text-[#6B756F]">
            {texto}
        </div>
    );
}

function Th({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="px-4 py-3 font-bold">
            {children}
        </th>
    );
}

function Td({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <td className="px-4 py-4 align-top">
            {children}
        </td>
    );
}

function formatearFechaSimple(
    fecha: string,
) {
    const [anio, mes, dia] =
        fecha.split("-");

    return `${dia}/${mes}/${anio}`;
}