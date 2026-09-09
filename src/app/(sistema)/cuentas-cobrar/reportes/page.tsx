import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReporteCuentasCobrarClient, {
    type CuentaReporte,
    type SucursalReporte,
} from "./ReporteCuentasCobrarClient";

export default async function ReporteCuentasCobrarPage() {
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
            "RECEPCION",
            "CAJA",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    await supabase.rpc(
        "actualizar_vencimientos_cuentas",
    );

    const [
        resultadoCuentas,
        resultadoSucursales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("cuentas_cobrar")
            .select(`
                id,
                codigo_cuenta,
                sucursal_id,
                cliente_id,
                venta_id,
                monto_original,
                monto_abonado,
                saldo_pendiente,
                fecha_origen,
                fecha_vencimiento,
                estado,

                clientes (
                    id,
                    codigo_cliente,
                    nombre_completo,
                    telefono,
                    whatsapp
                ),

                sucursales (
                    nombre
                ),

                ventas (
                    codigo_venta
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_origen", {
                ascending: false,
            })
            .limit(3000),

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
            .maybeSingle(),
    ]);

    if (resultadoCuentas.error) {
        console.error(
            "Error cargando reporte de cuentas por cobrar:",
            resultadoCuentas.error.message,
        );
    }

    return (
        <div className="mx-auto max-w-[1550px]">
            <ReporteCuentasCobrarClient
                cuentas={
                    (resultadoCuentas.data ??
                        []) as unknown as CuentaReporte[]
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalReporte[]
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