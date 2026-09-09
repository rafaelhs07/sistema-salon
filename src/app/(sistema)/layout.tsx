import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

type RolUsuario =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "RECEPCION"
    | "CAJA"
    | "TRABAJADOR"
    | "INVENTARIO";

type PerfilConsulta = {
    nombre_completo: string;
    correo: string;
    rol: RolUsuario;
    estado: string;
    salones: {
        nombre: string;
    } | null;
    sucursales: {
        nombre: string;
    } | null;
};

export default async function SistemaLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        redirect("/login");
    }

    const { data, error } = await supabase
        .from("usuarios_perfiles")
        .select(`
      nombre_completo,
      correo,
      rol,
      estado,
      salones (
        nombre
      ),
      sucursales (
        nombre
      )
    `)
        .eq("id", user.id)
        .single();

    if (error || !data) {
        console.error("No se pudo cargar el perfil:", error);
        redirect("/login");
    }

    const perfil = data as unknown as PerfilConsulta;

    if (perfil.estado !== "ACTIVO") {
        await supabase.auth.signOut();
        redirect("/login");
    }

    return (
        <AppShell
            perfil={{
                nombreCompleto: perfil.nombre_completo,
                correo: perfil.correo,
                rol: perfil.rol,
                salonNombre:
                    perfil.salones?.nombre ?? "Salón de belleza",
                sucursalNombre:
                    perfil.sucursales?.nombre ?? "Sucursal principal",
            }}
        >
            {children}
        </AppShell>
    );
}