"use client";

import Link from "next/link";
import {
    ArrowLeft,
    BadgeCheck,
    Check,
    CheckCircle2,
    CircleSlash2,
    KeyRound,
    LoaderCircle,
    Mail,
    MapPin,
    RotateCcw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    UserRoundCog,
    X,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";

import {
    guardarPermisoUsuario,
    restablecerPermisosUsuario,
    type EstadoPermiso,
} from "./actions";

export type PermisoUsuarioVista = {
    permiso_id: string;
    codigo: string;
    modulo: string;
    nombre: string;
    permitido: boolean;
    origen: "USUARIO" | "ROL" | "SIN_ACCESO";
};

export type UsuarioPermisosInfo = {
    id: string;
    nombre: string;
    correo: string;
    rolCodigo: string;
    rolNombre: string;
    rolDescripcion: string | null;
    sucursalNombre: string;
    estado: string;
    esUsuarioActual: boolean;
};

type PermisoLocal = PermisoUsuarioVista & {
    estadoVisual:
    | "HEREDAR"
    | "PERMITIR"
    | "DENEGAR";
};

export default function PermisosUsuarioClient({
    usuario,
    permisosIniciales,
}: {
    usuario: UsuarioPermisosInfo;
    permisosIniciales: PermisoUsuarioVista[];
}) {
    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        modulo,
        setModulo,
    ] = useState("TODOS");

    const [
        permisos,
        setPermisos,
    ] =
        useState<PermisoLocal[]>(
            permisosIniciales.map(
                (
                    permiso,
                ) => ({
                    ...permiso,
                    estadoVisual:
                        permiso.origen ===
                            "USUARIO"
                            ? permiso.permitido
                                ? "PERMITIR"
                                : "DENEGAR"
                            : "HEREDAR",
                }),
            ),
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
        guardandoCodigo,
        setGuardandoCodigo,
    ] =
        useState<
            string |
            null
        >(
            null,
        );

    const [
        restableciendo,
        iniciarRestablecer,
    ] =
        useTransition();

    const modulos =
        useMemo(
            () =>
                Array.from(
                    new Set(
                        permisos.map(
                            (
                                permiso,
                            ) =>
                                permiso.modulo,
                        ),
                    ),
                ),
            [
                permisos,
            ],
        );

    const permisosFiltrados =
        useMemo(
            () => {
                const termino =
                    busqueda
                        .trim()
                        .toLowerCase();

                return permisos.filter(
                    (
                        permiso,
                    ) => {
                        const coincideModulo =
                            modulo ===
                            "TODOS" ||
                            permiso.modulo ===
                            modulo;

                        const coincideBusqueda =
                            !termino ||
                            permiso.nombre
                                .toLowerCase()
                                .includes(
                                    termino,
                                ) ||
                            permiso.codigo
                                .toLowerCase()
                                .includes(
                                    termino,
                                );

                        return (
                            coincideModulo &&
                            coincideBusqueda
                        );
                    },
                );
            },
            [
                permisos,
                modulo,
                busqueda,
            ],
        );

    const grupos =
        useMemo(
            () => {
                const mapa =
                    new Map<
                        string,
                        PermisoLocal[]
                    >();

                for (
                    const permiso
                    of permisosFiltrados
                ) {
                    const actuales =
                        mapa.get(
                            permiso.modulo,
                        ) ??
                        [];

                    actuales.push(
                        permiso,
                    );

                    mapa.set(
                        permiso.modulo,
                        actuales,
                    );
                }

                return Array.from(
                    mapa.entries(),
                );
            },
            [
                permisosFiltrados,
            ],
        );

    const total =
        permisos.length;

    const efectivosPermitidos =
        permisos.filter(
            (
                permiso,
            ) =>
                calcularEfectivo(
                    permiso,
                ),
        ).length;

    const personalizados =
        permisos.filter(
            (
                permiso,
            ) =>
                permiso.estadoVisual !==
                "HEREDAR",
        ).length;

    const denegados =
        permisos.filter(
            (
                permiso,
            ) =>
                permiso.estadoVisual ===
                "DENEGAR",
        ).length;

    async function cambiarPermiso(
        permiso: PermisoLocal,
        nuevoEstado: EstadoPermiso,
    ) {
        if (
            guardandoCodigo
        ) {
            return;
        }

        if (
            usuario.esUsuarioActual &&
            permiso.codigo ===
            "USUARIOS_PERMISOS"
        ) {
            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    "No puedes modificar tu propio permiso crítico de gestión de permisos.",
            });
            return;
        }

        setMensaje(
            null,
        );
        setGuardandoCodigo(
            permiso.codigo,
        );

        const anterior =
            permiso;

        setPermisos(
            (
                actuales,
            ) =>
                actuales.map(
                    (
                        item,
                    ) =>
                        item.codigo ===
                            permiso.codigo
                            ? {
                                ...item,
                                estadoVisual:
                                    nuevoEstado,
                            }
                            : item,
                ),
        );

        const resultado =
            await guardarPermisoUsuario({
                usuarioId:
                    usuario.id,
                codigoPermiso:
                    permiso.codigo,
                estado:
                    nuevoEstado,
            });

        if (
            !resultado.exito
        ) {
            setPermisos(
                (
                    actuales,
                ) =>
                    actuales.map(
                        (
                            item,
                        ) =>
                            item.codigo ===
                                permiso.codigo
                                ? anterior
                                : item,
                    ),
            );

            setMensaje({
                tipo:
                    "ERROR",
                texto:
                    resultado.mensaje,
            });
        } else {
            setPermisos(
                (
                    actuales,
                ) =>
                    actuales.map(
                        (
                            item,
                        ) => {
                            if (
                                item.codigo !==
                                permiso.codigo
                            ) {
                                return item;
                            }

                            return {
                                ...item,
                                permitido:
                                    nuevoEstado ===
                                        "HEREDAR"
                                        ? permiso.origen ===
                                            "ROL"
                                            ? permiso.permitido
                                            : permiso.permitido
                                        : nuevoEstado ===
                                        "PERMITIR",
                                origen:
                                    nuevoEstado ===
                                        "HEREDAR"
                                        ? permiso.origen ===
                                            "USUARIO"
                                            ? (
                                                permiso.permitido
                                                    ? "ROL"
                                                    : "SIN_ACCESO"
                                            )
                                            : permiso.origen
                                        : "USUARIO",
                                estadoVisual:
                                    nuevoEstado,
                            };
                        },
                    ),
            );

            setMensaje({
                tipo:
                    "EXITO",
                texto:
                    "Permiso actualizado correctamente.",
            });
        }

        setGuardandoCodigo(
            null,
        );
    }

    function restablecerTodo() {
        if (
            personalizados ===
            0
        ) {
            return;
        }

        setMensaje(
            null,
        );

        iniciarRestablecer(
            async () => {
                const resultado =
                    await restablecerPermisosUsuario(
                        usuario.id,
                    );

                if (
                    !resultado.exito
                ) {
                    setMensaje({
                        tipo:
                            "ERROR",
                        texto:
                            resultado.mensaje,
                    });
                    return;
                }

                window.location.reload();
            },
        );
    }

    return (
        <div className="space-y-7 pb-10">
            <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#26332F] p-6 text-white shadow-[0_24px_70px_rgba(36,48,44,0.20)] sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#6F8F83]/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-[#C79AA1]/15 blur-3xl" />
                <div className="pointer-events-none absolute right-[18%] top-[12%] h-40 w-40 rounded-full border border-white/10" />

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
                                <KeyRound className="h-8 w-8" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-[#D8E3DE]">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Control granular
                                    </span>

                                    {usuario.esUsuarioActual && (
                                        <span className="rounded-full bg-[#DCE7E2] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#26332F]">
                                            Tu cuenta
                                        </span>
                                    )}
                                </div>

                                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                                    Permisos de
                                    <span className="text-[#AFC6BB]">
                                        {" "}
                                        {usuario.nombre}
                                    </span>
                                </h1>

                                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CDD8D3] sm:text-base">
                                    Decide qué puede hacer esta cuenta sin modificar
                                    el rol base de los demás usuarios.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <HeroInfo
                                etiqueta="Rol base"
                                valor={
                                    usuario.rolNombre
                                }
                                icono={
                                    ShieldCheck
                                }
                            />

                            <HeroInfo
                                etiqueta="Sucursal"
                                valor={
                                    usuario.sucursalNombre
                                }
                                icono={
                                    MapPin
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

            <section className="grid gap-4 md:grid-cols-4">
                <ResumenCard
                    etiqueta="Permisos"
                    valor={
                        total
                    }
                    detalle="acciones configurables"
                    icono={
                        SlidersHorizontal
                    }
                />

                <ResumenCard
                    etiqueta="Acceso efectivo"
                    valor={
                        efectivosPermitidos
                    }
                    detalle="acciones permitidas"
                    icono={
                        BadgeCheck
                    }
                />

                <ResumenCard
                    etiqueta="Personalizados"
                    valor={
                        personalizados
                    }
                    detalle="excepciones al rol"
                    icono={
                        UserRoundCog
                    }
                />

                <ResumenCard
                    etiqueta="Denegados"
                    valor={
                        denegados
                    }
                    detalle="bloqueos individuales"
                    icono={
                        CircleSlash2
                    }
                />
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
                <aside className="space-y-5">
                    <article className="rounded-[28px] border border-[#DDE5E1] bg-white p-5 shadow-[0_12px_34px_rgba(36,48,44,0.06)]">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                            Usuario
                        </p>

                        <div className="mt-4 flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[#E7EFEB] text-lg font-black text-[#456156]">
                                {obtenerIniciales(
                                    usuario.nombre,
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-base font-black text-[#2D3B35]">
                                    {
                                        usuario.nombre
                                    }
                                </p>

                                <div className="mt-1.5 flex items-center gap-2 text-xs text-[#76847D]">
                                    <Mail className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">
                                        {
                                            usuario.correo
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl bg-[#F6F9F7] p-4">
                            <div className="flex items-center gap-2 text-xs font-black text-[#4B6157]">
                                <ShieldCheck className="h-4 w-4 text-[#6F8F83]" />
                                {
                                    usuario.rolNombre
                                }
                            </div>

                            <p className="mt-2 text-xs leading-5 text-[#7A8781]">
                                {usuario.rolDescripcion ||
                                    "El rol define el acceso base. Las excepciones de esta pantalla tienen prioridad."}
                            </p>
                        </div>
                    </article>

                    <article className="rounded-[28px] border border-[#DDE5E1] bg-white p-5 shadow-[0_12px_34px_rgba(36,48,44,0.06)]">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                            Cómo funciona
                        </p>

                        <div className="mt-4 space-y-3">
                            <Leyenda
                                titulo="Heredar"
                                descripcion="Usa exactamente lo definido por el rol."
                                tipo="HEREDAR"
                            />

                            <Leyenda
                                titulo="Permitir"
                                descripcion="Da acceso aunque el rol no lo incluya."
                                tipo="PERMITIR"
                            />

                            <Leyenda
                                titulo="Denegar"
                                descripcion="Bloquea el acceso aunque el rol lo permita."
                                tipo="DENEGAR"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={
                                personalizados ===
                                0 ||
                                restableciendo
                            }
                            onClick={
                                restablecerTodo
                            }
                            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#D7DFDA] bg-[#FBFCFA] text-xs font-black text-[#56655D] transition hover:bg-[#F2F6F3] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            {restableciendo ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <RotateCcw className="h-4 w-4" />
                            )}

                            Restablecer todo al rol
                        </button>
                    </article>
                </aside>

                <section className="space-y-5">
                    <article className="rounded-[28px] border border-[#DDE5E1] bg-white p-4 shadow-[0_12px_34px_rgba(36,48,44,0.06)] sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#819087]" />

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
                                    placeholder="Buscar permiso..."
                                    className="h-12 w-full rounded-2xl border border-[#D9E1DD] bg-[#F8FAF8] pl-11 pr-4 text-sm outline-none transition focus:border-[#6F8F83] focus:bg-white"
                                />
                            </div>

                            <select
                                value={
                                    modulo
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setModulo(
                                        event.target.value,
                                    )
                                }
                                className="h-12 rounded-2xl border border-[#D9E1DD] bg-[#F8FAF8] px-4 text-sm font-bold text-[#4A5A52] outline-none focus:border-[#6F8F83]"
                            >
                                <option value="TODOS">
                                    Todos los módulos
                                </option>

                                {modulos.map(
                                    (
                                        item,
                                    ) => (
                                        <option
                                            key={
                                                item
                                            }
                                            value={
                                                item
                                            }
                                        >
                                            {
                                                formatearModulo(
                                                    item,
                                                )
                                            }
                                        </option>
                                    ),
                                )}
                            </select>

                            {(busqueda ||
                                modulo !==
                                "TODOS") && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBusqueda("");
                                            setModulo(
                                                "TODOS",
                                            );
                                        }}
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-[#7C8882] hover:bg-[#F4F7F5]"
                                    >
                                        <X className="h-4 w-4" />
                                        Limpiar
                                    </button>
                                )}
                        </div>
                    </article>

                    {grupos.length ===
                        0 ? (
                        <div className="rounded-[28px] border border-dashed border-[#CBD7D1] bg-white p-12 text-center">
                            <Search className="mx-auto h-7 w-7 text-[#8E9A94]" />
                            <p className="mt-3 font-black text-[#34423C]">
                                No encontramos permisos
                            </p>
                        </div>
                    ) : (
                        grupos.map(
                            ([
                                nombreModulo,
                                permisosModulo,
                            ]) => (
                                <ModuloPermisos
                                    key={
                                        nombreModulo
                                    }
                                    modulo={
                                        nombreModulo
                                    }
                                    permisos={
                                        permisosModulo
                                    }
                                    guardandoCodigo={
                                        guardandoCodigo
                                    }
                                    cambiarPermiso={
                                        cambiarPermiso
                                    }
                                />
                            ),
                        )
                    )}
                </section>
            </section>
        </div>
    );
}

function ModuloPermisos({
    modulo,
    permisos,
    guardandoCodigo,
    cambiarPermiso,
}: {
    modulo: string;
    permisos: PermisoLocal[];
    guardandoCodigo:
    | string
    | null;
    cambiarPermiso: (
        permiso: PermisoLocal,
        estado: EstadoPermiso,
    ) => void;
}) {
    const permitidos =
        permisos.filter(
            (
                permiso,
            ) =>
                calcularEfectivo(
                    permiso,
                ),
        ).length;

    return (
        <article className="overflow-hidden rounded-[28px] border border-[#DDE5E1] bg-white shadow-[0_12px_34px_rgba(36,48,44,0.06)]">
            <header className="flex flex-col gap-3 border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A978F]">
                        Módulo
                    </p>

                    <h2 className="mt-1 text-lg font-black text-[#26332F]">
                        {formatearModulo(
                            modulo,
                        )}
                    </h2>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF3F0] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.10em] text-[#5B7468]">
                    <Check className="h-3.5 w-3.5" />
                    {permitidos}/{permisos.length} permitidos
                </div>
            </header>

            <div className="divide-y divide-[#EEF1EF]">
                {permisos.map(
                    (
                        permiso,
                    ) => (
                        <PermisoFila
                            key={
                                permiso.codigo
                            }
                            permiso={
                                permiso
                            }
                            cargando={
                                guardandoCodigo ===
                                permiso.codigo
                            }
                            bloqueado={
                                guardandoCodigo !==
                                null &&
                                guardandoCodigo !==
                                permiso.codigo
                            }
                            cambiarPermiso={
                                cambiarPermiso
                            }
                        />
                    ),
                )}
            </div>
        </article>
    );
}

function PermisoFila({
    permiso,
    cargando,
    bloqueado,
    cambiarPermiso,
}: {
    permiso: PermisoLocal;
    cargando: boolean;
    bloqueado: boolean;
    cambiarPermiso: (
        permiso: PermisoLocal,
        estado: EstadoPermiso,
    ) => void;
}) {
    const efectivo =
        calcularEfectivo(
            permiso,
        );

    return (
        <div className="grid gap-4 px-5 py-4 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-[#33413B]">
                        {
                            permiso.nombre
                        }
                    </p>

                    <span
                        className={[
                            "rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.10em]",
                            efectivo
                                ? "bg-[#E5EFEA] text-[#567866]"
                                : "bg-[#F3E8E8] text-[#916466]",
                        ].join(
                            " ",
                        )}
                    >
                        {efectivo
                            ? "Permitido"
                            : "Bloqueado"}
                    </span>
                </div>

                <p className="mt-1 text-xs font-semibold text-[#87938D]">
                    {
                        permiso.codigo
                    }
                </p>

                <p className="mt-1 text-[11px] text-[#9AA49F]">
                    {permiso.estadoVisual ===
                        "HEREDAR"
                        ? permiso.origen ===
                            "ROL"
                            ? "Heredado del rol"
                            : "Sin acceso en el rol"
                        : permiso.estadoVisual ===
                            "PERMITIR"
                            ? "Permiso individual"
                            : "Bloqueo individual"}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <OpcionPermiso
                    activa={
                        permiso.estadoVisual ===
                        "HEREDAR"
                    }
                    tipo="HEREDAR"
                    cargando={
                        cargando
                    }
                    disabled={
                        bloqueado
                    }
                    onClick={() =>
                        cambiarPermiso(
                            permiso,
                            "HEREDAR",
                        )
                    }
                />

                <OpcionPermiso
                    activa={
                        permiso.estadoVisual ===
                        "PERMITIR"
                    }
                    tipo="PERMITIR"
                    cargando={
                        cargando
                    }
                    disabled={
                        bloqueado
                    }
                    onClick={() =>
                        cambiarPermiso(
                            permiso,
                            "PERMITIR",
                        )
                    }
                />

                <OpcionPermiso
                    activa={
                        permiso.estadoVisual ===
                        "DENEGAR"
                    }
                    tipo="DENEGAR"
                    cargando={
                        cargando
                    }
                    disabled={
                        bloqueado
                    }
                    onClick={() =>
                        cambiarPermiso(
                            permiso,
                            "DENEGAR",
                        )
                    }
                />
            </div>
        </div>
    );
}

function OpcionPermiso({
    activa,
    tipo,
    cargando,
    disabled,
    onClick,
}: {
    activa: boolean;
    tipo: EstadoPermiso;
    cargando: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    const estilos =
        tipo ===
            "PERMITIR"
            ? activa
                ? "border-[#91B1A2] bg-[#E6F0EB] text-[#4F735F]"
                : "border-[#DDE4E0] bg-white text-[#68766F]"
            : tipo ===
                "DENEGAR"
                ? activa
                    ? "border-[#DAB9BB] bg-[#F5EAEA] text-[#93656A]"
                    : "border-[#DDE4E0] bg-white text-[#68766F]"
                : activa
                    ? "border-[#A9B8B1] bg-[#EEF2EF] text-[#53635B]"
                    : "border-[#DDE4E0] bg-white text-[#68766F]";

    return (
        <button
            type="button"
            disabled={
                disabled ||
                cargando
            }
            onClick={
                onClick
            }
            className={[
                "inline-flex min-w-[86px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.08em] transition",
                estilos,
                "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(
                " ",
            )}
        >
            {cargando &&
                activa ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : tipo ===
                "PERMITIR" ? (
                <Check className="h-3.5 w-3.5" />
            ) : tipo ===
                "DENEGAR" ? (
                <CircleSlash2 className="h-3.5 w-3.5" />
            ) : (
                <RotateCcw className="h-3.5 w-3.5" />
            )}

            {tipo ===
                "HEREDAR"
                ? "Heredar"
                : tipo ===
                    "PERMITIR"
                    ? "Permitir"
                    : "Denegar"}
        </button>
    );
}

function Leyenda({
    titulo,
    descripcion,
    tipo,
}: {
    titulo: string;
    descripcion: string;
    tipo:
    | "HEREDAR"
    | "PERMITIR"
    | "DENEGAR";
}) {
    const icono =
        tipo ===
            "PERMITIR"
            ? Check
            : tipo ===
                "DENEGAR"
                ? CircleSlash2
                : RotateCcw;

    const Icono =
        icono;

    return (
        <div className="flex items-start gap-3 rounded-2xl bg-[#F7F9F7] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#6F8F83] shadow-sm">
                <Icono className="h-4 w-4" />
            </div>

            <div>
                <p className="text-xs font-black text-[#3B4A43]">
                    {
                        titulo
                    }
                </p>

                <p className="mt-1 text-[11px] leading-5 text-[#7E8B84]">
                    {
                        descripcion
                    }
                </p>
            </div>
        </div>
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

function ResumenCard({
    etiqueta,
    valor,
    detalle,
    icono: Icono,
}: {
    etiqueta: string;
    valor: number;
    detalle: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <article className="rounded-[24px] border border-[#DCE5E0] bg-white p-5 shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#87958D]">
                        {
                            etiqueta
                        }
                    </p>

                    <p className="mt-2 text-3xl font-black text-[#26332F]">
                        {
                            valor
                        }
                    </p>

                    <p className="mt-1 text-xs text-[#8E9993]">
                        {
                            detalle
                        }
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF3F0] text-[#6F8F83]">
                    <Icono className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}

function calcularEfectivo(
    permiso: PermisoLocal,
) {
    if (
        permiso.estadoVisual ===
        "PERMITIR"
    ) {
        return true;
    }

    if (
        permiso.estadoVisual ===
        "DENEGAR"
    ) {
        return false;
    }

    return permiso.permitido;
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

function formatearModulo(
    modulo: string,
) {
    return modulo
        .toLowerCase()
        .split(
            "_",
        )
        .map(
            (
                palabra,
            ) =>
                palabra.charAt(
                    0,
                ).toUpperCase() +
                palabra.slice(
                    1,
                ),
        )
        .join(
            " ",
        );
}
