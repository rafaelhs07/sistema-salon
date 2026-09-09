"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    CalendarDays,
    CreditCard,
    Eye,
    Filter,
    History,
    Landmark,
    ReceiptText,
    Search,
    Store,
    UserRound,
    WalletCards,
    X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SucursalAbono = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type AbonoHistorial = {
    id: string;
    sucursal_id: string;
    cuenta_id: string;
    caja_sesion_id: string | null;
    monto: number;
    estado: string;
    referencia: string | null;
    observaciones: string | null;
    fecha_abono: string;

    sucursales: {
        nombre: string;
    } | null;

    cuentas_cobrar: {
        id: string;
        codigo_cuenta: string;
        cliente_id: string;
        venta_id: string | null;
        monto_original: number;
        monto_abonado: number;
        saldo_pendiente: number;
        estado: string;

        clientes: {
            id: string;
            codigo_cliente: string | null;
            nombre_completo: string;
            telefono: string | null;
            whatsapp: string | null;
        } | null;

        ventas: {
            id: string;
            codigo_venta: string | null;
            total: number;
            estado: string;
            estado_pago: string;
        } | null;
    } | null;

    cuentas_cobrar_abono_pagos: {
        id: string;
        metodo_pago: string;
        monto: number;
        monto_recibido: number | null;
        cambio: number;
        terminal_pos_id: string | null;
        porcentaje_comision_pos: number;
        monto_comision_pos: number;
        monto_neto: number | null;
        referencia: string | null;
        banco: string | null;
        observaciones: string | null;
        estado: string;
        fecha_pago: string;

        terminales_pos: {
            nombre: string;
            banco: string | null;
        } | null;
    }[];
};

export default function AbonosClient({
    abonos,
    sucursales,
    simboloMoneda,
}: {
    abonos: AbonoHistorial[];
    sucursales: SucursalAbono[];
    simboloMoneda: string;
}) {
    const [busqueda, setBusqueda] =
        useState("");
    const [sucursalId, setSucursalId] =
        useState("");
    const [metodoPago, setMetodoPago] =
        useState("");
    const [estado, setEstado] =
        useState("APLICADO");
    const [fechaDesde, setFechaDesde] =
        useState("");
    const [fechaHasta, setFechaHasta] =
        useState("");

    const abonosFiltrados = useMemo(() => {
        const texto =
            busqueda.trim().toLowerCase();

        return abonos.filter((abono) => {
            const fecha =
                abono.fecha_abono.slice(0, 10);

            const cliente =
                abono.cuentas_cobrar
                    ?.clientes;

            const cuenta =
                abono.cuentas_cobrar;

            const coincideTexto =
                !texto ||
                cliente?.nombre_completo
                    .toLowerCase()
                    .includes(texto) ||
                cliente?.codigo_cliente
                    ?.toLowerCase()
                    .includes(texto) ||
                cliente?.telefono
                    ?.toLowerCase()
                    .includes(texto) ||
                cliente?.whatsapp
                    ?.toLowerCase()
                    .includes(texto) ||
                cuenta?.codigo_cuenta
                    .toLowerCase()
                    .includes(texto) ||
                cuenta?.ventas
                    ?.codigo_venta
                    ?.toLowerCase()
                    .includes(texto) ||
                abono.referencia
                    ?.toLowerCase()
                    .includes(texto);

            const coincideMetodo =
                !metodoPago ||
                abono.cuentas_cobrar_abono_pagos.some(
                    (pago) =>
                        pago.estado ===
                        "APLICADO" &&
                        pago.metodo_pago ===
                        metodoPago,
                );

            return (
                coincideTexto &&
                coincideMetodo &&
                (!sucursalId ||
                    abono.sucursal_id ===
                    sucursalId) &&
                (!estado ||
                    abono.estado ===
                    estado) &&
                (!fechaDesde ||
                    fecha >= fechaDesde) &&
                (!fechaHasta ||
                    fecha <= fechaHasta)
            );
        });
    }, [
        abonos,
        busqueda,
        estado,
        fechaDesde,
        fechaHasta,
        metodoPago,
        sucursalId,
    ]);

    const resumen = useMemo(() => {
        return abonosFiltrados.reduce(
            (acumulado, abono) => {
                if (
                    abono.estado !==
                    "APLICADO"
                ) {
                    return acumulado;
                }

                const pagosAplicados =
                    abono.cuentas_cobrar_abono_pagos.filter(
                        (pago) =>
                            pago.estado ===
                            "APLICADO",
                    );

                const efectivo =
                    pagosAplicados
                        .filter(
                            (pago) =>
                                pago.metodo_pago ===
                                "EFECTIVO",
                        )
                        .reduce(
                            (total, pago) =>
                                total +
                                Number(
                                    pago.monto,
                                ),
                            0,
                        );

                const tarjeta =
                    pagosAplicados
                        .filter(
                            (pago) =>
                                pago.metodo_pago ===
                                "TARJETA",
                        )
                        .reduce(
                            (total, pago) =>
                                total +
                                Number(
                                    pago.monto,
                                ),
                            0,
                        );

                const comisionPos =
                    pagosAplicados.reduce(
                        (total, pago) =>
                            total +
                            Number(
                                pago.monto_comision_pos ||
                                0,
                            ),
                        0,
                    );

                return {
                    cantidad:
                        acumulado.cantidad + 1,
                    total:
                        acumulado.total +
                        Number(abono.monto),
                    efectivo:
                        acumulado.efectivo +
                        efectivo,
                    tarjeta:
                        acumulado.tarjeta +
                        tarjeta,
                    comisionPos:
                        acumulado.comisionPos +
                        comisionPos,
                };
            },
            {
                cantidad: 0,
                total: 0,
                efectivo: 0,
                tarjeta: 0,
                comisionPos: 0,
            },
        );
    }, [abonosFiltrados]);

    const hayFiltros =
        Boolean(busqueda) ||
        Boolean(sucursalId) ||
        Boolean(metodoPago) ||
        estado !== "APLICADO" ||
        Boolean(fechaDesde) ||
        Boolean(fechaHasta);

    function limpiarFiltros() {
        setBusqueda("");
        setSucursalId("");
        setMetodoPago("");
        setEstado("APLICADO");
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
                        href="/cuentas-cobrar"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Cuentas por cobrar
                    </Link>

                    <div className="mt-5 flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                            <History className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Cuentas por cobrar
                            </p>

                            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                Historial de abonos
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Consulta todos los pagos recibidos
                                de clientes con saldo pendiente,
                                incluyendo pagos mixtos y POS.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Resumen
                    titulo="Abonos"
                    valor={String(
                        resumen.cantidad,
                    )}
                    icono={History}
                />
                <Resumen
                    titulo="Total recibido"
                    valor={dinero(
                        resumen.total,
                    )}
                    icono={WalletCards}
                />
                <Resumen
                    titulo="Efectivo"
                    valor={dinero(
                        resumen.efectivo,
                    )}
                    icono={Banknote}
                />
                <Resumen
                    titulo="Tarjeta"
                    valor={dinero(
                        resumen.tarjeta,
                    )}
                    icono={CreditCard}
                />
                <Resumen
                    titulo="Comisión POS"
                    valor={dinero(
                        resumen.comisionPos,
                    )}
                    icono={Landmark}
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
                                Busca por cliente, cuenta,
                                venta o referencia.
                            </p>
                        </div>

                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={
                                    limpiarFiltros
                                }
                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#EEF2EF] px-3 text-xs font-bold text-[#52605A]"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-6 sm:p-6">
                    <div className="relative sm:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder="Cliente, cuenta, venta o referencia..."
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
                                    valor:
                                        sucursal.id,
                                    texto:
                                        sucursal.nombre,
                                }),
                            ),
                        ]}
                        icono={Store}
                    />

                    <Select
                        valor={metodoPago}
                        cambiar={setMetodoPago}
                        opciones={[
                            {
                                valor: "",
                                texto:
                                    "Todos los métodos",
                            },
                            {
                                valor: "EFECTIVO",
                                texto:
                                    "Efectivo",
                            },
                            {
                                valor: "TARJETA",
                                texto:
                                    "Tarjeta / POS",
                            },
                            {
                                valor:
                                    "TRANSFERENCIA",
                                texto:
                                    "Transferencia",
                            },
                            {
                                valor: "DEPOSITO",
                                texto:
                                    "Depósito",
                            },
                            {
                                valor: "OTRO",
                                texto: "Otro",
                            },
                        ]}
                        icono={Filter}
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
                                valor: "APLICADO",
                                texto:
                                    "Aplicado",
                            },
                            {
                                valor: "ANULADO",
                                texto:
                                    "Anulado",
                            },
                        ]}
                        icono={ReceiptText}
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
                        Abonos registrados
                    </h2>
                    <p className="mt-1 text-sm text-[#6B756F]">
                        {abonosFiltrados.length} resultado
                        {abonosFiltrados.length ===
                            1
                            ? ""
                            : "s"}
                    </p>
                </header>

                {abonosFiltrados.length ===
                    0 ? (
                    <div className="p-12 text-center">
                        <History className="mx-auto h-9 w-9 text-[#829089]" />
                        <p className="mt-3 font-bold text-[#24302C]">
                            No hay abonos para mostrar
                        </p>
                        <p className="mt-1 text-sm text-[#6B756F]">
                            Ajusta los filtros o registra
                            un abono nuevo.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full min-w-[1250px]">
                                <thead className="bg-[#FBFCFA] text-left text-xs uppercase text-[#76817B]">
                                    <tr>
                                        <Th>
                                            Fecha
                                        </Th>
                                        <Th>
                                            Cliente
                                        </Th>
                                        <Th>
                                            Cuenta
                                        </Th>
                                        <Th>
                                            Sucursal
                                        </Th>
                                        <Th>
                                            Métodos
                                        </Th>
                                        <Th>
                                            Referencia
                                        </Th>
                                        <Th>
                                            Monto
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
                                    {abonosFiltrados.map(
                                        (abono) => (
                                            <FilaAbono
                                                key={
                                                    abono.id
                                                }
                                                abono={
                                                    abono
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
                            {abonosFiltrados.map(
                                (abono) => (
                                    <TarjetaAbono
                                        key={
                                            abono.id
                                        }
                                        abono={
                                            abono
                                        }
                                        dinero={
                                            dinero
                                        }
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

function FilaAbono({
    abono,
    dinero,
}: {
    abono: AbonoHistorial;
    dinero: (valor: number) => string;
}) {
    const cuenta =
        abono.cuentas_cobrar;
    const cliente =
        cuenta?.clientes;

    const pagos =
        abono.cuentas_cobrar_abono_pagos.filter(
            (pago) =>
                pago.estado === "APLICADO",
        );

    return (
        <tr className="text-sm text-[#33413B] hover:bg-[#FBFCFA]">
            <Td>
                {formatearFechaHora(
                    abono.fecha_abono,
                )}
            </Td>

            <Td>
                <p className="font-bold text-[#24302C]">
                    {cliente
                        ?.nombre_completo ??
                        "Cliente"}
                </p>
                <p className="mt-1 text-xs text-[#829089]">
                    {cliente
                        ?.codigo_cliente ??
                        cliente?.telefono ??
                        ""}
                </p>
            </Td>

            <Td>
                <p className="font-semibold">
                    {cuenta?.codigo_cuenta ??
                        "Cuenta"}
                </p>

                {cuenta?.ventas
                    ?.codigo_venta && (
                        <p className="mt-1 text-xs text-[#829089]">
                            {
                                cuenta.ventas
                                    .codigo_venta
                            }
                        </p>
                    )}
            </Td>

            <Td>
                {abono.sucursales?.nombre ??
                    "Sucursal"}
            </Td>

            <Td>
                <div className="flex max-w-[300px] flex-wrap gap-1.5">
                    {pagos.map(
                        (pago) => (
                            <MetodoPago
                                key={
                                    pago.id
                                }
                                pago={
                                    pago
                                }
                                dinero={
                                    dinero
                                }
                            />
                        ),
                    )}
                </div>
            </Td>

            <Td>
                {abono.referencia ??
                    pagos.find(
                        (pago) =>
                            pago.referencia,
                    )?.referencia ??
                    "—"}
            </Td>

            <Td>
                <strong className="text-[#3F6657]">
                    {dinero(
                        abono.monto,
                    )}
                </strong>
            </Td>

            <Td>
                <EstadoAbono
                    estado={abono.estado}
                />
            </Td>

            <Td>
                {cuenta?.cliente_id && (
                    <Link
                        href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#26332F] px-3 text-xs font-bold text-white"
                    >
                        <Eye className="h-4 w-4" />
                        Estado de cuenta
                    </Link>
                )}
            </Td>
        </tr>
    );
}

function TarjetaAbono({
    abono,
    dinero,
}: {
    abono: AbonoHistorial;
    dinero: (valor: number) => string;
}) {
    const cuenta =
        abono.cuentas_cobrar;
    const cliente =
        cuenta?.clientes;

    const pagos =
        abono.cuentas_cobrar_abono_pagos.filter(
            (pago) =>
                pago.estado === "APLICADO",
        );

    return (
        <article className="rounded-2xl border border-[#E3E7E4] p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-bold text-[#24302C]">
                        {cliente
                            ?.nombre_completo ??
                            "Cliente"}
                    </p>
                    <p className="mt-1 text-xs text-[#76817B]">
                        {cuenta
                            ?.codigo_cuenta ??
                            "Cuenta"}{" "}
                        ·{" "}
                        {formatearFechaHora(
                            abono.fecha_abono,
                        )}
                    </p>
                </div>

                <EstadoAbono
                    estado={abono.estado}
                />
            </div>

            <p className="mt-4 text-2xl font-bold text-[#3F6657]">
                {dinero(abono.monto)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
                {pagos.map(
                    (pago) => (
                        <MetodoPago
                            key={pago.id}
                            pago={pago}
                            dinero={dinero}
                        />
                    ),
                )}
            </div>

            {cuenta?.cliente_id && (
                <Link
                    href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#26332F] text-sm font-bold text-white"
                >
                    <Eye className="h-4 w-4" />
                    Estado de cuenta
                </Link>
            )}
        </article>
    );
}

function MetodoPago({
    pago,
    dinero,
}: {
    pago: AbonoHistorial["cuentas_cobrar_abono_pagos"][number];
    dinero: (valor: number) => string;
}) {
    const texto =
        pago.metodo_pago ===
            "TARJETA" &&
            pago.terminales_pos?.nombre
            ? `Tarjeta · ${pago.terminales_pos.nombre}`
            : formatearTexto(
                pago.metodo_pago,
            );

    return (
        <span
            title={
                pago.metodo_pago ===
                    "TARJETA" &&
                    Number(
                        pago.monto_comision_pos,
                    ) > 0
                    ? `Comisión POS: ${dinero(
                        pago.monto_comision_pos,
                    )}`
                    : undefined
            }
            className="inline-flex rounded-full bg-[#EEF2EF] px-2.5 py-1 text-[10px] font-bold text-[#52605A]"
        >
            {texto} ·{" "}
            {dinero(pago.monto)}
        </span>
    );
}

function EstadoAbono({
    estado,
}: {
    estado: string;
}) {
    return (
        <span
            className={[
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                estado === "APLICADO"
                    ? "bg-[#E3EEE8] text-[#527865]"
                    : "bg-[#F8E5E5] text-[#A25E5E]",
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
                    cambiar(
                        event.target.value,
                    )
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
                    cambiar(
                        event.target.value,
                    )
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