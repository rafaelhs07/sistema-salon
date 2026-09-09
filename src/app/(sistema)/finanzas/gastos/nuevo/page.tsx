import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import NuevoGastoClient, {
    type CajaAbiertaGasto,
    type CategoriaGasto,
    type SucursalGasto,
} from "./NuevoGastoClient";

export default async function NuevoGastoPage() {
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
        .from("usuarios_perfiles")
        .select(
            "salon_id, rol, estado, sucursal_id",
        )
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
            "CAJA",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const [
        sucursales,
        categorias,
        cajas,
        configuracion,
    ] = await Promise.all([
        supabase
            .from("sucursales")
            .select(
                "id, nombre, es_principal, estado",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "ACTIVA",
            )
            .order(
                "es_principal",
                {
                    ascending: false,
                },
            )
            .order("nombre"),

        supabase
            .from(
                "categorias_financieras",
            )
            .select(
                "id, nombre, descripcion, sistema",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "tipo",
                "GASTO",
            )
            .eq(
                "estado",
                "ACTIVA",
            )
            .order("nombre"),

        supabase
            .from(
                "cajas_sesiones",
            )
            .select(
                "id, sucursal_id, fecha_apertura, estado",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "ABIERTA",
            )
            .order(
                "fecha_apertura",
                {
                    ascending: false,
                },
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

    return (
        <div className="mx-auto max-w-[1450px]">
            <NuevoGastoClient
                simboloMoneda={
                    configuracion.data
                        ?.simbolo_moneda ??
                    "C$"
                }
                sucursales={
                    (
                        sucursales.data ??
                        []
                    ) as SucursalGasto[]
                }
                categorias={
                    (
                        categorias.data ??
                        []
                    ) as CategoriaGasto[]
                }
                cajasAbiertas={
                    (
                        cajas.data ??
                        []
                    ) as CajaAbiertaGasto[]
                }
                sucursalInicialId={
                    perfil.sucursal_id ??
                    sucursales.data?.[0]
                        ?.id ??
                    ""
                }
            />
        </div>
    );
}