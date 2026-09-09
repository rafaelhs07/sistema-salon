"use client";

import Link from "next/link";
import {
    ArrowLeft,
    BadgeCheck,
    CalendarClock,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    LoaderCircle,
    LockKeyhole,
    Mail,
    MapPin,
    Save,
    ShieldCheck,
    Sparkles,
    UserRoundCog,
    UserRoundX,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";

import {
    editarUsuarioSistema,
} from "./actions";

export type RolDisponibleEditar = {
    codigo: string;
    nombre: string;
    descripcion: string | null;
    nivel: number;
};

export type SucursalDisponibleEditar = {
    id: string;
    nombre: string;
};

export type UsuarioEditarInicial = {
    id: string;
    nombre: string;
    correo: string;
    rol: string;
    sucursalId: string | null;
    estado: string;
    creadoEn: string | null;
    ultimoAcceso: string | null;
    esUsuarioActual: boolean;
};

export default function EditarUsuarioClient({
    usuario,
    roles,
    sucursales,
}: {
    usuario: UsuarioEditarInicial;
    roles: RolDisponibleEditar[];
    sucursales: SucursalDisponibleEditar[];
}) {
    const [
        nombre,
        setNombre,
    ] =
        useState(
            usuario.nombre,
        );

    const [
        correo,
        setCorreo,
    ] =
        useState(
            usuario.correo,
        );

    const [
        rol,
        setRol,
    ] =
        useState(
            usuario.rol,
        );

    const [
        sucursalId,
        setSucursalId,
    ] =
        useState(
            usuario.sucursalId ??
            "",
        );

    const [
        estado,
        setEstado,
    ] =
        useState<
            "ACTIVO" |
            "INACTIVO"
        >(
            usuario.estado ===
                "INACTIVO"
                ? "INACTIVO"
                : "ACTIVO",
        );

    const [
        nuevaContrasena,
        setNuevaContrasena,
    ] =
        useState("");

    const [
        mostrarContrasena,
        setMostrarContrasena,
    ] =
        useState(false);

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

    const hayCambios =
        nombre.trim() !==
        usuario.nombre.trim() ||
        correo.trim().toLowerCase() !==
        usuario.correo.trim().toLowerCase() ||
        rol !==
        usuario.rol ||
        sucursalId !==
        (
            usuario.sucursalId ??
            ""
        ) ||
        estado !==
        (
            usuario.estado ===
                "INACTIVO"
                ? "INACTIVO"
                : "ACTIVO"
        ) ||
        nuevaContrasena.length >
        0;

    const puedeGuardar =
        nombre.trim().length >=
        2 &&
        correo.includes(
            "@",
        ) &&
        Boolean(
            rol,
        ) &&
        Boolean(
            sucursalId,
        ) &&
        (
            nuevaContrasena.length ===
            0 ||
            nuevaContrasena.length >=
            8
        ) &&
        hayCambios &&
        !guardando;

    function guardar() {
        setMensaje(
            null,
        );

        iniciarTransicion(
            async () => {
                const resultado =
                    await editarUsuarioSistema({
                        usuarioId:
                            usuario.id,
                        nombre,
                        correo,
                        rol,
                        sucursalId,
                        estado,
                        nuevaContrasena:
                            nuevaContrasena ||
                            undefined,
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
                    setNuevaContrasena("");
                }
            },
        );
    }

    return (
        <div className="space-y-7 pb-10">
            <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#26332F] p-6 text-white shadow-[0_24px_70px_rgba(36,48,44,0.20)] sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#6F8F83]/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-[#C79AA1]/15 blur-3xl" />
                <div className="pointer-events-none absolute right-[20%] top-[14%] h-36 w-36 rounded-full border border-white/10" />

                <div className="relative">
                    <Link
                        href="/usuarios"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#C9D7D0] transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a usuarios
                    </Link>

                    <div className="mt-6 grid gap-7 xl:grid-cols-[1.25fr_0.75fr] xl:items-end">
                        <div className="flex items-start gap-4">
                            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#DCE7E2] text-[#26332F] shadow-lg shadow-black/10 sm:flex">
                                <UserRoundCog className="h-8 w-8" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-[#D8E3DE]">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Edición de acceso
                                    </span>

                                    {usuario.esUsuarioActual && (
                                        <span className="rounded-full bg-[#DCE7E2] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#26332F]">
                                            Tu cuenta
                                        </span>
                                    )}
                                </div>

                                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                                    Editar
                                    <span className="text-[#AFC6BB]">
                                        {" "}
                                        usuario
                                    </span>
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CDD8D3] sm:text-base">
                                    Actualiza la identidad, ubicación operativa, rol y estado
                                    de esta cuenta sin perder su historial ni sus permisos personalizados.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <HeroInfo
                                etiqueta="Estado"
                                valor={
                                    estado
                                }
                                icono={
                                    estado ===
                                        "ACTIVO"
                                        ? BadgeCheck
                                        : UserRoundX
                                }
                            />

                            <HeroInfo
                                etiqueta="Rol actual"
                                valor={
                                    rolSeleccionado?.nombre ??
                                    rol
                                }
                                icono={
                                    ShieldCheck
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>

            {mensaje && (
                <div
                    className={[
                        "flex items-start gap-3 rounded-2xl border px-4 py-4 shadow-sm",
                        mensaje.tipo ===
                            "EXITO"
                            ? "border-[#CFE0D8] bg-[#E8F1EC] text-[#456B5A]"
                            : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
                    ].join(
                        " ",
                    )}
                >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                    <p className="text-sm font-bold">
                        {
                            mensaje.texto
                        }
                    </p>
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                <article className="rounded-[30px] border border-[#DDE5E1] bg-white p-5 shadow-[0_12px_34px_rgba(36,48,44,0.06)] sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Identidad
                            </p>

                            <h2 className="mt-1 text-xl font-black text-[#26332F]">
                                Datos de la cuenta
                            </h2>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-[#7A8781]">
                                Nombre y correo utilizados para identificar al usuario dentro del sistema.
                            </p>
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3F0] text-[#6F8F83]">
                            <Mail className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-6 grid gap-5">
                        <Campo
                            etiqueta="Nombre completo"
                            icono={
                                UserRoundCog
                            }
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
                                className="h-12 w-full rounded-2xl border border-[#D7DFDA] bg-[#F9FBF9] px-4 text-sm font-semibold outline-none transition focus:border-[#6F8F83] focus:bg-white focus:shadow-[0_0_0_4px_rgba(111,143,131,0.08)]"
                            />
                        </Campo>

                        <Campo
                            etiqueta="Correo electrónico"
                            icono={
                                Mail
                            }
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
                                className="h-12 w-full rounded-2xl border border-[#D7DFDA] bg-[#F9FBF9] px-4 text-sm font-semibold outline-none transition focus:border-[#6F8F83] focus:bg-white focus:shadow-[0_0_0_4px_rgba(111,143,131,0.08)]"
                            />
                        </Campo>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <DatoMini
                            etiqueta="Creado"
                            valor={
                                usuario.creadoEn
                                    ? formatearFecha(
                                        usuario.creadoEn,
                                    )
                                    : "No disponible"
                            }
                            icono={
                                CalendarClock
                            }
                        />

                        <DatoMini
                            etiqueta="Último acceso"
                            valor={
                                usuario.ultimoAcceso
                                    ? formatearFecha(
                                        usuario.ultimoAcceso,
                                    )
                                    : "Sin acceso registrado"
                            }
                            icono={
                                BadgeCheck
                            }
                        />
                    </div>
                </article>

                <article className="rounded-[30px] border border-[#DDE5E1] bg-white p-5 shadow-[0_12px_34px_rgba(36,48,44,0.06)] sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Operación
                            </p>

                            <h2 className="mt-1 text-xl font-black text-[#26332F]">
                                Rol y sucursal
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-[#7A8781]">
                                Define el acceso base y la ubicación desde la que trabaja esta cuenta.
                            </p>
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3F0] text-[#6F8F83]">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-6 space-y-5">
                        <Campo
                            etiqueta="Rol"
                            icono={
                                ShieldCheck
                            }
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
                                disabled={
                                    usuario.esUsuarioActual
                                }
                                className="h-12 w-full rounded-2xl border border-[#D7DFDA] bg-[#F9FBF9] px-4 text-sm font-bold text-[#43524B] outline-none transition focus:border-[#6F8F83] disabled:cursor-not-allowed disabled:opacity-60"
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
                            <div className="rounded-2xl border border-[#E1E7E3] bg-[#F7F9F7] p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#87958D]">
                                    Perfil seleccionado
                                </p>

                                <p className="mt-2 text-sm font-black text-[#35443D]">
                                    {
                                        rolSeleccionado.nombre
                                    }
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[#78857F]">
                                    {rolSeleccionado.descripcion ||
                                        "Rol operativo del sistema."}
                                </p>
                            </div>
                        )}

                        <Campo
                            etiqueta="Sucursal"
                            icono={
                                MapPin
                            }
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
                                className="h-12 w-full rounded-2xl border border-[#D7DFDA] bg-[#F9FBF9] px-4 text-sm font-bold text-[#43524B] outline-none transition focus:border-[#6F8F83]"
                            >
                                {sucursales.map(
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
                                )}
                            </select>
                        </Campo>
                    </div>
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <article className="rounded-[30px] border border-[#DDE5E1] bg-white p-5 shadow-[0_12px_34px_rgba(36,48,44,0.06)] sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Seguridad
                            </p>

                            <h2 className="mt-1 text-xl font-black text-[#26332F]">
                                Estado de acceso
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-[#7A8781]">
                                Desactivar una cuenta impide su uso operativo sin eliminar su historial.
                            </p>
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3F0] text-[#6F8F83]">
                            <BadgeCheck className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            disabled={
                                usuario.esUsuarioActual
                            }
                            onClick={() =>
                                setEstado(
                                    "ACTIVO",
                                )
                            }
                            className={[
                                "rounded-2xl border p-4 text-left transition",
                                estado ===
                                    "ACTIVO"
                                    ? "border-[#9DB6AA] bg-[#EAF2EE] shadow-sm"
                                    : "border-[#DDE4E0] bg-[#FBFCFA] hover:bg-[#F5F8F6]",
                                usuario.esUsuarioActual
                                    ? "cursor-not-allowed opacity-60"
                                    : "",
                            ].join(
                                " ",
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <BadgeCheck className="h-5 w-5 text-[#5F8272]" />
                                <span className="text-sm font-black text-[#35443D]">
                                    Activo
                                </span>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-[#76847D]">
                                Puede iniciar sesión y usar sus permisos.
                            </p>
                        </button>

                        <button
                            type="button"
                            disabled={
                                usuario.esUsuarioActual
                            }
                            onClick={() =>
                                setEstado(
                                    "INACTIVO",
                                )
                            }
                            className={[
                                "rounded-2xl border p-4 text-left transition",
                                estado ===
                                    "INACTIVO"
                                    ? "border-[#D9B5B8] bg-[#F6EAEA] shadow-sm"
                                    : "border-[#DDE4E0] bg-[#FBFCFA] hover:bg-[#F5F8F6]",
                                usuario.esUsuarioActual
                                    ? "cursor-not-allowed opacity-60"
                                    : "",
                            ].join(
                                " ",
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <UserRoundX className="h-5 w-5 text-[#A06B70]" />
                                <span className="text-sm font-black text-[#4A3B3D]">
                                    Inactivo
                                </span>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-[#826F72]">
                                Conserva datos, pero no debe operar el sistema.
                            </p>
                        </button>
                    </div>

                    {usuario.esUsuarioActual && (
                        <p className="mt-4 rounded-2xl bg-[#F5F7F5] px-4 py-3 text-xs font-semibold leading-5 text-[#6E7B74]">
                            Por seguridad, no puedes cambiar tu propio rol ni desactivar tu cuenta desde aquí.
                        </p>
                    )}
                </article>

                <article className="rounded-[30px] border border-[#DDE5E1] bg-white p-5 shadow-[0_12px_34px_rgba(36,48,44,0.06)] sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                                Credenciales
                            </p>

                            <h2 className="mt-1 text-xl font-black text-[#26332F]">
                                Nueva contraseña
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-[#7A8781]">
                                Déjalo vacío si no quieres modificar la contraseña actual.
                            </p>
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3F0] text-[#6F8F83]">
                            <KeyRound className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-6">
                        <Campo
                            etiqueta="Contraseña nueva"
                            icono={
                                LockKeyhole
                            }
                        >
                            <div className="relative">
                                <input
                                    type={
                                        mostrarContrasena
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        nuevaContrasena
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setNuevaContrasena(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
                                    className="h-12 w-full rounded-2xl border border-[#D7DFDA] bg-[#F9FBF9] px-4 pr-12 text-sm font-semibold outline-none transition focus:border-[#6F8F83] focus:bg-white focus:shadow-[0_0_0_4px_rgba(111,143,131,0.08)]"
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
                                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[#74817B] transition hover:bg-[#EEF2EF]"
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
                        </Campo>
                    </div>
                </article>
            </section>

            <section className="sticky bottom-4 z-20 flex flex-col gap-4 rounded-[26px] border border-[#D6DFDA] bg-white/95 p-4 shadow-[0_18px_50px_rgba(36,48,44,0.16)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-black text-[#33413B]">
                        {hayCambios
                            ? "Hay cambios pendientes"
                            : "Todo está actualizado"}
                    </p>

                    <p className="mt-1 text-xs text-[#7C8982]">
                        Los cambios de rol y estado afectarán el acceso del usuario.
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Link
                        href="/usuarios"
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#D7DFDA] px-5 text-sm font-black text-[#53635B] transition hover:bg-[#F4F7F5]"
                    >
                        Cancelar
                    </Link>

                    <button
                        type="button"
                        disabled={
                            !puedeGuardar
                        }
                        onClick={
                            guardar
                        }
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#26332F] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#34463F] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        {guardando ? (
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                        ) : (
                            <Save className="h-5 w-5" />
                        )}

                        {guardando
                            ? "Guardando..."
                            : "Guardar cambios"}
                    </button>
                </div>
            </section>
        </div>
    );
}

function Campo({
    etiqueta,
    icono: Icono,
    children,
}: {
    etiqueta: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#43524B]">
                <Icono className="h-4 w-4 text-[#6F8F83]" />
                {
                    etiqueta
                }
            </span>

            {
                children
            }
        </label>
    );
}

function HeroInfo({
    etiqueta,
    valor,
    icono: Icono,
}: {
    etiqueta: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#AEC0B7]">
                        {
                            etiqueta
                        }
                    </p>

                    <p className="mt-2 line-clamp-2 text-sm font-black text-white">
                        {
                            valor
                        }
                    </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#DCE7E2]">
                    <Icono className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
}

function DatoMini({
    etiqueta,
    valor,
    icono: Icono,
}: {
    etiqueta: string;
    valor: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="rounded-2xl border border-[#E3E8E5] bg-[#FBFCFA] p-4">
            <div className="flex items-center gap-2 text-[#6F8F83]">
                <Icono className="h-4 w-4" />

                <span className="text-[10px] font-black uppercase tracking-[0.12em]">
                    {
                        etiqueta
                    }
                </span>
            </div>

            <p className="mt-2 text-sm font-black text-[#3B4A43]">
                {
                    valor
                }
            </p>
        </div>
    );
}

function formatearFecha(
    fecha: string,
) {
    return new Intl.DateTimeFormat(
        "es-NI",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone:
                "America/Managua",
        },
    ).format(
        new Date(
            fecha,
        ),
    );
}
