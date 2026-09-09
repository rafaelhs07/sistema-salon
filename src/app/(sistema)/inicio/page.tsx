import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import InicioDashboardClient, {
    type CitaHoyDashboard,
    type DatosDashboard,
    type MovimientoDashboard,
    type ProductoAlertaDashboard,
    type VentaDashboard,
} from "./InicioDashboardClient";

function fechaManaguaISO() {
    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                "America/Managua",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        },
    ).format(
        new Date(),
    );
}

function inicioMesActual() {
    const hoy =
        new Date();

    return new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1,
    ).toISOString();
}

function inicioHaceSeisMeses() {
    const hoy =
        new Date();

    return new Date(
        hoy.getFullYear(),
        hoy.getMonth() -
        5,
        1,
    ).toISOString();
}

export default async function InicioPage() {
    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } =
        await supabase.auth.getUser();

    if (
        usuarioError ||
        !user
    ) {
        redirect(
            "/login",
        );
    }

    const {
        data: perfil,
        error: perfilError,
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
        perfilError ||
        !perfil ||
        perfil.estado !==
        "ACTIVO"
    ) {
        redirect(
            "/login",
        );
    }

    const hoy =
        fechaManaguaISO();

    const [
        configuracionResultado,
        salonResultado,
        movimientosResultado,
        ventasResultado,
        citasHoyResultado,
        citasMesResultado,
        productosResultado,
        clientesResultado,
        comprasResultado,
    ] =
        await Promise.all([
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

            supabase
                .from(
                    "salones",
                )
                .select(
                    "nombre",
                )
                .eq(
                    "id",
                    perfil.salon_id,
                )
                .maybeSingle(),

            supabase
                .from(
                    "movimientos_financieros",
                )
                .select(
                    "id, tipo, monto, fecha_movimiento, concepto, estado",
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
                    inicioHaceSeisMeses(),
                )
                .order(
                    "fecha_movimiento",
                    {
                        ascending:
                            true,
                    },
                )
                .limit(
                    10000,
                ),

            supabase
                .from(
                    "ventas",
                )
                .select(
                    "id, total, monto_pagado, saldo_pendiente, estado, estado_pago, fecha_venta, tipo_venta",
                )
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .gte(
                    "fecha_venta",
                    inicioHaceSeisMeses(),
                )
                .order(
                    "fecha_venta",
                    {
                        ascending:
                            false,
                    },
                )
                .limit(
                    10000,
                ),

            supabase
                .from(
                    "citas",
                )
                .select(`
                    id,
                    codigo_cita,
                    fecha,
                    hora_inicio,
                    hora_fin,
                    estado,
                    total,
                    clientes (
                        nombre_completo
                    ),
                    cita_servicios (
                        nombre_servicio,
                        trabajadores (
                            nombre_completo
                        )
                    )
                `)
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .eq(
                    "fecha",
                    hoy,
                )
                .order(
                    "hora_inicio",
                    {
                        ascending:
                            true,
                    },
                )
                .limit(
                    100,
                ),

            supabase
                .from(
                    "citas",
                )
                .select(
                    "id, fecha, estado, total",
                )
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .gte(
                    "fecha",
                    inicioMesActual().slice(
                        0,
                        10,
                    ),
                )
                .limit(
                    5000,
                ),

            supabase
                .from(
                    "productos",
                )
                .select(
                    "id, codigo_producto, nombre, stock, stock_minimo, controla_stock, estado",
                )
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .eq(
                    "estado",
                    "ACTIVO",
                )
                .limit(
                    10000,
                ),

            supabase
                .from(
                    "clientes",
                )
                .select(
                    "id",
                    {
                        count:
                            "exact",
                        head: true,
                    },
                )
                .eq(
                    "salon_id",
                    perfil.salon_id,
                ),

            supabase
                .from(
                    "compras",
                )
                .select(
                    "id, total, fecha_compra, estado",
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
                    inicioMesActual(),
                )
                .limit(
                    5000,
                ),
        ]);

    const movimientos =
        (
            movimientosResultado.data ??
            []
        ) as MovimientoDashboard[];

    const ventas =
        (
            ventasResultado.data ??
            []
        ) as VentaDashboard[];

    const productos =
        productosResultado.data ??
        [];

    const productosAlerta =
        productos
            .filter(
                (
                    producto,
                ) =>
                    producto.controla_stock &&
                    Number(
                        producto.stock ??
                        0,
                    ) <=
                    Number(
                        producto.stock_minimo ??
                        0,
                    ),
            )
            .sort(
                (
                    a,
                    b,
                ) =>
                    Number(
                        a.stock,
                    ) -
                    Number(
                        b.stock,
                    ),
            )
            .slice(
                0,
                8,
            ) as ProductoAlertaDashboard[];

    const comprasMes =
        (
            comprasResultado.data ??
            []
        ).reduce(
            (
                total,
                compra,
            ) =>
                total +
                Number(
                    compra.total ??
                    0,
                ),
            0,
        );

    const datos: DatosDashboard =
    {
        salonNombre:
            salonResultado.data
                ?.nombre ??
            "Mi salón",

        simboloMoneda:
            configuracionResultado
                .data
                ?.simbolo_moneda ??
            "C$",

        clientesTotal:
            clientesResultado.count ??
            0,

        comprasMes,

        movimientos,

        ventas,

        citasHoy:
            (
                citasHoyResultado.data ??
                []
            ) as unknown as CitaHoyDashboard[],

        citasMes:
            citasMesResultado.data ??
            [],

        productosAlerta,
    };

    return (
        <InicioDashboardClient
            datos={
                datos
            }
        />
    );
}
