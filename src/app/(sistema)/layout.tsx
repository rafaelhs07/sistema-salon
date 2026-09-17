import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import type { TemaColorSistema } from "./configuracion/tema-actions";

type RolUsuario =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "RECEPCION"
    | "CAJA"
    | "TRABAJADOR"
    | "INVENTARIO";

type PerfilConsulta = {
    salon_id: string;
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
            salon_id,
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
        console.error(
            "No se pudo cargar el perfil:",
            error,
        );

        redirect("/login");
    }

    const perfil =
        data as unknown as PerfilConsulta;

    if (
        perfil.estado !==
        "ACTIVO"
    ) {
        redirect("/acceso-suspendido");
    }

    const { data: accesoActivo, error: accesoError } = await supabase.rpc("plataforma_acceso_actual");
    if (accesoError || accesoActivo !== true) redirect("/acceso-suspendido");

    const {
        data: configuracionTema,
    } =
        await supabase
            .from(
                "configuracion_salon",
            )
            .select(
                "tema_color",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle();

    const temaColor =
        (
            configuracionTema?.tema_color ??
            "SALVIA"
        ) as TemaColorSistema;

    return (
        <AppShell
            temaColor={
                temaColor
            }
            perfil={{
                nombreCompleto:
                    perfil.nombre_completo,
                correo:
                    perfil.correo,
                rol:
                    perfil.rol,
                salonNombre:
                    perfil.salones?.nombre ??
                    "Salón de belleza",
                sucursalNombre:
                    perfil.sucursales?.nombre ??
                    "Sucursal principal",
            }}
        >
            {children}
        </AppShell>
    );
}
