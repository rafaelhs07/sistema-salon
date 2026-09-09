import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ConfiguracionNotificacionesClient, {
    type ConfiguracionNotificaciones,
} from "./ConfiguracionNotificacionesClient";

export default async function ConfiguracionNotificacionesPage() {
    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } =
        await supabase.auth.getUser();

    if (
        usuarioError ||
        !user
    ) {
        redirect(
            "/login",
        );
    }

    const {
        data: perfil,
        error: perfilError,
    } = await supabase
        .from(
            "usuarios_perfiles",
        )
        .select(
            "salon_id, rol, estado",
        )
        .eq(
            "id",
            user.id,
        )
        .single();

    if (
        perfilError ||
        !perfil ||
        perfil.estado !==
        "ACTIVO"
    ) {
        redirect(
            "/login",
        );
    }

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
        ].includes(
            perfil.rol,
        )
    ) {
        redirect(
            "/inicio",
        );
    }

    const {
        data,
        error,
    } = await supabase
        .from(
            "configuracion_notificaciones",
        )
        .select(`
            salon_id,
            citas_proximas,
            minutos_cita_proxima,
            cita_sin_confirmar,
            cita_finalizada_sin_cobrar,
            stock_bajo,
            stock_agotado,
            caja_abierta_dia_anterior,
            diferencia_caja,
            cuenta_cobrar_vencida,
            cuenta_pagar_vencida
        `)
        .eq(
            "salon_id",
            perfil.salon_id,
        )
        .maybeSingle();

    if (
        error
    ) {
        console.error(
            "Error cargando configuración de notificaciones:",
            error,
        );
    }

    const configuracion: ConfiguracionNotificaciones =
        data ?? {
            salon_id:
                perfil.salon_id,
            citas_proximas:
                true,
            minutos_cita_proxima:
                60,
            cita_sin_confirmar:
                true,
            cita_finalizada_sin_cobrar:
                true,
            stock_bajo:
                true,
            stock_agotado:
                true,
            caja_abierta_dia_anterior:
                true,
            diferencia_caja:
                true,
            cuenta_cobrar_vencida:
                true,
            cuenta_pagar_vencida:
                true,
        };

    return (
        <div className="mx-auto max-w-5xl">
            <ConfiguracionNotificacionesClient
                inicial={
                    configuracion
                }
            />
        </div>
    );
}
