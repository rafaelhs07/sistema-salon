import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ConsumosServiciosClient, {
    type ConsumoServicioListado,
    type SucursalConsumo,
} from "./ConsumosServiciosClient";

type MovimientoBase = {
    id: string;
    sucursal_id: string;
    producto_id: string;
    cita_id: string | null;
    cantidad: number;
    cantidad_anterior: number;
    cantidad_nueva: number;
    referencia: string | null;
    concepto: string | null;
    observaciones: string | null;
    fecha_movimiento: string;
};

type ProductoBase = {
    id: string;
    codigo_producto: string;
    nombre: string;
    unidad_medida: string;
};

type CitaBase = {
    id: string;
    codigo_cita: string;
    cliente_id: string | null;
    fecha_cita: string;
};

type ClienteBase = {
    id: string;
    nombre: string;
};

export default async function ConsumosServiciosPage() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        redirect("/login");
    }

    const { data: perfil, error: perfilError } =
        await supabase
            .from("usuarios_perfiles")
            .select("salon_id, rol, estado")
            .eq("id", user.id)
            .single();

    if (
        perfilError ||
        !perfil ||
        perfil.estado !== "ACTIVO"
    ) {
        redirect("/login");
    }

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
            "RECEPCION",
            "CAJA",
            "INVENTARIO",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const [
        resultadoMovimientos,
        resultadoSucursales,
    ] = await Promise.all([
        supabase
            .from("inventario_movimientos")
            .select(`
                id,
                sucursal_id,
                producto_id,
                cita_id,
                cantidad,
                cantidad_anterior,
                cantidad_nueva,
                referencia,
                concepto,
                observaciones,
                fecha_movimiento
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("tipo", "CONSUMO_SERVICIO")
            .eq("naturaleza", "SALIDA")
            .order("fecha_movimiento", {
                ascending: false,
            })
            .limit(3000),

        supabase
            .from("sucursales")
            .select(`
                id,
                nombre
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("nombre"),
    ]);

    if (resultadoMovimientos.error) {
        console.error(
            "Error cargando consumos de servicios:",
            resultadoMovimientos.error,
        );
    }

    const movimientos =
        (resultadoMovimientos.data ??
            []) as MovimientoBase[];

    const productoIds = [
        ...new Set(
            movimientos.map(
                (movimiento) =>
                    movimiento.producto_id,
            ),
        ),
    ];

    const citaIds = [
        ...new Set(
            movimientos
                .map(
                    (movimiento) =>
                        movimiento.cita_id,
                )
                .filter(
                    (
                        id,
                    ): id is string =>
                        Boolean(id),
                ),
        ),
    ];

    const [
        resultadoProductos,
        resultadoCitas,
    ] = await Promise.all([
        productoIds.length > 0
            ? supabase
                .from("productos")
                .select(`
                      id,
                      codigo_producto,
                      nombre,
                      unidad_medida
                  `)
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .in("id", productoIds)
            : Promise.resolve({
                data: [],
                error: null,
            }),

        citaIds.length > 0
            ? supabase
                .from("citas")
                .select(`
                      id,
                      codigo_cita,
                      cliente_id,
                      fecha_cita
                  `)
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .in("id", citaIds)
            : Promise.resolve({
                data: [],
                error: null,
            }),
    ]);

    const productos =
        (resultadoProductos.data ??
            []) as ProductoBase[];

    const citas =
        (resultadoCitas.data ??
            []) as CitaBase[];

    const clienteIds = [
        ...new Set(
            citas
                .map(
                    (cita) =>
                        cita.cliente_id,
                )
                .filter(
                    (
                        id,
                    ): id is string =>
                        Boolean(id),
                ),
        ),
    ];

    let clientes: ClienteBase[] = [];

    if (clienteIds.length > 0) {
        const {
            data,
            error,
        } = await supabase
            .from("clientes")
            .select("id, nombre")
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .in("id", clienteIds);

        if (error) {
            console.error(
                "Error cargando clientes de consumos:",
                error,
            );
        }

        clientes =
            (data ?? []) as ClienteBase[];
    }

    const sucursales =
        (resultadoSucursales.data ??
            []) as SucursalConsumo[];

    const consumos: ConsumoServicioListado[] =
        movimientos.map(
            (movimiento) => {
                const producto =
                    productos.find(
                        (item) =>
                            item.id ===
                            movimiento.producto_id,
                    ) ?? null;

                const cita =
                    movimiento.cita_id
                        ? citas.find(
                            (item) =>
                                item.id ===
                                movimiento.cita_id,
                        ) ?? null
                        : null;

                const cliente =
                    cita?.cliente_id
                        ? clientes.find(
                            (item) =>
                                item.id ===
                                cita.cliente_id,
                        ) ?? null
                        : null;

                const sucursal =
                    sucursales.find(
                        (item) =>
                            item.id ===
                            movimiento.sucursal_id,
                    ) ?? null;

                return {
                    id: movimiento.id,
                    sucursalId:
                        movimiento.sucursal_id,
                    sucursalNombre:
                        sucursal?.nombre ??
                        "Sucursal",
                    productoId:
                        movimiento.producto_id,
                    productoCodigo:
                        producto?.codigo_producto ??
                        "",
                    productoNombre:
                        producto?.nombre ??
                        "Producto",
                    unidadMedida:
                        producto?.unidad_medida ??
                        "",
                    citaId:
                        movimiento.cita_id,
                    codigoCita:
                        cita?.codigo_cita ??
                        movimiento.referencia ??
                        "Sin cita",
                    fechaCita:
                        cita?.fecha_cita ??
                        null,
                    clienteNombre:
                        cliente?.nombre ??
                        "Consumidor",
                    cantidad: Number(
                        movimiento.cantidad,
                    ),
                    cantidadAnterior:
                        Number(
                            movimiento.cantidad_anterior,
                        ),
                    cantidadNueva:
                        Number(
                            movimiento.cantidad_nueva,
                        ),
                    concepto:
                        movimiento.concepto,
                    observaciones:
                        movimiento.observaciones,
                    fechaMovimiento:
                        movimiento.fecha_movimiento,
                };
            },
        );

    return (
        <div className="mx-auto max-w-[1600px]">
            <ConsumosServiciosClient
                consumosIniciales={consumos}
                sucursales={sucursales}
            />
        </div>
    );
}