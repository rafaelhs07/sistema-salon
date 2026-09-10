"use client";

import Link from "next/link";
import {
    Activity,
    ArrowRight,
    BadgeCheck,
    CalendarClock,
    CheckCircle2,
    CircleUserRound,
    Command,
    Filter,
    KeyRound,
    Mail,
    MapPin,
    Pencil,
    Plus,
    Search,
    Shield,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    UserRoundCheck,
    UserRoundCog,
    UserRoundX,
    Users,
    X,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

export type UsuarioListado = {
    id: string;
    nombre: string;
    correo: string;
    rol: string;
    estado: string;
    sucursalId: string | null;
    sucursalNombre: string;
    creadoEn: string | null;
    ultimoAcceso: string | null;
    esUsuarioActual: boolean;
};

export type RolFiltro = {
    codigo: string;
    nombre: string;
    nivel: number;
};

export type SucursalFiltro = {
    id: string;
    nombre: string;
};

type FiltroEstado =
    | "TODOS"
    | "ACTIVO"
    | "INACTIVO";

export default function UsuariosClient({
    usuariosIniciales,
    roles,
    sucursales,
    puedeCrear,
    puedeEditar,
    puedePermisos,
}: {
    usuariosIniciales: UsuarioListado[];
    roles: RolFiltro[];
    sucursales: SucursalFiltro[];
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedePermisos: boolean;
}) {
    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        rol,
        setRol,
    ] = useState("TODOS");

    const [
        estado,
        setEstado,
    ] =
        useState<FiltroEstado>(
            "TODOS",
        );

    const [
        sucursalId,
        setSucursalId,
    ] =
        useState("TODAS");

    const [
        mostrarFiltros,
        setMostrarFiltros,
    ] =
        useState(false);

    const usuarios =
        useMemo(() => {
            const termino =
                busqueda
                    .trim()
                    .toLowerCase();

            return usuariosIniciales.filter(
                (
                    usuario,
                ) => {
                    const coincideBusqueda =
                        !termino ||
                        usuario.nombre
                            .toLowerCase()
                            .includes(
                                termino,
                            ) ||
                        usuario.correo
                            .toLowerCase()
                            .includes(
                                termino,
                            );

                    const coincideRol =
                        rol ===
                        "TODOS" ||
                        usuario.rol ===
                        rol;

                    const coincideEstado =
                        estado ===
                        "TODOS" ||
                        usuario.estado ===
                        estado;

                    const coincideSucursal =
                        sucursalId ===
                        "TODAS" ||
                        usuario.sucursalId ===
                        sucursalId;

                    return (
                        coincideBusqueda &&
                        coincideRol &&
                        coincideEstado &&
                        coincideSucursal
                    );
                },
            );
        }, [
            usuariosIniciales,
            busqueda,
            rol,
            estado,
            sucursalId,
        ]);

    const total =
        usuariosIniciales.length;

    const activos =
        usuariosIniciales.filter(
            (
                usuario,
            ) =>
                usuario.estado ===
                "ACTIVO",
        ).length;

    const inactivos =
        usuariosIniciales.filter(
            (
                usuario,
            ) =>
                usuario.estado !==
                "ACTIVO",
        ).length;

    const rolesUsados =
        new Set(
            usuariosIniciales.map(
                (
                    usuario,
                ) =>
                    usuario.rol,
            ),
        ).size;

    const hayFiltros =
        busqueda.trim() !==
        "" ||
        rol !==
        "TODOS" ||
        estado !==
        "TODOS" ||
        sucursalId !==
        "TODAS";

    function limpiarFiltros() {
        setBusqueda("");
        setRol("TODOS");
        setEstado("TODOS");
        setSucursalId("TODAS");
    }

    return (
        <div className="space-y-7 pb-10">
            <section className="salon-hero relative overflow-hidden border border-white/10 bg-sidebar p-6 text-white sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-secondary/15 blur-3xl" />
                <div className="pointer-events-none absolute right-[22%] top-[18%] h-32 w-32 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute right-[18%] top-[10%] h-44 w-44 rounded-full border border-white/5" />

                <div className="relative grid gap-8 xl:grid-cols-[1.3fr_0.7fr] xl:items-end">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-[#D7E3DD]">
                            <Command className="h-3.5 w-3.5" />
                            Centro de control de accesos
                        </div>

                        <div className="mt-5 flex items-start gap-4">
                            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-primary-soft text-sidebar shadow-lg shadow-black/10 sm:flex">
                                <UserRoundCog className="h-8 w-8" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                                    Usuarios
                                    <span className="text-[#AFC6BB]">
                                        {" "}
                                        & accesos
                                    </span>
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#CCD8D2] sm:text-base">
                                    Administra quién entra al sistema, desde dónde trabaja
                                    y qué nivel de acceso tiene cada persona.
                                </p>
                            </div>
                        </div>

                        <div className="mt-7 flex flex-wrap items-center gap-3">
                            {puedeCrear && (
                                <Link
                                    href="/usuarios/nuevo"
                                    className="salon-action inline-flex items-center gap-2 bg-primary-soft px-5 font-extrabold text-sidebar shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white"
                                >
                                    <Plus className="h-5 w-5" />
                                    Crear usuario
                                </Link>
                            )}

                            <div className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-[#D4DFD9]">
                                <ShieldCheck className="h-4 w-4 text-[#A9C2B6]" />
                                Control por rol + permisos
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <HeroMetric
                            label="Usuarios"
                            value={
                                total
                            }
                            helper="registrados"
                            icono={
                                Users
                            }
                        />

                        <HeroMetric
                            label="Activos"
                            value={
                                activos
                            }
                            helper="con acceso"
                            icono={
                                BadgeCheck
                            }
                        />

                        <HeroMetric
                            label="Roles"
                            value={
                                rolesUsados
                            }
                            helper="en uso"
                            icono={
                                Shield
                            }
                        />

                        <HeroMetric
                            label="Inactivos"
                            value={
                                inactivos
                            }
                            helper="sin acceso"
                            icono={
                                UserRoundX
                            }
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <InsightCard
                    titulo="Accesos activos"
                    valor={`${activos}/${total}`}
                    descripcion="Usuarios que actualmente pueden iniciar sesión"
                    icono={Activity}
                />

                <InsightCard
                    titulo="Roles configurados"
                    valor={
                        String(
                            rolesUsados,
                        )
                    }
                    descripcion="Perfiles distintos asignados en este salón"
                    icono={ShieldCheck}
                />

                <InsightCard
                    titulo="Sucursales"
                    valor={
                        String(
                            sucursales.length,
                        )
                    }
                    descripcion="Ubicaciones disponibles para asignación"
                    icono={MapPin}
                />
            </section>

            <section className="salon-panel border border-[#DDE5E1] bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7F8E86]" />

                        <input
                            value={
                                busqueda
                            }
                            onChange={(
                                event,
                            ) =>
                                setBusqueda(
                                    event.target.value,
                                )
                            }
                            placeholder="Buscar usuario por nombre o correo..."
                            className="salon-control h-13 w-full border border-[#D9E1DD] bg-[#F8FAF8] pl-12 pr-4 outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(111,143,131,0.08)]"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setMostrarFiltros(
                                    (
                                        actual,
                                    ) =>
                                        !actual,
                                )
                            }
                            className={[
                                "inline-flex h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-extrabold transition",
                                mostrarFiltros
                                    ? "border-[#9FB6AB] bg-surface-soft text-[#425C51]"
                                    : "border-[#D7DFDA] bg-white text-[#53635B] hover:bg-[#F4F7F5]",
                            ].join(
                                " ",
                            )}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filtros
                        </button>

                        {hayFiltros && (
                            <button
                                type="button"
                                onClick={
                                    limpiarFiltros
                                }
                                className="salon-action inline-flex items-center gap-2 px-4 text-[#7D8A83] transition hover:bg-[#F3F6F4]"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {mostrarFiltros && (
                    <div className="mt-4 grid gap-3 border-t border-[#E8ECE9] pt-4 md:grid-cols-3">
                        <FiltroSelect
                            etiqueta="Rol"
                            valor={
                                rol
                            }
                            onChange={
                                setRol
                            }
                            opciones={[
                                {
                                    valor:
                                        "TODOS",
                                    texto:
                                        "Todos los roles",
                                },
                                ...roles.map(
                                    (
                                        item,
                                    ) => ({
                                        valor:
                                            item.codigo,
                                        texto:
                                            item.nombre,
                                    }),
                                ),
                            ]}
                        />

                        <FiltroSelect
                            etiqueta="Estado"
                            valor={
                                estado
                            }
                            onChange={(
                                valor,
                            ) =>
                                setEstado(
                                    valor as FiltroEstado,
                                )
                            }
                            opciones={[
                                {
                                    valor:
                                        "TODOS",
                                    texto:
                                        "Todos los estados",
                                },
                                {
                                    valor:
                                        "ACTIVO",
                                    texto:
                                        "Activos",
                                },
                                {
                                    valor:
                                        "INACTIVO",
                                    texto:
                                        "Inactivos",
                                },
                            ]}
                        />

                        <FiltroSelect
                            etiqueta="Sucursal"
                            valor={
                                sucursalId
                            }
                            onChange={
                                setSucursalId
                            }
                            opciones={[
                                {
                                    valor:
                                        "TODAS",
                                    texto:
                                        "Todas las sucursales",
                                },
                                ...sucursales.map(
                                    (
                                        item,
                                    ) => ({
                                        valor:
                                            item.id,
                                        texto:
                                            item.nombre,
                                    }),
                                ),
                            ]}
                        />
                    </div>
                )}
            </section>

            <section>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-sidebar">
                            Equipo con acceso
                        </h2>

                        <p className="mt-1 text-sm text-[#7C8982]">
                            Mostrando {usuarios.length} de {total} cuentas.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#839087]">
                        <Filter className="h-4 w-4" />
                        Vista filtrada
                    </div>
                </div>

                {usuarios.length ===
                    0 ? (
                    <div className="salon-panel border border-dashed border-[#CBD7D1] bg-white px-6 py-16 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-surface-soft text-primary">
                            <CircleUserRound className="h-8 w-8" />
                        </div>

                        <h3 className="mt-5 text-lg font-black text-[#33413B] tracking-tight">
                            No encontramos usuarios
                        </h3>

                        <p className="mt-2 text-sm text-[#7D8983]">
                            Cambia los filtros o limpia la búsqueda actual.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                        {usuarios.map(
                            (
                                usuario,
                            ) => (
                                <UsuarioCard
                                    key={
                                        usuario.id
                                    }
                                    usuario={
                                        usuario
                                    }
                                    roles={
                                        roles
                                    }
                                    puedeEditar={
                                        puedeEditar
                                    }
                                    puedePermisos={
                                        puedePermisos
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

function UsuarioCard({
    usuario,
    roles,
    puedeEditar,
    puedePermisos,
}: {
    usuario: UsuarioListado;
    roles: RolFiltro[];
    puedeEditar: boolean;
    puedePermisos: boolean;
}) {
    const rolNombre =
        roles.find(
            (
                rol,
            ) =>
                rol.codigo ===
                usuario.rol,
        )?.nombre ??
        usuario.rol;

    const activo =
        usuario.estado ===
        "ACTIVO";

    return (
        <article className="salon-panel group relative overflow-hidden border border-[#DDE4E0] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#BFCFC7] hover:shadow-[0_18px_45px_rgba(36,48,44,0.10)]">
            <div
                className={[
                    "absolute inset-x-0 top-0 h-1",
                    activo
                        ? "bg-primary"
                        : "bg-secondary",
                ].join(
                    " ",
                )}
            />

            <div className="flex items-start gap-4">
                <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#E7EFEB] text-lg font-black text-[#456156]">
                        {obtenerIniciales(
                            usuario.nombre,
                        )}
                    </div>

                    <span
                        className={[
                            "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white",
                            activo
                                ? "bg-primary"
                                : "bg-secondary",
                        ].join(
                            " ",
                        )}
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-black text-[#2D3B35]">
                            {
                                usuario.nombre
                            }
                        </p>

                        {usuario.esUsuarioActual && (
                            <span className="rounded-full bg-sidebar px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">
                                Tú
                            </span>
                        )}
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-xs text-[#76847D]">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                            {usuario.correo ||
                                "Correo no disponible"}
                        </span>
                    </div>
                </div>

                <EstadoBadge
                    estado={
                        usuario.estado
                    }
                />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
                <InfoMini
                    etiqueta="Rol"
                    valor={
                        rolNombre
                    }
                    icono={
                        ShieldCheck
                    }
                />

                <InfoMini
                    etiqueta="Sucursal"
                    valor={
                        usuario.sucursalNombre
                    }
                    icono={
                        MapPin
                    }
                />
            </div>

            <div className="mt-4 rounded-2xl bg-[#F7F9F7] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-[#74817B]">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        <span>
                            {usuario.ultimoAcceso
                                ? `Último acceso ${formatearFecha(
                                    usuario.ultimoAcceso,
                                )}`
                                : "Sin acceso registrado"}
                        </span>
                    </div>

                    {activo && (
                        <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.10em] text-[#5E7F70]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Disponible
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-5 flex items-center gap-2 border-t border-[#EDF0EE] pt-4">
                {puedeEditar && (
                    <Link
                        href={`/usuarios/${usuario.id}/editar`}
                        className="salon-action inline-flex flex-1 items-center justify-center gap-2 border border-[#D7DFDA] bg-white text-[#526159] transition hover:bg-[#F3F6F4]"
                    >
                        <Pencil className="h-4 w-4" />
                        Editar
                    </Link>
                )}

                {puedePermisos && (
                    <Link
                        href={`/usuarios/${usuario.id}/permisos`}
                        className="salon-action inline-flex flex-1 items-center justify-center gap-2 bg-sidebar text-white transition hover:bg-sidebar-hover"
                    >
                        <KeyRound className="h-4 w-4" />
                        Permisos
                        <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                    </Link>
                )}
            </div>
        </article>
    );
}

function HeroMetric({
    label,
    value,
    helper,
    icono: Icono,
}: {
    label: string;
    value: number;
    helper: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#AFC1B8]">
                        {
                            label
                        }
                    </p>

                    <p className="mt-2 text-3xl font-black">
                        {
                            value
                        }
                    </p>

                    <p className="mt-1 text-xs text-[#B9C8C1]">
                        {
                            helper
                        }
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-primary-soft">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function InsightCard({
    titulo,
    valor,
    descripcion,
    icono: Icono,
}: {
    titulo: string;
    valor: string;
    descripcion: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <article className="salon-panel border border-border bg-white p-5">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-primary">
                    <Icono className="h-5 w-5" />
                </div>

                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8A978F]">
                        {
                            titulo
                        }
                    </p>

                    <p className="mt-1 text-2xl font-black text-sidebar">
                        {
                            valor
                        }
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#7D8983]">
                        {
                            descripcion
                        }
                    </p>
                </div>
            </div>
        </article>
    );
}

function InfoMini({
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
        <div className="rounded-2xl border border-[#E3E8E5] bg-[#FBFCFA] p-3">
            <div className="flex items-center gap-2 text-primary">
                <Icono className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-[0.12em]">
                    {
                        etiqueta
                    }
                </span>
            </div>

            <p className="mt-2 truncate text-sm font-black text-[#3A4942]">
                {
                    valor
                }
            </p>
        </div>
    );
}

function FiltroSelect({
    etiqueta,
    valor,
    onChange,
    opciones,
}: {
    etiqueta: string;
    valor: string;
    onChange: (
        valor: string,
    ) => void;
    opciones: Array<{
        valor: string;
        texto: string;
    }>;
}) {
    return (
        <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#87958D]">
                {
                    etiqueta
                }
            </span>

            <select
                value={
                    valor
                }
                onChange={(
                    event,
                ) =>
                    onChange(
                        event.target.value,
                    )
                }
                className="salon-control w-full border border-[#D9E1DD] bg-[#FAFCFB] px-3 text-[#4A5A52] outline-none focus:border-primary"
            >
                {opciones.map(
                    (
                        opcion,
                    ) => (
                        <option
                            key={
                                opcion.valor
                            }
                            value={
                                opcion.valor
                            }
                        >
                            {
                                opcion.texto
                            }
                        </option>
                    ),
                )}
            </select>
        </label>
    );
}

function EstadoBadge({
    estado,
}: {
    estado: string;
}) {
    const activo =
        estado ===
        "ACTIVO";

    return (
        <span
            className={[
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.10em]",
                activo
                    ? "bg-[#E3EEE8] text-[#527865]"
                    : "bg-[#F3E7E7] text-[#986363]",
            ].join(
                " ",
            )}
        >
            {activo ? (
                <UserRoundCheck className="h-3.5 w-3.5" />
            ) : (
                <UserRoundX className="h-3.5 w-3.5" />
            )}

            {
                estado
            }
        </span>
    );
}

function obtenerIniciales(
    nombre: string,
) {
    return (
        nombre
            .trim()
            .split(
                /\s+/,
            )
            .slice(
                0,
                2,
            )
            .map(
                (
                    parte,
                ) =>
                    parte[0]?.toUpperCase() ??
                    "",
            )
            .join(
                "",
            ) || "U"
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
            timeZone:
                "America/Managua",
        },
    ).format(
        new Date(
            fecha,
        ),
    );
}
