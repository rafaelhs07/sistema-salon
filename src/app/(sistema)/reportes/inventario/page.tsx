import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReporteInventarioClient, {
    type ProductoReporteInventario,
} from "./ReporteInventarioClient";

export default async function ReporteInventarioPage() {
    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (
        usuarioError ||
        !user
    ) {
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
        ].includes(
            perfil.rol,
        )
    ) {
        redirect("/inicio");
    }

    const [
        productosResultado,
        configuracionResultado,
    ] = await Promise.all([
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
                categoria,
                stock,
                stock_minimo,
                costo_unitario,
                precio_venta,
                controla_stock,
                estado
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .order(
                "nombre",
            )
            .limit(10000),

        supabase
            .from(
                "configuracion_salon",
            )
            .select(
                "simbolo_moneda",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle(),
    ]);

    if (
        productosResultado.error
    ) {
        console.error(
            "Error cargando reporte de inventario:",
            productosResultado.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1750px]">
            <ReporteInventarioClient
                simboloMoneda={
                    configuracionResultado
                        .data
                        ?.simbolo_moneda ??
                    "C$"
                }
                productos={
                    (
                        productosResultado.data ??
                        []
                    ) as ProductoReporteInventario[]
                }
            />
        </div>
    );
}
