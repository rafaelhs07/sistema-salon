import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ClientesClient, {
    type ClienteListado,
} from "./ClientesClient";

export default async function ClientesPage() {
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
            "TRABAJADOR",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const [resultadoClientes, resultadoSucursales] =
        await Promise.all([
            supabase
                .from("clientes")
                .select(`
          id,
          codigo_cliente,
          sucursal_id,
          nombre_completo,
          telefono,
          whatsapp,
          correo,
          direccion,
          fecha_nacimiento,
          genero,
          contacto_emergencia_nombre,
          contacto_emergencia_telefono,
          como_conocio_salon,
          permite_notificaciones,
          permite_whatsapp,
          permite_correo,
          cliente_frecuente,
          estado,
          observaciones,
          fecha_registro,
          sucursales (
            nombre
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
        ]);

    if (resultadoClientes.error) {
        console.error(
            "Error cargando clientes:",
            resultadoClientes.error,
        );
    }

    if (resultadoSucursales.error) {
        console.error(
            "Error cargando sucursales:",
            resultadoSucursales.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1600px]">
            <ClientesClient
                clientesIniciales={
                    (resultadoClientes.data ??
                        []) as unknown as ClienteListado[]
                }
                sucursales={resultadoSucursales.data ?? []}
            />
        </div>
    );
}