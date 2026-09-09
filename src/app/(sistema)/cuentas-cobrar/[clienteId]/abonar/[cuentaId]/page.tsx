import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import RegistrarAbonoClient, {
    type CajaAbono,
    type CuentaParaAbono,
    type TerminalPosAbono,
} from "./RegistrarAbonoClient";

export default async function RegistrarAbonoPage({
    params,
}: {
    params: Promise<{
        clienteId: string;
        cuentaId: string;
    }>;
}) {
    const {
        clienteId,
        cuentaId,
    } = await params;

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

    const { data: cuenta, error: cuentaError } =
        await supabase
            .from("cuentas_cobrar")
            .select(`
                id,
                codigo_cuenta,
                salon_id,
                sucursal_id,
                cliente_id,
                venta_id,
                monto_original,
                monto_abonado,
                saldo_pendiente,
                estado,
                fecha_origen,
                fecha_vencimiento,
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
            .eq("id", cuentaId)
            .eq("cliente_id", clienteId)
            .eq("salon_id", perfil.salon_id)
            .single();

    if (cuentaError || !cuenta) {
        notFound();
    }

    if (
        ["PAGADA", "ANULADA"].includes(
            cuenta.estado,
        ) ||
        Number(
            cuenta.saldo_pendiente,
        ) <= 0
    ) {
        redirect(
            `/cuentas-cobrar/${clienteId}`,
        );
    }

    const [
        resultadoCajas,
        resultadoTerminales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("cajas_sesiones")
            .select(`
                id,
                sucursal_id,
                fecha_apertura,
                estado,
                sucursales (
                    nombre
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .eq(
                "sucursal_id",
                cuenta.sucursal_id,
            )
            .eq("estado", "ABIERTA")
            .order("fecha_apertura", {
                ascending: false,
            }),

        supabase
            .from("terminales_pos")
            .select(`
                id,
                sucursal_id,
                nombre,
                banco,
                porcentaje_comision,
                estado
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .order("nombre"),

        supabase
            .from("configuracion_salon")
            .select(`
                simbolo_moneda,
                permitir_pago_combinado
            `)
            .eq("salon_id", perfil.salon_id)
            .single(),
    ]);

    return (
        <div className="mx-auto max-w-[1250px]">
            <RegistrarAbonoClient
                cuenta={
                    cuenta as unknown as CuentaParaAbono
                }
                cajas={
                    (resultadoCajas.data ??
                        []) as unknown as CajaAbono[]
                }
                terminales={
                    (resultadoTerminales.data ??
                        []) as TerminalPosAbono[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
                permitirPagoCombinado={
                    resultadoConfiguracion.data
                        ?.permitir_pago_combinado ??
                    true
                }
            />
        </div>
    );
}