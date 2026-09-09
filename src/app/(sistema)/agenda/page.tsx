import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import AgendaClient, {
    type SucursalAgenda,
    type TrabajadorAgenda,
} from "./AgendaClient";
import { cargarAgenda } from "./actions";

function obtenerRangoInicial() {
    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 35);

    const hasta = new Date(hoy);
    hasta.setDate(hoy.getDate() + 65);

    return {
        desde: desde.toISOString().slice(0, 10),
        hasta: hasta.toISOString().slice(0, 10),
    };
}

export default async function AgendaPage() {
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
            .select(
                "salon_id, sucursal_id, rol, estado",
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

    const [
        resultadoSucursales,
        resultadoTrabajadores,
    ] = await Promise.all([
        supabase
            .from("sucursales")
            .select(
                "id, nombre, es_principal",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq("estado", "ACTIVA")
            .order("es_principal", {
                ascending: false,
            })
            .order("nombre", {
                ascending: true,
            }),

        supabase
            .from("trabajadores")
            .select(
                "id, nombre_completo, color_calendario",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq("estado", "ACTIVO")
            .eq("permite_citas", true)
            .order("nombre_completo", {
                ascending: true,
            }),
    ]);

    const rango = obtenerRangoInicial();

    const agendaInicial = await cargarAgenda({
        fechaDesde: rango.desde,
        fechaHasta: rango.hasta,
        sucursalId:
            perfil.sucursal_id ??
            resultadoSucursales.data?.[0]
                ?.id ??
            undefined,
    });

    return (
        <div className="mx-auto max-w-[1800px]">
            <AgendaClient
                citasIniciales={
                    agendaInicial.citas
                }
                bloqueosIniciales={
                    agendaInicial.bloqueos
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalAgenda[]
                }
                trabajadores={
                    (resultadoTrabajadores.data ??
                        []) as TrabajadorAgenda[]
                }
                sucursalInicialId={
                    perfil.sucursal_id ??
                    resultadoSucursales.data?.[0]
                        ?.id ??
                    ""
                }
                rangoInicial={rango}
            />
        </div>
    );
}
