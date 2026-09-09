import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import AlertasInventarioClient, {
    type AlertaInventario,
    type SucursalAlerta,
} from "./AlertasInventarioClient";

export default async function AlertasInventarioPage() {
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
        redirect("/inventario");
    }

    const [
        resultadoAlertas,
        resultadoSucursales,
    ] = await Promise.all([
        supabase
            .from("v_inventario_actual")
            .select(`
                id,
                sucursal_id,
                sucursal_nombre,
                producto_id,
                codigo_producto,
                codigo_barras,
                producto_nombre,
                marca,
                presentacion,
                unidad_medida,
                categoria_id,
                categoria_nombre,
                cantidad_actual,
                stock_minimo,
                ubicacion,
                estado_stock,
                actualizado_en
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("producto_estado", "ACTIVO")
            .in("estado_stock", [
                "BAJO",
                "AGOTADO",
            ])
            .order("estado_stock")
            .order("cantidad_actual")
            .order("producto_nombre"),

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
    ]);

    if (resultadoAlertas.error) {
        console.error(
            "Error cargando alertas de inventario:",
            resultadoAlertas.error.message,
            resultadoAlertas.error.code,
            resultadoAlertas.error.details,
            resultadoAlertas.error.hint,
        );
    }

    return (
        <div className="mx-auto max-w-[1550px]">
            <AlertasInventarioClient
                alertas={
                    (resultadoAlertas.data ??
                        []) as AlertaInventario[]
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalAlerta[]
                }
            />
        </div>
    );
}