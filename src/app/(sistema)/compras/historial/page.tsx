import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import HistorialComprasClient, {
    type CompraHistorial,
    type ProveedorFiltro,
    type SucursalFiltro,
} from "./HistorialComprasClient";

export default async function HistorialComprasPage() {
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
            "salon_id, rol, estado",
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
            "INVENTARIO",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const [
        resultadoCompras,
        resultadoProveedores,
        resultadoSucursales,
    ] = await Promise.all([
        supabase
            .from("compras")
            .select(`
                id,
                proveedor_id,
                sucursal_id,
                codigo_compra,
                numero_factura,
                fecha_compra,
                condicion_pago,
                total,
                monto_pagado,
                saldo_pendiente,
                estado_pago,
                estado
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .order(
                "fecha_compra",
                {
                    ascending: false,
                },
            )
            .limit(3000),

        supabase
            .from("proveedores")
            .select(`
                id,
                nombre
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .order("nombre"),

        supabase
            .from("sucursales")
            .select(`
                id,
                nombre
            `)
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .order("nombre"),
    ]);

    if (resultadoCompras.error) {
        console.error(
            "Error cargando historial de compras:",
            resultadoCompras.error,
        );
    }

    const proveedores =
        (resultadoProveedores.data ??
            []) as ProveedorFiltro[];

    const sucursales =
        (resultadoSucursales.data ??
            []) as SucursalFiltro[];

    const compras: CompraHistorial[] =
        (
            resultadoCompras.data ??
            []
        ).map(
            (compra) => ({
                id:
                    compra.id,

                codigoCompra:
                    compra.codigo_compra,

                numeroFactura:
                    compra.numero_factura,

                fechaCompra:
                    compra.fecha_compra,

                condicionPago:
                    compra.condicion_pago,

                total:
                    Number(
                        compra.total,
                    ),

                montoPagado:
                    Number(
                        compra.monto_pagado,
                    ),

                saldoPendiente:
                    Number(
                        compra.saldo_pendiente,
                    ),

                estadoPago:
                    compra.estado_pago,

                estado:
                    compra.estado,

                proveedorId:
                    compra.proveedor_id,

                proveedorNombre:
                    proveedores.find(
                        (proveedor) =>
                            proveedor.id ===
                            compra.proveedor_id,
                    )?.nombre ??
                    "Proveedor",

                sucursalId:
                    compra.sucursal_id,

                sucursalNombre:
                    sucursales.find(
                        (sucursal) =>
                            sucursal.id ===
                            compra.sucursal_id,
                    )?.nombre ??
                    "Sucursal",
            }),
        );

    return (
        <div className="mx-auto max-w-[1600px]">
            <HistorialComprasClient
                comprasIniciales={
                    compras
                }
                proveedores={
                    proveedores
                }
                sucursales={
                    sucursales
                }
            />
        </div>
    );
}