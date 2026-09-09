import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import DetalleMovimientoClient, {
    type MovimientoDetalle,
} from "./DetalleMovimientoClient";

export default async function DetalleMovimientoPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        redirect("/login");
    }

    const { data: perfil, error: perfilError } =
        await supabase
            .from("usuarios_perfiles")
            .select("salon_id, rol, estado")
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
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const [
        resultadoMovimiento,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("movimientos_caja")
            .select(`
                id,
                sucursal_id,
                caja_sesion_id,
                venta_id,
                pago_id,
                tipo,
                naturaleza,
                metodo_pago,
                concepto,
                monto,
                referencia,
                observaciones,
                fecha_movimiento,
                sucursales (
                    nombre,
                    direccion,
                    telefono
                ),
                ventas (
                    id,
                    codigo_venta,
                    tipo_venta,
                    total,
                    estado,
                    estado_pago
                ),
                cajas_sesiones (
                    id,
                    estado,
                    fecha_apertura,
                    fecha_cierre
                )
            `)
            .eq("id", id)
            .eq("salon_id", perfil.salon_id)
            .single(),

        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq("salon_id", perfil.salon_id)
            .single(),
    ]);

    if (
        resultadoMovimiento.error ||
        !resultadoMovimiento.data
    ) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-[1100px]">
            <DetalleMovimientoClient
                movimiento={
                    resultadoMovimiento.data as unknown as MovimientoDetalle
                }
                simboloMoneda={
                    resultadoConfiguracion.data
                        ?.simbolo_moneda ?? "C$"
                }
            />
        </div>
    );
}