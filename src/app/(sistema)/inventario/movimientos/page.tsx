import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import MovimientosInventarioClient, {
    type MovimientoInventarioListado,
    type SucursalMovimiento,
} from "./MovimientosInventarioClient";

export default async function MovimientosInventarioPage() {
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
        resultadoMovimientos,
        resultadoSucursales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("inventario_movimientos")
            .select(`
                id,
                sucursal_id,
                producto_id,
                tipo,
                naturaleza,
                cantidad,
                cantidad_anterior,
                cantidad_nueva,
                costo_unitario,
                venta_id,
                cita_id,
                movimiento_origen_id,
                referencia,
                concepto,
                observaciones,
                fecha_movimiento,

                sucursales (
                    nombre
                ),

                productos (
                    id,
                    codigo_producto,
                    codigo_barras,
                    nombre,
                    marca,
                    presentacion,
                    unidad_medida
                ),

                ventas (
                    codigo_venta
                )
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .order(
                "fecha_movimiento",
                {
                    ascending: false,
                },
            )
            .limit(3000),

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
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle(),
    ]);

    if (resultadoMovimientos.error) {
        console.error(
            "Error cargando movimientos de inventario:",
            resultadoMovimientos.error.message,
            resultadoMovimientos.error.code,
            resultadoMovimientos.error.details,
            resultadoMovimientos.error.hint,
        );
    }

    return (
        <div className="mx-auto max-w-[1550px]">
            <MovimientosInventarioClient
                movimientos={
                    (resultadoMovimientos.data ??
                        []) as unknown as MovimientoInventarioListado[]
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalMovimiento[]
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