import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReportesClient, {
    type ResumenCentroReportes,
} from "./ReportesClient";

function inicioMesActual() {
    const ahora = new Date();

    return new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        1,
    ).toISOString();
}

export default async function ReportesPage() {
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

    const desde =
        inicioMesActual();

    const [
        movimientosResultado,
        ventasResultado,
        comprasResultado,
        clientesResultado,
        productosResultado,
        configuracionResultado,
    ] = await Promise.all([
        supabase
            .from(
                "movimientos_financieros",
            )
            .select(
                "tipo, monto",
            )
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
                desde,
            ),

        supabase
            .from("ventas")
            .select(
                "id",
                {
                    count: "exact",
                    head: true,
                },
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "ACTIVA",
            )
            .gte(
                "fecha_venta",
                desde,
            ),

        supabase
            .from("compras")
            .select(
                "id",
                {
                    count: "exact",
                    head: true,
                },
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "CONFIRMADA",
            )
            .gte(
                "fecha_compra",
                desde.slice(
                    0,
                    10,
                ),
            ),

        supabase
            .from("clientes")
            .select(
                "id",
                {
                    count: "exact",
                    head: true,
                },
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            ),

        supabase
            .from("productos")
            .select(
                "id",
                {
                    count: "exact",
                    head: true,
                },
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "ACTIVO",
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
        movimientosResultado.error
    ) {
        console.error(
            "Error cargando resumen financiero de reportes:",
            movimientosResultado.error,
        );
    }

    const movimientos =
        movimientosResultado.data ??
        [];

    const ingresos =
        movimientos
            .filter(
                (movimiento) =>
                    movimiento.tipo ===
                    "INGRESO",
            )
            .reduce(
                (
                    total,
                    movimiento,
                ) =>
                    total +
                    Number(
                        movimiento.monto,
                    ),
                0,
            );

    const gastos =
        movimientos
            .filter(
                (movimiento) =>
                    movimiento.tipo ===
                    "GASTO",
            )
            .reduce(
                (
                    total,
                    movimiento,
                ) =>
                    total +
                    Number(
                        movimiento.monto,
                    ),
                0,
            );

    const resumen: ResumenCentroReportes =
    {
        ingresosMes:
            ingresos,

        gastosMes:
            gastos,

        utilidadMes:
            ingresos -
            gastos,

        ventasMes:
            ventasResultado.count ??
            0,

        comprasMes:
            comprasResultado.count ??
            0,

        clientes:
            clientesResultado.count ??
            0,

        productos:
            productosResultado.count ??
            0,
    };

    return (
        <div className="mx-auto max-w-[1550px]">
            <ReportesClient
                simboloMoneda={
                    configuracionResultado
                        .data
                        ?.simbolo_moneda ??
                    "C$"
                }
                resumen={
                    resumen
                }
            />
        </div>
    );
}