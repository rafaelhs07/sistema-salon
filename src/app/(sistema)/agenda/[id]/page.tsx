import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import DetalleCitaClient, {
    type CitaDetalle,
    type HistorialCita,
} from "./DetalleCitaClient";

export default async function DetalleCitaPage({
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

    const [
        resultadoCita,
        resultadoHistorial,
    ] = await Promise.all([
        supabase
            .from("citas")
            .select(`
        id,
        codigo_cita,
        fecha,
        hora_inicio,
        hora_fin,
        duracion_total_minutos,
        subtotal,
        descuento,
        total,
        requiere_anticipo,
        monto_anticipo_requerido,
        monto_anticipo_pagado,
        estado,
        origen,
        notas,
        notas_internas,
        motivo_cancelacion,
        fecha_registro,
        clientes (
          id,
          codigo_cliente,
          nombre_completo,
          telefono,
          whatsapp,
          correo
        ),
        sucursales (
          nombre
        ),
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
          tipo_comision,
          valor_comision,
          monto_comision_calculado,
          notas,
          trabajadores (
            id,
            nombre_completo,
            color_calendario
          )
        )
      `)
            .eq("id", id)
            .eq("salon_id", perfil.salon_id)
            .single(),

        supabase
            .from("citas_historial")
            .select(`
        id,
        tipo_evento,
        estado_anterior,
        estado_nuevo,
        descripcion,
        fecha_registro
      `)
            .eq("cita_id", id)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_registro", {
                ascending: false,
            }),
    ]);

    if (
        resultadoCita.error ||
        !resultadoCita.data
    ) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-6xl">
            <DetalleCitaClient
                cita={
                    resultadoCita.data as unknown as CitaDetalle
                }
                historial={
                    (resultadoHistorial.data ??
                        []) as HistorialCita[]
                }
            />
        </div>
    );
}