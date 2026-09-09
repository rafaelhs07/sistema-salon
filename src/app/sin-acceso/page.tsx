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
        <main className="min-h-screen bg-[#F6F7F4] px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-3xl">
                <section className="relative overflow-hidden rounded-[36px] bg-[#26332F] p-7 text-white shadow-[0_24px_70px_rgba(36,48,44,0.20)] sm:p-10">
                    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#6F8F83]/30 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-[#C79AA1]/15 blur-3xl" />

                    <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#DCE7E2] text-[#26332F]">
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

                <section className="mt-6 rounded-[28px] border border-[#DCE5E0] bg-white p-6 shadow-[0_12px_34px_rgba(36,48,44,0.06)]">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3F0] text-[#6F8F83]">
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
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#26332F] px-5 text-sm font-black text-white transition hover:bg-[#34463F]"
                        >
                            <Home className="h-4 w-4" />
                            Ir al inicio
                        </Link>

                        <Link
                            href="/usuarios"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#D7DFDA] px-5 text-sm font-black text-[#53635B] transition hover:bg-[#F4F7F5]"
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
