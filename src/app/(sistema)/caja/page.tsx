import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CajaClient, {
    type CajaAbierta,
    type SucursalCaja,
} from "./CajaClient";

export default async function CajaPage() {
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

    const [resultadoSucursales, resultadoCajas] =
        await Promise.all([
            supabase
                .from("sucursales")
                .select(
                    "id, nombre, es_principal, estado",
                )
                .eq("salon_id", perfil.salon_id)
                .eq("estado", "ACTIVA")
                .order("es_principal", {
                    ascending: false,
                })
                .order("nombre"),

            supabase
                .from("cajas_sesiones")
                .select(`
                    id,
                    sucursal_id,
                    usuario_apertura_id,
                    fecha_apertura,
                    monto_inicial,
                    total_ventas_efectivo,
                    total_ventas_otros,
                    total_ingresos_manuales,
                    total_egresos,
                    estado,
                    observaciones_apertura,
                    sucursales (
                        nombre
                    )
                `)
                .eq("salon_id", perfil.salon_id)
                .eq("estado", "ABIERTA")
                .order("fecha_apertura", {
                    ascending: false,
                }),
        ]);

    if (resultadoSucursales.error) {
        console.error(
            "Error cargando sucursales:",
            resultadoSucursales.error,
        );
    }

    if (resultadoCajas.error) {
        console.error(
            "Error cargando cajas:",
            resultadoCajas.error,
        );
    }

    const sucursales =
        (resultadoSucursales.data ??
            []) as SucursalCaja[];

    const cajasAbiertas =
        (resultadoCajas.data ??
            []) as unknown as CajaAbierta[];

    const sucursalInicial =
        sucursales.find(
            (sucursal) =>
                sucursal.es_principal &&
                !cajasAbiertas.some(
                    (caja) =>
                        caja.sucursal_id === sucursal.id,
                ),
        ) ??
        sucursales.find(
            (sucursal) =>
                !cajasAbiertas.some(
                    (caja) =>
                        caja.sucursal_id === sucursal.id,
                ),
        ) ??
        null;

    return (
        <div className="mx-auto max-w-[1450px]">
            <CajaClient
                sucursales={sucursales}
                cajasIniciales={cajasAbiertas}
                sucursalInicialId={
                    sucursalInicial?.id ?? ""
                }
            />
        </div>
    );
}