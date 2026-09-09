import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReporteComprasProveedoresClient, {
    type CompraReporteProveedores,
    type ProveedorReporteFiltro,
    type SucursalReporteCompras,
} from "./ReporteComprasProveedoresClient";

function fechaDesdeConsulta() {
    const hoy = new Date();

    return new Date(
        hoy.getFullYear() - 1,
        0,
        1,
    ).toISOString();
}

export default async function ReporteComprasProveedoresPage() {
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
        comprasResultado,
        proveedoresResultado,
        sucursalesResultado,
        configuracionResultado,
    ] = await Promise.all([
        supabase
            .from("compras")
            .select(`
                id,
                codigo_compra,
                numero_factura,
                fecha_compra,
                condicion_pago,
                subtotal,
                descuento,
                impuestos,
                total,
                monto_pagado,
                saldo_pendiente,
                estado_pago,
                estado,
                proveedor_id,
                sucursal_id,
                proveedores (
                    codigo_proveedor,
                    nombre
                ),
                sucursales (
                    nombre
                ),
                compra_detalles (
                    id,
                    producto_id,
                    cantidad,
                    costo_unitario,
                    descuento,
                    subtotal,
                    total,
                    productos (
                        codigo_producto,
                        nombre,
                        unidad_medida
                    )
                )
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .gte(
                "fecha_compra",
                fechaDesdeConsulta(),
            )
            .order(
                "fecha_compra",
                {
                    ascending: false,
                },
            )
            .limit(7000),

        supabase
            .from("proveedores")
            .select(
                "id, codigo_proveedor, nombre, estado",
            )
            .eq(
                "salon_id",
                perfil.salon_id,
            )
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
        comprasResultado.error
    ) {
        console.error(
            "Error cargando reporte de compras:",
            comprasResultado.error,
        );
    }

    if (
        proveedoresResultado.error
    ) {
        console.error(
            "Error cargando proveedores:",
            proveedoresResultado.error,
        );
    }

    return (
        <div className="mx-auto max-w-[1750px]">
            <ReporteComprasProveedoresClient
                simboloMoneda={
                    configuracionResultado
                        .data
                        ?.simbolo_moneda ??
                    "C$"
                }
                compras={
                    (
                        comprasResultado.data ??
                        []
                    ) as unknown as CompraReporteProveedores[]
                }
                proveedores={
                    (
                        proveedoresResultado.data ??
                        []
                    ) as ProveedorReporteFiltro[]
                }
                sucursales={
                    (
                        sucursalesResultado.data ??
                        []
                    ) as SucursalReporteCompras[]
                }
            />
        </div>
    );
}
