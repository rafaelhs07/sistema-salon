import {
    notFound,
    redirect,
} from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ProductoFormClient, {
    type CategoriaProductoForm,
    type ProductoEditar,
} from "./ProductoFormClient";

export default async function EditarProductoPage({
    params,
}: {
    params: Promise<{
        productoId: string;
    }>;
}) {
    const { productoId } =
        await params;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: perfil } =
        await supabase
            .from("usuarios_perfiles")
            .select("salon_id, rol, estado")
            .eq("id", user.id)
            .single();

    if (
        !perfil ||
        perfil.estado !== "ACTIVO"
    ) {
        redirect("/login");
    }

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
        ].includes(perfil.rol)
    ) {
        redirect(
            "/inventario/catalogo",
        );
    }

    const [
        resultadoProducto,
        resultadoCategorias,
        resultadoConfiguracion,
    ] = await Promise.all([
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
                stock_minimo_general
            `)
            .eq("id", productoId)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle(),

        supabase
            .from("categorias_productos")
            .select("id, nombre")
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq("estado", "ACTIVA")
            .order("orden")
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

    if (
        resultadoProducto.error ||
        !resultadoProducto.data
    ) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-[1450px]">
            <ProductoFormClient
                producto={
                    resultadoProducto.data as ProductoEditar
                }
                categorias={
                    (resultadoCategorias.data ??
                        []) as CategoriaProductoForm[]
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