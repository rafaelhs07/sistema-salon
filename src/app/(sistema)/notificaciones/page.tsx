import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import NotificacionesClient, {
    type NotificacionSistema,
    type RecordatorioCita,
} from "./NotificacionesClient";

export default async function NotificacionesPage() {
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
            "salon_id, estado",
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

    const ahora =
        new Date();

    const hastaRecordatorios =
        new Date(
            ahora.getTime() +
            30 *
            24 *
            60 *
            60 *
            1000,
        ).toISOString();

    const [
        activasResultado,
        archivadasResultado,
        recordatoriosResultado,
    ] = await Promise.all([
        supabase
            .from(
                "notificaciones_sistema",
            )
            .select(`
                id,
                usuario_id,
                cita_id,
                cliente_id,
                tipo,
                titulo,
                mensaje,
                prioridad,
                enlace,
                leida,
                leida_en,
                archivada,
                archivada_en,
                fecha_registro
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "archivada",
                false,
            )
            .or(
                `usuario_id.eq.${user.id},usuario_id.is.null`,
            )
            .order(
                "fecha_registro",
                {
                    ascending:
                        false,
                },
            )
            .limit(
                500,
            ),

        supabase
            .from(
                "notificaciones_sistema",
            )
            .select(`
                id,
                usuario_id,
                cita_id,
                cliente_id,
                tipo,
                titulo,
                mensaje,
                prioridad,
                enlace,
                leida,
                leida_en,
                archivada,
                archivada_en,
                fecha_registro
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "archivada",
                true,
            )
            .or(
                `usuario_id.eq.${user.id},usuario_id.is.null`,
            )
            .order(
                "archivada_en",
                {
                    ascending:
                        false,
                },
            )
            .limit(
                500,
            ),

        supabase
            .from(
                "recordatorios_citas",
            )
            .select(`
                id,
                cita_id,
                cliente_id,
                tipo,
                canal,
                titulo,
                mensaje,
                fecha_programada,
                estado,
                intentos,
                enviado_en,
                error_envio,
                clientes (
                    nombre_completo,
                    telefono,
                    whatsapp
                ),
                citas (
                    codigo_cita,
                    fecha,
                    hora_inicio,
                    estado
                )
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .gte(
                "fecha_programada",
                new Date(
                    ahora.getTime() -
                    24 *
                    60 *
                    60 *
                    1000,
                ).toISOString(),
            )
            .lte(
                "fecha_programada",
                hastaRecordatorios,
            )
            .order(
                "fecha_programada",
                {
                    ascending:
                        true,
                },
            )
            .limit(
                300,
            ),
    ]);

    if (
        activasResultado.error
    ) {
        console.error(
            "Error cargando notificaciones activas:",
            activasResultado.error,
        );
    }

    if (
        archivadasResultado.error
    ) {
        console.error(
            "Error cargando notificaciones archivadas:",
            archivadasResultado.error,
        );
    }

    if (
        recordatoriosResultado.error
    ) {
        console.error(
            "Error cargando recordatorios:",
            recordatoriosResultado.error,
        );
    }

    return (
        <NotificacionesClient
            notificacionesIniciales={
                (
                    activasResultado.data ??
                    []
                ) as NotificacionSistema[]
            }
            archivadasIniciales={
                (
                    archivadasResultado.data ??
                    []
                ) as NotificacionSistema[]
            }
            recordatoriosIniciales={
                (
                    recordatoriosResultado.data ??
                    []
                ) as unknown as RecordatorioCita[]
            }
            fechaServidor={
                ahora.toISOString()
            }
        />
    );
}
