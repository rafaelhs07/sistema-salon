import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReporteFinancieroClient, {
    type CategoriaReporteFinanciero,
    type MovimientoReporteFinanciero,
    type SucursalReporteFinanciero,
} from "./ReporteFinancieroClient";

function fechaDesdeConsulta() {
    const hoy = new Date();

    return new Date(
        hoy.getFullYear() - 2,
        0,
        1,
    ).toISOString();
}

export default async function ReporteFinancieroPage() {
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
        ].includes(
            perfil.rol,
        )
    ) {
        redirect("/inicio");
    }

    const [
        movimientosResultado,
        categoriasResultado,
        sucursalesResultado,
        configuracionResultado,
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
                descripcion,
                monto,
                referencia,
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
            .gte(
                "fecha_movimiento",
                fechaDesdeConsulta(),
            )
            .order(
                "fecha_movimiento",
                {
                    ascending: false,
                },
            )
            .limit(10000),

        supabase
            .from(
                "categorias_financieras",
            )
            .select(
                "id, nombre, tipo",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .order("tipo")
            .order("nombre"),

        supabase
            .from("sucursales")
            .select(
                "id, nombre",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "ACTIVA",
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
        movimientosResultado.error
    ) {
        console.error(
            "Error cargando reporte financiero:",
            movimientosResultado.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1750px]">
            <ReporteFinancieroClient
                simboloMoneda={
                    configuracionResultado
                        .data
                        ?.simbolo_moneda ??
                    "C$"
                }
                movimientos={
                    (
                        movimientosResultado
                            .data ??
                        []
                    ) as unknown as MovimientoReporteFinanciero[]
                }
                categorias={
                    (
                        categoriasResultado
                            .data ??
                        []
                    ) as CategoriaReporteFinanciero[]
                }
                sucursales={
                    (
                        sucursalesResultado
                            .data ??
                        []
                    ) as SucursalReporteFinanciero[]
                }
            />
        </div>
    );
}