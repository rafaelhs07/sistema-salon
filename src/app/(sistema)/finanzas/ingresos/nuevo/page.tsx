import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import NuevoIngresoClient, {
    type CajaAbiertaIngreso,
    type CategoriaIngreso,
    type SucursalIngreso,
} from "./NuevoIngresoClient";

export default async function NuevoIngresoPage() {
    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (
        usuarioError ||
        !user
    ) {
        redirect("/login");
    }

    const {
        data: perfil,
        error: perfilError,
    } = await supabase
        .from("usuarios_perfiles")
        .select(
            "salon_id, rol, estado, sucursal_id",
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
            "CAJA",
        ].includes(
            perfil.rol,
        )
    ) {
        redirect("/inicio");
    }

    const [
        resultadoSucursales,
        resultadoCategorias,
        resultadoCajas,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("sucursales")
            .select(`
                id,
                nombre,
                es_principal,
                estado
            `)
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
            .order(
                "nombre",
                {
                    ascending: true,
                },
            ),

        supabase
            .from(
                "categorias_financieras",
            )
            .select(`
                id,
                nombre,
                descripcion,
                sistema
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "tipo",
                "INGRESO",
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
            .select(`
                id,
                sucursal_id,
                fecha_apertura,
                estado
            `)
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

    if (
        resultadoSucursales.error
    ) {
        console.error(
            "Error cargando sucursales:",
            resultadoSucursales.error,
        );
    }

    if (
        resultadoCategorias.error
    ) {
        console.error(
            "Error cargando categorías:",
            resultadoCategorias.error,
        );
    }

    if (
        resultadoCajas.error
    ) {
        console.error(
            "Error cargando cajas abiertas:",
            resultadoCajas.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1450px]">
            <NuevoIngresoClient
                simboloMoneda={
                    resultadoConfiguracion
                        .data
                        ?.simbolo_moneda ??
                    "C$"
                }
                sucursales={
                    (
                        resultadoSucursales
                            .data ??
                        []
                    ) as SucursalIngreso[]
                }
                categorias={
                    (
                        resultadoCategorias
                            .data ??
                        []
                    ) as CategoriaIngreso[]
                }
                cajasAbiertas={
                    (
                        resultadoCajas
                            .data ??
                        []
                    ) as CajaAbiertaIngreso[]
                }
                sucursalInicialId={
                    perfil.sucursal_id ??
                    resultadoSucursales
                        .data?.[0]
                        ?.id ??
                    ""
                }
            />
        </div>
    );
}