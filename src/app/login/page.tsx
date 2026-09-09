"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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
        <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-2">
            <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
                <div>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold">
                        SB
                    </div>

                    <h1 className="mt-10 max-w-xl text-5xl font-semibold leading-tight">
                        Administra tu salón de manera sencilla y profesional.
                    </h1>

                    <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                        Controla citas, clientes, inventario, ingresos,
                        gastos y personal desde un solo lugar.
                    </p>
                </div>

                <p className="text-sm text-slate-400">
                    Sistema de administración para salones de belleza
                </p>
            </section>

            <section className="flex min-h-screen items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-md">
                    <div className="mb-8 lg:hidden">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-white">
                            SB
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                                Bienvenido
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-950">
                                Iniciar sesión
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Ingresa tus credenciales para acceder al sistema.
                            </p>
                        </div>

                        <form
                            onSubmit={iniciarSesion}
                            className="mt-8 space-y-5"
                        >
                            <div>
                                <label
                                    htmlFor="correo"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Correo electrónico
                                </label>

                                <input
                                    id="correo"
                                    type="email"
                                    value={correo}
                                    onChange={(event) => setCorreo(event.target.value)}
                                    placeholder="administrador@correo.com"
                                    autoComplete="email"
                                    required
                                    disabled={cargando}
                                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Contraseña
                                </label>

                                <div className="relative">
                                    <input
                                        id="password"
                                        type={mostrarPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        placeholder="Ingresa tu contraseña"
                                        autoComplete="current-password"
                                        required
                                        disabled={cargando}
                                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-24 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMostrarPassword((valor) => !valor)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                    >
                                        {mostrarPassword ? "Ocultar" : "Mostrar"}
                                    </button>
                                </div>
                            </div>

                            {mensaje && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    {mensaje}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={cargando}
                                className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                                {cargando ? "Ingresando..." : "Iniciar sesión"}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}