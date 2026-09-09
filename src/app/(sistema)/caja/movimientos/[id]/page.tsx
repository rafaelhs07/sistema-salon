import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import MovimientosCajaClient, {
    type CajaMovimiento,
    type MovimientoCajaManual,
} from "./MovimientosCajaClient";

export default async function MovimientosCajaPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) redirect("/login");

    const { data: perfil, error: perfilError } = await supabase
        .from("usuarios_perfiles")
        .select("salon_id, rol, estado")
        .eq("id", user.id)
        .single();

    if (perfilError || !perfil || perfil.estado !== "ACTIVO") {
        redirect("/login");
    }

    if (!["SUPER_ADMIN", "ADMIN", "CAJA"].includes(perfil.rol)) {
        redirect("/caja");
    }

    const [resultadoCaja, resultadoMovimientos, resultadoConfiguracion] =
        await Promise.all([
            supabase
                .from("cajas_sesiones")
                .select(`
                    id,
                    sucursal_id,
                    fecha_apertura,
                    monto_inicial,
                    total_ventas_efectivo,
                    total_ventas_otros,
                    total_ingresos_manuales,
                    total_egresos,
                    estado,
                    sucursales (nombre)
                `)
                .eq("id", id)
                .eq("salon_id", perfil.salon_id)
                .single(),

            supabase
                .from("movimientos_caja")
                .select(`
                    id,
                    tipo,
                    naturaleza,
                    metodo_pago,
                    concepto,
                    monto,
                    referencia,
                    observaciones,
                    fecha_movimiento
                `)
                .eq("caja_sesion_id", id)
                .eq("salon_id", perfil.salon_id)
                .in("tipo", ["INGRESO", "EGRESO"])
                .order("fecha_movimiento", { ascending: false })
                .limit(200),

            supabase
                .from("configuracion_salon")
                .select("simbolo_moneda")
                .eq("salon_id", perfil.salon_id)
                .single(),
        ]);

    if (resultadoCaja.error || !resultadoCaja.data) notFound();

    if (resultadoCaja.data.estado !== "ABIERTA") {
        redirect("/caja");
    }

    return (
        <div className="mx-auto max-w-[1300px]">
            <MovimientosCajaClient
                caja={resultadoCaja.data as unknown as CajaMovimiento}
                movimientos={(resultadoMovimientos.data ?? []) as MovimientoCajaManual[]}
                simboloMoneda={resultadoConfiguracion.data?.simbolo_moneda ?? "C$"}
            />
        </div>
    );
}