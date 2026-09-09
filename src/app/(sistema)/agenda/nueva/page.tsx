import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NuevaCitaClient, {
    type ClienteDisponible,
    type ServicioDisponible,
    type SucursalDisponible,
    type TrabajadorDisponible,
} from "./NuevaCitaClient";

export default async function NuevaCitaPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: perfil } = await supabase
        .from("usuarios_perfiles")
        .select("salon_id, sucursal_id, rol, estado")
        .eq("id", user.id)
        .single();

    if (!perfil || perfil.estado !== "ACTIVO") redirect("/login");

    const [clientes, sucursales, servicios, trabajadores, configuracion] = await Promise.all([
        supabase.from("clientes")
            .select("id, codigo_cliente, nombre_completo, telefono, whatsapp")
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .order("nombre_completo"),

        supabase.from("sucursales")
            .select("id, nombre, es_principal")
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("es_principal", { ascending: false })
            .order("nombre"),

        supabase.from("servicios")
            .select(`
        id,
        nombre,
        precio,
        duracion_minutos,
        color,
        requiere_anticipo,
        monto_anticipo,
        categorias_servicios (nombre),
        trabajador_servicios (trabajador_id, estado)
      `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .eq("permite_citas", true)
            .order("nombre"),

        supabase.from("trabajadores")
            .select("id, nombre_completo, color_calendario, permite_citas")
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .eq("permite_citas", true)
            .order("nombre_completo"),

        supabase.from("configuracion_salon")
            .select("simbolo_moneda, hora_apertura, hora_cierre")
            .eq("salon_id", perfil.salon_id)
            .single(),
    ]);

    const config = configuracion.data ?? {
        simbolo_moneda: "C$",
        hora_apertura: "08:00:00",
        hora_cierre: "18:00:00",
    };

    return (
        <div className="mx-auto max-w-6xl">
            <NuevaCitaClient
                clientes={(clientes.data ?? []) as ClienteDisponible[]}
                sucursales={(sucursales.data ?? []) as SucursalDisponible[]}
                servicios={(servicios.data ?? []) as unknown as ServicioDisponible[]}
                trabajadores={(trabajadores.data ?? []) as TrabajadorDisponible[]}
                sucursalInicialId={perfil.sucursal_id ?? sucursales.data?.[0]?.id ?? ""}
                simboloMoneda={config.simbolo_moneda}
                horaApertura={config.hora_apertura.slice(0, 5)}
                horaCierre={config.hora_cierre.slice(0, 5)}
            />
        </div>
    );
}