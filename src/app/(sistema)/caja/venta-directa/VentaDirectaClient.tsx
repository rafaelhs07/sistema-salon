"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    CheckCircle2,
    CircleDollarSign,
    CreditCard,
    LoaderCircle,
    Plus,
    ReceiptText,
    Search,
    Trash2,
    UserRound,
    WalletCards,
    X,
    XCircle,
} from "lucide-react";
import {
    FormEvent,
    useMemo,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    registrarVentaDirecta,
    type DatosVentaDirecta,
    type ItemVentaDirecta,
    type PagoVentaDirecta,
} from "./actions";

export type CajaVentaDirecta = {
    id: string;
    sucursal_id: string;
    fecha_apertura: string;
    sucursales: {
        nombre: string;
    } | null;
};

export type TerminalPosVentaDirecta = {
    id: string;
    nombre: string;
    banco: string | null;
    sucursal_id: string | null;
    porcentaje_comision: number;
    estado: string;
};

export type ClienteVentaDirecta = {
    id: string;
    codigo_cliente: string | null;
    nombre_completo: string;
    telefono: string | null;
    whatsapp: string | null;
};

export type ServicioVentaDirecta = {
    id: string;
    nombre: string;
    precio: number;
    duracion_minutos: number;
    trabajador_servicios: {
        trabajador_id: string;
        estado: string;
    }[];
};

export type TrabajadorVentaDirecta = {
    id: string;
    nombre_completo: string;
    estado: string;
};

type Mensaje = {
    tipo: "EXITO" | "ERROR";
    texto: string;
} | null;

export default function VentaDirectaClient({
    cajas,
    clientes,
    servicios,
    trabajadores,
    terminales,
    permitirCredito,
    permitirPagoCombinado,
}: {
    cajas: CajaVentaDirecta[];
    clientes: ClienteVentaDirecta[];
    servicios: ServicioVentaDirecta[];
    trabajadores: TrabajadorVentaDirecta[];
    terminales: TerminalPosVentaDirecta[];
    permitirCredito: boolean;
    permitirPagoCombinado: boolean;
}) {
    const router = useRouter();

    const [busquedaCliente, setBusquedaCliente] =
        useState("");
    const [mostrarClientes, setMostrarClientes] =
        useState(false);
    const [mensaje, setMensaje] =
        useState<Mensaje>(null);
    const [guardando, iniciarGuardado] =
        useTransition();

    const [formulario, setFormulario] =
        useState<DatosVentaDirecta>({
            cajaSesionId:
                cajas.length === 1
                    ? cajas[0].id
                    : "",
            clienteId: null,
            descuento: 0,
            notas: "",
            items: [],
            pagos: [],
        });

    const cajaSeleccionada =
        cajas.find(
            (caja) =>
                caja.id === formulario.cajaSesionId,
        ) ?? null;

    const clienteSeleccionado =
        clientes.find(
            (cliente) =>
                cliente.id === formulario.clienteId,
        ) ?? null;

    const clientesFiltrados = useMemo(() => {
        const texto =
            busquedaCliente.trim().toLowerCase();

        return clientes
            .filter(
                (cliente) =>
                    !texto ||
                    cliente.nombre_completo
                        .toLowerCase()
                        .includes(texto) ||
                    cliente.codigo_cliente
                        ?.toLowerCase()
                        .includes(texto) ||
                    cliente.telefono
                        ?.toLowerCase()
                        .includes(texto) ||
                    cliente.whatsapp
                        ?.toLowerCase()
                        .includes(texto),
            )
            .slice(0, 12);
    }, [busquedaCliente, clientes]);

    const subtotal = formulario.items.reduce(
        (suma, item) =>
            suma +
            Math.max(
                0,
                Number(item.precio) -
                Number(item.descuento),
            ),
        0,
    );

    const total = Math.max(
        0,
        subtotal - formulario.descuento,
    );

    const totalPagos = formulario.pagos.reduce(
        (suma, pago) =>
            suma + Number(pago.monto || 0),
        0,
    );

    const saldo = Math.max(
        0,
        total - totalPagos,
    );

    const comisionTotal = formulario.pagos.reduce(
        (suma, pago) => {
            if (pago.metodoPago !== "TARJETA") {
                return suma;
            }

            const terminal = terminales.find(
                (item) =>
                    item.id === pago.terminalPosId,
            );

            return (
                suma +
                Number(pago.monto || 0) *
                (Number(
                    terminal?.porcentaje_comision ??
                    0,
                ) /
                    100)
            );
        },
        0,
    );

    const terminalesDisponibles =
        terminales.filter(
            (terminal) =>
                !terminal.sucursal_id ||
                terminal.sucursal_id ===
                cajaSeleccionada?.sucursal_id,
        );

    function actualizar<
        K extends keyof DatosVentaDirecta,
    >(
        campo: K,
        valor: DatosVentaDirecta[K],
    ) {
        setFormulario((actual) => ({
            ...actual,
            [campo]: valor,
        }));
        setMensaje(null);
    }

    function agregarItem() {
        actualizar("items", [
            ...formulario.items,
            {
                servicioId: "",
                trabajadorId: "",
                precio: 0,
                descuento: 0,
            },
        ]);
    }

    function actualizarItem(
        indice: number,
        cambios: Partial<ItemVentaDirecta>,
    ) {
        actualizar(
            "items",
            formulario.items.map(
                (item, posicion) =>
                    posicion === indice
                        ? {
                            ...item,
                            ...cambios,
                        }
                        : item,
            ),
        );
    }

    function seleccionarServicio(
        indice: number,
        servicioId: string,
    ) {
        const servicio = servicios.find(
            (item) => item.id === servicioId,
        );

        actualizarItem(indice, {
            servicioId,
            trabajadorId: "",
            precio: Number(
                servicio?.precio ?? 0,
            ),
            descuento: 0,
        });
    }

    function trabajadoresPermitidos(
        servicioId: string,
    ) {
        const servicio = servicios.find(
            (item) => item.id === servicioId,
        );

        if (!servicio) return [];

        const ids = new Set(
            servicio.trabajador_servicios
                .filter(
                    (relacion) =>
                        relacion.estado ===
                        "ACTIVO",
                )
                .map(
                    (relacion) =>
                        relacion.trabajador_id,
                ),
        );

        return trabajadores.filter(
            (trabajador) =>
                ids.has(trabajador.id),
        );
    }

    function agregarPago() {
        if (
            !permitirPagoCombinado &&
            formulario.pagos.length > 0
        ) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Los pagos combinados están desactivados en Configuración.",
            });
            return;
        }

        actualizar("pagos", [
            ...formulario.pagos,
            {
                metodoPago: "EFECTIVO",
                monto: saldo,
                montoRecibido: saldo,
                terminalPosId: null,
                referencia: "",
                banco: "",
                observaciones: "",
            },
        ]);
    }

    function actualizarPago(
        indice: number,
        cambios: Partial<PagoVentaDirecta>,
    ) {
        actualizar(
            "pagos",
            formulario.pagos.map(
                (pago, posicion) =>
                    posicion === indice
                        ? {
                            ...pago,
                            ...cambios,
                        }
                        : pago,
            ),
        );
    }

    function eliminarPago(indice: number) {
        actualizar(
            "pagos",
            formulario.pagos.filter(
                (_, posicion) =>
                    posicion !== indice,
            ),
        );
    }

    function enviar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (formulario.items.length === 0) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Agrega al menos un servicio.",
            });
            return;
        }

        if (
            formulario.items.some(
                (item) => !item.servicioId,
            )
        ) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Selecciona todos los servicios.",
            });
            return;
        }

        if (totalPagos > total) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Los pagos no pueden superar el total.",
            });
            return;
        }

        if (!permitirCredito && saldo > 0) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Las ventas a crédito están desactivadas. Debes completar el pago.",
            });
            return;
        }

        if (
            formulario.pagos.some(
                (pago) =>
                    pago.metodoPago === "TARJETA" &&
                    !pago.terminalPosId,
            )
        ) {
            setMensaje({
                tipo: "ERROR",
                texto:
                    "Selecciona la terminal POS en todos los pagos con tarjeta.",
            });
            return;
        }

        iniciarGuardado(async () => {
            const resultado =
                await registrarVentaDirecta(
                    formulario,
                );

            setMensaje({
                tipo: resultado.exito
                    ? "EXITO"
                    : "ERROR",
                texto: resultado.mensaje,
            });

            if (resultado.exito) {
                if (resultado.ventaId) {
                    router.push(
                        `/caja/recibos/${resultado.ventaId}`,
                    );
                } else {
                    router.push("/caja");
                }

                router.refresh();
            }
        });
    }

    return (
        <div className="space-y-6">
            <section className="rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <Link
                    href="/caja"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Caja
                </Link>

                <div className="mt-6 flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                        <ReceiptText className="h-7 w-7" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-[#B9C8C1]">
                            Venta sin cita
                        </p>

                        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                            Venta directa
                        </h1>

                        <p className="mt-3 text-[#CFD9D4]">
                            Registra servicios realizados sin una
                            cita previa.
                        </p>
                    </div>
                </div>
            </section>

            {mensaje && (
                <MensajeEstado
                    mensaje={mensaje}
                    cerrar={() =>
                        setMensaje(null)
                    }
                />
            )}

            {cajas.length === 0 ? (
                <div className="rounded-3xl border border-[#EBCBCB] bg-[#F8E5E5] p-6 text-[#985858]">
                    Debes abrir una caja antes de registrar
                    una venta directa.
                </div>
            ) : (
                <form onSubmit={enviar}>
                    <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
                        <div className="space-y-6">
                            <Seccion
                                titulo="Caja y cliente"
                                icono={
                                    WalletCards
                                }
                            >
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label>
                                        <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                                            Caja abierta
                                        </span>

                                        <select
                                            value={
                                                formulario.cajaSesionId
                                            }
                                            required
                                            onChange={(
                                                event,
                                            ) =>
                                                setFormulario((actual) => ({
                                                    ...actual,
                                                    cajaSesionId:
                                                        event.target.value,
                                                    pagos: [],
                                                }))
                                            }
                                            className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4"
                                        >
                                            <option value="">
                                                Seleccionar caja
                                            </option>

                                            {cajas.map(
                                                (caja) => (
                                                    <option
                                                        key={
                                                            caja.id
                                                        }
                                                        value={
                                                            caja.id
                                                        }
                                                    >
                                                        {caja
                                                            .sucursales
                                                            ?.nombre ??
                                                            "Sucursal"}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>

                                    <div className="relative">
                                        <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                                            Cliente opcional
                                        </span>

                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                                            <input
                                                value={
                                                    busquedaCliente
                                                }
                                                onFocus={() =>
                                                    setMostrarClientes(
                                                        true,
                                                    )
                                                }
                                                onChange={(
                                                    event,
                                                ) => {
                                                    setBusquedaCliente(
                                                        event
                                                            .target
                                                            .value,
                                                    );
                                                    actualizar(
                                                        "clienteId",
                                                        null,
                                                    );
                                                    setMostrarClientes(
                                                        true,
                                                    );
                                                }}
                                                placeholder="Nombre, código o teléfono..."
                                                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white pl-11 pr-4"
                                            />
                                        </div>

                                        {mostrarClientes && (
                                            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[#DCE3DF] bg-white p-2 shadow-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        actualizar(
                                                            "clienteId",
                                                            null,
                                                        );
                                                        setBusquedaCliente(
                                                            "",
                                                        );
                                                        setMostrarClientes(
                                                            false,
                                                        );
                                                    }}
                                                    className="w-full rounded-xl p-3 text-left text-sm font-semibold text-[#6B756F] hover:bg-[#EEF2EF]"
                                                >
                                                    Venta sin cliente
                                                </button>

                                                {clientesFiltrados.map(
                                                    (
                                                        cliente,
                                                    ) => (
                                                        <button
                                                            key={
                                                                cliente.id
                                                            }
                                                            type="button"
                                                            onClick={() => {
                                                                actualizar(
                                                                    "clienteId",
                                                                    cliente.id,
                                                                );
                                                                setBusquedaCliente(
                                                                    cliente.nombre_completo,
                                                                );
                                                                setMostrarClientes(
                                                                    false,
                                                                );
                                                            }}
                                                            className="w-full rounded-xl p-3 text-left hover:bg-[#EEF2EF]"
                                                        >
                                                            <p className="font-semibold text-[#33413B]">
                                                                {
                                                                    cliente.nombre_completo
                                                                }
                                                            </p>
                                                            <p className="mt-1 text-xs text-[#76817B]">
                                                                {cliente.codigo_cliente ??
                                                                    "Sin código"}
                                                            </p>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {clienteSeleccionado && (
                                    <div className="mt-4 rounded-2xl bg-[#F0F5F2] p-4 text-sm font-semibold text-[#43524B]">
                                        Cliente:{" "}
                                        {
                                            clienteSeleccionado.nombre_completo
                                        }
                                    </div>
                                )}
                            </Seccion>

                            <Seccion
                                titulo="Servicios"
                                icono={
                                    ReceiptText
                                }
                            >
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={
                                            agregarItem
                                        }
                                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B]"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Agregar servicio
                                    </button>
                                </div>

                                <div className="mt-4 space-y-4">
                                    {formulario.items.map(
                                        (
                                            item,
                                            indice,
                                        ) => (
                                            <article
                                                key={
                                                    indice
                                                }
                                                className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4"
                                            >
                                                <div className="flex justify-between">
                                                    <strong>
                                                        Servicio{" "}
                                                        {indice +
                                                            1}
                                                    </strong>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            actualizar(
                                                                "items",
                                                                formulario.items.filter(
                                                                    (
                                                                        _,
                                                                        posicion,
                                                                    ) =>
                                                                        posicion !==
                                                                        indice,
                                                                ),
                                                            )
                                                        }
                                                        className="rounded-xl bg-[#F8E5E5] p-2 text-[#A25E5E]"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                    <CampoSelect
                                                        etiqueta="Servicio"
                                                        valor={
                                                            item.servicioId
                                                        }
                                                        opciones={[
                                                            {
                                                                valor: "",
                                                                texto:
                                                                    "Seleccionar servicio",
                                                            },
                                                            ...servicios.map(
                                                                (
                                                                    servicio,
                                                                ) => ({
                                                                    valor:
                                                                        servicio.id,
                                                                    texto:
                                                                        servicio.nombre,
                                                                }),
                                                            ),
                                                        ]}
                                                        cambiar={(
                                                            valor,
                                                        ) =>
                                                            seleccionarServicio(
                                                                indice,
                                                                valor,
                                                            )
                                                        }
                                                    />

                                                    <CampoSelect
                                                        etiqueta="Trabajador"
                                                        valor={
                                                            item.trabajadorId
                                                        }
                                                        opciones={[
                                                            {
                                                                valor: "",
                                                                texto:
                                                                    "Sin trabajador",
                                                            },
                                                            ...trabajadoresPermitidos(
                                                                item.servicioId,
                                                            ).map(
                                                                (
                                                                    trabajador,
                                                                ) => ({
                                                                    valor:
                                                                        trabajador.id,
                                                                    texto:
                                                                        trabajador.nombre_completo,
                                                                }),
                                                            ),
                                                        ]}
                                                        cambiar={(
                                                            trabajadorId,
                                                        ) =>
                                                            actualizarItem(
                                                                indice,
                                                                {
                                                                    trabajadorId,
                                                                },
                                                            )
                                                        }
                                                    />

                                                    <CampoDinero
                                                        etiqueta="Precio"
                                                        valor={
                                                            item.precio
                                                        }
                                                        cambiar={(
                                                            precio,
                                                        ) =>
                                                            actualizarItem(
                                                                indice,
                                                                {
                                                                    precio,
                                                                },
                                                            )
                                                        }
                                                    />

                                                    <CampoDinero
                                                        etiqueta="Descuento"
                                                        valor={
                                                            item.descuento
                                                        }
                                                        maximo={
                                                            item.precio
                                                        }
                                                        cambiar={(
                                                            descuento,
                                                        ) =>
                                                            actualizarItem(
                                                                indice,
                                                                {
                                                                    descuento,
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </article>
                                        ),
                                    )}
                                </div>
                            </Seccion>

                            <Seccion
                                titulo={
                                    formulario.pagos.length > 1
                                        ? "Pagos · Mixto"
                                        : "Pagos"
                                }
                                icono={
                                    CreditCard
                                }
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-[#6B756F]">
                                        {permitirPagoCombinado
                                            ? "Puedes combinar varios métodos."
                                            : "Solo se permite un método de pago."}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={
                                            agregarPago
                                        }
                                        disabled={
                                            saldo <= 0 ||
                                            (!permitirPagoCombinado &&
                                                formulario.pagos.length > 0)
                                        }
                                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B] disabled:opacity-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {formulario.pagos.length > 0
                                            ? "Agregar otro método"
                                            : "Agregar pago"}
                                    </button>
                                </div>

                                <div className="mt-4 space-y-4">
                                    {formulario.pagos.map(
                                        (pago, indice) => (
                                            <PagoVentaEditor
                                                key={indice}
                                                indice={indice}
                                                pago={pago}
                                                terminales={
                                                    terminalesDisponibles
                                                }
                                                actualizar={(cambios) =>
                                                    actualizarPago(
                                                        indice,
                                                        cambios,
                                                    )
                                                }
                                                eliminar={() =>
                                                    eliminarPago(indice)
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            </Seccion>
                        </div>

                        <aside className="xl:sticky xl:top-24 xl:self-start">
                            <section className="rounded-3xl border border-[#E3E7E4] bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-bold">
                                    Resumen
                                </h2>

                                <div className="mt-5 space-y-4">
                                    <Fila
                                        titulo="Subtotal"
                                        valor={
                                            subtotal
                                        }
                                    />

                                    <CampoDinero
                                        etiqueta="Descuento general"
                                        valor={
                                            formulario.descuento
                                        }
                                        maximo={
                                            subtotal
                                        }
                                        cambiar={(
                                            descuento,
                                        ) =>
                                            actualizar(
                                                "descuento",
                                                descuento,
                                            )
                                        }
                                    />

                                    <Fila
                                        titulo="Total"
                                        valor={total}
                                        destacado
                                    />

                                    <Fila
                                        titulo="Pagado"
                                        valor={
                                            totalPagos
                                        }
                                    />

                                    <Fila
                                        titulo="Comisión POS"
                                        valor={comisionTotal}
                                    />

                                    <Fila
                                        titulo="Ingreso neto"
                                        valor={totalPagos - comisionTotal}
                                    />

                                    <Fila
                                        titulo="Saldo"
                                        valor={saldo}
                                    />
                                </div>

                                <textarea
                                    rows={3}
                                    value={
                                        formulario.notas
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        actualizar(
                                            "notas",
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Notas de la venta..."
                                    className="mt-5 w-full rounded-xl border border-[#D4DAD6] p-3"
                                />

                                <button
                                    type="submit"
                                    disabled={
                                        guardando ||
                                        formulario.items
                                            .length ===
                                        0 ||
                                        totalPagos >
                                        total
                                    }
                                    className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6F8F83] font-bold text-white disabled:opacity-50"
                                >
                                    {guardando ? (
                                        <LoaderCircle className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <CircleDollarSign className="h-5 w-5" />
                                    )}
                                    Registrar venta
                                </button>
                            </section>
                        </aside>
                    </div>
                </form>
            )}
        </div>
    );
}

function PagoVentaEditor({
    indice,
    pago,
    terminales,
    actualizar,
    eliminar,
}: {
    indice: number;
    pago: PagoVentaDirecta;
    terminales: TerminalPosVentaDirecta[];
    actualizar: (
        cambios: Partial<PagoVentaDirecta>,
    ) => void;
    eliminar: () => void;
}) {
    const terminalSeleccionada =
        terminales.find(
            (terminal) =>
                terminal.id === pago.terminalPosId,
        );

    const comision =
        pago.metodoPago === "TARJETA"
            ? Number(pago.monto || 0) *
            (Number(
                terminalSeleccionada?.porcentaje_comision ??
                0,
            ) /
                100)
            : 0;

    return (
        <article className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-4">
            <div className="flex items-center justify-between">
                <p className="font-bold text-[#24302C]">
                    Pago {indice + 1}
                </p>

                <button
                    type="button"
                    onClick={eliminar}
                    className="rounded-xl bg-[#F8E5E5] p-2 text-[#A25E5E]"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <CampoSelect
                    etiqueta="Método"
                    valor={pago.metodoPago}
                    opciones={[
                        {
                            valor: "EFECTIVO",
                            texto: "Efectivo",
                        },
                        {
                            valor: "TARJETA",
                            texto: "Tarjeta / POS",
                        },
                        {
                            valor: "TRANSFERENCIA",
                            texto: "Transferencia",
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
                    cambiar={(metodoPago) =>
                        actualizar({
                            metodoPago:
                                metodoPago as PagoVentaDirecta["metodoPago"],
                            terminalPosId: null,
                            banco: "",
                            montoRecibido:
                                metodoPago === "EFECTIVO"
                                    ? pago.monto
                                    : null,
                        })
                    }
                />

                <CampoDinero
                    etiqueta="Monto"
                    valor={pago.monto}
                    cambiar={(monto) =>
                        actualizar({
                            monto,
                            montoRecibido:
                                pago.metodoPago === "EFECTIVO"
                                    ? Math.max(
                                        Number(
                                            pago.montoRecibido ?? 0,
                                        ),
                                        monto,
                                    )
                                    : null,
                        })
                    }
                />

                {pago.metodoPago === "TARJETA" && (
                    <>
                        <CampoSelect
                            etiqueta="Terminal POS"
                            valor={pago.terminalPosId ?? ""}
                            opciones={[
                                {
                                    valor: "",
                                    texto: "Seleccionar POS",
                                },
                                ...terminales.map(
                                    (terminal) => ({
                                        valor: terminal.id,
                                        texto: `${terminal.nombre} · ${Number(
                                            terminal.porcentaje_comision,
                                        )}%`,
                                    }),
                                ),
                            ]}
                            cambiar={(terminalPosId) => {
                                const terminal =
                                    terminales.find(
                                        (item) =>
                                            item.id === terminalPosId,
                                    );

                                actualizar({
                                    terminalPosId:
                                        terminalPosId || null,
                                    banco:
                                        terminal?.banco ?? "",
                                });
                            }}
                        />

                        <DatoPago
                            titulo="Comisión POS"
                            valor={formatearDinero(comision)}
                        />

                        <DatoPago
                            titulo="Ingreso neto"
                            valor={formatearDinero(
                                Number(pago.monto) - comision,
                            )}
                        />

                        <CampoTexto
                            etiqueta="Referencia"
                            valor={pago.referencia ?? ""}
                            cambiar={(referencia) =>
                                actualizar({ referencia })
                            }
                        />
                    </>
                )}

                {pago.metodoPago === "EFECTIVO" && (
                    <CampoDinero
                        etiqueta="Efectivo recibido"
                        valor={Number(
                            pago.montoRecibido ?? pago.monto,
                        )}
                        cambiar={(montoRecibido) =>
                            actualizar({ montoRecibido })
                        }
                    />
                )}

                {[
                    "TRANSFERENCIA",
                    "DEPOSITO",
                ].includes(pago.metodoPago) && (
                        <>
                            <CampoTexto
                                etiqueta="Banco"
                                valor={pago.banco ?? ""}
                                cambiar={(banco) =>
                                    actualizar({ banco })
                                }
                            />

                            <CampoTexto
                                etiqueta="Referencia"
                                valor={pago.referencia ?? ""}
                                cambiar={(referencia) =>
                                    actualizar({ referencia })
                                }
                            />
                        </>
                    )}

                {pago.metodoPago === "OTRO" && (
                    <CampoTexto
                        etiqueta="Observación"
                        valor={pago.observaciones ?? ""}
                        cambiar={(observaciones) =>
                            actualizar({ observaciones })
                        }
                    />
                )}
            </div>
        </article>
    );
}

function DatoPago({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl bg-[#F0F5F2] p-3">
            <p className="text-xs text-[#76817B]">
                {titulo}
            </p>
            <p className="mt-1 font-bold text-[#33413B]">
                {valor}
            </p>
        </div>
    );
}

function Seccion({
    titulo,
    icono: Icono,
    children,
}: {
    titulo: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-visible rounded-3xl border border-[#E3E7E4] bg-white shadow-sm">
            <header className="flex items-center gap-3 border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4">
                <Icono className="h-5 w-5 text-[#527064]" />
                <h2 className="font-bold">
                    {titulo}
                </h2>
            </header>
            <div className="p-5">
                {children}
            </div>
        </section>
    );
}

function CampoSelect({
    etiqueta,
    valor,
    opciones,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    opciones: {
        valor: string;
        texto: string;
    }[];
    cambiar: (valor: string) => void;
}) {
    return (
        <label>
            <span className="mb-2 block text-sm font-semibold">
                {etiqueta}
            </span>
            <select
                value={valor}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4"
            >
                {opciones.map((opcion) => (
                    <option
                        key={`${opcion.valor}-${opcion.texto}`}
                        value={opcion.valor}
                    >
                        {opcion.texto}
                    </option>
                ))}
            </select>
        </label>
    );
}

function CampoDinero({
    etiqueta,
    valor,
    cambiar,
    maximo,
}: {
    etiqueta: string;
    valor: number;
    cambiar: (valor: number) => void;
    maximo?: number;
}) {
    return (
        <label>
            <span className="mb-2 block text-sm font-semibold">
                {etiqueta}
            </span>
            <input
                type="number"
                min={0}
                max={maximo}
                step={0.01}
                value={valor}
                onChange={(event) =>
                    cambiar(
                        Number(event.target.value),
                    )
                }
                className="h-11 w-full rounded-xl border border-[#D4DAD6] px-4 text-right"
            />
        </label>
    );
}

function CampoTexto({
    etiqueta,
    valor,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    cambiar: (valor: string) => void;
}) {
    return (
        <label>
            <span className="mb-2 block text-sm font-semibold">
                {etiqueta}
            </span>
            <input
                value={valor}
                onChange={(event) =>
                    cambiar(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-[#D4DAD6] px-4"
            />
        </label>
    );
}

function Fila({
    titulo,
    valor,
    destacado = false,
}: {
    titulo: string;
    valor: number;
    destacado?: boolean;
}) {
    return (
        <div className="flex justify-between">
            <span>
                {titulo}
            </span>
            <strong
                className={
                    destacado
                        ? "text-xl"
                        : ""
                }
            >
                {formatearDinero(valor)}
            </strong>
        </div>
    );
}

function MensajeEstado({
    mensaje,
    cerrar,
}: {
    mensaje: Exclude<Mensaje, null>;
    cerrar: () => void;
}) {
    return (
        <div
            className={[
                "flex items-start gap-3 rounded-2xl border px-4 py-4",
                mensaje.tipo === "EXITO"
                    ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                    : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
            ].join(" ")}
        >
            {mensaje.tipo === "EXITO" ? (
                <CheckCircle2 className="h-5 w-5" />
            ) : (
                <XCircle className="h-5 w-5" />
            )}
            <p className="flex-1 text-sm font-semibold">
                {mensaje.texto}
            </p>
            <button
                type="button"
                onClick={cerrar}
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

function formatearDinero(valor: number) {
    return `C$ ${Number(valor).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    )}`;
}