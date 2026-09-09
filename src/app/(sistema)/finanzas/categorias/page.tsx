import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CategoriasFinancierasClient, {
    type CategoriaFinancieraListado,
} from "./CategoriasFinancierasClient";

export default async function CategoriasFinancierasPage() {
    const supabase =
        await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const {
        data: perfil,
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
        !perfil ||
        perfil.estado !== "ACTIVO"
    ) {
        redirect("/login");
    }

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
        ].includes(perfil.rol)
    ) {
        redirect("/finanzas");
    }

    const {
        data: categorias,
        error,
    } = await supabase
        .from(
            "categorias_financieras",
        )
        .select(`
            id,
            nombre,
            tipo,
            descripcion,
            sistema,
            estado,
            creado_en
        `)
        .eq(
            "salon_id",
            perfil.salon_id,
        )
        .order("tipo")
        .order("nombre");

    if (error) {
        console.error(
            "Error cargando categorías financieras:",
            error,
        );
    }

    return (
        <div className="mx-auto max-w-[1350px]">
            <CategoriasFinancierasClient
                categorias={
                    (
                        categorias ??
                        []
                    ) as CategoriaFinancieraListado[]
                }
            />
        </div>
    );
}