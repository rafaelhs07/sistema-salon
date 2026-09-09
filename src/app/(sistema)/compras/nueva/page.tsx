import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import NuevaCompraClient, {
    type ProductoCompra,
    type ProveedorCompra,
    type SucursalCompra,
} from "./NuevaCompraClient";

export default async function NuevaCompraPage() {
    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        redirect("/login");
    }

    const {
        data: perfil,
        error: perfilError,
    } = await supabase
        .from("usuarios_perfiles")
        .select(
            "salon_id, rol, estado",
        )
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
        resultadoSucursales,
        resultadoProveedores,
        resultadoProductos,
    ] = await Promise.all([
        supabase
            .from("sucursales")
            .select(
                "id, nombre",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq("estado", "ACTIVA")
            .order("nombre"),

        supabase
            .from("proveedores")
            .select(`
                id,
                codigo_proveedor,
                nombre,
                condiciones_pago
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq("estado", "ACTIVO")
            .order("nombre"),

        supabase
            .from("productos")
            .select(`
                id,
                codigo_producto,
                codigo_barras,
                nombre,
                marca,
                presentacion,
                unidad_medida,
                costo_unitario,
                controla_stock,
                estado
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq("estado", "ACTIVO")
            .order("nombre"),
    ]);

    if (
        resultadoProductos.error
    ) {
        console.error(
            "Error cargando productos para compra:",
            resultadoProductos.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1600px]">
            <NuevaCompraClient
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalCompra[]
                }
                proveedores={
                    (resultadoProveedores.data ??
                        []) as ProveedorCompra[]
                }
                productos={
                    (resultadoProductos.data ??
                        []) as ProductoCompra[]
                }
            />
        </div>
    );
}