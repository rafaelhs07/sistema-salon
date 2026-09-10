import { redirect } from "next/navigation";
import {
    Building2,
    Palette,
    Settings2,
    ShieldCheck,
    SlidersHorizontal,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import FormularioConfiguracion, {
    type SucursalConfiguracion,
    type TerminalPosConfiguracion,
} from "./FormularioConfiguracion";
import TemaSistemaClient from "./TemaSistemaClient";
import type { DatosConfiguracion } from "./actions";
import type { TemaColorSistema } from "./tema-actions";

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
    tema_color: TemaColorSistema;
};

export default async function ConfiguracionPage() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

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
    } =
        await supabase
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

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
        ].includes(
            perfil.rol,
        )
    ) {
        redirect(
            "/inicio",
        );
    }

    const [
        resultadoConfiguracion,
        resultadoSucursales,
        resultadoTerminales,
    ] =
        await Promise.all([
            supabase
                .from(
                    "configuracion_salon",
                )
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
                    politica_cancelacion,
                    tema_color
                `)
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .single(),

            supabase
                .from(
                    "sucursales",
                )
                .select(`
                    id,
                    nombre,
                    es_principal,
                    estado
                `)
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .eq(
                    "estado",
                    "ACTIVA",
                )
                .order(
                    "es_principal",
                    {
                        ascending:
                            false,
                    },
                )
                .order(
                    "nombre",
                ),

            supabase
                .from(
                    "terminales_pos",
                )
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
                .eq(
                    "salon_id",
                    perfil.salon_id,
                )
                .order(
                    "estado",
                )
                .order(
                    "nombre",
                ),
        ]);

    if (
        resultadoConfiguracion.error ||
        !resultadoConfiguracion.data
    ) {
        return (
            <div className="mx-auto max-w-7xl">
                <div className="rounded-3xl border border-[#EBCBCB] bg-[#F8E5E5] p-6 text-[#985858]">
                    <h1 className="text-xl font-black tracking-tight">
                        No se pudo cargar la configuración
                    </h1>

                    <p className="mt-2 text-sm">
                        Verifica la configuración del salón.
                    </p>
                </div>
            </div>
        );
    }

    const configuracion =
        resultadoConfiguracion.data as ConfiguracionConsulta;

    const configuracionInicial: DatosConfiguracion = {
        nombreSalon:
            configuracion.nombre_salon,
        telefono:
            configuracion.telefono ??
            "",
        whatsapp:
            configuracion.whatsapp ??
            "",
        correo:
            configuracion.correo ??
            "",
        direccion:
            configuracion.direccion ??
            "",
        moneda:
            configuracion.moneda,
        simboloMoneda:
            configuracion.simbolo_moneda,
        horaApertura:
            normalizarHora(
                configuracion.hora_apertura,
            ),
        horaCierre:
            normalizarHora(
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

    const sucursales =
        (
            resultadoSucursales.data ??
            []
        ) as SucursalConfiguracion[];

    const terminales =
        (
            resultadoTerminales.data ??
            []
        ) as unknown as TerminalPosConfiguracion[];

    return (
        <div className="mx-auto max-w-[1450px] space-y-6 pb-8">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-secondary/12 blur-3xl" />

                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                            <Settings2 className="h-7 w-7" />
                        </div>

                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#AFC2B9]">
                                Administración
                            </p>

                            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                Configuración
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CFD9D4] sm:text-base">
                                Ajusta la identidad, agenda, cobros y preferencias del salón desde un solo lugar.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
                        <DatoHero
                            icono={
                                Building2
                            }
                            titulo="Sucursal"
                            valor={`${sucursales.length}`}
                        />

                        <DatoHero
                            icono={
                                SlidersHorizontal
                            }
                            titulo="Agenda"
                            valor={`${configuracion.intervalo_citas_minutos} min`}
                        />

                        <DatoHero
                            icono={
                                Palette
                            }
                            titulo="Tema"
                            valor={formatearTema(
                                configuracion.tema_color,
                            )}
                        />

                        <DatoHero
                            icono={
                                ShieldCheck
                            }
                            titulo="Acceso"
                            valor="Admin"
                        />
                    </div>
                </div>
            </section>

            <TemaSistemaClient
                temaInicial={
                    configuracion.tema_color ??
                    "SALVIA"
                }
            />

            <FormularioConfiguracion
                configuracionInicial={
                    configuracionInicial
                }
                sucursales={
                    sucursales
                }
                terminalesIniciales={
                    terminales
                }
            />
        </div>
    );
}

function DatoHero({
    icono: Icono,
    titulo,
    valor,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <div className="flex items-center gap-2 text-[#AEC0B7]">
                <Icono className="h-3.5 w-3.5" />

                <p className="text-xs font-black uppercase tracking-[0.12em]">
                    {
                        titulo
                    }
                </p>
            </div>

            <p className="mt-2 truncate text-sm font-black text-white">
                {
                    valor
                }
            </p>
        </div>
    );
}

function normalizarHora(
    hora: string,
) {
    return hora.slice(
        0,
        5,
    );
}

function formatearTema(
    tema: string,
) {
    const nombres: Record<
        string,
        string
    > = {
        SALVIA:
            "Salvia",
        AZUL:
            "Azul",
        LILA:
            "Lila",
        ROSA:
            "Rosa",
        TERRACOTA:
            "Terracota",
        GRAFITO:
            "Grafito",
    };

    return nombres[
        tema
    ] ?? "Salvia";
}
