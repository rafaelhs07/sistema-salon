import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import VentaDirectaClient, {
    type CajaVentaDirecta,
    type ClienteVentaDirecta,
    type ServicioVentaDirecta,
    type TerminalPosVentaDirecta,
    type TrabajadorVentaDirecta,
} from "./VentaDirectaClient";

export default async function VentaDirectaPage() {
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

    if (
        perfilError ||
        !perfil ||
        perfil.estado !== "ACTIVO"
    ) {
        redirect("/login");
    }

    if (
        !["SUPER_ADMIN", "ADMIN", "RECEPCION", "CAJA"].includes(
            perfil.rol,
        )
    ) {
        redirect("/inicio");
    }

    const [
        resultadoCajas,
        resultadoClientes,
        resultadoServicios,
        resultadoTrabajadores,
        resultadoTerminales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("cajas_sesiones")
            .select(`
                id,
                sucursal_id,
                fecha_apertura,
                sucursales (nombre)
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ABIERTA")
            .order("fecha_apertura", { ascending: false }),

        supabase
            .from("clientes")
            .select(`
                id,
                codigo_cliente,
                nombre_completo,
                telefono,
                whatsapp
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .order("nombre_completo")
            .limit(500),

        supabase
            .from("servicios")
            .select(`
                id,
                nombre,
                precio,
                duracion_minutos,
                trabajador_servicios (
                    trabajador_id,
                    estado
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .order("nombre"),

        supabase
            .from("trabajadores")
            .select(`
                id,
                nombre_completo,
                estado
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .order("nombre_completo"),

        supabase
            .from("terminales_pos")
            .select(`
                id,
                nombre,
                banco,
                sucursal_id,
                porcentaje_comision,
                estado
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .order("nombre"),

        supabase
            .from("configuracion_salon")
            .select(`
                permitir_credito,
                permitir_pago_combinado
            `)
            .eq("salon_id", perfil.salon_id)
            .single(),
    ]);

    return (
        <div className="mx-auto max-w-[1500px]">
            <VentaDirectaClient
                cajas={
                    (resultadoCajas.data ??
                        []) as unknown as CajaVentaDirecta[]
                }
                clientes={
                    (resultadoClientes.data ??
                        []) as ClienteVentaDirecta[]
                }
                servicios={
                    (resultadoServicios.data ??
                        []) as unknown as ServicioVentaDirecta[]
                }
                trabajadores={
                    (resultadoTrabajadores.data ??
                        []) as TrabajadorVentaDirecta[]
                }
                terminales={
                    (resultadoTerminales.data ??
                        []) as TerminalPosVentaDirecta[]
                }
                permitirCredito={
                    resultadoConfiguracion.data?.permitir_credito ??
                    true
                }
                permitirPagoCombinado={
                    resultadoConfiguracion.data
                        ?.permitir_pago_combinado ?? true
                }
            />
        </div>
    );
}