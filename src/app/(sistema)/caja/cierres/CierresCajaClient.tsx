"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    CheckCircle2,
    Clock3,
    Eye,
    History,
    Search,
    Store,
    WalletCards,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SucursalCierre = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type CierreCajaHistorial = {
    id: string;
    sucursal_id: string;
    fecha_apertura: string;
    fecha_cierre: string | null;
    monto_inicial: number;
    total_ventas_efectivo: number;
    total_ventas_otros: number;
    total_ingresos_manuales: number;
    total_egresos: number;
    monto_esperado: number;
    monto_contado: number;
    diferencia: number;
    estado: string;
    observaciones_apertura: string | null;
    observaciones_cierre: string | null;
    sucursales: {
        nombre: string;
    } | null;
};

export default function CierresCajaClient({
    cierres,
    sucursales,
    simboloMoneda,
}: {
    cierres: CierreCajaHistorial[];
    sucursales: SucursalCierre[];
    simboloMoneda: string;
}) {
    const [busqueda, setBusqueda] =
        useState("");
    const [sucursalId, setSucursalId] =
        useState("");
    const [fechaDesde, setFechaDesde] =
        useState("");
    const [fechaHasta, setFechaHasta] =
        useState("");

    const cierresFiltrados = useMemo(() => {
        const texto =
            busqueda.trim().toLowerCase();

        return cierres.filter((cierre) => {
            const fecha =
                cierre.fecha_cierre?.slice(
                    0,
                    10,
                ) ?? "";

            const coincideTexto =
                !texto ||
                cierre.sucursales?.nombre
                    .toLowerCase()
                    .includes(texto) ||
                cierre.observaciones_cierre
                    ?.toLowerCase()
                    .includes(texto);

            const coincideSucursal =
                !sucursalId ||
                cierre.sucursal_id ===
                sucursalId;

            const coincideDesde =
                !fechaDesde ||
                fecha >= fechaDesde;

            const coincideHasta =
                !fechaHasta ||
                fecha <= fechaHasta;

            return (
                coincideTexto &&
                coincideSucursal &&
                coincideDesde &&
                coincideHasta
            );
        });
    }, [
        busqueda,
        cierres,
        fechaDesde,
        fechaHasta,
        sucursalId,
    ]);

    const resumen = useMemo(() => {
        return cierresFiltrados.reduce(
            (acumulado, cierre) => {
                const diferencia =
                    Number(
                        cierre.diferencia || 0,
                    );

                return {
                    cantidad:
                        acumulado.cantidad + 1,
                    esperado:
                        acumulado.esperado +
                        Number(
                            cierre.monto_esperado ||
                            0,
                        ),
                    contado:
                        acumulado.contado +
                        Number(
                            cierre.monto_contado ||
                            0,
                        ),
                    faltantes:
                        acumulado.faltantes +
                        (diferencia < 0
                            ? Math.abs(
                                diferencia,
                            )
                            : 0),
                    sobrantes:
                        acumulado.sobrantes +
                        (diferencia > 0
                            ? diferencia
                            : 0),
                };
            },
            {
                cantidad: 0,
                esperado: 0,
                contado: 0,
                faltantes: 0,
                sobrantes: 0,
            },
        );
    }, [cierresFiltrados]);

    const hayFiltros =
        Boolean(busqueda) ||
        Boolean(sucursalId) ||
        Boolean(fechaDesde) ||
        Boolean(fechaHasta);

    function limpiarFiltros() {
        setBusqueda("");
        setSucursalId("");
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
                    <Link
                        href="/caja"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Caja
                    </Link>

                    <div className="mt-5 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                            <History className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Control histórico
                            </p>

                            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                Historial de cierres
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Consulta arqueos anteriores,
                                diferencias y resultados de cada
                                sesión de caja.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Resumen
                    titulo="Cierres"
                    valor={String(
                        resumen.cantidad,
                    )}
                    icono={History}
                />

                <Resumen
                    titulo="Esperado"
                    valor={dinero(
                        resumen.esperado,
                    )}
                    icono={WalletCards}
                />

                <Resumen
                    titulo="Contado"
                    valor={dinero(
                        resumen.contado,
                    )}
                    icono={Banknote}
                />

                <Resumen
                    titulo="Faltantes"
                    valor={dinero(
                        resumen.faltantes,
                    )}
                    icono={AlertTriangle}
                />

                <Resumen
                    titulo="Sobrantes"
                    valor={dinero(
                        resumen.sobrantes,
                    )}
                    icono={CheckCircle2}
                />
            </section>

            <section className="rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-[#24302C]">
                                Filtros
                            </h2>
                            <p className="mt-1 text-sm text-[#6B756F]">
                                Busca por sucursal,
                                observación o fecha.
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

                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder="Sucursal u observación..."
                            className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#6F8F83]"
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

                            {sucursales.map(
                                (sucursal) => (
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
                        </select>
                    </div>

                    <CampoFecha
                        titulo="Desde"
                        valor={fechaDesde}
                        cambiar={setFechaDesde}
                    />

                    <CampoFecha
                        titulo="Hasta"
                        valor={fechaHasta}
                        cambiar={setFechaHasta}
                    />
                </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                    <h2 className="font-bold text-[#24302C]">
                        Cierres registrados
                    </h2>
                    <p className="mt-1 text-sm text-[#6B756F]">
                        {cierresFiltrados.length} resultado
                        {cierresFiltrados.length ===
                            1
                            ? ""
                            : "s"}
                    </p>
                </header>

                {cierresFiltrados.length ===
                    0 ? (
                    <EstadoVacio />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full min-w-[1100px]">
                                <thead className="bg-[#FBFCFA] text-left text-xs uppercase text-[#76817B]">
                                    <tr>
                                        <Th>
                                            Sucursal
                                        </Th>
                                        <Th>
                                            Apertura
                                        </Th>
                                        <Th>
                                            Cierre
                                        </Th>
                                        <Th>
                                            Inicial
                                        </Th>
                                        <Th>
                                            Esperado
                                        </Th>
                                        <Th>
                                            Contado
                                        </Th>
                                        <Th>
                                            Diferencia
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
                                    {cierresFiltrados.map(
                                        (cierre) => (
                                            <tr
                                                key={
                                                    cierre.id
                                                }
                                                className="text-sm text-[#33413B] hover:bg-[#FBFCFA]"
                                            >
                                                <Td>
                                                    <strong>
                                                        {cierre
                                                            .sucursales
                                                            ?.nombre ??
                                                            "Sucursal"}
                                                    </strong>
                                                </Td>

                                                <Td>
                                                    {formatearFechaHora(
                                                        cierre.fecha_apertura,
                                                    )}
                                                </Td>

                                                <Td>
                                                    {cierre.fecha_cierre
                                                        ? formatearFechaHora(
                                                            cierre.fecha_cierre,
                                                        )
                                                        : "Sin cierre"}
                                                </Td>

                                                <Td>
                                                    {dinero(
                                                        cierre.monto_inicial,
                                                    )}
                                                </Td>

                                                <Td>
                                                    {dinero(
                                                        cierre.monto_esperado,
                                                    )}
                                                </Td>

                                                <Td>
                                                    {dinero(
                                                        cierre.monto_contado,
                                                    )}
                                                </Td>

                                                <Td>
                                                    <Diferencia
                                                        valor={
                                                            cierre.diferencia
                                                        }
                                                        dinero={
                                                            dinero
                                                        }
                                                    />
                                                </Td>

                                                <Td>
                                                    <EstadoArqueo
                                                        diferencia={
                                                            cierre.diferencia
                                                        }
                                                    />
                                                </Td>

                                                <Td>
                                                    <Link
                                                        href={`/caja/cierres/${cierre.id}`}
                                                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#26332F] px-3 text-xs font-bold text-white"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Detalle
                                                    </Link>
                                                </Td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3 p-4 lg:hidden">
                            {cierresFiltrados.map(
                                (cierre) => (
                                    <TarjetaCierre
                                        key={cierre.id}
                                        cierre={cierre}
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

function TarjetaCierre({
    cierre,
    dinero,
}: {
    cierre: CierreCajaHistorial;
    dinero: (valor: number) => string;
}) {
    return (
        <article className="rounded-2xl border border-[#E3E7E4] p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-bold text-[#24302C]">
                        {cierre.sucursales?.nombre ??
                            "Sucursal"}
                    </p>
                    <p className="mt-1 text-xs text-[#76817B]">
                        {cierre.fecha_cierre
                            ? formatearFechaHora(
                                cierre.fecha_cierre,
                            )
                            : "Sin fecha"}
                    </p>
                </div>

                <EstadoArqueo
                    diferencia={cierre.diferencia}
                />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniDato
                    titulo="Esperado"
                    valor={dinero(
                        cierre.monto_esperado,
                    )}
                />
                <MiniDato
                    titulo="Contado"
                    valor={dinero(
                        cierre.monto_contado,
                    )}
                />
                <MiniDato
                    titulo="Diferencia"
                    valor={dinero(
                        cierre.diferencia,
                    )}
                />
            </div>

            <Link
                href={`/caja/cierres/${cierre.id}`}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#26332F] text-sm font-bold text-white"
            >
                <Eye className="h-4 w-4" />
                Ver detalle
            </Link>
        </article>
    );
}

function EstadoArqueo({
    diferencia,
}: {
    diferencia: number;
}) {
    const valor = Number(
        diferencia || 0,
    );

    if (Math.abs(valor) < 0.005) {
        return (
            <span className="inline-flex rounded-full bg-[#E3EEE8] px-2.5 py-1 text-[10px] font-bold uppercase text-[#527865]">
                Cuadrada
            </span>
        );
    }

    if (valor < 0) {
        return (
            <span className="inline-flex rounded-full bg-[#F8E5E5] px-2.5 py-1 text-[10px] font-bold uppercase text-[#A25E5E]">
                Faltante
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-[#FAF0DC] px-2.5 py-1 text-[10px] font-bold uppercase text-[#9A742D]">
            Sobrante
        </span>
    );
}

function Diferencia({
    valor,
    dinero,
}: {
    valor: number;
    dinero: (valor: number) => string;
}) {
    const numero = Number(valor || 0);

    return (
        <strong
            className={
                Math.abs(numero) < 0.005
                    ? "text-[#527865]"
                    : numero < 0
                        ? "text-[#A25E5E]"
                        : "text-[#9A742D]"
            }
        >
            {numero > 0 ? "+" : ""}
            {dinero(numero)}
        </strong>
    );
}

function CampoFecha({
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
                className="h-11 w-full rounded-xl border border-[#D4DAD6] px-3 text-sm"
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
        <article className="rounded-3xl border border-[#E3E7E4] bg-white p-5 shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
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
            <Clock3 className="mx-auto h-9 w-9 text-[#829089]" />
            <h3 className="mt-4 font-bold text-[#24302C]">
                No hay cierres para mostrar
            </h3>
            <p className="mt-2 text-sm text-[#6B756F]">
                Ajusta los filtros o realiza
                un cierre de caja.
            </p>
        </div>
    );
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
    ).format(new Date(fecha));
}