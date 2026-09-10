import Link from "next/link";
import {
    ArrowLeft,
    Home,
    LockKeyhole,
    ShieldAlert,
} from "lucide-react";

export default async function SinAccesoPage({
    searchParams,
}: {
    searchParams: Promise<{
        permiso?: string;
        ruta?: string;
    }>;
}) {
    const params =
        await searchParams;

    const permiso =
        params.permiso ??
        "ACCESO_RESTRINGIDO";

    return (
        <main className="salon-app min-h-screen bg-background px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-3xl">
                <section className="salon-hero relative overflow-hidden bg-sidebar p-7 text-white sm:p-10">
                    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />

                    <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary-soft text-sidebar">
                            <ShieldAlert className="h-8 w-8" />
                        </div>

                        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#AFC1B8]">
                            Acceso restringido
                        </p>

                        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                            No tienes permiso para entrar aquí
                        </h1>

                        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#CBD7D1] sm:text-base">
                            Tu cuenta está activa, pero el rol o los permisos personalizados
                            no autorizan esta sección del sistema.
                        </p>
                    </div>
                </section>

                <section className="salon-panel mt-6 border border-border bg-white p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-primary">
                            <LockKeyhole className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-sm font-black text-[#33413B]">
                                Permiso requerido
                            </p>

                            <code className="mt-2 inline-flex rounded-xl bg-[#F3F6F4] px-3 py-2 text-xs font-bold text-[#56665E]">
                                {permiso}
                            </code>

                            {params.ruta && (
                                <p className="mt-3 text-xs text-[#859189]">
                                    Ruta solicitada: {params.ruta}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/inicio"
                            className="salon-action inline-flex items-center justify-center gap-2 bg-sidebar px-5 text-white transition hover:bg-sidebar-hover"
                        >
                            <Home className="h-4 w-4" />
                            Ir al inicio
                        </Link>

                        <Link
                            href="/usuarios"
                            className="salon-action inline-flex items-center justify-center gap-2 border border-[#D7DFDA] px-5 text-[#53635B] transition hover:bg-[#F4F7F5]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Usuarios y accesos
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
