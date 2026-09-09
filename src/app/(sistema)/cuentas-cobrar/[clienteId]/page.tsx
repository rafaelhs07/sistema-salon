import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import EstadoCuentaClienteClient, {
    type ClienteEstadoCuenta,
    type CuentaClienteDetalle,
} from "./EstadoCuentaClienteClient";

type AbonoBD = {
    id: string;
    cuenta_id: string;
    monto: number;
    estado: string;
    referencia: string | null;
    observaciones: string | null;
    fecha_abono: string;
};

type PagoAbonoBD = {
    id: string;
    abono_id: string;
    metodo_pago: string;
    monto: number;
    monto_recibido: number | null;
    cambio: number;
    porcentaje_comision_pos: number;
    monto_comision_pos: number;
    monto_neto: number | null;
    referencia: string | null;
    banco: string | null;
    observaciones: string | null;
    estado: string;
    fecha_pago: string;
    terminales_pos: {
        nombre: string;
        banco: string | null;
    } | null;
};

export default async function EstadoCuentaClientePage({
    params,
}: {
    params: Promise<{
        clienteId: string;
    }>;
}) {
    const { clienteId } = await params;
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
            "RECEPCION",
            "CAJA",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    /*
     * 1. CLIENTE
     */
    const {
        data: cliente,
        error: clienteError,
    } = await supabase
        .from("clientes")
        .select(`
            id,
            codigo_cliente,
            nombre_completo,
            telefono,
            whatsapp,
            correo
        `)
        .eq("id", clienteId)
        .eq("salon_id", perfil.salon_id)
        .maybeSingle();

    if (clienteError) {
        console.error(
            "Error cliente:",
            clienteError.message,
            clienteError.code,
            clienteError.details,
            clienteError.hint,
        );
    }

    /*
     * 2. CUENTAS
     *
     * Sin anidar abonos ni pagos.
     */
    const {
        data: cuentasBase,
        error: cuentasError,
    } = await supabase
        .from("cuentas_cobrar")
        .select(`
            id,
            codigo_cuenta,
            sucursal_id,
            cliente_id,
            venta_id,
            cita_id,
            monto_original,
            monto_abonado,
            saldo_pendiente,
            fecha_origen,
            fecha_vencimiento,
            estado,
            observaciones,

            sucursales (
                nombre
            ),

            ventas (
                id,
                codigo_venta,
                tipo_venta,
                total,
                monto_pagado,
                saldo_pendiente,
                estado,
                estado_pago,
                fecha_venta
            )
        `)
        .eq("salon_id", perfil.salon_id)
        .eq("cliente_id", clienteId)
        .order("fecha_origen", {
            ascending: false,
        });

    if (cuentasError) {
        throw new Error(
            [
                "Error cargando cuentas por cobrar.",
                `Mensaje: ${cuentasError.message}`,
                `Código: ${cuentasError.code ?? "sin código"}`,
                `Detalles: ${cuentasError.details ?? "sin detalles"}`,
                `Hint: ${cuentasError.hint ?? "sin hint"}`,
            ].join(" "),
        );
    }

    const cuentas = cuentasBase ?? [];
    const cuentaIds = cuentas.map(
        (cuenta) => cuenta.id,
    );

    /*
     * 3. ABONOS
     */
    let abonos: AbonoBD[] = [];

    if (cuentaIds.length > 0) {
        const {
            data: abonosData,
            error: abonosError,
        } = await supabase
            .from("cuentas_cobrar_abonos")
            .select(`
                id,
                cuenta_id,
                monto,
                estado,
                referencia,
                observaciones,
                fecha_abono
            `)
            .eq("salon_id", perfil.salon_id)
            .in("cuenta_id", cuentaIds)
            .order("fecha_abono", {
                ascending: false,
            });

        if (abonosError) {
            throw new Error(
                [
                    "Error cargando abonos.",
                    `Mensaje: ${abonosError.message}`,
                    `Código: ${abonosError.code ?? "sin código"}`,
                    `Detalles: ${abonosError.details ?? "sin detalles"}`,
                    `Hint: ${abonosError.hint ?? "sin hint"}`,
                ].join(" "),
            );
        }

        abonos =
            (abonosData ?? []) as AbonoBD[];
    }

    /*
     * 4. PAGOS DE ABONOS
     */
    const abonoIds = abonos.map(
        (abono) => abono.id,
    );

    let pagosAbonos: PagoAbonoBD[] = [];

    if (abonoIds.length > 0) {
        const {
            data: pagosData,
            error: pagosError,
        } = await supabase
            .from(
                "cuentas_cobrar_abono_pagos",
            )
            .select(`
                id,
                abono_id,
                metodo_pago,
                monto,
                monto_recibido,
                cambio,
                porcentaje_comision_pos,
                monto_comision_pos,
                monto_neto,
                referencia,
                banco,
                observaciones,
                estado,
                fecha_pago,

                terminales_pos (
                    nombre,
                    banco
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .in("abono_id", abonoIds)
            .order("fecha_pago", {
                ascending: false,
            });

        if (pagosError) {
            throw new Error(
                [
                    "Error cargando pagos de abonos.",
                    `Mensaje: ${pagosError.message}`,
                    `Código: ${pagosError.code ?? "sin código"}`,
                    `Detalles: ${pagosError.details ?? "sin detalles"}`,
                    `Hint: ${pagosError.hint ?? "sin hint"}`,
                ].join(" "),
            );
        }

        pagosAbonos =
            (pagosData ??
                []) as unknown as PagoAbonoBD[];
    }

    /*
     * 5. UNIR TODO EN MEMORIA
     */
    const cuentasCompletas =
        cuentas.map((cuenta) => {
            const abonosCuenta =
                abonos
                    .filter(
                        (abono) =>
                            abono.cuenta_id ===
                            cuenta.id,
                    )
                    .map((abono) => ({
                        id: abono.id,
                        monto: abono.monto,
                        estado: abono.estado,
                        referencia:
                            abono.referencia,
                        observaciones:
                            abono.observaciones,
                        fecha_abono:
                            abono.fecha_abono,

                        cuentas_cobrar_abono_pagos:
                            pagosAbonos
                                .filter(
                                    (pago) =>
                                        pago.abono_id ===
                                        abono.id,
                                )
                                .map(
                                    ({
                                        abono_id,
                                        ...pago
                                    }) => pago,
                                ),
                    }));

            return {
                ...cuenta,
                cuentas_cobrar_abonos:
                    abonosCuenta,
            };
        });

    /*
     * Si el cliente directo no aparece por alguna
     * política RLS, intentamos obtenerlo de la cuenta
     * únicamente para evitar un 404 engañoso.
     */
    let clienteFinal =
        cliente as ClienteEstadoCuenta | null;

    if (
        !clienteFinal &&
        cuentas.length > 0
    ) {
        const {
            data: clienteFallback,
            error: clienteFallbackError,
        } = await supabase
            .from("clientes")
            .select(`
                id,
                codigo_cliente,
                nombre_completo,
                telefono,
                whatsapp,
                correo
            `)
            .eq(
                "id",
                cuentas[0].cliente_id,
            )
            .maybeSingle();

        if (
            !clienteFallbackError &&
            clienteFallback
        ) {
            clienteFinal =
                clienteFallback as ClienteEstadoCuenta;
        }
    }

    if (
        !clienteFinal &&
        cuentas.length === 0
    ) {
        notFound();
    }

    if (!clienteFinal) {
        clienteFinal = {
            id: clienteId,
            codigo_cliente: null,
            nombre_completo: "Cliente",
            telefono: null,
            whatsapp: null,
            correo: null,
        };
    }

    /*
     * 6. CONFIGURACION
     */
    const {
        data: configuracion,
    } = await supabase
        .from("configuracion_salon")
        .select("simbolo_moneda")
        .eq("salon_id", perfil.salon_id)
        .maybeSingle();

    return (
        <div className="mx-auto max-w-[1450px]">
            <EstadoCuentaClienteClient
                cliente={clienteFinal}
                cuentas={
                    cuentasCompletas as unknown as CuentaClienteDetalle[]
                }
                simboloMoneda={
                    configuracion
                        ?.simbolo_moneda ??
                    "C$"
                }
            />
        </div>
    );
}