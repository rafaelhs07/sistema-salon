"use client";

import Link from "next/link";
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    CalendarDays,
    CircleDollarSign,
    Filter,
    ReceiptText,
    Search,
    Store,
    Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

export type MovimientoHistorial = {
    id: string;
    sucursal_id: string | null;
    categoria_id: string | null;
    tipo: "INGRESO" | "GASTO";
    origen: string;
    metodo_pago: string | null;
    concepto: string;
    descripcion: string | null;
    monto: number;
    referencia: string | null;
    fecha_movimiento: string;
    estado: "APLICADO" | "ANULADO";
    categorias_financieras: {
        nombre: string;
    } | null;
    sucursales: {
        nombre: string;
    } | null;
};

export type CategoriaFiltro = {
    id: string;
    nombre: string;
    tipo: "INGRESO" | "GASTO";
};

export type SucursalFiltro = {
    id: string;
    nombre: string;
};

type TipoFiltro =
    | "TODOS"
    | "INGRESO"
    | "GASTO";

type EstadoFiltro =
    | "APLICADO"
    | "ANULADO"
    | "TODOS";

export default function HistorialFinancieroClient({
    simboloMoneda,
    movimientos,
    categorias,
    sucursales,
}: {
    simboloMoneda: string;
    movimientos: MovimientoHistorial[];
    categorias: CategoriaFiltro[];
    sucursales: SucursalFiltro[];
}) {
    const [busqueda, setBusqueda] = useState("");
    const [tipo, setTipo] = useState<TipoFiltro>("TODOS");
    const [estado, setEstado] = useState<EstadoFiltro>("APLICADO");
    const [categoriaId, setCategoriaId] = useState("");
    const [sucursalId, setSucursalId] = useState("");
    const [origen, setOrigen] = useState("");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");

    const origenes = useMemo(
        () =>
            Array.from(
                new Set(
                    movimientos.map(
                        (movimiento) => movimiento.origen,
                    ),
                ),
            ).sort(),
        [movimientos],
    );

    const filtrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        const fechaDesde = desde
            ? new Date(`${desde}T00:00:00`)
            : null;

        const fechaHasta = hasta
            ? new Date(`${hasta}T23:59:59`)
            : null;

        return movimientos.filter((movimiento) => {
            const fecha = new Date(
                movimiento.fecha_movimiento,
            );

            const coincideTexto =
                !texto ||
                movimiento.concepto
                    .toLowerCase()
                    .includes(texto) ||
                movimiento.referencia
                    ?.toLowerCase()
                    .includes(texto) ||
                movimiento.categorias_financieras
                    ?.nombre.toLowerCase()
                    .includes(texto) ||
                movimiento.sucursales
                    ?.nombre.toLowerCase()
                    .includes(texto);

            const coincideTipo =
                tipo === "TODOS" ||
                movimiento.tipo === tipo;

            const coincideEstado =
                estado === "TODOS" ||
                movimiento.estado === estado;

            const coincideCategoria =
                !categoriaId ||
                movimiento.categoria_id ===
                categoriaId;

            const coincideSucursal =
                !sucursalId ||
                movimiento.sucursal_id ===
                sucursalId;

            const coincideOrigen =
                !origen ||
                movimiento.origen ===
                origen;

            const coincideDesde =
                !fechaDesde ||
                fecha >= fechaDesde;

            const coincideHasta =
                !fechaHasta ||
                fecha <= fechaHasta;

            return (
                coincideTexto &&
                coincideTipo &&
                coincideEstado &&
                coincideCategoria &&
                coincideSucursal &&
                coincideOrigen &&
                coincideDesde &&
                coincideHasta
            );
        });
    }, [
        busqueda,
        categoriaId,
        desde,
        estado,
        hasta,
        movimientos,
        origen,
        sucursalId,
        tipo,
    ]);

    const resumen = useMemo(() => {
        const aplicados = filtrados.filter(
            (movimiento) =>
                movimiento.estado === "APLICADO",
        );

        const ingresos = aplicados
            .filter(
                (movimiento) =>
                    movimiento.tipo === "INGRESO",
            )
            .reduce(
                (total, movimiento) =>
                    total +
                    Number(movimiento.monto),
                0,
            );

        const gastos = aplicados
            .filter(
                (movimiento) =>
                    movimiento.tipo === "GASTO",
            )
            .reduce(
                (total, movimiento) =>
                    total +
                    Number(movimiento.monto),
                0,
            );

        return {
            ingresos,
            gastos,
            balance: ingresos - gastos,
            cantidad: filtrados.length,
        };
    }, [filtrados]);

    function limpiarFiltros() {
        setBusqueda("");
        setTipo("TODOS");
        setEstado("APLICADO");
        setCategoriaId("");
        setSucursalId("");
        setOrigen("");
        setDesde("");
        setHasta("");
    }

    return (
        <div className="space-y-6 pb-8">
            <section className="relative overflow-hidden rounded-[32px] bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <Link
                    href="/finanzas"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Finanzas
                </Link>

                <div className="mt-5 flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                        <ReceiptText className="h-7 w-7" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-[#B9C8C1]">
                            Libro financiero
                        </p>

                        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                            Historial financiero
                        </h1>

                        <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                            Revisa entradas y salidas con filtros por fecha,
                            sucursal, categoría, origen y estado.
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ResumenCard
                    titulo="Ingresos filtrados"
                    valor={moneda(
                        resumen.ingresos,
                        simboloMoneda,
                    )}
                    icono={ArrowUpRight}
                />

                <ResumenCard
                    titulo="Gastos filtrados"
                    valor={moneda(
                        resumen.gastos,
                        simboloMoneda,
                    )}
                    icono={ArrowDownRight}
                />

                <ResumenCard
                    titulo="Balance"
                    valor={moneda(
                        resumen.balance,
                        simboloMoneda,
                    )}
                    icono={Wallet}
                />

                <ResumenCard
                    titulo="Movimientos"
                    valor={String(
                        resumen.cantidad,
                    )}
                    icono={ReceiptText}
                />
            </section>

            <section className="rounded-[30px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.08)] sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#26332F]">
                            Filtros
                        </h2>

                        <p className="mt-1 text-sm text-[#72827A]">
                            Combina varios filtros para encontrar un movimiento.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="h-10 rounded-xl border border-[#DCE5E0] px-4 text-sm font-bold text-[#52605A] transition hover:bg-[#EEF2EF]"
                    >
                        Limpiar filtros
                    </button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="relative md:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87948D]" />

                        <input
                            value={busqueda}
                            onChange={(event) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder="Concepto, referencia, categoría o sucursal..."
                            className="h-11 w-full rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] pl-11 pr-4 text-sm outline-none transition focus:border-[#6F8F83] focus:bg-white"
                        />
                    </div>

                    <Select
                        valor={tipo}
                        cambiar={(valor) =>
                            setTipo(
                                valor as TipoFiltro,
                            )
                        }
                    >
                        <option value="TODOS">
                            Ingresos y gastos
                        </option>
                        <option value="INGRESO">
                            Solo ingresos
                        </option>
                        <option value="GASTO">
                            Solo gastos
                        </option>
                    </Select>

                    <Select
                        valor={estado}
                        cambiar={(valor) =>
                            setEstado(
                                valor as EstadoFiltro,
                            )
                        }
                    >
                        <option value="APLICADO">
                            Aplicados
                        </option>
                        <option value="ANULADO">
                            Anulados
                        </option>
                        <option value="TODOS">
                            Todos los estados
                        </option>
                    </Select>

                    <Select
                        valor={categoriaId}
                        cambiar={setCategoriaId}
                    >
                        <option value="">
                            Todas las categorías
                        </option>

                        {categorias.map(
                            (categoria) => (
                                <option
                                    key={
                                        categoria.id
                                    }
                                    value={
                                        categoria.id
                                    }
                                >
                                    {categoria.tipo ===
                                        "INGRESO"
                                        ? "Ingreso"
                                        : "Gasto"}{" "}
                                    ·{" "}
                                    {
                                        categoria.nombre
                                    }
                                </option>
                            ),
                        )}
                    </Select>

                    <Select
                        valor={sucursalId}
                        cambiar={setSucursalId}
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
                    </Select>

                    <Select
                        valor={origen}
                        cambiar={setOrigen}
                    >
                        <option value="">
                            Todos los orígenes
                        </option>

                        {origenes.map(
                            (item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {formatearOrigen(
                                        item,
                                    )}
                                </option>
                            ),
                        )}
                    </Select>

                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="date"
                            value={desde}
                            onChange={(event) =>
                                setDesde(
                                    event.target.value,
                                )
                            }
                            title="Desde"
                            className="h-11 rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] px-3 text-sm outline-none focus:border-[#6F8F83]"
                        />

                        <input
                            type="date"
                            value={hasta}
                            onChange={(event) =>
                                setHasta(
                                    event.target.value,
                                )
                            }
                            title="Hasta"
                            className="h-11 rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] px-3 text-sm outline-none focus:border-[#6F8F83]"
                        />
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-[30px] border border-[#DCE5E0] bg-white shadow-[0_12px_35px_rgba(36,48,44,0.08)]">
                <div className="flex items-center justify-between border-b border-[#E7EEEA] px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="font-bold text-[#26332F]">
                            Movimientos
                        </h2>
                        <p className="mt-1 text-xs text-[#74837C]">
                            {filtrados.length} resultados
                        </p>
                    </div>

                    <Filter className="h-5 w-5 text-[#71817A]" />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1100px] w-full">
                        <thead className="bg-[#F7FAF8]">
                            <tr>
                                <Th>Fecha</Th>
                                <Th>Concepto</Th>
                                <Th>Categoría</Th>
                                <Th>Origen</Th>
                                <Th>Método</Th>
                                <Th>Sucursal</Th>
                                <Th>Estado</Th>
                                <Th derecha>Monto</Th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EDF3EF]">
                            {filtrados.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-14 text-center text-sm text-[#74837C]"
                                    >
                                        No encontramos movimientos con esos filtros.
                                    </td>
                                </tr>
                            ) : (
                                filtrados.map(
                                    (movimiento) => (
                                        <tr
                                            key={
                                                movimiento.id
                                            }
                                            className="transition hover:bg-[#FAFCFB]"
                                        >
                                            <Td>
                                                {fecha(
                                                    movimiento.fecha_movimiento,
                                                )}
                                            </Td>

                                            <Td>
                                                <div className="max-w-[260px]">
                                                    <p className="font-semibold text-[#33413B]">
                                                        {
                                                            movimiento.concepto
                                                        }
                                                    </p>

                                                    {movimiento.referencia && (
                                                        <p className="mt-1 truncate text-xs text-[#829089]">
                                                            Ref.{" "}
                                                            {
                                                                movimiento.referencia
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </Td>

                                            <Td>
                                                {movimiento
                                                    .categorias_financieras
                                                    ?.nombre ??
                                                    "Sin categoría"}
                                            </Td>

                                            <Td>
                                                {formatearOrigen(
                                                    movimiento.origen,
                                                )}
                                            </Td>

                                            <Td>
                                                {formatearMetodo(
                                                    movimiento.metodo_pago,
                                                )}
                                            </Td>

                                            <Td>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Store className="h-3.5 w-3.5 text-[#7F8E87]" />
                                                    {movimiento
                                                        .sucursales
                                                        ?.nombre ??
                                                        "Sin sucursal"}
                                                </span>
                                            </Td>

                                            <Td>
                                                <span
                                                    className={[
                                                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                                                        movimiento.estado ===
                                                            "APLICADO"
                                                            ? "bg-[#E3EEE8] text-[#4F7564]"
                                                            : "bg-[#F5E8EB] text-[#9B6470]",
                                                    ].join(
                                                        " ",
                                                    )}
                                                >
                                                    {
                                                        movimiento.estado
                                                    }
                                                </span>
                                            </Td>

                                            <Td derecha>
                                                <span
                                                    className={
                                                        movimiento.tipo ===
                                                            "INGRESO"
                                                            ? "font-bold text-[#3F705D]"
                                                            : "font-bold text-[#A26673]"
                                                    }
                                                >
                                                    {movimiento.tipo ===
                                                        "INGRESO"
                                                        ? "+"
                                                        : "-"}{" "}
                                                    {moneda(
                                                        Number(
                                                            movimiento.monto,
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

function ResumenCard({
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
        <article className="rounded-[26px] border border-[#DCE5E0] bg-white p-5 shadow-[0_12px_35px_rgba(36,48,44,0.07)]">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#71817A]">
                        {titulo}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#26332F]">
                        {valor}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4F0] text-[#597064]">
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
            value={valor}
            onChange={(event) =>
                cambiar(
                    event.target.value,
                )
            }
            className="h-11 rounded-xl border border-[#DCE5E0] bg-[#F9FBFA] px-3 text-sm font-medium text-[#43524B] outline-none transition focus:border-[#6F8F83] focus:bg-white"
        >
            {children}
        </select>
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

function moneda(
    valor: number,
    simbolo: string,
) {
    return `${simbolo} ${Number(
        valor,
    ).toLocaleString("es-NI", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function fecha(valor: string) {
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
        new Date(valor),
    );
}

function formatearOrigen(
    valor: string,
) {
    return (
        {
            VENTA: "Venta",
            PAGO_PROVEEDOR:
                "Pago a proveedor",
            COMISION_POS:
                "Comisión POS",
            MOVIMIENTO_CAJA:
                "Movimiento de caja",
            MANUAL: "Manual",
            AJUSTE: "Ajuste",
            OTRO: "Otro",
        }[valor] ?? valor
    );
}

function formatearMetodo(
    valor: string | null,
) {
    if (!valor) {
        return "—";
    }

    return (
        {
            EFECTIVO: "Efectivo",
            TARJETA: "Tarjeta",
            TRANSFERENCIA:
                "Transferencia",
            DEPOSITO: "Depósito",
            CHEQUE: "Cheque",
            CREDITO: "Crédito",
            OTRO: "Otro",
        }[valor] ?? valor
    );
}