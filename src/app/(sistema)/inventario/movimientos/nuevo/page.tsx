import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import AjusteInventarioClient, {
    type ExistenciaAjuste,
    type ProductoAjuste,
    type SucursalAjuste,
} from "./AjusteInventarioClient";

export default async function NuevoMovimientoInventarioPage() {
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
        resultadoSucursales,
        resultadoProductos,
        resultadoExistencias,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("sucursales")
            .select(`
                id,
                nombre,
                es_principal
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq("estado", "ACTIVA")
            .order(
                "es_principal",
                {
                    ascending: false,
                },
            )
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
                stock_minimo_general
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq("estado", "ACTIVO")
            .eq(
                "controla_stock",
                true,
            )
            .order("nombre"),

        supabase
            .from("inventario_existencias")
            .select(`
                id,
                sucursal_id,
                producto_id,
                cantidad_actual,
                stock_minimo,
                ubicacion
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            ),

        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle(),
    ]);

    return (
        <div className="mx-auto max-w-[1450px]">
            <AjusteInventarioClient
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalAjuste[]
                }
                productos={
                    (resultadoProductos.data ??
                        []) as ProductoAjuste[]
                }
                existencias={
                    (resultadoExistencias.data ??
                        []) as ExistenciaAjuste[]
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