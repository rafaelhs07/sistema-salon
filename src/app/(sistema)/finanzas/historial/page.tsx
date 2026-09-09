import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import HistorialFinancieroClient, {
    type MovimientoHistorial,
    type CategoriaFiltro,
    type SucursalFiltro,
} from "./HistorialFinancieroClient";

export default async function HistorialFinancieroPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: perfil } = await supabase
        .from("usuarios_perfiles")
        .select("salon_id, rol, estado")
        .eq("id", user.id)
        .single();

    if (!perfil || perfil.estado !== "ACTIVO") {
        redirect("/login");
    }

    if (!["SUPER_ADMIN", "ADMIN", "CAJA"].includes(perfil.rol)) {
        redirect("/inicio");
    }

    const [
        resultadoMovimientos,
        resultadoCategorias,
        resultadoSucursales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("movimientos_financieros")
            .select(`
                id,
                sucursal_id,
                categoria_id,
                tipo,
                origen,
                metodo_pago,
                concepto,
                descripcion,
                monto,
                referencia,
                fecha_movimiento,
                estado,
                categorias_financieras (
                    nombre
                ),
                sucursales (
                    nombre
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_movimiento", { ascending: false })
            .limit(5000),

        supabase
            .from("categorias_financieras")
            .select("id, nombre, tipo")
            .eq("salon_id", perfil.salon_id)
            .order("tipo")
            .order("nombre"),

        supabase
            .from("sucursales")
            .select("id, nombre")
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("nombre"),

        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq("salon_id", perfil.salon_id)
            .maybeSingle(),
    ]);

    if (resultadoMovimientos.error) {
        console.error(
            "Error cargando historial financiero:",
            resultadoMovimientos.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1650px]">
            <HistorialFinancieroClient
                simboloMoneda={
                    resultadoConfiguracion.data?.simbolo_moneda ?? "C$"
                }
                movimientos={
                    (resultadoMovimientos.data ?? []) as unknown as MovimientoHistorial[]
                }
                categorias={
                    (resultadoCategorias.data ?? []) as CategoriaFiltro[]
                }
                sucursales={
                    (resultadoSucursales.data ?? []) as SucursalFiltro[]
                }
            />
        </div>
    );
}