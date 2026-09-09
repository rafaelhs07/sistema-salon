import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ComprasClient, {
    type ResumenCompras,
} from "./ComprasClient";

export default async function ComprasPage() {
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

    const [
        proveedoresActivos,
        comprasConfirmadas,
        cuentasPendientes,
    ] = await Promise.all([
        supabase
            .from("proveedores")
            .select("id", {
                count: "exact",
                head: true,
            })
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq("estado", "ACTIVO"),

        supabase
            .from("compras")
            .select("id", {
                count: "exact",
                head: true,
            })
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .eq(
                "estado",
                "CONFIRMADA",
            ),

        supabase
            .from("cuentas_pagar")
            .select("saldo_pendiente")
            .eq(
                "salon_id",
                perfil.salon_id,
            )
            .in("estado", [
                "PENDIENTE",
                "PARCIAL",
                "VENCIDA",
            ]),
    ]);

    const saldoPendiente =
        (
            cuentasPendientes.data ??
            []
        ).reduce(
            (total, cuenta) =>
                total +
                Number(
                    cuenta.saldo_pendiente ??
                    0,
                ),
            0,
        );

    const resumen: ResumenCompras = {
        proveedoresActivos:
            proveedoresActivos.count ??
            0,

        comprasConfirmadas:
            comprasConfirmadas.count ??
            0,

        cuentasPendientes:
            (
                cuentasPendientes.data ??
                []
            ).length,

        saldoPendiente,
    };

    return (
        <div className="mx-auto max-w-[1600px]">
            <ComprasClient
                resumen={resumen}
            />
        </div>
    );
}