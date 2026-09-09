"use client";

import Link from "next/link";
import {
    ArrowDownCircle,
    ArrowLeft,
    ArrowUpCircle,
    Banknote,
    CalendarDays,
    Eye,
    Filter,
    ListFilter,
    Search,
    Store,
    WalletCards,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SucursalMovimiento = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type MovimientoHistorial = {
    id: string;
    sucursal_id: string;
    caja_sesion_id: string;
    venta_id: string | null;
    pago_id: string | null;
    tipo: string;
    naturaleza: string;
    metodo_pago: string | null;
    concepto: string;
    monto: number;
    referencia: string | null;
    observaciones: string | null;
    fecha_movimiento: string;

    sucursales: {
        nombre: string;
    } | null;

    ventas: {
        codigo_venta: string | null;
        estado: string;
    } | null;
};

export default function HistorialMovimientosClient({
    movimientos,
    sucursales,
    simboloMoneda,
}: {
    movimientos: MovimientoHistorial[];
    sucursales: SucursalMovimiento[];
    simboloMoneda: string;
}) {
    const [busqueda, setBusqueda] = useState("");
    const [sucursalId, setSucursalId] = useState("");
    const [tipo, setTipo] = useState("");
    const [naturaleza, setNaturaleza] = useState("");
    const [metodo, setMetodo] = useState("");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    const movimientosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return movimientos.filter((movimiento) => {
            const fecha = movimiento.fecha_movimiento.slice(0, 10);

            const coincideTexto =
                !texto ||
                movimiento.concepto.toLowerCase().includes(texto) ||
                movimiento.referencia?.toLowerCase().includes(texto) ||
                movimiento.observaciones?.toLowerCase().includes(texto) ||
                movimiento.ventas?.codigo_venta
                    ?.toLowerCase()
                    .includes(texto);

            return (
                coincideTexto &&
                (!sucursalId ||
                    movimiento.sucursal_id === sucursalId) &&
                (!tipo || movimiento.tipo === tipo) &&
                (!naturaleza ||
                    movimiento.naturaleza === naturaleza) &&
                (!metodo ||
                    movimiento.metodo_pago === metodo) &&
                (!fechaDesde || fecha >= fechaDesde) &&
                (!fechaHasta || fecha <= fechaHasta)
            );
        });
    }, [
        busqueda,
        fechaDesde,
        fechaHasta,
        metodo,
        movimientos,
        naturaleza,
        sucursalId,
        tipo,
    ]);

    const resumen = useMemo(() => {
        return movimientosFiltrados.reduce(
            (acumulado, movimiento) => {
                const monto = Number(movimiento.monto || 0);

                return {
                    cantidad: acumulado.cantidad + 1,
                    entradas:
                        acumulado.entradas +
                        (movimiento.naturaleza === "ENTRADA"
                            ? monto
                            : 0),
                    salidas:
                        acumulado.salidas +
                        (movimiento.naturaleza === "SALIDA"
                            ? monto
                            : 0),
                };
            },
            {
                cantidad: 0,
                entradas: 0,
                salidas: 0,
            },
        );
    }, [movimientosFiltrados]);

    const balance = resumen.entradas - resumen.salidas;

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(valor).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function limpiar() {
        setBusqueda("");
        setSucursalId("");
        setTipo("");
        setNaturaleza("");
        setMetodo("");
        setFechaDesde("");
        setFechaHasta("");
    }

    const hayFiltros =
        Boolean(busqueda) ||
        Boolean(sucursalId) ||
        Boolean(tipo) ||
        Boolean(naturaleza) ||
        Boolean(metodo) ||
        Boolean(fechaDesde) ||
        Boolean(fechaHasta);

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/caja"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Caja
                    </Link>

                    <div className="mt-5 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                            <ListFilter className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Trazabilidad
                            </p>

                            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                Movimientos de caja
                            </h1>

                            <p className="mt-3 max-w-2xl text-[#CFD9D4]">
                                Consulta aperturas, ventas,
                                ingresos, egresos, devoluciones
                                y ajustes registrados en caja.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Resumen
                    titulo="Movimientos"
                    valor={String(resumen.cantidad)}
                    icono={ListFilter}
                />
                <Resumen
                    titulo="Entradas"
                    valor={dinero(resumen.entradas)}
                    icono={ArrowDownCircle}
                />
                <Resumen
                    titulo="Salidas"
                    valor={dinero(resumen.salidas)}
                    icono={ArrowUpCircle}
                />
                <Resumen
                    titulo="Balance"
                    valor={dinero(balance)}
                    icono={WalletCards}
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
                                Busca por concepto, referencia,
                                venta, sucursal o fecha.
                            </p>
                        </div>

                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={limpiar}
                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#EEF2EF] px-3 text-xs font-bold text-[#52605A]"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 sm:p-6">
                    <div className="relative sm:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(event.target.value)
                            }
                            placeholder="Concepto, referencia o venta..."
                            className="h-11 w-full rounded-xl border border-[#D4DAD6] pl-11 pr-4 text-sm"
                        />
                    </div>

                    <Select
                        valor={sucursalId}
                        cambiar={setSucursalId}
                        opciones={[
                            {
                                valor: "",
                                texto: "Todas las sucursales",
                            },
                            ...sucursales.map((sucursal) => ({
                                valor: sucursal.id,
                                texto: sucursal.nombre,
                            })),
                        ]}
                        icono={Store}
                    />

                    <Select
                        valor={tipo}
                        cambiar={setTipo}
                        opciones={[
                            { valor: "", texto: "Todos los tipos" },
                            { valor: "APERTURA", texto: "Apertura" },
                            { valor: "VENTA", texto: "Venta" },
                            { valor: "INGRESO", texto: "Ingreso" },
                            { valor: "EGRESO", texto: "Egreso" },
                            { valor: "RETIRO", texto: "Retiro" },
                            { valor: "AJUSTE", texto: "Ajuste" },
                            { valor: "DEVOLUCION", texto: "Devolución" },
                            { valor: "CIERRE", texto: "Cierre" },
                        ]}
                        icono={Filter}
                    />

                    <Select
                        valor={naturaleza}
                        cambiar={setNaturaleza}
                        opciones={[
                            { valor: "", texto: "Entrada / salida" },
                            { valor: "ENTRADA", texto: "Entrada" },
                            { valor: "SALIDA", texto: "Salida" },
                        ]}
                        icono={WalletCards}
                    />

                    <Select
                        valor={metodo}
                        cambiar={setMetodo}
                        opciones={[
                            { valor: "", texto: "Todos los métodos" },
                            { valor: "EFECTIVO", texto: "Efectivo" },
                            { valor: "TARJETA", texto: "Tarjeta" },
                            { valor: "TRANSFERENCIA", texto: "Transferencia" },
                            { valor: "DEPOSITO", texto: "Depósito" },
                            { valor: "OTRO", texto: "Otro" },
                        ]}
                        icono={Banknote}
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
                        Historial
                    </h2>
                    <p className="mt-1 text-sm text-[#6B756F]">
                        {movimientosFiltrados.length} resultado
                        {movimientosFiltrados.length === 1 ? "" : "s"}
                    </p>
                </header>

                {movimientosFiltrados.length === 0 ? (
                    <div className="p-12 text-center text-sm text-[#6B756F]">
                        No hay movimientos para mostrar.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1150px]">
                            <thead className="bg-[#FBFCFA] text-left text-xs uppercase text-[#76817B]">
                                <tr>
                                    <Th>Fecha</Th>
                                    <Th>Sucursal</Th>
                                    <Th>Tipo</Th>
                                    <Th>Concepto</Th>
                                    <Th>Método</Th>
                                    <Th>Venta</Th>
                                    <Th>Naturaleza</Th>
                                    <Th>Monto</Th>
                                    <Th>Acción</Th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#E8ECE9]">
                                {movimientosFiltrados.map((movimiento) => (
                                    <tr
                                        key={movimiento.id}
                                        className="text-sm text-[#33413B] hover:bg-[#FBFCFA]"
                                    >
                                        <Td>
                                            {formatearFechaHora(
                                                movimiento.fecha_movimiento,
                                            )}
                                        </Td>

                                        <Td>
                                            {movimiento.sucursales?.nombre ??
                                                "Sucursal"}
                                        </Td>

                                        <Td>
                                            <EtiquetaTipo
                                                tipo={movimiento.tipo}
                                            />
                                        </Td>

                                        <Td>
                                            <p className="font-semibold">
                                                {movimiento.concepto}
                                            </p>
                                            {movimiento.referencia && (
                                                <p className="mt-1 text-xs text-[#829089]">
                                                    Ref. {movimiento.referencia}
                                                </p>
                                            )}
                                        </Td>

                                        <Td>
                                            {movimiento.metodo_pago
                                                ? formatearTexto(
                                                    movimiento.metodo_pago,
                                                )
                                                : "—"}
                                        </Td>

                                        <Td>
                                            {movimiento.venta_id ? (
                                                <Link
                                                    href={`/caja/ventas/${movimiento.venta_id}`}
                                                    className="font-bold text-[#527064] hover:underline"
                                                >
                                                    {movimiento.ventas
                                                        ?.codigo_venta ??
                                                        "Ver venta"}
                                                </Link>
                                            ) : (
                                                "—"
                                            )}
                                        </Td>

                                        <Td>
                                            <Naturaleza
                                                valor={
                                                    movimiento.naturaleza
                                                }
                                            />
                                        </Td>

                                        <Td>
                                            <strong
                                                className={
                                                    movimiento.naturaleza ===
                                                        "SALIDA"
                                                        ? "text-[#A25E5E]"
                                                        : "text-[#3F6657]"
                                                }
                                            >
                                                {movimiento.naturaleza ===
                                                    "SALIDA"
                                                    ? "- "
                                                    : "+ "}
                                                {dinero(movimiento.monto)}
                                            </strong>
                                        </Td>

                                        <Td>
                                            <Link
                                                href={`/caja/historial-movimientos/${movimiento.id}`}
                                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#26332F] px-3 text-xs font-bold text-white"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Detalle
                                            </Link>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
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
    opciones: { valor: string; texto: string }[];
    icono: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div className="relative">
            <Icono className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
            <select
                value={valor}
                onChange={(event) => cambiar(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm"
            >
                {opciones.map((opcion) => (
                    <option
                        key={opcion.valor || opcion.texto}
                        value={opcion.valor}
                    >
                        {opcion.texto}
                    </option>
                ))}
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
                onChange={(event) => cambiar(event.target.value)}
                className="h-9 w-full rounded-lg border border-[#D4DAD6] px-2 text-xs"
            />
        </label>
    );
}

function EtiquetaTipo({ tipo }: { tipo: string }) {
    return (
        <span className="inline-flex rounded-full bg-[#EEF2EF] px-2.5 py-1 text-[10px] font-bold uppercase text-[#52605A]">
            {formatearTexto(tipo)}
        </span>
    );
}

function Naturaleza({ valor }: { valor: string }) {
    return (
        <span
            className={[
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                valor === "ENTRADA"
                    ? "bg-[#E3EEE8] text-[#527865]"
                    : "bg-[#F8E5E5] text-[#A25E5E]",
            ].join(" ")}
        >
            {formatearTexto(valor)}
        </span>
    );
}

function Resumen({
    titulo,
    valor,
    icono: Icono,
}: {
    titulo: string;
    valor: string;
    icono: React.ComponentType<{ className?: string }>;
}) {
    return (
        <article className="rounded-3xl border border-[#E3E7E4] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-[#6B756F]">{titulo}</p>
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

function Th({ children }: { children: React.ReactNode }) {
    return <th className="px-4 py-3 font-bold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
    return <td className="px-4 py-4 align-top">{children}</td>;
}

function formatearFechaHora(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Managua",
    }).format(new Date(fecha));
}

function formatearTexto(valor: string) {
    return valor
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^\w/, (letra) => letra.toUpperCase());
}