"use client";

import Link from "next/link";
import {
    AlertTriangle,
    BarChart3,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    Eye,
    Filter,
    History,
    ReceiptText,
    Search,
    Store,
    UserRound,
    WalletCards,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SucursalCuenta = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type CuentaCobrarListado = {
    id: string;
    codigo_cuenta: string;
    sucursal_id: string;
    cliente_id: string;
    venta_id: string | null;
    cita_id: string | null;
    monto_original: number;
    monto_abonado: number;
    saldo_pendiente: number;
    fecha_origen: string;
    fecha_vencimiento: string | null;
    estado: string;
    observaciones: string | null;

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
        tipo_venta: string;
        total: number;
        estado: string;
        estado_pago: string;
        fecha_venta: string;
    } | null;
};

export default function CuentasCobrarClient({
    cuentas,
    sucursales,
    simboloMoneda,
}: {
    cuentas: CuentaCobrarListado[];
    sucursales: SucursalCuenta[];
    simboloMoneda: string;
}) {
    const [busqueda, setBusqueda] =
        useState("");
    const [sucursalId, setSucursalId] =
        useState("");
    const [estado, setEstado] =
        useState("");
    const [fechaDesde, setFechaDesde] =
        useState("");
    const [fechaHasta, setFechaHasta] =
        useState("");

    const cuentasFiltradas = useMemo(() => {
        const texto =
            busqueda.trim().toLowerCase();

        return cuentas.filter((cuenta) => {
            const fecha =
                cuenta.fecha_origen.slice(0, 10);

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
                cuenta.clientes?.telefono
                    ?.toLowerCase()
                    .includes(texto) ||
                cuenta.clientes?.whatsapp
                    ?.toLowerCase()
                    .includes(texto) ||
                cuenta.ventas?.codigo_venta
                    ?.toLowerCase()
                    .includes(texto);

            return (
                coincideTexto &&
                (!sucursalId ||
                    cuenta.sucursal_id ===
                    sucursalId) &&
                (!estado ||
                    estadoCuentaActual(
                        cuenta,
                    ) === estado) &&
                (!fechaDesde ||
                    fecha >= fechaDesde) &&
                (!fechaHasta ||
                    fecha <= fechaHasta)
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
            (acumulado, cuenta) => {
                const estadoActual =
                    estadoCuentaActual(cuenta);

                return {
                    totalCuentas:
                        acumulado.totalCuentas +
                        (estadoActual !== "ANULADA"
                            ? 1
                            : 0),
                    deudaOriginal:
                        acumulado.deudaOriginal +
                        (estadoActual !== "ANULADA"
                            ? Number(
                                cuenta.monto_original,
                            )
                            : 0),
                    abonado:
                        acumulado.abonado +
                        (estadoActual !== "ANULADA"
                            ? Number(
                                cuenta.monto_abonado,
                            )
                            : 0),
                    pendiente:
                        acumulado.pendiente +
                        (estadoActual !== "ANULADA"
                            ? Number(
                                cuenta.saldo_pendiente,
                            )
                            : 0),
                    vencido:
                        acumulado.vencido +
                        (estadoActual === "VENCIDA"
                            ? Number(
                                cuenta.saldo_pendiente,
                            )
                            : 0),
                };
            },
            {
                totalCuentas: 0,
                deudaOriginal: 0,
                abonado: 0,
                pendiente: 0,
                vencido: 0,
            },
        );
    }, [cuentasFiltradas]);

    const hayFiltros =
        Boolean(busqueda) ||
        Boolean(sucursalId) ||
        Boolean(estado) ||
        Boolean(fechaDesde) ||
        Boolean(fechaHasta);

    function limpiarFiltros() {
        setBusqueda("");
        setSucursalId("");
        setEstado("");
        setFechaDesde("");
        setFechaHasta("");
    }

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <Link
                            href="/inicio"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a Inicio
                        </Link>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/cuentas-cobrar/abonos"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
                            >
                                <History className="h-4 w-4" />
                                Historial de abonos
                            </Link>

                            <Link
                                href="/cuentas-cobrar/reportes"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
                            >
                                <BarChart3 className="h-4 w-4" />
                                Reportes
                            </Link>
                        </div>
                    </div>

                    <div className="mt-5 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                            <WalletCards className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Finanzas
                            </p>

                            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                Cuentas por cobrar
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Consulta clientes con saldo
                                pendiente, deudas parciales,
                                vencimientos y pagos realizados.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Resumen
                    titulo="Cuentas activas"
                    valor={String(
                        resumen.totalCuentas,
                    )}
                    icono={ReceiptText}
                />

                <Resumen
                    titulo="Deuda original"
                    valor={dinero(
                        resumen.deudaOriginal,
                    )}
                    icono={CircleDollarSign}
                />

                <Resumen
                    titulo="Abonado"
                    valor={dinero(
                        resumen.abonado,
                    )}
                    icono={CheckCircle2}
                />

                <Resumen
                    titulo="Saldo pendiente"
                    valor={dinero(
                        resumen.pendiente,
                    )}
                    icono={WalletCards}
                />

                <Resumen
                    titulo="Vencido"
                    valor={dinero(
                        resumen.vencido,
                    )}
                    icono={AlertTriangle}
                />
            </section>

            <section className="rounded-3xl border border-[#E3E7E4] bg-white shadow-sm">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-[#24302C]">
                                Filtros
                            </h2>
                            <p className="mt-1 text-sm text-[#6B756F]">
                                Busca por cliente,
                                teléfono, cuenta o venta.
                            </p>
                        </div>

                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#EEF2EF] px-3 text-xs font-bold text-[#52605A]"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5 sm:p-6">
                    <div className="relative sm:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder="Cliente, teléfono, cuenta o venta..."
                            className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83]"
                        />
                    </div>

                    <Select
                        valor={sucursalId}
                        cambiar={setSucursalId}
                        opciones={[
                            {
                                valor: "",
                                texto:
                                    "Todas las sucursales",
                            },
                            ...sucursales.map(
                                (sucursal) => ({
                                    valor: sucursal.id,
                                    texto:
                                        sucursal.nombre,
                                }),
                            ),
                        ]}
                        icono={Store}
                    />

                    <Select
                        valor={estado}
                        cambiar={setEstado}
                        opciones={[
                            {
                                valor: "",
                                texto:
                                    "Todos los estados",
                            },
                            {
                                valor: "PENDIENTE",
                                texto:
                                    "Pendiente",
                            },
                            {
                                valor: "PARCIAL",
                                texto:
                                    "Parcial",
                            },
                            {
                                valor: "VENCIDA",
                                texto:
                                    "Vencida",
                            },
                            {
                                valor: "PAGADA",
                                texto:
                                    "Pagada",
                            },
                            {
                                valor: "ANULADA",
                                texto:
                                    "Anulada",
                            },
                        ]}
                        icono={Filter}
                    />

                    <div className="grid grid-cols-2 gap-2">
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
                </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-sm">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <h2 className="font-bold text-[#24302C]">
                        Saldos registrados
                    </h2>

                    <p className="mt-1 text-sm text-[#6B756F]">
                        {cuentasFiltradas.length} resultado
                        {cuentasFiltradas.length ===
                            1
                            ? ""
                            : "s"}
                    </p>
                </header>

                {cuentasFiltradas.length ===
                    0 ? (
                    <EstadoVacio />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full min-w-[1200px]">
                                <thead className="bg-[#FBFCFA] text-left text-xs uppercase text-[#76817B]">
                                    <tr>
                                        <Th>
                                            Cliente
                                        </Th>
                                        <Th>
                                            Cuenta
                                        </Th>
                                        <Th>
                                            Origen
                                        </Th>
                                        <Th>
                                            Sucursal
                                        </Th>
                                        <Th>
                                            Deuda
                                        </Th>
                                        <Th>
                                            Abonado
                                        </Th>
                                        <Th>
                                            Saldo
                                        </Th>
                                        <Th>
                                            Vencimiento
                                        </Th>
                                        <Th>
                                            Estado
                                        </Th>
                                        <Th>
                                            Acción
                                        </Th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#E8ECE9]">
                                    {cuentasFiltradas.map(
                                        (cuenta) => (
                                            <FilaCuenta
                                                key={
                                                    cuenta.id
                                                }
                                                cuenta={
                                                    cuenta
                                                }
                                                dinero={
                                                    dinero
                                                }
                                            />
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3 p-4 lg:hidden">
                            {cuentasFiltradas.map(
                                (cuenta) => (
                                    <TarjetaCuenta
                                        key={cuenta.id}
                                        cuenta={cuenta}
                                        dinero={dinero}
                                    />
                                ),
                            )}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

function FilaCuenta({
    cuenta,
    dinero,
}: {
    cuenta: CuentaCobrarListado;
    dinero: (valor: number) => string;
}) {
    const estadoActual =
        estadoCuentaActual(cuenta);

    return (
        <tr className="text-sm text-[#33413B] hover:bg-[#FBFCFA]">
            <Td>
                <p className="font-bold text-[#24302C]">
                    {cuenta.clientes
                        ?.nombre_completo ??
                        "Cliente"}
                </p>

                <p className="mt-1 text-xs text-[#829089]">
                    {cuenta.clientes
                        ?.codigo_cliente ??
                        cuenta.clientes
                            ?.telefono ??
                        ""}
                </p>
            </Td>

            <Td>
                <p className="font-semibold">
                    {cuenta.codigo_cuenta}
                </p>

                <p className="mt-1 text-xs text-[#829089]">
                    {formatearFecha(
                        cuenta.fecha_origen,
                    )}
                </p>
            </Td>

            <Td>
                {cuenta.venta_id ? (
                    <Link
                        href={`/caja/ventas/${cuenta.venta_id}`}
                        className="font-bold text-[#527064] hover:underline"
                    >
                        {cuenta.ventas
                            ?.codigo_venta ??
                            "Venta"}
                    </Link>
                ) : (
                    "Manual"
                )}
            </Td>

            <Td>
                {cuenta.sucursales?.nombre ??
                    "Sucursal"}
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
                <strong
                    className={
                        Number(
                            cuenta.saldo_pendiente,
                        ) > 0
                            ? "text-[#A25E5E]"
                            : "text-[#527865]"
                    }
                >
                    {dinero(
                        cuenta.saldo_pendiente,
                    )}
                </strong>
            </Td>

            <Td>
                {cuenta.fecha_vencimiento
                    ? formatearFechaSimple(
                        cuenta.fecha_vencimiento,
                    )
                    : "Sin fecha"}
            </Td>

            <Td>
                <EstadoCuenta
                    estado={estadoActual}
                />
            </Td>

            <Td>
                <Link
                    href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#26332F] px-3 text-xs font-bold text-white"
                >
                    <Eye className="h-4 w-4" />
                    Estado de cuenta
                </Link>
            </Td>
        </tr>
    );
}

function TarjetaCuenta({
    cuenta,
    dinero,
}: {
    cuenta: CuentaCobrarListado;
    dinero: (valor: number) => string;
}) {
    const estadoActual =
        estadoCuentaActual(cuenta);

    return (
        <article className="rounded-2xl border border-[#E3E7E4] p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-bold text-[#24302C]">
                        {cuenta.clientes
                            ?.nombre_completo ??
                            "Cliente"}
                    </p>
                    <p className="mt-1 text-xs text-[#76817B]">
                        {cuenta.codigo_cuenta}
                    </p>
                </div>

                <EstadoCuenta
                    estado={estadoActual}
                />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniDato
                    titulo="Deuda"
                    valor={dinero(
                        cuenta.monto_original,
                    )}
                />
                <MiniDato
                    titulo="Abonado"
                    valor={dinero(
                        cuenta.monto_abonado,
                    )}
                />
                <MiniDato
                    titulo="Saldo"
                    valor={dinero(
                        cuenta.saldo_pendiente,
                    )}
                />
            </div>

            <Link
                href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#26332F] text-sm font-bold text-white"
            >
                <Eye className="h-4 w-4" />
                Estado de cuenta
            </Link>
        </article>
    );
}

function estadoCuentaActual(
    cuenta: CuentaCobrarListado,
) {
    if (
        cuenta.estado === "ANULADA" ||
        cuenta.estado === "PAGADA"
    ) {
        return cuenta.estado;
    }

    if (
        cuenta.fecha_vencimiento &&
        cuenta.fecha_vencimiento <
        new Date()
            .toISOString()
            .slice(0, 10) &&
        Number(
            cuenta.saldo_pendiente,
        ) > 0
    ) {
        return "VENCIDA";
    }

    return cuenta.estado;
}

function EstadoCuenta({
    estado,
}: {
    estado: string;
}) {
    const estilos: Record<
        string,
        string
    > = {
        PENDIENTE:
            "bg-[#F8E5E5] text-[#A25E5E]",
        PARCIAL:
            "bg-[#FAF0DC] text-[#9A742D]",
        PAGADA:
            "bg-[#E3EEE8] text-[#527865]",
        VENCIDA:
            "bg-[#F0DEDE] text-[#934A4A]",
        ANULADA:
            "bg-[#EFE7E1] text-[#8B6754]",
    };

    return (
        <span
            className={[
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                estilos[estado] ??
                "bg-[#EEF2EF] text-[#6B756F]",
            ].join(" ")}
        >
            {formatearTexto(estado)}
        </span>
    );
}

function Select({
    valor,
    cambiar,
    opciones,
    icono: Icono,
}: {
    valor: string;
    cambiar: (valor: string) => void;
    opciones: {
        valor: string;
        texto: string;
    }[];
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="relative">
            <Icono className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

            <select
                value={valor}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm"
            >
                {opciones.map(
                    (opcion) => (
                        <option
                            key={
                                opcion.valor ||
                                opcion.texto
                            }
                            value={
                                opcion.valor
                            }
                        >
                            {opcion.texto}
                        </option>
                    ),
                )}
            </select>
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
                className="h-9 w-full rounded-lg border border-[#D4DAD6] px-2 text-xs"
            />
        </label>
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

function MiniDato({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl bg-[#FBFCFA] p-3">
            <p className="text-[10px] font-bold uppercase text-[#829089]">
                {titulo}
            </p>

            <p className="mt-1 text-xs font-bold text-[#33413B]">
                {valor}
            </p>
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

function EstadoVacio() {
    return (
        <div className="p-12 text-center">
            <WalletCards className="mx-auto h-9 w-9 text-[#829089]" />

            <h3 className="mt-4 font-bold text-[#24302C]">
                No hay cuentas por cobrar
            </h3>

            <p className="mt-2 text-sm text-[#6B756F]">
                Las ventas con saldo pendiente
                aparecerán aquí automáticamente.
            </p>
        </div>
    );
}

function formatearFecha(
    fecha: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone:
                "America/Managua",
        },
    ).format(new Date(fecha));
}

function formatearFechaSimple(
    fecha: string,
) {
    const [anio, mes, dia] =
        fecha.split("-");

    return `${dia}/${mes}/${anio}`;
}

function formatearTexto(
    valor: string,
) {
    return valor
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letra) =>
            letra.toUpperCase(),
        );
}