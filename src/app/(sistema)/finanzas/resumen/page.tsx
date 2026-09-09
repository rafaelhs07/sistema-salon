import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ResumenFinancieroClient, {
    type MovimientoResumen,
    type SucursalResumen,
} from "./ResumenFinancieroClient";

function fechaInicioConsulta() {
    const hoy = new Date();

    return new Date(
        hoy.getFullYear() - 2,
        0,
        1,
    )
        .toISOString()
        .slice(0, 10);
}

export default async function ResumenFinancieroPage() {
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
        resultadoMovimientos,
        resultadoSucursales,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from(
                "movimientos_financieros",
            )
            .select(`
                id,
                sucursal_id,
                categoria_id,
                tipo,
                origen,
                metodo_pago,
                concepto,
                monto,
                fecha_movimiento,
                estado,
                categorias_financieras (
                    nombre
                ),
                sucursales (
                    nombre
                )
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "APLICADO",
            )
            .gte(
                "fecha_movimiento",
                `${fechaInicioConsulta()}T00:00:00`,
            )
            .order(
                "fecha_movimiento",
                {
                    ascending: true,
                },
            )
            .limit(10000),

        supabase
            .from("sucursales")
            .select(
                "id, nombre, es_principal",
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
        resultadoMovimientos.error
    ) {
        console.error(
            "Error cargando resumen financiero:",
            resultadoMovimientos.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1700px]">
            <ResumenFinancieroClient
                simboloMoneda={
                    resultadoConfiguracion
                        .data
                        ?.simbolo_moneda ??
                    "C$"
                }
                movimientos={
                    (
                        resultadoMovimientos
                            .data ??
                        []
                    ) as unknown as MovimientoResumen[]
                }
                sucursales={
                    (
                        resultadoSucursales
                            .data ??
                        []
                    ) as SucursalResumen[]
                }
                sucursalInicialId={
                    perfil.sucursal_id ??
                    "TODAS"
                }
            />
        </div>
    );
}