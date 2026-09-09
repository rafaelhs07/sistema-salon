import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ProductoFormClient, {
    type CategoriaProductoForm,
} from "./ProductoFormClient";

export default async function NuevoProductoPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: perfil } =
        await supabase
            .from("usuarios_perfiles")
            .select("salon_id, rol, estado")
            .eq("id", user.id)
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
        redirect(
            "/inventario/catalogo",
        );
    }

    const [
        resultadoCategorias,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("categorias_productos")
            .select("id, nombre")
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq("estado", "ACTIVA")
            .order("orden")
            .order("nombre"),

        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .maybeSingle(),
    ]);

    return (
        <div className="mx-auto max-w-[1450px]">
            <ProductoFormClient
                categorias={
                    (resultadoCategorias.data ??
                        []) as CategoriaProductoForm[]
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ??
                    "C$"
                }
            />
        </div>
    );
}