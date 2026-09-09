import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import InventarioClient, {
    type CategoriaInventario,
    type InventarioFila,
    type SucursalInventario,
} from "./InventarioClient";

export default async function InventarioPage() {
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
            "INVENTARIO",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const [
        resultadoInventario,
        resultadoSucursales,
        resultadoCategorias,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("v_inventario_actual")
            .select(`
                id,
                salon_id,
                sucursal_id,
                sucursal_nombre,
                producto_id,
                codigo_producto,
                codigo_barras,
                producto_nombre,
                marca,
                presentacion,
                unidad_medida,
                costo_unitario,
                precio_venta,
                controla_stock,
                producto_estado,
                categoria_id,
                categoria_nombre,
                cantidad_actual,
                stock_minimo,
                ubicacion,
                estado_stock,
                actualizado_en
            `)
            .eq("salon_id", perfil.salon_id)
            .order("producto_nombre")
            .order("sucursal_nombre"),

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
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq("salon_id", perfil.salon_id)
            .maybeSingle(),
    ]);

    if (resultadoInventario.error) {
        console.error(
            "Error cargando inventario:",
            resultadoInventario.error.message,
            resultadoInventario.error.code,
            resultadoInventario.error.details,
            resultadoInventario.error.hint,
        );
    }

    return (
        <div className="mx-auto max-w-[1550px]">
            <InventarioClient
                inventario={
                    (resultadoInventario.data ??
                        []) as InventarioFila[]
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalInventario[]
                }
                categorias={
                    (resultadoCategorias.data ??
                        []) as CategoriaInventario[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ??
                    "C$"
                }
            />
        </div>
    );
}