import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CuentaPagarDetalleClient, { type CuentaPagarDetalle } from "./CuentaPagarDetalleClient";

export default async function CuentaPagarDetallePage({
    params,
}: {
    params: Promise<{ cuentaId: string }>;
}) {
    const { cuentaId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: perfil } = await supabase
        .from("usuarios_perfiles")
        .select("salon_id, rol, estado")
        .eq("id", user.id)
        .single();

    if (!perfil || perfil.estado !== "ACTIVO") redirect("/login");
    if (!["SUPER_ADMIN", "ADMIN", "INVENTARIO"].includes(perfil.rol)) redirect("/inicio");

    const { data: cuenta } = await supabase
        .from("cuentas_pagar")
        .select("id, proveedor_id, compra_id, monto_original, total_abonado, saldo_pendiente, fecha_origen, fecha_vencimiento, estado, observaciones")
        .eq("id", cuentaId)
        .eq("salon_id", perfil.salon_id)
        .maybeSingle();

    if (!cuenta) notFound();

    const [prov, compra, abonos] = await Promise.all([
        supabase.from("proveedores")
            .select("id, codigo_proveedor, nombre, contacto, telefono, whatsapp, correo")
            .eq("id", cuenta.proveedor_id)
            .eq("salon_id", perfil.salon_id)
            .maybeSingle(),

        supabase.from("compras")
            .select("id, codigo_compra, numero_factura, condicion_pago")
            .eq("id", cuenta.compra_id)
            .eq("salon_id", perfil.salon_id)
            .maybeSingle(),

        supabase.from("abonos_cuentas_pagar")
            .select("id, monto, metodo_pago, referencia, observaciones, estado, fecha_abono")
            .eq("cuenta_pagar_id", cuenta.id)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_abono", { ascending: false }),
    ]);

    const detalle: CuentaPagarDetalle = {
        id: cuenta.id,
        proveedorNombre: prov.data?.nombre ?? "Proveedor",
        proveedorCodigo: prov.data?.codigo_proveedor ?? "",
        proveedorContacto: prov.data?.contacto ?? null,
        proveedorTelefono: prov.data?.telefono ?? null,
        proveedorWhatsapp: prov.data?.whatsapp ?? null,
        proveedorCorreo: prov.data?.correo ?? null,
        compraId: cuenta.compra_id,
        codigoCompra: compra.data?.codigo_compra ?? "",
        numeroFactura: compra.data?.numero_factura ?? null,
        condicionPago: compra.data?.condicion_pago ?? "",
        montoOriginal: Number(cuenta.monto_original),
        totalAbonado: Number(cuenta.total_abonado),
        saldoPendiente: Number(cuenta.saldo_pendiente),
        fechaOrigen: cuenta.fecha_origen,
        fechaVencimiento: cuenta.fecha_vencimiento,
        estado: cuenta.estado,
        observaciones: cuenta.observaciones,
        abonos: (abonos.data ?? []).map((a) => ({
            id: a.id,
            monto: Number(a.monto),
            metodoPago: a.metodo_pago,
            referencia: a.referencia,
            observaciones: a.observaciones,
            estado: a.estado,
            fechaAbono: a.fecha_abono,
        })),
    };

    return <CuentaPagarDetalleClient cuenta={detalle} />;
}