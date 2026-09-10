"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    CalendarDays,
    Eye,
    EyeOff,
    LoaderCircle,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles,
    UsersRound,
    WalletCards,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const router = useRouter();

    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");

    async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setMensaje("");
        setCargando(true);

        try {
            const supabase = createClient();

            const { error } = await supabase.auth.signInWithPassword({
                email: correo.trim(),
                password,
            });

            if (error) {
                setMensaje("Correo o contraseña incorrectos.");
                return;
            }

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                await supabase.auth.signOut();
                setMensaje("No fue posible verificar el usuario.");
                return;
            }

            const { data: perfil, error: perfilError } = await supabase
                .from("usuarios_perfiles")
                .select("id, nombre_completo, rol, estado, salon_id")
                .eq("id", user.id)
                .single();

            if (perfilError || !perfil) {
                await supabase.auth.signOut();
                setMensaje(
                    "El usuario no tiene un perfil configurado en el sistema.",
                );
                return;
            }

            if (perfil.estado !== "ACTIVO") {
                await supabase.auth.signOut();
                setMensaje("Este usuario se encuentra inactivo.");
                return;
            }

            router.replace("/inicio");
            router.refresh();
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            setMensaje(
                "Ocurrió un error inesperado. Intenta nuevamente.",
            );
        } finally {
            setCargando(false);
        }
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#F4F6F3]">
            <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#DCE7E2]/70 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[#C79AA1]/15 blur-3xl" />

            <div className="relative grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
                <section className="relative hidden overflow-hidden bg-[#26332F] p-12 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#6F8F83]/35 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#C79AA1]/10 blur-3xl" />

                    <div className="relative">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                                <Sparkles className="h-6 w-6" />
                            </div>

                            <div>
                                <p className="font-black">Sistema de Salón</p>
                                <p className="text-xs text-[#AFC2B9]">
                                    Gestión integral
                                </p>
                            </div>
                        </div>

                        <div className="mt-16 max-w-2xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-[#D6E1DC]">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Control, orden y claridad
                            </span>

                            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
                                Todo tu salón,
                                <span className="block text-[#AFC6BB]">
                                    en un solo lugar.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-xl text-base leading-8 text-[#CCD8D2]">
                                Administra citas, clientes, caja, inventario,
                                compras y finanzas desde una experiencia
                                cómoda para el trabajo diario.
                            </p>
                        </div>

                        <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3">
                            <Beneficio
                                icono={CalendarDays}
                                titulo="Agenda organizada"
                                texto="Citas y disponibilidad"
                            />
                            <Beneficio
                                icono={WalletCards}
                                titulo="Caja clara"
                                texto="Cobros y movimientos"
                            />
                            <Beneficio
                                icono={UsersRound}
                                titulo="Clientes"
                                texto="Historial centralizado"
                            />
                            <Beneficio
                                icono={ShieldCheck}
                                titulo="Acceso protegido"
                                texto="Roles y permisos"
                            />
                        </div>
                    </div>

                    <p className="relative text-xs text-[#9FB1A8]">
                        Sistema de administración para salones de belleza
                    </p>
                </section>

                <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
                    <div className="w-full max-w-[520px]">
                        <div className="mb-7 flex items-center gap-3 lg:hidden">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#26332F] text-white">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-black text-[#26332F]">
                                    Sistema de Salón
                                </p>
                                <p className="text-xs text-[#7A8781]">
                                    Gestión integral
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[34px] border border-[#DDE5E1] bg-white shadow-[0_26px_80px_rgba(36,48,44,0.12)]">
                            <div className="border-b border-[#E7ECE9] px-6 py-7 sm:px-8">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#84928A]">
                                            Bienvenido
                                        </p>
                                        <h2 className="mt-2 text-3xl font-black tracking-tight text-[#26332F] sm:text-4xl">
                                            Iniciar sesión
                                        </h2>
                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF3F0] text-[#6F8F83]">
                                        <LockKeyhole className="h-5 w-5" />
                                    </div>
                                </div>

                                <p className="mt-4 max-w-md text-sm leading-6 text-[#76837C]">
                                    Ingresa tus credenciales para continuar al panel de administración.
                                </p>
                            </div>

                            <form
                                onSubmit={iniciarSesion}
                                className="space-y-5 px-6 py-7 sm:px-8"
                            >
                                <label className="block">
                                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#43524B]">
                                        <Mail className="h-4 w-4 text-[#6F8F83]" />
                                        Correo electrónico
                                    </span>

                                    <input
                                        id="correo"
                                        type="email"
                                        value={correo}
                                        onChange={(event) =>
                                            setCorreo(event.target.value)
                                        }
                                        placeholder="tu@correo.com"
                                        autoComplete="email"
                                        required
                                        disabled={cargando}
                                        className="h-12 w-full rounded-2xl border border-[#D6DFDA] bg-[#F9FBF9] px-4 text-sm font-semibold text-[#26332F] outline-none transition placeholder:text-[#A1AAA5] focus:border-[#6F8F83] focus:bg-white focus:shadow-[0_0_0_4px_rgba(111,143,131,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#43524B]">
                                        <LockKeyhole className="h-4 w-4 text-[#6F8F83]" />
                                        Contraseña
                                    </span>

                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={
                                                mostrarPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                            placeholder="Ingresa tu contraseña"
                                            autoComplete="current-password"
                                            required
                                            disabled={cargando}
                                            className="h-12 w-full rounded-2xl border border-[#D6DFDA] bg-[#F9FBF9] px-4 pr-12 text-sm font-semibold text-[#26332F] outline-none transition placeholder:text-[#A1AAA5] focus:border-[#6F8F83] focus:bg-white focus:shadow-[0_0_0_4px_rgba(111,143,131,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMostrarPassword(
                                                    (valor) => !valor,
                                                )
                                            }
                                            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[#74817B] transition hover:bg-[#EEF2EF]"
                                            aria-label={
                                                mostrarPassword
                                                    ? "Ocultar contraseña"
                                                    : "Mostrar contraseña"
                                            }
                                        >
                                            {mostrarPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </label>

                                {mensaje && (
                                    <div
                                        role="alert"
                                        className="rounded-2xl border border-[#E9CACA] bg-[#F9EAEA] px-4 py-3.5 text-sm font-bold text-[#95595F]"
                                    >
                                        {mensaje}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={cargando}
                                    className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#26332F] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(38,51,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#34463F] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                                >
                                    {cargando ? (
                                        <LoaderCircle className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            Iniciar sesión
                                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 pt-1 text-xs font-semibold text-[#8A9690]">
                                    <ShieldCheck className="h-3.5 w-3.5 text-[#6F8F83]" />
                                    Acceso protegido con roles y permisos
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function Beneficio({
    icono: Icono,
    titulo,
    texto,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    titulo: string;
    texto: string;
}) {
    return (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#DCE7E2]">
                    <Icono className="h-4 w-4" />
                </div>

                <div>
                    <p className="text-sm font-black text-white">
                        {titulo}
                    </p>
                    <p className="mt-1 text-xs text-[#AEBEB6]">
                        {texto}
                    </p>
                </div>
            </div>
        </div>
    );
}
