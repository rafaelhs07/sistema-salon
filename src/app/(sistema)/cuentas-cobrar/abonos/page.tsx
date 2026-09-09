import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import AbonosClient, {
    type AbonoHistorial,
    type SucursalAbono,
} from "./AbonosClient";

export default async function HistorialAbonosPage() {
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

    const [
        resultadoAbonos,
        resultadoSucursales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("cuentas_cobrar_abonos")
            .select(`
                id,
                sucursal_id,
                cuenta_id,
                caja_sesion_id,
                monto,
                estado,
                referencia,
                observaciones,
                fecha_abono,

                sucursales (
                    nombre
                ),

                cuentas_cobrar (
                    id,
                    codigo_cuenta,
                    cliente_id,
                    venta_id,
                    monto_original,
                    monto_abonado,
                    saldo_pendiente,
                    estado,

                    clientes (
                        id,
                        codigo_cliente,
                        nombre_completo,
                        telefono,
                        whatsapp
                    ),

                    ventas (
                        id,
                        codigo_venta,
                        total,
                        estado,
                        estado_pago
                    )
                ),

                cuentas_cobrar_abono_pagos (
                    id,
                    metodo_pago,
                    monto,
                    monto_recibido,
                    cambio,
                    terminal_pos_id,
                    porcentaje_comision_pos,
                    monto_comision_pos,
                    monto_neto,
                    referencia,
                    banco,
                    observaciones,
                    estado,
                    fecha_pago,

                    terminales_pos (
                        nombre,
                        banco
                    )
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_abono", {
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

    if (resultadoAbonos.error) {
        console.error(
            "Error cargando historial de abonos:",
            resultadoAbonos.error.message,
            resultadoAbonos.error.code,
            resultadoAbonos.error.details,
            resultadoAbonos.error.hint,
        );
    }

    return (
        <div className="mx-auto max-w-[1550px]">
            <AbonosClient
                abonos={
                    (resultadoAbonos.data ??
                        []) as unknown as AbonoHistorial[]
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalAbono[]
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