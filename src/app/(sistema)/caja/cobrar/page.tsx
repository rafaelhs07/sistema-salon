import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CobrarCitaClient, {
    type CajaDisponible,
    type CitaCobrable,
    type TerminalPosDisponible,
} from "./CobrarCitaClient";

export default async function CobrarCitaPage({
    searchParams,
}: {
    searchParams: Promise<{ citaId?: string }>;
}) {
    const parametros = await searchParams;
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
        resultadoCitas,
        resultadoTerminales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("cajas_sesiones")
            .select(`
                id,
                sucursal_id,
                fecha_apertura,
                monto_inicial,
                estado,
                sucursales (nombre)
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ABIERTA")
            .order("fecha_apertura", { ascending: false }),

        supabase
            .from("citas")
            .select(`
                id,
                codigo_cita,
                cliente_id,
                sucursal_id,
                fecha,
                hora_inicio,
                hora_fin,
                subtotal,
                descuento,
                total,
                estado,
                clientes (
                    nombre_completo,
                    codigo_cliente,
                    telefono,
                    whatsapp
                ),
                sucursales (nombre),
                cita_servicios (
                    id,
                    nombre_servicio,
                    precio_unitario,
                    descuento,
                    total,
                    duracion_minutos,
                    hora_inicio,
                    hora_fin,
                    estado,
                    trabajadores (nombre_completo)
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "FINALIZADA")
            .order("fecha", { ascending: false })
            .order("hora_inicio", { ascending: false })
            .limit(250),

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

    const cajas =
        (resultadoCajas.data ?? []) as unknown as CajaDisponible[];

    const ventasExistentes =
        resultadoCitas.data?.length
            ? await supabase
                .from("ventas")
                .select("cita_id")
                .eq("salon_id", perfil.salon_id)
                .eq("estado", "ACTIVA")
                .in(
                    "cita_id",
                    resultadoCitas.data.map((cita) => cita.id),
                )
            : { data: [], error: null };

    const citasCobradas = new Set(
        (ventasExistentes.data ?? [])
            .map((venta) => venta.cita_id)
            .filter(Boolean),
    );

    const citas = (
        (resultadoCitas.data ?? []) as unknown as CitaCobrable[]
    ).filter((cita) => !citasCobradas.has(cita.id));

    return (
        <div className="mx-auto max-w-[1500px]">
            <CobrarCitaClient
                cajas={cajas}
                citas={citas}
                terminales={
                    (resultadoTerminales.data ??
                        []) as TerminalPosDisponible[]
                }
                permitirCredito={
                    resultadoConfiguracion.data?.permitir_credito ??
                    true
                }
                permitirPagoCombinado={
                    resultadoConfiguracion.data
                        ?.permitir_pago_combinado ?? true
                }
                citaInicialId={parametros.citaId ?? ""}
            />
        </div>
    );
}