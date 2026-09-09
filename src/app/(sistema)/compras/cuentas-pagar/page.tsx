import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CuentasPagarClient, {
    type CuentaPagarListado,
} from "./CuentasPagarClient";

export default async function CuentasPagarPage() {
    const supabase =
        await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
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
            "INVENTARIO",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const {
        data: cuentas,
        error,
    } = await supabase
        .from("cuentas_pagar")
        .select(`
            id,
            proveedor_id,
            compra_id,
            monto_original,
            total_abonado,
            saldo_pendiente,
            fecha_origen,
            fecha_vencimiento,
            estado,
            observaciones,
            creado_en
        `)
        .eq(
            "salon_id",
            perfil.salon_id,
        )
        .order(
            "creado_en",
            {
                ascending: false,
            },
        );

    if (error) {
        console.error(
            "Error cargando cuentas por pagar:",
            error,
        );
    }

    const proveedorIds = [
        ...new Set(
            (
                cuentas ??
                []
            ).map(
                (
                    cuenta,
                ) =>
                    cuenta.proveedor_id,
            ),
        ),
    ];

    const compraIds = [
        ...new Set(
            (
                cuentas ??
                []
            ).map(
                (
                    cuenta,
                ) =>
                    cuenta.compra_id,
            ),
        ),
    ];

    const [
        resultadoProveedores,
        resultadoCompras,
    ] = await Promise.all([
        proveedorIds.length > 0
            ? supabase
                .from("proveedores")
                .select(`
                      id,
                      nombre,
                      codigo_proveedor
                  `)
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .in(
                    "id",
                    proveedorIds,
                )
            : Promise.resolve({
                data: [],
                error: null,
            }),

        compraIds.length > 0
            ? supabase
                .from("compras")
                .select(`
                      id,
                      codigo_compra,
                      numero_factura,
                      fecha_compra,
                      condicion_pago
                  `)
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .in(
                    "id",
                    compraIds,
                )
            : Promise.resolve({
                data: [],
                error: null,
            }),
    ]);

    const cuentasListado: CuentaPagarListado[] =
        (
            cuentas ??
            []
        ).map(
            (
                cuenta,
            ) => {
                const proveedor =
                    (
                        resultadoProveedores.data ??
                        []
                    ).find(
                        (
                            item,
                        ) =>
                            item.id ===
                            cuenta.proveedor_id,
                    );

                const compra =
                    (
                        resultadoCompras.data ??
                        []
                    ).find(
                        (
                            item,
                        ) =>
                            item.id ===
                            cuenta.compra_id,
                    );

                return {
                    id:
                        cuenta.id,

                    proveedorId:
                        cuenta.proveedor_id,

                    proveedorNombre:
                        proveedor?.nombre ??
                        "Proveedor",

                    proveedorCodigo:
                        proveedor
                            ?.codigo_proveedor ??
                        "",

                    compraId:
                        cuenta.compra_id,

                    codigoCompra:
                        compra
                            ?.codigo_compra ??
                        "",

                    numeroFactura:
                        compra
                            ?.numero_factura ??
                        null,

                    condicionPago:
                        compra
                            ?.condicion_pago ??
                        "",

                    montoOriginal:
                        Number(
                            cuenta.monto_original,
                        ),

                    totalAbonado:
                        Number(
                            cuenta.total_abonado,
                        ),

                    saldoPendiente:
                        Number(
                            cuenta.saldo_pendiente,
                        ),

                    fechaOrigen:
                        cuenta.fecha_origen,

                    fechaVencimiento:
                        cuenta.fecha_vencimiento,

                    estado:
                        obtenerEstadoCuenta(
                            cuenta.estado,
                            Number(
                                cuenta.saldo_pendiente,
                            ),
                            cuenta.fecha_vencimiento,
                        ),

                    observaciones:
                        cuenta.observaciones,

                    creadoEn:
                        cuenta.creado_en,
                };
            },
        );

    return (
        <div className="mx-auto max-w-[1600px]">
            <CuentasPagarClient
                cuentasIniciales={
                    cuentasListado
                }
            />
        </div>
    );
}

function obtenerEstadoCuenta(
    estadoActual: string,
    saldoPendiente: number,
    fechaVencimiento: string | null,
) {
    if (
        estadoActual === "ANULADA" ||
        estadoActual === "PAGADA" ||
        saldoPendiente <= 0
    ) {
        return estadoActual;
    }

    if (!fechaVencimiento) {
        return estadoActual;
    }

    const hoy = new Date();

    const hoyLocal =
        new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            hoy.getDate(),
        );

    const [
        anio,
        mes,
        dia,
    ] = fechaVencimiento
        .split("-")
        .map(Number);

    const vencimiento =
        new Date(
            anio,
            mes - 1,
            dia,
        );

    if (
        vencimiento <
        hoyLocal
    ) {
        return "VENCIDA";
    }

    return estadoActual;
}
