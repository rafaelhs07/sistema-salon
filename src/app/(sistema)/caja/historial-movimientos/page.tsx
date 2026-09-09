import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import HistorialMovimientosClient, {
    type MovimientoHistorial,
    type SucursalMovimiento,
} from "./HistorialMovimientosClient";

export default async function HistorialMovimientosPage() {
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
            "CAJA",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const [
        resultadoMovimientos,
        resultadoSucursales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("movimientos_caja")
            .select(`
                id,
                sucursal_id,
                caja_sesion_id,
                venta_id,
                pago_id,
                tipo,
                naturaleza,
                metodo_pago,
                concepto,
                monto,
                referencia,
                observaciones,
                fecha_movimiento,
                sucursales (
                    nombre
                ),
                ventas (
                    codigo_venta,
                    estado
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_movimiento", {
                ascending: false,
            })
            .limit(5000),

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
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq("salon_id", perfil.salon_id)
            .single(),
    ]);

    if (resultadoMovimientos.error) {
        console.error(
            "Error cargando movimientos:",
            resultadoMovimientos.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1550px]">
            <HistorialMovimientosClient
                movimientos={
                    (resultadoMovimientos.data ??
                        []) as unknown as MovimientoHistorial[]
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalMovimiento[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
            />
        </div>
    );
}