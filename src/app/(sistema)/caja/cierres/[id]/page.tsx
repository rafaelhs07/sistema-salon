import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import DetalleCierreClient, {
    type CajaCierreDetalle,
    type MovimientoCierreDetalle,
} from "./DetalleCierreClient";

export default async function DetalleCierrePage({
    params,
}: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;
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
        resultadoCaja,
        resultadoMovimientos,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("cajas_sesiones")
            .select(`
                id,
                sucursal_id,
                fecha_apertura,
                fecha_cierre,
                monto_inicial,
                total_ventas_efectivo,
                total_ventas_otros,
                total_ingresos_manuales,
                total_egresos,
                monto_esperado,
                monto_contado,
                diferencia,
                estado,
                observaciones_apertura,
                observaciones_cierre,
                sucursales (
                    nombre,
                    direccion,
                    telefono
                )
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
                fecha_movimiento,
                venta_id
            `)
            .eq("caja_sesion_id", id)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_movimiento", {
                ascending: true,
            }),

        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq("salon_id", perfil.salon_id)
            .single(),
    ]);

    if (
        resultadoCaja.error ||
        !resultadoCaja.data
    ) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-[1400px]">
            <DetalleCierreClient
                caja={
                    resultadoCaja.data as unknown as CajaCierreDetalle
                }
                movimientos={
                    (resultadoMovimientos.data ??
                        []) as MovimientoCierreDetalle[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
            />
        </div>
    );
}