import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CatalogoInventarioClient, {
    type CategoriaCatalogo,
    type ProductoCatalogo,
} from "./CatalogoInventarioClient";

export default async function CatalogoInventarioPage() {
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
        resultadoCategorias,
        resultadoProductos,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("categorias_productos")
            .select(`
                id,
                nombre,
                descripcion,
                estado,
                orden,
                creado_en,
                actualizado_en
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .order("estado")
            .order("orden")
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
                permite_consumo_servicio,
                controla_stock,
                stock_minimo_general,
                estado,
                creado_en,
                categorias_productos (
                    id,
                    nombre
                )
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .order("estado")
            .order("nombre"),

        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle(),
    ]);

    if (resultadoCategorias.error) {
        console.error(
            "Error cargando categorías:",
            resultadoCategorias.error.message,
        );
    }

    if (resultadoProductos.error) {
        console.error(
            "Error cargando productos:",
            resultadoProductos.error.message,
        );
    }

    return (
        <div className="mx-auto max-w-[1550px]">
            <CatalogoInventarioClient
                categorias={
                    (resultadoCategorias.data ??
                        []) as CategoriaCatalogo[]
                }
                productos={
                    (resultadoProductos.data ??
                        []) as unknown as ProductoCatalogo[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ??
                    "C$"
                }
                puedeAdministrar={
                    perfil.rol ===
                    "SUPER_ADMIN" ||
                    perfil.rol ===
                    "ADMIN"
                }
            />
        </div>
    );
}