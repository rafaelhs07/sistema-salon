import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReporteCitasServiciosClient, {
    type CitaReporte,
    type SucursalReporteCitas,
    type TrabajadorFiltroReporte,
} from "./ReporteCitasServiciosClient";

function fechaDesdeConsulta() {
    const hoy = new Date();

    return new Date(
        hoy.getFullYear() - 1,
        0,
        1,
    )
        .toISOString()
        .slice(0, 10);
}

export default async function ReporteCitasServiciosPage() {
    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (
        usuarioError ||
        !user
    ) {
        redirect("/login");
    }

    const {
        data: perfil,
        error: perfilError,
    } = await supabase
        .from("usuarios_perfiles")
        .select(
            "salon_id, rol, estado",
        )
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
        ].includes(
            perfil.rol,
        )
    ) {
        redirect("/inicio");
    }

    const [
        citasResultado,
        sucursalesResultado,
        trabajadoresResultado,
        configuracionResultado,
    ] = await Promise.all([
        supabase
            .from("citas")
            .select(`
                id,
                codigo_cita,
                sucursal_id,
                cliente_id,
                fecha,
                hora_inicio,
                hora_fin,
                duracion_total_minutos,
                subtotal,
                descuento,
                total,
                estado,
                origen,
                clientes (
                    nombre_completo,
                    codigo_cliente
                ),
                sucursales (
                    nombre
                ),
                cita_servicios (
                    id,
                    servicio_id,
                    trabajador_id,
                    nombre_servicio,
                    precio_unitario,
                    descuento,
                    total,
                    duracion_minutos,
                    hora_inicio,
                    hora_fin,
                    estado,
                    trabajadores (
                        id,
                        nombre_completo
                    )
                )
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .gte(
                "fecha",
                fechaDesdeConsulta(),
            )
            .order(
                "fecha",
                {
                    ascending: false,
                },
            )
            .order(
                "hora_inicio",
                {
                    ascending: false,
                },
            )
            .limit(7000),

        supabase
            .from("sucursales")
            .select(
                "id, nombre",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "ACTIVA",
            )
            .order("nombre"),

        supabase
            .from("trabajadores")
            .select(
                "id, nombre_completo",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "ACTIVO",
            )
            .order(
                "nombre_completo",
            ),

        supabase
            .from(
                "configuracion_salon",
            )
            .select(
                "simbolo_moneda",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle(),
    ]);

    if (
        citasResultado.error
    ) {
        console.error(
            "Error cargando reporte de citas y servicios:",
            citasResultado.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1750px]">
            <ReporteCitasServiciosClient
                simboloMoneda={
                    configuracionResultado
                        .data
                        ?.simbolo_moneda ??
                    "C$"
                }
                citas={
                    (
                        citasResultado.data ??
                        []
                    ) as unknown as CitaReporte[]
                }
                sucursales={
                    (
                        sucursalesResultado.data ??
                        []
                    ) as SucursalReporteCitas[]
                }
                trabajadores={
                    (
                        trabajadoresResultado.data ??
                        []
                    ) as TrabajadorFiltroReporte[]
                }
            />
        </div>
    );
}
