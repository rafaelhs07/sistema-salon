import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import FinanzasClient, {
    type MovimientoFinancieroListado,
    type SucursalFinanciera,
} from "./FinanzasClient";

type ConfiguracionMoneda = {
    simbolo_moneda: string;
};

function obtenerFechaInicioMesActual() {
    const ahora = new Date();
    return new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        1,
    )
        .toISOString()
        .slice(0, 10);
}

function obtenerFechaHaceMeses(meses: number) {
    const ahora = new Date();
    return new Date(
        ahora.getFullYear(),
        ahora.getMonth() - meses,
        1,
    )
        .toISOString()
        .slice(0, 10);
}

export default async function FinanzasPage() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        redirect("/login");
    }

    const { data: perfil, error: perfilError } = await supabase
        .from("usuarios_perfiles")
        .select("salon_id, rol, estado, sucursal_id")
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
        !["SUPER_ADMIN", "ADMIN", "CAJA"].includes(
            perfil.rol,
        )
    ) {
        redirect("/inicio");
    }

    const fechaInicioMes = obtenerFechaInicioMesActual();
    const fechaInicioGrafico = obtenerFechaHaceMeses(5);

    const [
        resultadoConfiguracion,
        resultadoSucursales,
        resultadoMovimientosMes,
        resultadoMovimientosGrafico,
        resultadoRecientes,
    ] = await Promise.all([
        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq("salon_id", perfil.salon_id)
            .single(),

        supabase
            .from("sucursales")
            .select("id, nombre, es_principal, estado")
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("es_principal", {
                ascending: false,
            })
            .order("nombre", {
                ascending: true,
            }),

        supabase
            .from("movimientos_financieros")
            .select(
                `
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
            `,
            )
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "APLICADO")
            .gte("fecha_movimiento", `${fechaInicioMes}T00:00:00`)
            .order("fecha_movimiento", {
                ascending: false,
            })
            .limit(500),

        supabase
            .from("movimientos_financieros")
            .select(
                `
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
            `,
            )
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "APLICADO")
            .gte("fecha_movimiento", `${fechaInicioGrafico}T00:00:00`)
            .order("fecha_movimiento", {
                ascending: false,
            })
            .limit(1000),

        supabase
            .from("movimientos_financieros")
            .select(
                `
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
            `,
            )
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "APLICADO")
            .order("fecha_movimiento", {
                ascending: false,
            })
            .limit(14),
    ]);

    if (resultadoMovimientosMes.error) {
        console.error(
            "Error cargando movimientos del mes:",
            resultadoMovimientosMes.error,
        );
    }

    if (resultadoMovimientosGrafico.error) {
        console.error(
            "Error cargando movimientos del gráfico:",
            resultadoMovimientosGrafico.error,
        );
    }

    if (resultadoRecientes.error) {
        console.error(
            "Error cargando movimientos recientes:",
            resultadoRecientes.error,
        );
    }

    const configuracion =
        resultadoConfiguracion.data as ConfiguracionMoneda | null;

    const movimientosMes =
        (resultadoMovimientosMes.data ??
            []) as unknown as MovimientoFinancieroListado[];

    const movimientosGrafico =
        (resultadoMovimientosGrafico.data ??
            []) as unknown as MovimientoFinancieroListado[];

    const movimientosRecientes =
        (resultadoRecientes.data ??
            []) as unknown as MovimientoFinancieroListado[];

    const movimientosBase = [
        ...movimientosGrafico,
        ...movimientosMes,
        ...movimientosRecientes,
    ];

    const mapaMovimientos = new Map<
        string,
        MovimientoFinancieroListado
    >();

    for (const movimiento of movimientosBase) {
        mapaMovimientos.set(movimiento.id, movimiento);
    }

    const movimientos = Array.from(
        mapaMovimientos.values(),
    ).sort((a, b) =>
        b.fecha_movimiento.localeCompare(
            a.fecha_movimiento,
        ),
    );

    return (
        <div className="mx-auto max-w-[1700px]">
            <FinanzasClient
                simboloMoneda={
                    configuracion?.simbolo_moneda ?? "C$"
                }
                sucursales={
                    (resultadoSucursales.data ??
                        []) as SucursalFinanciera[]
                }
                sucursalInicialId={
                    perfil.sucursal_id ?? ""
                }
                movimientos={movimientos}
            />
        </div>
    );
}