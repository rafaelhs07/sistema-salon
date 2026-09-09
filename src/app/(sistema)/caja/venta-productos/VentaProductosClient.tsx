"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Barcode,
    Banknote,
    Building2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    CreditCard,
    Landmark,
    Minus,
    Package,
    Plus,
    ReceiptText,
    ScanLine,
    Search,
    ShoppingBasket,
    Store,
    Trash2,
    UserRound,
    WalletCards,
    X,
} from "lucide-react";
import {
    useMemo,
    useRef,
    useState,
} from "react";

import {
    registrarVentaProductos,
} from "./actions";

export type SucursalVentaProducto = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type ClienteVentaProducto = {
    id: string;
    nombre: string;
    telefono: string | null;
    whatsapp: string | null;
};

export type CategoriaVentaProducto = {
    id: string;
    nombre: string;
};

export type ExistenciaVentaProducto = {
    id: string;
    sucursal_id: string;
    producto_id: string;
    cantidad_actual: number;
    stock_minimo: number;
};

export type TerminalPOSVenta = {
    id: string;
    sucursal_id: string | null;
    nombre: string;
    banco: string | null;
    porcentaje_comision: number;
    estado: string;
};

export type ProductoVentaBase = {
    id: string;
    categoria_id: string | null;
    codigo_producto: string;
    codigo_barras: string | null;
    nombre: string;
    descripcion: string | null;
    marca: string | null;
    presentacion: string | null;
    unidad_medida: string;
    costo_unitario: number;
    precio_venta: number;
    permite_venta: boolean;
    controla_stock: boolean;
    estado: string;

    categorias_productos: {
        id: string;
        nombre: string;
    } | null;
};

type ItemCarrito = {
    productoId: string;
    cantidad: number;
};

type MetodoPago =
    | "EFECTIVO"
    | "TARJETA"
    | "TRANSFERENCIA"
    | "DEPOSITO"
    | "CREDITO"
    | "OTRO";

type PagoTemporal = {
    id: string;
    metodo: MetodoPago;
    monto: number;
    montoRecibido: number | null;
    terminalPosId: string | null;
    referencia: string;
};

export default function VentaProductosClient({
    sucursales,
    productos,
    existencias,
    categorias,
    clientes,
    terminales,
    simboloMoneda,
    permitirCredito,
    permitirPagoCombinado,
}: {
    sucursales: SucursalVentaProducto[];
    productos: ProductoVentaBase[];
    existencias: ExistenciaVentaProducto[];
    categorias: CategoriaVentaProducto[];
    clientes: ClienteVentaProducto[];
    terminales: TerminalPOSVenta[];
    simboloMoneda: string;
    permitirCredito: boolean;
    permitirPagoCombinado: boolean;
}) {
    const router = useRouter();

    const [sucursalId, setSucursalId] =
        useState(sucursales[0]?.id ?? "");
    const [clienteId, setClienteId] =
        useState("");
    const [
        busquedaCliente,
        setBusquedaCliente,
    ] = useState("");
    const [busqueda, setBusqueda] =
        useState("");
    const [categoriaId, setCategoriaId] =
        useState("");
    const [
        codigoBarras,
        setCodigoBarras,
    ] = useState("");
    const [carrito, setCarrito] =
        useState<ItemCarrito[]>([]);
    const [
        paginaActual,
        setPaginaActual,
    ] = useState(1);
    const [
        mostrarCobro,
        setMostrarCobro,
    ] = useState(false);
    const [pagos, setPagos] =
        useState<PagoTemporal[]>([]);

    const [
        guardandoVenta,
        setGuardandoVenta,
    ] = useState(false);

    const inputCodigoRef =
        useRef<HTMLInputElement>(null);

    const POR_PAGINA = 12;

    const clienteSeleccionado =
        clientes.find(
            (cliente) =>
                cliente.id === clienteId,
        ) ?? null;

    const clientesFiltrados = useMemo(() => {
        const texto =
            busquedaCliente
                .trim()
                .toLowerCase();

        if (!texto) {
            return clientes.slice(0, 8);
        }

        return clientes
            .filter(
                (cliente) =>
                    cliente.nombre
                        .toLowerCase()
                        .includes(texto) ||
                    cliente.telefono
                        ?.toLowerCase()
                        .includes(texto) ||
                    cliente.whatsapp
                        ?.toLowerCase()
                        .includes(texto),
            )
            .slice(0, 8);
    }, [busquedaCliente, clientes]);

    const productosFiltrados =
        useMemo(() => {
            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            return productos.filter(
                (producto) => {
                    const coincideTexto =
                        !texto ||
                        producto.nombre
                            .toLowerCase()
                            .includes(texto) ||
                        producto.codigo_producto
                            .toLowerCase()
                            .includes(texto) ||
                        producto.codigo_barras
                            ?.toLowerCase()
                            .includes(texto) ||
                        producto.marca
                            ?.toLowerCase()
                            .includes(texto) ||
                        producto.presentacion
                            ?.toLowerCase()
                            .includes(texto);

                    const coincideCategoria =
                        !categoriaId ||
                        producto.categoria_id ===
                        categoriaId;

                    return (
                        coincideTexto &&
                        coincideCategoria
                    );
                },
            );
        }, [
            busqueda,
            categoriaId,
            productos,
        ]);

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            productosFiltrados.length /
            POR_PAGINA,
        ),
    );

    const productosPagina =
        productosFiltrados.slice(
            (paginaActual - 1) *
            POR_PAGINA,
            paginaActual *
            POR_PAGINA,
        );

    const itemsCarrito = useMemo(() => {
        return carrito
            .map((item) => {
                const producto =
                    productos.find(
                        (producto) =>
                            producto.id ===
                            item.productoId,
                    );

                if (!producto) {
                    return null;
                }

                const existencia =
                    existencias.find(
                        (existencia) =>
                            existencia.sucursal_id ===
                            sucursalId &&
                            existencia.producto_id ===
                            producto.id,
                    );

                const stockDisponible =
                    producto.controla_stock
                        ? Number(
                            existencia
                                ?.cantidad_actual ??
                            0,
                        )
                        : null;

                return {
                    ...item,
                    producto,
                    stockDisponible,
                    subtotal:
                        item.cantidad *
                        Number(
                            producto.precio_venta,
                        ),
                };
            })
            .filter(
                (
                    item,
                ): item is NonNullable<
                    typeof item
                > => Boolean(item),
            );
    }, [
        carrito,
        existencias,
        productos,
        sucursalId,
    ]);

    const subtotal = itemsCarrito.reduce(
        (total, item) =>
            total + item.subtotal,
        0,
    );

    const descuento = 0;
    const total = subtotal - descuento;

    const totalPagos = pagos.reduce(
        (suma, pago) =>
            suma + pago.monto,
        0,
    );

    const saldoPendiente = Math.max(
        0,
        total - totalPagos,
    );

    const excesoPagado = Math.max(
        0,
        totalPagos - total,
    );

    const hayCredito = pagos.some(
        (pago) =>
            pago.metodo === "CREDITO",
    );

    const terminalesSucursal =
        terminales.filter(
            (terminal) =>
                terminal.sucursal_id ===
                null ||
                terminal.sucursal_id ===
                sucursalId,
        );

    function dinero(valor: number) {
        return `${simboloMoneda} ${Number(
            valor,
        ).toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function stockProducto(
        producto: ProductoVentaBase,
    ) {
        if (!producto.controla_stock) {
            return null;
        }

        return Number(
            existencias.find(
                (existencia) =>
                    existencia.sucursal_id ===
                    sucursalId &&
                    existencia.producto_id ===
                    producto.id,
            )?.cantidad_actual ?? 0,
        );
    }

    function cantidadEnCarrito(
        productoId: string,
    ) {
        return (
            carrito.find(
                (item) =>
                    item.productoId ===
                    productoId,
            )?.cantidad ?? 0
        );
    }

    function agregarProducto(
        producto: ProductoVentaBase,
        cantidad = 1,
    ) {
        if (cantidad <= 0) return;

        const actual =
            cantidadEnCarrito(
                producto.id,
            );
        const nuevaCantidad =
            actual + cantidad;
        const stock =
            stockProducto(producto);

        if (
            stock !== null &&
            nuevaCantidad > stock
        ) {
            alert(
                `Stock insuficiente. Disponible: ${formatearCantidad(
                    stock,
                )} ${abreviarUnidad(
                    producto.unidad_medida,
                )}.`,
            );
            return;
        }

        setCarrito((actualCarrito) => {
            const existe =
                actualCarrito.some(
                    (item) =>
                        item.productoId ===
                        producto.id,
                );

            if (existe) {
                return actualCarrito.map(
                    (item) =>
                        item.productoId ===
                            producto.id
                            ? {
                                ...item,
                                cantidad:
                                    item.cantidad +
                                    cantidad,
                            }
                            : item,
                );
            }

            return [
                ...actualCarrito,
                {
                    productoId:
                        producto.id,
                    cantidad,
                },
            ];
        });
    }

    function cambiarCantidad(
        producto: ProductoVentaBase,
        nuevaCantidad: number,
    ) {
        if (nuevaCantidad <= 0) {
            quitarProducto(producto.id);
            return;
        }

        const stock =
            stockProducto(producto);

        if (
            stock !== null &&
            nuevaCantidad > stock
        ) {
            alert(
                `No puedes vender más de ${formatearCantidad(
                    stock,
                )} ${abreviarUnidad(
                    producto.unidad_medida,
                )}.`,
            );
            return;
        }

        setCarrito((actual) =>
            actual.map((item) =>
                item.productoId ===
                    producto.id
                    ? {
                        ...item,
                        cantidad:
                            nuevaCantidad,
                    }
                    : item,
            ),
        );
    }

    function quitarProducto(
        productoId: string,
    ) {
        setCarrito((actual) =>
            actual.filter(
                (item) =>
                    item.productoId !==
                    productoId,
            ),
        );
    }

    function limpiarCarrito() {
        if (carrito.length === 0) return;

        if (
            window.confirm(
                "¿Quieres vaciar el carrito?",
            )
        ) {
            setCarrito([]);
            setPagos([]);
            setMostrarCobro(false);
        }
    }

    function procesarCodigoBarras() {
        const codigo =
            codigoBarras.trim();

        if (!codigo) {
            inputCodigoRef.current?.focus();
            return;
        }

        const producto =
            productos.find(
                (producto) =>
                    producto.codigo_barras?.trim() ===
                    codigo ||
                    producto.codigo_producto
                        .trim()
                        .toLowerCase() ===
                    codigo.toLowerCase(),
            );

        if (!producto) {
            alert(
                "No se encontró un producto con ese código.",
            );
            return;
        }

        agregarProducto(producto, 1);
        setCodigoBarras("");

        setTimeout(() => {
            inputCodigoRef.current?.focus();
        }, 0);
    }

    function cambiarSucursal(
        nuevaSucursal: string,
    ) {
        if (
            carrito.length > 0 &&
            nuevaSucursal !==
            sucursalId
        ) {
            const aceptar =
                window.confirm(
                    "Cambiar de sucursal vaciará el carrito y los pagos temporales. ¿Deseas continuar?",
                );

            if (!aceptar) return;

            setCarrito([]);
            setPagos([]);
            setMostrarCobro(false);
        }

        setSucursalId(
            nuevaSucursal,
        );
    }

    function abrirCobro() {
        if (
            itemsCarrito.length === 0
        ) {
            return;
        }

        if (pagos.length === 0) {
            setPagos([
                {
                    id:
                        crypto.randomUUID(),
                    metodo: "EFECTIVO",
                    monto: total,
                    montoRecibido:
                        total,
                    terminalPosId:
                        null,
                    referencia: "",
                },
            ]);
        }

        setMostrarCobro(true);
    }

    function agregarPago() {
        if (
            !permitirPagoCombinado &&
            pagos.length >= 1
        ) {
            alert(
                "El pago combinado está desactivado en la configuración del salón.",
            );
            return;
        }

        setPagos((actual) => [
            ...actual,
            {
                id: crypto.randomUUID(),
                metodo: "EFECTIVO",
                monto:
                    saldoPendiente > 0
                        ? saldoPendiente
                        : 0,
                montoRecibido:
                    saldoPendiente > 0
                        ? saldoPendiente
                        : 0,
                terminalPosId:
                    null,
                referencia: "",
            },
        ]);
    }

    function actualizarPago(
        id: string,
        cambios: Partial<PagoTemporal>,
    ) {
        setPagos((actual) =>
            actual.map((pago) =>
                pago.id === id
                    ? {
                        ...pago,
                        ...cambios,
                    }
                    : pago,
            ),
        );
    }

    function cambiarMetodo(
        pago: PagoTemporal,
        metodo: MetodoPago,
    ) {
        if (
            metodo === "CREDITO" &&
            !permitirCredito
        ) {
            alert(
                "La venta a crédito está desactivada en la configuración del salón.",
            );
            return;
        }

        if (
            metodo === "CREDITO" &&
            !clienteId
        ) {
            alert(
                "Para vender a crédito debes seleccionar un cliente.",
            );
            return;
        }

        actualizarPago(pago.id, {
            metodo,
            terminalPosId:
                metodo === "TARJETA"
                    ? pago.terminalPosId ??
                    terminalesSucursal[0]?.id ??
                    null
                    : null,
            montoRecibido:
                metodo === "EFECTIVO"
                    ? pago.monto
                    : null,
        });
    }

    function eliminarPago(id: string) {
        setPagos((actual) =>
            actual.filter(
                (pago) =>
                    pago.id !== id,
            ),
        );
    }

    async function confirmarCobro() {
        if (
            itemsCarrito.length === 0
        ) {
            alert(
                "El carrito está vacío.",
            );
            return;
        }

        if (pagos.length === 0) {
            alert(
                "Agrega al menos un método de pago.",
            );
            return;
        }

        for (const pago of pagos) {
            if (
                pago.monto <= 0 ||
                !Number.isFinite(
                    pago.monto,
                )
            ) {
                alert(
                    "Todos los pagos deben tener un monto mayor que cero.",
                );
                return;
            }

            if (
                pago.metodo ===
                "TARJETA" &&
                !pago.terminalPosId
            ) {
                alert(
                    "Selecciona el POS para el pago con tarjeta.",
                );
                return;
            }

            if (
                pago.metodo ===
                "EFECTIVO" &&
                Number(
                    pago.montoRecibido ??
                    0,
                ) < pago.monto
            ) {
                alert(
                    "El monto recibido en efectivo no puede ser menor que el pago.",
                );
                return;
            }

            if (
                pago.metodo ===
                "CREDITO" &&
                !clienteId
            ) {
                alert(
                    "Selecciona un cliente para registrar una venta a crédito.",
                );
                return;
            }
        }

        if (
            Math.abs(
                totalPagos - total,
            ) > 0.01
        ) {
            alert(
                `Los métodos de pago deben sumar exactamente ${dinero(
                    total,
                )}. Actualmente suman ${dinero(
                    totalPagos,
                )}.`,
            );
            return;
        }

        const confirmar =
            window.confirm(
                `¿Registrar la venta por ${dinero(
                    total,
                )}?`,
            );

        if (!confirmar) {
            return;
        }

        try {
            setGuardandoVenta(true);

            const resultado =
                await registrarVentaProductos(
                    {
                        sucursalId,

                        clienteId:
                            clienteId ||
                            null,

                        items:
                            itemsCarrito.map(
                                (item) => ({
                                    productoId:
                                        item.productoId,

                                    cantidad:
                                        item.cantidad,
                                }),
                            ),

                        pagos:
                            pagos.map(
                                (pago) => ({
                                    metodo:
                                        pago.metodo,

                                    monto:
                                        pago.monto,

                                    montoRecibido:
                                        pago.montoRecibido,

                                    terminalPosId:
                                        pago.terminalPosId,

                                    referencia:
                                        pago.referencia,
                                }),
                            ),
                    },
                );

            if (!resultado.exito) {
                alert(
                    resultado.mensaje,
                );
                return;
            }

            let mensaje =
                "Venta registrada correctamente.\\n\\n";

            if (
                resultado.codigoVenta
            ) {
                mensaje +=
                    `Venta: ${resultado.codigoVenta}\\n`;
            }

            mensaje +=
                `Total: ${dinero(
                    resultado.total ??
                    total,
                )}`;

            if (
                Number(
                    resultado.saldoPendiente ??
                    0,
                ) > 0
            ) {
                mensaje +=
                    `\\nSaldo pendiente: ${dinero(
                        resultado.saldoPendiente ??
                        0,
                    )}`;
            }

            if (
                Number(
                    resultado.cambio ??
                    0,
                ) > 0
            ) {
                mensaje +=
                    `\\nCambio: ${dinero(
                        resultado.cambio ??
                        0,
                    )}`;
            }

            alert(mensaje);

            setCarrito([]);
            setPagos([]);
            setClienteId("");
            setBusquedaCliente("");
            setBusqueda("");
            setCodigoBarras("");
            setCategoriaId("");
            setPaginaActual(1);
            setMostrarCobro(false);

            if (resultado.ventaId) {
                router.push(
                    `/caja/venta-productos/recibo/${resultado.ventaId}`,
                );
                return;
            }

            router.refresh();
        } catch (error) {
            console.error(
                "Error confirmando venta:",
                error,
            );

            alert(
                "Ocurrió un error al registrar la venta.",
            );
        } finally {
            setGuardandoVenta(false);
        }
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-[#DDE4DF] bg-white shadow-[0_18px_55px_rgba(36,48,44,0.08)]">
                <div className="grid lg:grid-cols-[1fr_390px]">
                    <div className="relative overflow-hidden bg-[#26332F] p-7 text-white sm:p-9">
                        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#6F8F83]/20 blur-3xl" />

                        <div className="relative">
                            <Link
                                href="/caja"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver a Caja
                            </Link>

                            <div className="mt-6 flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                                    <ShoppingBasket className="h-7 w-7 text-[#DCE7E2]" />
                                </div>

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#AFC2B9]">
                                        Caja
                                    </p>

                                    <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
                                        Venta de productos
                                    </h1>

                                    <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                        Arma el carrito y
                                        distribuye el cobro
                                        entre uno o varios
                                        métodos de pago.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#F8FAF8] p-6 sm:p-7">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7A8781]">
                            Total provisional
                        </p>

                        <p className="mt-3 text-3xl font-bold text-[#26332F]">
                            {dinero(total)}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            <MiniEstado
                                titulo="Pago mixto"
                                activo={
                                    permitirPagoCombinado
                                }
                            />
                            <MiniEstado
                                titulo="Crédito"
                                activo={
                                    permitirCredito
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
                <div className="space-y-6">
                    <section className="rounded-[28px] border border-[#E0E6E2] bg-white shadow-sm">
                        <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                            <h2 className="font-bold text-[#26332F]">
                                1. Datos de la venta
                            </h2>
                        </header>

                        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                            <label>
                                <span className="mb-2 block text-xs font-bold text-[#52605A]">
                                    Sucursal
                                </span>

                                <select
                                    value={
                                        sucursalId
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        cambiarSucursal(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
                                >
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
                                </select>
                            </label>

                            <div>
                                <span className="mb-2 block text-xs font-bold text-[#52605A]">
                                    Cliente
                                </span>

                                <div className="relative">
                                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                                    <input
                                        value={
                                            busquedaCliente
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setBusquedaCliente(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        placeholder="Buscar cliente (opcional)..."
                                        className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-[#FBFCFB] pl-11 pr-4 text-sm"
                                    />
                                </div>

                                {busquedaCliente &&
                                    !clienteSeleccionado && (
                                        <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-[#E1E6E3] bg-white p-2 shadow-lg">
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
                                                            setClienteId(
                                                                cliente.id,
                                                            );
                                                            setBusquedaCliente(
                                                                cliente.nombre,
                                                            );
                                                        }}
                                                        className="w-full rounded-xl px-3 py-2.5 text-left hover:bg-[#F4F7F5]"
                                                    >
                                                        <p className="text-sm font-bold text-[#26332F]">
                                                            {
                                                                cliente.nombre
                                                            }
                                                        </p>
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[28px] border border-[#E0E6E2] bg-white shadow-sm">
                        <header className="border-b border-[#E8ECE9] p-5 sm:p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <h2 className="font-bold text-[#26332F]">
                                        2. Productos
                                    </h2>
                                    <p className="mt-1 text-sm text-[#718078]">
                                        Busca o escanea
                                        productos.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Barcode className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                                        <input
                                            ref={
                                                inputCodigoRef
                                            }
                                            value={
                                                codigoBarras
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setCodigoBarras(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            onKeyDown={(
                                                event,
                                            ) => {
                                                if (
                                                    event.key ===
                                                    "Enter"
                                                ) {
                                                    event.preventDefault();
                                                    procesarCodigoBarras();
                                                }
                                            }}
                                            placeholder="Código..."
                                            className="h-10 w-48 rounded-xl border border-[#D4DAD6] pl-11 pr-3 text-sm"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            procesarCodigoBarras
                                        }
                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#26332F] text-white"
                                    >
                                        <ScanLine className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </header>

                        <div className="space-y-5 p-5 sm:p-6">
                            <div className="flex flex-col gap-3 lg:flex-row">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />
                                    <input
                                        value={
                                            busqueda
                                        }
                                        onChange={(
                                            event,
                                        ) => {
                                            setBusqueda(
                                                event
                                                    .target
                                                    .value,
                                            );
                                            setPaginaActual(
                                                1,
                                            );
                                        }}
                                        placeholder="Buscar producto..."
                                        className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-[#FBFCFB] pl-11 pr-4 text-sm"
                                    />
                                </div>

                                <select
                                    value={
                                        categoriaId
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        setCategoriaId(
                                            event
                                                .target
                                                .value,
                                        );
                                        setPaginaActual(
                                            1,
                                        );
                                    }}
                                    className="h-11 rounded-xl border border-[#D4DAD6] bg-white px-4 text-sm"
                                >
                                    <option value="">
                                        Todas las categorías
                                    </option>
                                    {categorias.map(
                                        (
                                            categoria,
                                        ) => (
                                            <option
                                                key={
                                                    categoria.id
                                                }
                                                value={
                                                    categoria.id
                                                }
                                            >
                                                {
                                                    categoria.nombre
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                                {productosPagina.map(
                                    (producto) => {
                                        const stock =
                                            stockProducto(
                                                producto,
                                            );
                                        const agotado =
                                            stock !==
                                            null &&
                                            stock <= 0;

                                        return (
                                            <article
                                                key={
                                                    producto.id
                                                }
                                                className="rounded-[22px] border border-[#E1E6E3] p-4"
                                            >
                                                <p className="truncate text-sm font-bold text-[#26332F]">
                                                    {
                                                        producto.nombre
                                                    }
                                                </p>
                                                <p className="mt-1 text-xs text-[#829089]">
                                                    {
                                                        producto.codigo_producto
                                                    }
                                                </p>

                                                <div className="mt-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-[#315C4B]">
                                                            {dinero(
                                                                producto.precio_venta,
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-[10px] text-[#829089]">
                                                            {stock ===
                                                                null
                                                                ? "Sin control de stock"
                                                                : `Stock: ${formatearCantidad(
                                                                    stock,
                                                                )}`}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            agotado
                                                        }
                                                        onClick={() =>
                                                            agregarProducto(
                                                                producto,
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#26332F] text-white disabled:bg-[#E5E9E6] disabled:text-[#9AA29E]"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    },
                                )}
                            </div>

                            {totalPaginas > 1 && (
                                <div className="flex justify-end gap-2 border-t border-[#EDF1EE] pt-4">
                                    <button
                                        type="button"
                                        disabled={
                                            paginaActual <=
                                            1
                                        }
                                        onClick={() =>
                                            setPaginaActual(
                                                (
                                                    p,
                                                ) =>
                                                    p -
                                                    1,
                                            )
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2EF] disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            paginaActual >=
                                            totalPaginas
                                        }
                                        onClick={() =>
                                            setPaginaActual(
                                                (
                                                    p,
                                                ) =>
                                                    p +
                                                    1,
                                            )
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2EF] disabled:opacity-40"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <aside>
                    <div className="sticky top-5 space-y-4">
                        <section className="overflow-hidden rounded-[26px] border border-[#E0E6E2] bg-white shadow-sm">
                            <header className="flex items-center justify-between border-b border-[#EDF1EE] p-5">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#849189]">
                                        Carrito
                                    </p>
                                    <h2 className="mt-1 font-bold text-[#26332F]">
                                        {
                                            itemsCarrito.length
                                        }{" "}
                                        producto
                                        {itemsCarrito.length ===
                                            1
                                            ? ""
                                            : "s"}
                                    </h2>
                                </div>

                                {itemsCarrito.length >
                                    0 && (
                                        <button
                                            type="button"
                                            onClick={
                                                limpiarCarrito
                                            }
                                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8E5E5] text-[#A25E5E]"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                            </header>

                            <div className="max-h-[360px] divide-y divide-[#EDF1EE] overflow-y-auto">
                                {itemsCarrito.map(
                                    (item) => (
                                        <div
                                            key={
                                                item.productoId
                                            }
                                            className="p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-[#26332F]">
                                                        {
                                                            item
                                                                .producto
                                                                .nombre
                                                        }
                                                    </p>
                                                    <p className="mt-1 text-xs text-[#829089]">
                                                        {dinero(
                                                            item
                                                                .producto
                                                                .precio_venta,
                                                        )}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        quitarProducto(
                                                            item.productoId,
                                                        )
                                                    }
                                                    className="text-[#A25E5E]"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="inline-flex items-center rounded-xl bg-[#F4F6F4] p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            cambiarCantidad(
                                                                item.producto,
                                                                item.cantidad -
                                                                1,
                                                            )
                                                        }
                                                        className="flex h-7 w-7 items-center justify-center"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>

                                                    <span className="min-w-10 text-center text-xs font-bold">
                                                        {formatearCantidad(
                                                            item.cantidad,
                                                        )}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            cambiarCantidad(
                                                                item.producto,
                                                                item.cantidad +
                                                                1,
                                                            )
                                                        }
                                                        className="flex h-7 w-7 items-center justify-center"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                <strong className="text-sm text-[#315C4B]">
                                                    {dinero(
                                                        item.subtotal,
                                                    )}
                                                </strong>
                                            </div>
                                        </div>
                                    ),
                                )}

                                {itemsCarrito.length ===
                                    0 && (
                                        <div className="p-8 text-center text-sm text-[#718078]">
                                            Carrito vacío
                                        </div>
                                    )}
                            </div>

                            <div className="space-y-3 border-t border-[#EDF1EE] p-5">
                                <ResumenLinea
                                    titulo="Subtotal"
                                    valor={dinero(
                                        subtotal,
                                    )}
                                />
                                <ResumenLinea
                                    titulo="Total"
                                    valor={dinero(
                                        total,
                                    )}
                                    fuerte
                                />
                            </div>
                        </section>

                        <button
                            type="button"
                            disabled={
                                itemsCarrito.length ===
                                0
                            }
                            onClick={
                                abrirCobro
                            }
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#26332F] text-sm font-bold text-white disabled:opacity-45"
                        >
                            <WalletCards className="h-4 w-4" />
                            Continuar al cobro
                        </button>
                    </div>
                </aside>
            </div>

            {mostrarCobro && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[30px] bg-white shadow-2xl">
                        <header className="flex items-center justify-between border-b border-[#E8ECE9] p-5 sm:p-6">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#849189]">
                                    Cobro
                                </p>
                                <h2 className="mt-1 text-2xl font-bold text-[#26332F]">
                                    Distribuir pago
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setMostrarCobro(
                                        false,
                                    )
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2EF]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>

                        <div className="space-y-5 p-5 sm:p-6">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <CobroResumen
                                    titulo="Total venta"
                                    valor={dinero(
                                        total,
                                    )}
                                />
                                <CobroResumen
                                    titulo="Aplicado"
                                    valor={dinero(
                                        totalPagos,
                                    )}
                                />
                                <CobroResumen
                                    titulo={
                                        saldoPendiente >
                                            0
                                            ? "Pendiente"
                                            : "Cubierto"
                                    }
                                    valor={dinero(
                                        saldoPendiente,
                                    )}
                                />
                            </div>

                            <div className="space-y-3">
                                {pagos.map(
                                    (
                                        pago,
                                        index,
                                    ) => (
                                        <PagoCard
                                            key={
                                                pago.id
                                            }
                                            numero={
                                                index +
                                                1
                                            }
                                            pago={
                                                pago
                                            }
                                            terminales={
                                                terminalesSucursal
                                            }
                                            simboloMoneda={
                                                simboloMoneda
                                            }
                                            permitirCredito={
                                                permitirCredito
                                            }
                                            cambiarMetodo={(
                                                metodo,
                                            ) =>
                                                cambiarMetodo(
                                                    pago,
                                                    metodo,
                                                )
                                            }
                                            actualizar={(
                                                cambios,
                                            ) =>
                                                actualizarPago(
                                                    pago.id,
                                                    cambios,
                                                )
                                            }
                                            eliminar={() =>
                                                eliminarPago(
                                                    pago.id,
                                                )
                                            }
                                        />
                                    ),
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={
                                    agregarPago
                                }
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#EEF2EF] px-4 text-sm font-bold text-[#52605A]"
                            >
                                <Plus className="h-4 w-4" />
                                Agregar método
                            </button>

                            {hayCredito &&
                                !clienteId && (
                                    <div className="rounded-xl bg-[#FFF5E4] p-3 text-xs text-[#8D6A28]">
                                        Para utilizar crédito
                                        debes seleccionar un
                                        cliente.
                                    </div>
                                )}

                            <div className="flex flex-col gap-2 border-t border-[#EDF1EE] pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setMostrarCobro(
                                            false,
                                        )
                                    }
                                    className="h-11 rounded-xl bg-[#EEF2EF] px-5 text-sm font-bold text-[#52605A]"
                                >
                                    Volver
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        confirmarCobro
                                    }
                                    disabled={
                                        guardandoVenta
                                    }
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#26332F] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ReceiptText className="h-4 w-4" />
                                    {guardandoVenta
                                        ? "Registrando venta..."
                                        : "Confirmar cobro"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PagoCard({
    numero,
    pago,
    terminales,
    simboloMoneda,
    permitirCredito,
    cambiarMetodo,
    actualizar,
    eliminar,
}: {
    numero: number;
    pago: PagoTemporal;
    terminales: TerminalPOSVenta[];
    simboloMoneda: string;
    permitirCredito: boolean;
    cambiarMetodo: (
        metodo: MetodoPago,
    ) => void;
    actualizar: (
        cambios: Partial<PagoTemporal>,
    ) => void;
    eliminar: () => void;
}) {
    const terminal =
        terminales.find(
            (item) =>
                item.id ===
                pago.terminalPosId,
        ) ?? null;

    const comision =
        pago.metodo === "TARJETA" &&
            terminal
            ? pago.monto *
            (Number(
                terminal.porcentaje_comision,
            ) /
                100)
            : 0;

    const cambio =
        pago.metodo === "EFECTIVO"
            ? Math.max(
                0,
                Number(
                    pago.montoRecibido ??
                    0,
                ) - pago.monto,
            )
            : 0;

    return (
        <section className="rounded-2xl border border-[#E1E6E3] bg-[#FBFCFB] p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-[#26332F]">
                    Pago {numero}
                </p>

                <button
                    type="button"
                    onClick={eliminar}
                    className="text-[#A25E5E]"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label>
                    <span className="mb-1.5 block text-[10px] font-bold uppercase text-[#829089]">
                        Método
                    </span>

                    <select
                        value={
                            pago.metodo
                        }
                        onChange={(
                            event,
                        ) =>
                            cambiarMetodo(
                                event.target
                                    .value as MetodoPago,
                            )
                        }
                        className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 text-sm"
                    >
                        <option value="EFECTIVO">
                            Efectivo
                        </option>
                        <option value="TARJETA">
                            Tarjeta / POS
                        </option>
                        <option value="TRANSFERENCIA">
                            Transferencia
                        </option>
                        <option value="DEPOSITO">
                            Depósito
                        </option>
                        {permitirCredito && (
                            <option value="CREDITO">
                                Crédito
                            </option>
                        )}
                        <option value="OTRO">
                            Otro
                        </option>
                    </select>
                </label>

                <label>
                    <span className="mb-1.5 block text-[10px] font-bold uppercase text-[#829089]">
                        Monto
                    </span>

                    <div className="relative">
                        <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#829089]" />

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                                pago.monto
                            }
                            onChange={(
                                event,
                            ) =>
                                actualizar({
                                    monto:
                                        Number(
                                            event
                                                .target
                                                .value ||
                                            0,
                                        ),
                                })
                            }
                            className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white pl-10 pr-3 text-sm"
                        />
                    </div>
                </label>

                {pago.metodo ===
                    "EFECTIVO" && (
                        <label>
                            <span className="mb-1.5 block text-[10px] font-bold uppercase text-[#829089]">
                                Recibido
                            </span>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                    pago.montoRecibido ??
                                    ""
                                }
                                onChange={(
                                    event,
                                ) =>
                                    actualizar({
                                        montoRecibido:
                                            Number(
                                                event
                                                    .target
                                                    .value ||
                                                0,
                                            ),
                                    })
                                }
                                className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 text-sm"
                            />

                            <p className="mt-1 text-xs font-semibold text-[#527865]">
                                Cambio:{" "}
                                {simboloMoneda}{" "}
                                {cambio.toFixed(
                                    2,
                                )}
                            </p>
                        </label>
                    )}

                {pago.metodo ===
                    "TARJETA" && (
                        <label>
                            <span className="mb-1.5 block text-[10px] font-bold uppercase text-[#829089]">
                                Terminal POS
                            </span>

                            <select
                                value={
                                    pago.terminalPosId ??
                                    ""
                                }
                                onChange={(
                                    event,
                                ) =>
                                    actualizar({
                                        terminalPosId:
                                            event
                                                .target
                                                .value ||
                                            null,
                                    })
                                }
                                className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 text-sm"
                            >
                                <option value="">
                                    Seleccionar POS
                                </option>

                                {terminales.map(
                                    (
                                        terminal,
                                    ) => (
                                        <option
                                            key={
                                                terminal.id
                                            }
                                            value={
                                                terminal.id
                                            }
                                        >
                                            {
                                                terminal.nombre
                                            }
                                            {terminal.banco
                                                ? ` · ${terminal.banco}`
                                                : ""}
                                        </option>
                                    ),
                                )}
                            </select>

                            {terminal && (
                                <p className="mt-1 text-xs text-[#718078]">
                                    Comisión{" "}
                                    {
                                        terminal.porcentaje_comision
                                    }
                                    % ≈{" "}
                                    {simboloMoneda}{" "}
                                    {comision.toFixed(
                                        2,
                                    )}
                                </p>
                            )}
                        </label>
                    )}

                {[
                    "TARJETA",
                    "TRANSFERENCIA",
                    "DEPOSITO",
                    "OTRO",
                ].includes(
                    pago.metodo,
                ) && (
                        <label className={
                            pago.metodo ===
                                "TARJETA"
                                ? "sm:col-span-2"
                                : ""
                        }>
                            <span className="mb-1.5 block text-[10px] font-bold uppercase text-[#829089]">
                                Referencia
                            </span>

                            <input
                                value={
                                    pago.referencia
                                }
                                onChange={(
                                    event,
                                ) =>
                                    actualizar({
                                        referencia:
                                            event
                                                .target
                                                .value,
                                    })
                                }
                                placeholder="Número o referencia opcional"
                                className="h-10 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 text-sm"
                            />
                        </label>
                    )}
            </div>
        </section>
    );
}

function CobroResumen({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-2xl bg-[#F8FAF8] p-4">
            <p className="text-[10px] font-bold uppercase text-[#829089]">
                {titulo}
            </p>
            <p className="mt-2 text-lg font-bold text-[#26332F]">
                {valor}
            </p>
        </div>
    );
}

function MiniEstado({
    titulo,
    activo,
}: {
    titulo: string;
    activo: boolean;
}) {
    return (
        <div className="rounded-xl border border-[#E1E6E3] bg-white p-3">
            <p className="text-[10px] font-bold uppercase text-[#89948F]">
                {titulo}
            </p>
            <p className="mt-1 text-xs font-bold text-[#405049]">
                {activo
                    ? "Permitido"
                    : "No permitido"}
            </p>
        </div>
    );
}

function ResumenLinea({
    titulo,
    valor,
    fuerte = false,
}: {
    titulo: string;
    valor: string;
    fuerte?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span
                className={
                    fuerte
                        ? "font-bold text-[#26332F]"
                        : "text-sm text-[#718078]"
                }
            >
                {titulo}
            </span>

            <strong
                className={
                    fuerte
                        ? "text-xl text-[#26332F]"
                        : "text-sm text-[#405049]"
                }
            >
                {valor}
            </strong>
        </div>
    );
}

function formatearCantidad(
    valor: number,
) {
    return Number(valor).toLocaleString(
        "es-NI",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
        },
    );
}

function abreviarUnidad(
    unidad: string,
) {
    const unidades: Record<
        string,
        string
    > = {
        UNIDAD: "und.",
        ML: "ml",
        LITRO: "L",
        GRAMO: "g",
        KILOGRAMO: "kg",
        ONZA: "oz",
        CAJA: "caja",
        PAQUETE: "paq.",
    };

    return (
        unidades[
        unidad.toUpperCase()
        ] ?? unidad
    );
}