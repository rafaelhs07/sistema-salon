"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    CalendarDays,
    CheckCircle2,
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
                abono.cuentas_cobrar?.clientes;
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
                cuenta?.ventas?.codigo_venta
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
                    abono.estado === estado) &&
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
                    abono.estado !== "APLICADO"
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

                const transferencia =
                    pagosAplicados
                        .filter(
                            (pago) =>
                                pago.metodo_pago ===
                                "TRANSFERENCIA",
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
                    transferencia:
                        acumulado.transferencia +
                        transferencia,
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
                transferencia: 0,
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
        <div className="space-y-6 pb-10">
            <section className="relative overflow-hidden rounded-[36px] bg-[#26332F] p-6 text-white shadow-[0_24px_70px_rgba(36,48,44,0.18)] sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#6F8F83]/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#C79AA1]/12 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/cuentas-cobrar"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Cuentas por cobrar
                    </Link>

                    <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <History className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#AFC2B9]">
                                    Cuentas por cobrar
                                </p>

                                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                    Historial de abonos
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CFD9D4] sm:text-base">
                                    Revisa todos los pagos aplicados a cuentas pendientes, sus métodos de pago y referencias.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[570px]">
                            <HeroDato
                                titulo="Total recibido"
                                valor={dinero(
                                    resumen.total,
                                )}
                                icono={WalletCards}
                            />

                            <HeroDato
                                titulo="Abonos"
                                valor={String(
                                    resumen.cantidad,
                                )}
                                icono={History}
                            />

                            <HeroDato
                                titulo="Comisión POS"
                                valor={dinero(
                                    resumen.comisionPos,
                                )}
                                icono={CreditCard}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ResumenMetodo
                    titulo="Efectivo"
                    valor={dinero(
                        resumen.efectivo,
                    )}
                    icono={Banknote}
                    descripcion="Ingresos recibidos en efectivo"
                />

                <ResumenMetodo
                    titulo="Tarjeta"
                    valor={dinero(
                        resumen.tarjeta,
                    )}
                    icono={CreditCard}
                    descripcion="Cobros procesados por POS"
                />

                <ResumenMetodo
                    titulo="Transferencia"
                    valor={dinero(
                        resumen.transferencia,
                    )}
                    icono={Landmark}
                    descripcion="Transferencias registradas"
                />

                <ResumenMetodo
                    titulo="Comisión POS"
                    valor={dinero(
                        resumen.comisionPos,
                    )}
                    icono={ReceiptText}
                    descripcion="Costo estimado por tarjetas"
                />
            </section>

            <section className="overflow-hidden rounded-[28px] border border-[#E1E7E3] bg-white shadow-[0_10px_28px_rgba(36,48,44,0.05)]">
                <header className="border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Búsqueda
                            </p>

                            <h2 className="mt-1 text-lg font-black text-[#24302C]">
                                Filtrar movimientos
                            </h2>

                            <p className="mt-1 text-sm text-[#74817B]">
                                Busca por cliente, cuenta, venta, referencia o método de pago.
                            </p>
                        </div>

                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE3DF] bg-white px-4 text-xs font-black text-[#52605A]"
                            >
                                <X className="h-4 w-4" />
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid gap-3 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_210px_190px_170px]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder="Cliente, cuenta, venta o referencia..."
                            className="h-12 w-full rounded-2xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#6F8F83]"
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
                                texto: "Efectivo",
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
                                texto: "Depósito",
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
                                texto: "Aplicados",
                            },
                            {
                                valor: "ANULADO",
                                texto: "Anulados",
                            },
                        ]}
                        icono={ReceiptText}
                    />

                    <div className="lg:col-span-4">
                        <div className="grid gap-3 sm:grid-cols-2">
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
                </div>
            </section>

            <section className="overflow-hidden rounded-[30px] border border-[#E1E7E3] bg-white shadow-[0_10px_28px_rgba(36,48,44,0.05)]">
                <header className="flex flex-col gap-3 border-b border-[#E8ECE9] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                            Movimientos
                        </p>

                        <h2 className="mt-1 text-xl font-black text-[#24302C]">
                            Abonos registrados
                        </h2>

                        <p className="mt-1 text-sm text-[#6B756F]">
                            {abonosFiltrados.length} resultado
                            {abonosFiltrados.length ===
                                1
                                ? ""
                                : "s"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-[#F5F8F6] px-4 py-2 text-right">
                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#829089]">
                            Total visible
                        </p>

                        <p className="mt-1 text-sm font-black text-[#527064]">
                            {dinero(
                                resumen.total,
                            )}
                        </p>
                    </div>
                </header>

                {abonosFiltrados.length ===
                    0 ? (
                    <EstadoVacio />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto xl:block">
                            <table className="w-full min-w-[1200px]">
                                <thead className="bg-[#FBFCFA] text-left text-[10px] uppercase tracking-[0.1em] text-[#76817B]">
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

                        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:hidden sm:p-5">
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
                pago.estado ===
                "APLICADO",
        );

    return (
        <tr className="text-sm text-[#33413B] transition hover:bg-[#FBFCFA]">
            <Td>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#66746D]">
                    <CalendarDays className="h-4 w-4 text-[#829089]" />
                    {formatearFechaHora(
                        abono.fecha_abono,
                    )}
                </div>
            </Td>

            <Td>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3F0] text-[#607C6F]">
                        <UserRound className="h-4 w-4" />
                    </div>

                    <div>
                        <p className="font-black text-[#24302C]">
                            {cliente?.nombre_completo ??
                                "Cliente"}
                        </p>

                        <p className="mt-1 text-xs text-[#829089]">
                            {cliente?.codigo_cliente ??
                                cliente?.telefono ??
                                ""}
                        </p>
                    </div>
                </div>
            </Td>

            <Td>
                <p className="font-black text-[#3F4D47]">
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
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F4F7F5] px-3 py-1.5 text-xs font-bold text-[#607069]">
                    <Store className="h-3.5 w-3.5" />
                    {abono.sucursales
                        ?.nombre ?? "Sucursal"}
                </span>
            </Td>

            <Td>
                <div className="flex max-w-[320px] flex-wrap gap-1.5">
                    {pagos.map((pago) => (
                        <MetodoPago
                            key={pago.id}
                            pago={pago}
                            dinero={dinero}
                        />
                    ))}
                </div>
            </Td>

            <Td>
                <span className="text-xs font-semibold text-[#67746E]">
                    {abono.referencia ??
                        pagos.find(
                            (pago) =>
                                pago.referencia,
                        )?.referencia ??
                        "—"}
                </span>
            </Td>

            <Td>
                <strong className="text-base text-[#527865]">
                    {dinero(abono.monto)}
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
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#26332F] px-4 text-xs font-black text-white transition hover:bg-[#34463F]"
                    >
                        <Eye className="h-4 w-4" />
                        Ver cuenta
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
                pago.estado ===
                "APLICADO",
        );

    return (
        <article className="overflow-hidden rounded-[24px] border border-[#E0E6E2] bg-white shadow-[0_8px_22px_rgba(36,48,44,0.04)]">
            <div className="border-b border-[#E9EDEA] bg-[#FBFCFA] p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E3EEE8] text-[#527865]">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <p className="truncate font-black text-[#24302C]">
                                {cliente?.nombre_completo ??
                                    "Cliente"}
                            </p>

                            <p className="mt-1 text-xs text-[#76817B]">
                                {cuenta?.codigo_cuenta ??
                                    "Cuenta"}
                            </p>
                        </div>
                    </div>

                    <EstadoAbono
                        estado={abono.estado}
                    />
                </div>
            </div>

            <div className="p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#87958D]">
                    Monto abonado
                </p>

                <p className="mt-1 text-2xl font-black text-[#527865]">
                    {dinero(abono.monto)}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#74817B]">
                    <CalendarDays className="h-4 w-4" />
                    {formatearFechaHora(
                        abono.fecha_abono,
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {pagos.map((pago) => (
                        <MetodoPago
                            key={pago.id}
                            pago={pago}
                            dinero={dinero}
                        />
                    ))}
                </div>

                {(abono.referencia ||
                    pagos.find(
                        (pago) =>
                            pago.referencia,
                    )?.referencia) && (
                        <div className="mt-4 rounded-2xl bg-[#F8FAF8] p-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#87958D]">
                                Referencia
                            </p>

                            <p className="mt-1 text-xs font-bold text-[#52605A]">
                                {abono.referencia ??
                                    pagos.find(
                                        (pago) =>
                                            pago.referencia,
                                    )
                                        ?.referencia}
                            </p>
                        </div>
                    )}

                {cuenta?.cliente_id && (
                    <Link
                        href={`/cuentas-cobrar/${cuenta.cliente_id}`}
                        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#26332F] text-sm font-black text-white"
                    >
                        <Eye className="h-4 w-4" />
                        Abrir estado de cuenta
                    </Link>
                )}
            </div>
        </article>
    );
}

function ResumenMetodo({
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
        <article className="rounded-[24px] border border-[#E1E7E3] bg-white p-5 shadow-[0_8px_22px_rgba(36,48,44,0.04)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#87958D]">
                        {titulo}
                    </p>

                    <p className="mt-2 text-xl font-black text-[#24302C]">
                        {valor}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                    <Icono className="h-5 w-5" />
                </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-[#7A8781]">
                {descripcion}
            </p>
        </article>
    );
}

function HeroDato({
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
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#AEC0B7]">
                    {titulo}
                </p>

                <Icono className="h-4 w-4 text-[#DCE7E2]" />
            </div>

            <p className="mt-2 truncate text-lg font-black text-white">
                {valor}
            </p>
        </div>
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
        pago.metodo_pago === "TARJETA" &&
            pago.terminales_pos?.nombre
            ? `Tarjeta · ${pago.terminales_pos.nombre}`
            : formatearTexto(
                pago.metodo_pago,
            );

    return (
        <span
            title={
                pago.metodo_pago === "TARJETA" &&
                    Number(
                        pago.monto_comision_pos,
                    ) > 0
                    ? `Comisión POS: ${dinero(
                        pago.monto_comision_pos,
                    )}`
                    : undefined
            }
            className="inline-flex rounded-full bg-[#EEF2EF] px-2.5 py-1 text-[10px] font-black text-[#52605A]"
        >
            {texto} · {dinero(pago.monto)}
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
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase",
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
                className="h-12 w-full rounded-2xl border border-[#D4DAD6] bg-white pl-11 pr-4 text-sm font-semibold text-[#33413B]"
            >
                {opciones.map((opcion) => (
                    <option
                        key={
                            opcion.valor ||
                            opcion.texto
                        }
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
            <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.1em] text-[#829089]">
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
                className="h-11 w-full rounded-xl border border-[#D4DAD6] px-3 text-sm font-semibold"
            />
        </label>
    );
}

function EstadoVacio() {
    return (
        <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF3F0] text-[#607C6F]">
                <History className="h-7 w-7" />
            </div>

            <h3 className="mt-4 font-black text-[#24302C]">
                No hay abonos para mostrar
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B756F]">
                Ajusta los filtros o registra un nuevo abono desde el estado de cuenta de un cliente.
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
        <th className="px-4 py-3 font-black">
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
        <td className="px-4 py-4 align-middle">
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
