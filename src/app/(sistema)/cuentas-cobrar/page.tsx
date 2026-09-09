import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CuentasCobrarClient, {
    type CuentaCobrarListado,
    type SucursalCuenta,
} from "./CuentasCobrarClient";

export default async function CuentasCobrarPage() {
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

    // Actualiza automáticamente cuentas vencidas
    // antes de mostrar el listado.
    const { error: vencimientosError } =
        await supabase.rpc(
            "actualizar_vencimientos_cuentas",
        );

    if (vencimientosError) {
        console.error(
            "Error actualizando vencimientos:",
            vencimientosError.message,
        );
    }

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
                cita_id,
                monto_original,
                monto_abonado,
                saldo_pendiente,
                fecha_origen,
                fecha_vencimiento,
                estado,
                observaciones,
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
                    codigo_venta,
                    tipo_venta,
                    total,
                    estado,
                    estado_pago,
                    fecha_venta
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_origen", {
                ascending: false,
            })
            .limit(2000),

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

    if (resultadoCuentas.error) {
        console.error(
            "Error cargando cuentas por cobrar:",
            resultadoCuentas.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1500px]">
            <CuentasCobrarClient
                cuentas={
                    (resultadoCuentas.data ??
                        []) as unknown as CuentaCobrarListado[]
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalCuenta[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
            />
        </div>
    );
}