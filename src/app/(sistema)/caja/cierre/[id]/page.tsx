import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CierreCajaClient, {
    type CajaParaCierre,
    type MovimientoCajaCierre,
} from "./CierreCajaClient";

export default async function CierreCajaPage({
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
        redirect("/caja");
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
                monto_inicial,
                total_ventas_efectivo,
                total_ventas_otros,
                total_ingresos_manuales,
                total_egresos,
                estado,
                observaciones_apertura,
                sucursales (
                    nombre
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
                fecha_movimiento
            `)
            .eq("caja_sesion_id", id)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_movimiento", {
                ascending: false,
            })
            .limit(100),

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

    if (resultadoCaja.data.estado !== "ABIERTA") {
        redirect("/caja");
    }

    return (
        <div className="mx-auto max-w-[1300px]">
            <CierreCajaClient
                caja={
                    resultadoCaja.data as unknown as CajaParaCierre
                }
                movimientos={
                    (resultadoMovimientos.data ??
                        []) as MovimientoCajaCierre[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
            />
        </div>
    );
}