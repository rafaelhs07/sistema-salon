import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ProveedoresClient, {
    type ProveedorListado,
} from "./ProveedoresClient";

export default async function ProveedoresPage() {
    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
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
            "INVENTARIO",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const {
        data: proveedores,
        error,
    } = await supabase
        .from("proveedores")
        .select(`
            id,
            codigo_proveedor,
            nombre,
            ruc,
            categoria,
            contacto,
            telefono,
            whatsapp,
            correo,
            direccion,
            condiciones_pago,
            observaciones,
            estado,
            creado_en,
            actualizado_en
        `)
        .eq(
            "salon_id",
            perfil.salon_id,
        )
        .order("estado", {
            ascending: true,
        })
        .order("nombre", {
            ascending: true,
        });

    if (error) {
        console.error(
            "Error cargando proveedores:",
            error,
        );
    }

    return (
        <div className="mx-auto max-w-[1600px]">
            <ProveedoresClient
                proveedoresIniciales={
                    (proveedores ??
                        []) as ProveedorListado[]
                }
            />
        </div>
    );
}