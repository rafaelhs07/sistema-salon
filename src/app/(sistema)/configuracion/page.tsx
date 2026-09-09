import { redirect } from "next/navigation";
import {
    Building2,
    Settings2,
    ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import FormularioConfiguracion, {
    type SucursalConfiguracion,
    type TerminalPosConfiguracion,
} from "./FormularioConfiguracion";
import type { DatosConfiguracion } from "./actions";

type ConfiguracionConsulta = {
    nombre_salon: string;
    telefono: string | null;
    whatsapp: string | null;
    correo: string | null;
    direccion: string | null;
    moneda: string;
    simbolo_moneda: string;
    hora_apertura: string;
    hora_cierre: string;
    intervalo_citas_minutos: number;
    permitir_credito: boolean;
    permitir_pago_combinado: boolean;
    mensaje_recibo: string | null;
    politica_cancelacion: string | null;
};

export default async function ConfiguracionPage() {
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
        !["SUPER_ADMIN", "ADMIN"].includes(
            perfil.rol,
        )
    ) {
        redirect("/inicio");
    }

    const [
        resultadoConfiguracion,
        resultadoSucursales,
        resultadoTerminales,
    ] = await Promise.all([
        supabase
            .from("configuracion_salon")
            .select(`
                nombre_salon,
                telefono,
                whatsapp,
                correo,
                direccion,
                moneda,
                simbolo_moneda,
                hora_apertura,
                hora_cierre,
                intervalo_citas_minutos,
                permitir_credito,
                permitir_pago_combinado,
                mensaje_recibo,
                politica_cancelacion
            `)
            .eq("salon_id", perfil.salon_id)
            .single(),

        supabase
            .from("sucursales")
            .select(`
                id,
                nombre,
                es_principal,
                estado
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("es_principal", {
                ascending: false,
            })
            .order("nombre"),

        supabase
            .from("terminales_pos")
            .select(`
                id,
                nombre,
                banco,
                sucursal_id,
                porcentaje_comision,
                estado,
                fecha_registro,
                sucursales (
                    nombre
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .order("estado")
            .order("nombre"),
    ]);

    if (
        resultadoConfiguracion.error ||
        !resultadoConfiguracion.data
    ) {
        console.error(
            "No se pudo cargar la configuración:",
            resultadoConfiguracion.error,
        );

        return (
            <div className="mx-auto max-w-7xl">
                <div className="rounded-3xl border border-[#EBCBCB] bg-[#F8E5E5] p-6 text-[#985858]">
                    <h1 className="text-xl font-bold">
                        No se pudo cargar la configuración
                    </h1>

                    <p className="mt-2 text-sm leading-6">
                        Verifica que el salón tenga un
                        registro en la tabla
                        configuracion_salon.
                    </p>
                </div>
            </div>
        );
    }

    if (resultadoSucursales.error) {
        console.error(
            "No se pudieron cargar las sucursales:",
            resultadoSucursales.error,
        );
    }

    if (resultadoTerminales.error) {
        console.error(
            "No se pudieron cargar las terminales POS:",
            resultadoTerminales.error,
        );
    }

    const configuracion =
        resultadoConfiguracion.data as ConfiguracionConsulta;

    const configuracionInicial: DatosConfiguracion = {
        nombreSalon:
            configuracion.nombre_salon,
        telefono:
            configuracion.telefono ?? "",
        whatsapp:
            configuracion.whatsapp ?? "",
        correo: configuracion.correo ?? "",
        direccion:
            configuracion.direccion ?? "",
        moneda: configuracion.moneda,
        simboloMoneda:
            configuracion.simbolo_moneda,
        horaApertura: normalizarHora(
            configuracion.hora_apertura,
        ),
        horaCierre: normalizarHora(
            configuracion.hora_cierre,
        ),
        intervaloCitasMinutos:
            configuracion.intervalo_citas_minutos,
        permitirCredito:
            configuracion.permitir_credito,
        permitirPagoCombinado:
            configuracion.permitir_pago_combinado,
        mensajeRecibo:
            configuracion.mensaje_recibo ??
            "Gracias por preferir nuestros servicios.",
        politicaCancelacion:
            configuracion.politica_cancelacion ??
            "",
    };

    return (
        <div className="mx-auto max-w-7xl">
            <section className="relative overflow-hidden rounded-3xl border border-[#DCE5E0] bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6F8F83]/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-[#C79AA1]/15 blur-3xl" />

                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F] shadow-lg shadow-black/10">
                            <Settings2 className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#B9C8C1]">
                                Administración
                            </p>

                            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                                Configuración del salón
                            </h1>

                            <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                Personaliza los datos generales,
                                horarios, cobros y terminales POS.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:w-[370px]">
                        <ResumenSuperior
                            icono={Building2}
                            titulo="Datos centralizados"
                            descripcion="Una sola configuración para todo el salón."
                        />

                        <ResumenSuperior
                            icono={ShieldCheck}
                            titulo="Acceso protegido"
                            descripcion="Solo administradores pueden modificarla."
                        />
                    </div>
                </div>
            </section>

            <div className="mt-6">
                <FormularioConfiguracion
                    configuracionInicial={
                        configuracionInicial
                    }
                    sucursales={
                        (resultadoSucursales.data ??
                            []) as SucursalConfiguracion[]
                    }
                    terminalesIniciales={
                        (resultadoTerminales.data ??
                            []) as unknown as TerminalPosConfiguracion[]
                    }
                />
            </div>
        </div>
    );
}

function ResumenSuperior({
    icono: Icono,
    titulo,
    descripcion,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    titulo: string;
    descripcion: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <Icono className="h-5 w-5 text-[#DCE7E2]" />

            <p className="mt-3 text-sm font-bold text-white">
                {titulo}
            </p>

            <p className="mt-1 text-xs leading-5 text-[#B9C8C1]">
                {descripcion}
            </p>
        </div>
    );
}

function normalizarHora(hora: string) {
    return hora.slice(0, 5);
}