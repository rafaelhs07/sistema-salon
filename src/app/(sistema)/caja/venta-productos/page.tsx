import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import VentaProductosClient, {
    type CategoriaVentaProducto,
    type ClienteVentaProducto,
    type ExistenciaVentaProducto,
    type ProductoVentaBase,
    type SucursalVentaProducto,
    type TerminalPOSVenta,
} from "./VentaProductosClient";

export default async function VentaProductosPage() {
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
            "CAJA",
            "RECEPCION",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const [
        resultadoSucursales,
        resultadoProductos,
        resultadoExistencias,
        resultadoCategorias,
        resultadoClientes,
        resultadoConfiguracion,
        resultadoTerminales,
    ] = await Promise.all([
        supabase
            .from("sucursales")
            .select(`
                id,
                nombre,
                es_principal
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("es_principal", {
                ascending: false,
            })
            .order("nombre"),

        supabase
            .from("productos")
            .select(`
                id,
                categoria_id,
                codigo_producto,
                codigo_barras,
                nombre,
                descripcion,
                marca,
                presentacion,
                unidad_medida,
                costo_unitario,
                precio_venta,
                permite_venta,
                controla_stock,
                estado,
                categorias_productos (
                    id,
                    nombre
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .eq("permite_venta", true)
            .order("nombre"),

        supabase
            .from("inventario_existencias")
            .select(`
                id,
                sucursal_id,
                producto_id,
                cantidad_actual,
                stock_minimo
            `)
            .eq("salon_id", perfil.salon_id),

        supabase
            .from("categorias_productos")
            .select(`
                id,
                nombre
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("orden")
            .order("nombre"),

        supabase
            .from("clientes")
            .select(`
                id,
                nombre,
                telefono,
                whatsapp
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .order("nombre")
            .limit(1000),

        supabase
            .from("configuracion_salon")
            .select(`
                simbolo_moneda,
                permitir_credito,
                permitir_pago_combinado
            `)
            .eq("salon_id", perfil.salon_id)
            .maybeSingle(),

        supabase
            .from("terminales_pos")
            .select(`
                id,
                sucursal_id,
                nombre,
                banco,
                porcentaje_comision,
                estado
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .order("nombre"),
    ]);

    return (
        <div className="mx-auto max-w-[1600px]">
            <VentaProductosClient
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalVentaProducto[]
                }
                productos={
                    (resultadoProductos.data ??
                        []) as unknown as ProductoVentaBase[]
                }
                existencias={
                    (resultadoExistencias.data ??
                        []) as ExistenciaVentaProducto[]
                }
                categorias={
                    (resultadoCategorias.data ??
                        []) as CategoriaVentaProducto[]
                }
                clientes={
                    (resultadoClientes.data ??
                        []) as ClienteVentaProducto[]
                }
                terminales={
                    (resultadoTerminales.data ??
                        []) as TerminalPOSVenta[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
                permitirCredito={
                    Boolean(
                        resultadoConfiguracion.data
                            ?.permitir_credito,
                    )
                }
                permitirPagoCombinado={
                    Boolean(
                        resultadoConfiguracion.data
                            ?.permitir_pago_combinado,
                    )
                }
            />
        </div>
    );
}