"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    LoaderCircle,
    LockKeyhole,
    Mail,
    MapPin,
    Save,
    ShieldCheck,
    UserPlus,
    Users,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";

import {
    crearUsuarioSistema,
} from "./actions";

export type RolDisponible = {
    codigo: string;
    nombre: string;
    descripcion: string | null;
    nivel: number;
};

export type SucursalDisponible = {
    id: string;
    nombre: string;
};

export default function NuevoUsuarioClient({
    roles,
    sucursales,
}: {
    roles: RolDisponible[];
    sucursales: SucursalDisponible[];
}) {
    const [
        nombre,
        setNombre,
    ] =
        useState("");

    const [
        correo,
        setCorreo,
    ] =
        useState("");

    const [
        contrasena,
        setContrasena,
    ] =
        useState("");

    const [
        mostrarContrasena,
        setMostrarContrasena,
    ] =
        useState(false);

    const [
        rol,
        setRol,
    ] =
        useState(
            roles[0]?.codigo ??
            "",
        );

    const [
        sucursalId,
        setSucursalId,
    ] =
        useState(
            sucursales[0]?.id ??
            "",
        );

    const [
        mensaje,
        setMensaje,
    ] =
        useState<{
            tipo:
            | "EXITO"
            | "ERROR";
            texto: string;
        } | null>(
            null,
        );

    const [
        guardando,
        iniciarTransicion,
    ] =
        useTransition();

    const rolSeleccionado =
        useMemo(
            () =>
                roles.find(
                    (
                        item,
                    ) =>
                        item.codigo ===
                        rol,
                ) ??
                null,
            [
                roles,
                rol,
            ],
        );

    function guardar() {
        setMensaje(
            null,
        );

        iniciarTransicion(
            async () => {
                const resultado =
                    await crearUsuarioSistema({
                        nombre,
                        correo,
                        contrasena,
                        rol,
                        sucursalId,
                    });

                setMensaje({
                    tipo:
                        resultado.exito
                            ? "EXITO"
                            : "ERROR",
                    texto:
                        resultado.mensaje,
                });

                if (
                    resultado.exito
                ) {
                    setNombre("");
                    setCorreo("");
                    setContrasena("");
                }
            },
        );
    }

    const puedeGuardar =
        nombre.trim().length >=
        2 &&
        correo.includes(
            "@",
        ) &&
        contrasena.length >=
        8 &&
        Boolean(
            rol,
        ) &&
        Boolean(
            sucursalId,
        ) &&
        !guardando;

    return (
        <div className="space-y-6 pb-8">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-secondary/10 blur-3xl" />

                <div className="relative">
                    <Link
                        href="/usuarios"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a usuarios
                    </Link>

                    <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                                <UserPlus className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[#B9C8C1]">
                                    Administración de accesos
                                </p>

                                <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                                    Crear usuario
                                </h1>

                                <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                                    Crea una cuenta interna para el salón, asigna su rol
                                    y define la sucursal desde la que trabajará.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-primary-soft" />

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B9C8C1]">
                                        Acceso seguro
                                    </p>

                                    <p className="mt-1 text-sm font-semibold">
                                        Sin invitación por correo
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {mensaje && (
                <div
                    className={[
                        "flex items-start gap-3 rounded-2xl border px-4 py-4",
                        mensaje.tipo ===
                            "EXITO"
                            ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                            : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
                    ].join(
                        " ",
                    )}
                >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                    <p className="text-sm font-semibold">
                        {
                            mensaje.texto
                        }
                    </p>
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div>
                        <h2 className="text-lg font-bold text-sidebar tracking-tight">
                            Datos de acceso
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-[#75827C]">
                            Esta información se usará para iniciar sesión en el sistema.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-5">
                        <Campo
                            icono={Users}
                            etiqueta="Nombre del usuario"
                        >
                            <input
                                value={
                                    nombre
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setNombre(
                                        event.target.value,
                                    )
                                }
                                placeholder="Ej. María López"
                                autoComplete="off"
                                className="salon-control w-full border border-border-strong bg-[#FAFCFB] px-4 outline-none transition focus:border-primary focus:bg-white"
                            />
                        </Campo>

                        <Campo
                            icono={Mail}
                            etiqueta="Correo electrónico"
                        >
                            <input
                                type="email"
                                value={
                                    correo
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setCorreo(
                                        event.target.value,
                                    )
                                }
                                placeholder="usuario@salon.com"
                                autoComplete="off"
                                className="salon-control w-full border border-border-strong bg-[#FAFCFB] px-4 outline-none transition focus:border-primary focus:bg-white"
                            />
                        </Campo>

                        <Campo
                            icono={LockKeyhole}
                            etiqueta="Contraseña inicial"
                        >
                            <div className="relative">
                                <input
                                    type={
                                        mostrarContrasena
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        contrasena
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setContrasena(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
                                    className="salon-control w-full border border-border-strong bg-[#FAFCFB] px-4 pr-12 outline-none transition focus:border-primary focus:bg-white"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMostrarContrasena(
                                            (
                                                actual,
                                            ) =>
                                                !actual,
                                        )
                                    }
                                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[#74817B] transition hover:bg-surface-soft"
                                    aria-label={
                                        mostrarContrasena
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                >
                                    {mostrarContrasena ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            <p className="mt-2 text-xs text-[#8A958F]">
                                El usuario podrá iniciar sesión inmediatamente con esta contraseña.
                            </p>
                        </Campo>
                    </div>
                </article>

                <article className="salon-panel border border-border bg-white p-5 sm:p-6">
                    <div>
                        <h2 className="text-lg font-bold text-sidebar tracking-tight">
                            Acceso inicial
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-[#75827C]">
                            Después podrás personalizar los permisos de este usuario.
                        </p>
                    </div>

                    <div className="mt-6 space-y-5">
                        <Campo
                            icono={ShieldCheck}
                            etiqueta="Rol"
                        >
                            <select
                                value={
                                    rol
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setRol(
                                        event.target.value,
                                    )
                                }
                                className="salon-control w-full border border-border-strong bg-[#FAFCFB] px-4 font-semibold text-text-secondary outline-none focus:border-primary"
                            >
                                {roles.map(
                                    (
                                        item,
                                    ) => (
                                        <option
                                            key={
                                                item.codigo
                                            }
                                            value={
                                                item.codigo
                                            }
                                        >
                                            {
                                                item.nombre
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </Campo>

                        {rolSeleccionado && (
                            <div className="rounded-2xl bg-[#F4F7F5] p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#6F7D76]">
                                    Perfil seleccionado
                                </p>

                                <p className="mt-2 text-sm font-bold text-[#33413B]">
                                    {
                                        rolSeleccionado.nombre
                                    }
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[#74817B]">
                                    {rolSeleccionado.descripcion ||
                                        "Rol operativo del sistema."}
                                </p>
                            </div>
                        )}

                        <Campo
                            icono={MapPin}
                            etiqueta="Sucursal"
                        >
                            <select
                                value={
                                    sucursalId
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSucursalId(
                                        event.target.value,
                                    )
                                }
                                className="salon-control w-full border border-border-strong bg-[#FAFCFB] px-4 font-semibold text-text-secondary outline-none focus:border-primary"
                            >
                                {sucursales.length ===
                                    0 ? (
                                    <option value="">
                                        No hay sucursales
                                    </option>
                                ) : (
                                    sucursales.map(
                                        (
                                            item,
                                        ) => (
                                            <option
                                                key={
                                                    item.id
                                                }
                                                value={
                                                    item.id
                                                }
                                            >
                                                {
                                                    item.nombre
                                                }
                                            </option>
                                        ),
                                    )
                                )}
                            </select>
                        </Campo>

                        <div className="rounded-2xl border border-border bg-[#FBFCFA] p-4">
                            <p className="text-sm font-bold text-[#33413B]">
                                Estado inicial
                            </p>

                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#E3EEE8] px-3 py-1.5 text-xs font-bold text-[#527865]">
                                <span className="h-2 w-2 rounded-full bg-current" />
                                ACTIVO
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            <section className="salon-panel flex flex-col gap-4 border border-[#D9E1DD] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-bold text-[#33413B]">
                        El usuario quedará listo para iniciar sesión
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#7A8781]">
                        En los próximos pasos podrás editar sus datos y personalizar exactamente qué módulos y acciones puede utilizar.
                    </p>
                </div>

                <button
                    type="button"
                    disabled={
                        !puedeGuardar
                    }
                    onClick={
                        guardar
                    }
                    className="salon-action inline-flex shrink-0 items-center justify-center gap-2 bg-sidebar px-6 text-white transition hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {guardando ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}

                    {guardando
                        ? "Creando..."
                        : "Crear usuario"}
                </button>
            </section>
        </div>
    );
}

function Campo({
    icono: Icono,
    etiqueta,
    children,
}: {
    icono: React.ComponentType<{
        className?: string;
    }>;
    etiqueta: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-secondary">
                <Icono className="h-4 w-4 text-primary" />
                {etiqueta}
            </label>

            {children}
        </div>
    );
}
