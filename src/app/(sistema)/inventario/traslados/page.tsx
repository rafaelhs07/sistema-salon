import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import TrasladosInventarioClient, {
    type ExistenciaTraslado,
    type ProductoTraslado,
    type SucursalTraslado,
    type TrasladoListado,
} from "./TrasladosInventarioClient";

export default async function TrasladosInventarioPage() {
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
        resultadoTraslados,
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
                unidad_medida
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
                stock_minimo
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            ),

        supabase
            .from("inventario_traslados")
            .select(`
                id,
                sucursal_origen_id,
                sucursal_destino_id,
                producto_id,
                cantidad,
                referencia,
                observaciones,
                estado,
                fecha_traslado,

                producto:productos (
                    id,
                    codigo_producto,
                    nombre,
                    marca,
                    unidad_medida
                ),

                origen:sucursales!inventario_traslados_sucursal_origen_id_fkey (
                    nombre
                ),

                destino:sucursales!inventario_traslados_sucursal_destino_id_fkey (
                    nombre
                )
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .order(
                "fecha_traslado",
                {
                    ascending: false,
                },
            )
            .limit(100),
    ]);

    if (resultadoTraslados.error) {
        console.error(
            "Error cargando traslados:",
            resultadoTraslados.error.message,
            resultadoTraslados.error.code,
            resultadoTraslados.error.details,
            resultadoTraslados.error.hint,
        );
    }

    return (
        <div className="mx-auto max-w-[1550px]">
            <TrasladosInventarioClient
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalTraslado[]
                }
                productos={
                    (resultadoProductos.data ??
                        []) as ProductoTraslado[]
                }
                existencias={
                    (resultadoExistencias.data ??
                        []) as ExistenciaTraslado[]
                }
                traslados={
                    (resultadoTraslados.data ??
                        []) as unknown as TrasladoListado[]
                }
            />
        </div>
    );
}