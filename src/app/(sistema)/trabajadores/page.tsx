import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import TrabajadoresClient, {
    type EspecialidadListado,
    type TrabajadorListado,
} from "./TrabajadoresClient";

type ConfiguracionMoneda = {
    simbolo_moneda: string;
};

export default async function TrabajadoresPage() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        redirect("/login");
    }

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

    if (!["SUPER_ADMIN", "ADMIN"].includes(perfil.rol)) {
        redirect("/inicio");
    }

    const [
        resultadoTrabajadores,
        resultadoSucursales,
        resultadoConfiguracion,
        resultadoEspecialidades,
    ] = await Promise.all([
        supabase
            .from("trabajadores")
            .select(`
        id,
        sucursal_id,
        nombre_completo,
        telefono,
        correo,
        direccion,
        descripcion,
        fecha_nacimiento,
        fecha_ingreso,
        color_calendario,
        modalidad_pago,
        salario_fijo,
        frecuencia_pago,
        tipo_comision,
        comision_general,
        permite_citas,
        estado,
        observaciones,
        sucursales (
          nombre
        ),
        trabajador_especialidades (
          especialidad_id,
          especialidades (
            id,
            nombre
          )
        )
      `)
            .eq("salon_id", perfil.salon_id)
            .order("estado", {
                ascending: true,
            })
            .order("nombre_completo", {
                ascending: true,
            }),

        supabase
            .from("sucursales")
            .select("id, nombre, es_principal")
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("es_principal", {
                ascending: false,
            })
            .order("nombre", {
                ascending: true,
            }),

        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq("salon_id", perfil.salon_id)
            .single(),

        supabase
            .from("especialidades")
            .select("id, nombre, estado")
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("nombre", {
                ascending: true,
            }),
    ]);

    if (resultadoTrabajadores.error) {
        console.error(
            "Error cargando trabajadores:",
            resultadoTrabajadores.error,
        );
    }

    if (resultadoSucursales.error) {
        console.error(
            "Error cargando sucursales:",
            resultadoSucursales.error,
        );
    }

    if (resultadoEspecialidades.error) {
        console.error(
            "Error cargando especialidades:",
            resultadoEspecialidades.error,
        );
    }

    const configuracion =
        resultadoConfiguracion.data as ConfiguracionMoneda | null;

    const trabajadores =
        (resultadoTrabajadores.data ??
            []) as unknown as TrabajadorListado[];

    const sucursales = resultadoSucursales.data ?? [];

    const especialidades =
        (resultadoEspecialidades.data ??
            []) as EspecialidadListado[];

    return (
        <div className="mx-auto max-w-[1600px]">
            <TrabajadoresClient
                trabajadoresIniciales={trabajadores}
                sucursales={sucursales}
                especialidadesIniciales={especialidades}
                simboloMoneda={
                    configuracion?.simbolo_moneda ?? "C$"
                }
            />
        </div>
    );
}