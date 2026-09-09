import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CierresCajaClient, {
    type CierreCajaHistorial,
    type SucursalCierre,
} from "./CierresCajaClient";

export default async function CierresCajaPage() {
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
        resultadoCierres,
        resultadoSucursales,
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
                    nombre
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "CERRADA")
            .order("fecha_cierre", {
                ascending: false,
            })
            .limit(1000),

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

    if (resultadoCierres.error) {
        console.error(
            "Error cargando cierres de caja:",
            resultadoCierres.error,
        );
    }

    if (resultadoSucursales.error) {
        console.error(
            "Error cargando sucursales:",
            resultadoSucursales.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1500px]">
            <CierresCajaClient
                cierres={
                    (resultadoCierres.data ??
                        []) as unknown as CierreCajaHistorial[]
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalCierre[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
            />
        </div>
    );
}