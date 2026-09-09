"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    Bell,
    BellRing,
    BarChart3,
    Boxes,
    CalendarDays,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Menu,
    PackageOpen,
    ReceiptText,
    Scissors,
    Search,
    Settings,
    Sparkles,
    Store,
    UserRound,
    CheckCheck,
    LoaderCircle,
    UsersRound,
    WalletCards,
    X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type RolUsuario =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "RECEPCION"
    | "CAJA"
    | "TRABAJADOR"
    | "INVENTARIO";

type PerfilAppShell = {
    nombreCompleto: string;
    correo: string;
    rol: RolUsuario;
    salonNombre: string;
    sucursalNombre: string;
};

type AppShellProps = {
    perfil: PerfilAppShell;
    children: React.ReactNode;
};

type NotificacionCampana = {
    id: string;
    cita_id: string | null;
    titulo: string;
    mensaje: string;
    prioridad: string;
    enlace: string | null;
    leida: boolean;
    fecha_registro: string;
};

type ElementoMenu = {
    nombre: string;
    descripcion: string;
    href?: string;
    icono: React.ComponentType<{
        className?: string;
        strokeWidth?: number;
    }>;
    roles: RolUsuario[];
    permiso: string;
};

type GrupoMenu = {
    nombre: string;
    elementos: ElementoMenu[];
};

const todosLosRoles: RolUsuario[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "RECEPCION",
    "CAJA",
    "TRABAJADOR",
    "INVENTARIO",
];

const menu: GrupoMenu[] = [
    {
        nombre: "Principal",
        elementos: [
            {
                nombre: "Inicio",
                descripcion: "Resumen del negocio",
                href: "/inicio",
                icono: LayoutDashboard,
                roles: todosLosRoles,
                permiso: "INICIO_VER",
            },
            {
                nombre: "Notificaciones",
                descripcion: "Avisos y recordatorios",
                href: "/notificaciones",
                icono: Bell,
                roles: [
                    "SUPER_ADMIN",
                    "ADMIN",
                    "RECEPCION",
                    "CAJA",
                    "TRABAJADOR",
                ],
                permiso: "NOTIFICACIONES_VER",
            },
            {
                nombre: "Agenda",
                descripcion: "Calendario y citas",
                href: "/agenda",
                icono: CalendarDays,
                roles: [
                    "SUPER_ADMIN",
                    "ADMIN",
                    "RECEPCION",
                    "CAJA",
                    "TRABAJADOR",
                ],
                permiso: "AGENDA_VER",
            },
            {
                nombre: "Clientes",
                descripcion: "Perfiles e historial",
                href: "/clientes",
                icono: UserRound,
                roles: [
                    "SUPER_ADMIN",
                    "ADMIN",
                    "RECEPCION",
                    "CAJA",
                    "TRABAJADOR",
                ],
                permiso: "CLIENTES_VER",
            },
        ],
    },
    {
        nombre: "Operación",
        elementos: [
            {
                nombre: "Trabajadores",
                descripcion: "Personal y horarios",
                href: "/trabajadores",
                icono: UsersRound,
                roles: ["SUPER_ADMIN", "ADMIN"],
                permiso: "TRABAJADORES_VER",
            },
            {
                nombre: "Servicios",
                descripcion: "Precios y duración",
                href: "/servicios",
                icono: Scissors,
                roles: ["SUPER_ADMIN", "ADMIN", "RECEPCION"],
                permiso: "SERVICIOS_VER",
            },
            {
                nombre: "Caja y ventas",
                descripcion: "Cobros manuales",
                href: "/caja",
                icono: WalletCards,
                roles: [
                    "SUPER_ADMIN",
                    "ADMIN",
                    "CAJA",
                    "RECEPCION",
                ],
                permiso: "CAJA_VER",
            },
            {
                nombre: "Cuentas por cobrar",
                descripcion: "Saldos y abonos",
                href: "/cuentas-cobrar",
                icono: ReceiptText,
                roles: ["SUPER_ADMIN", "ADMIN", "CAJA", "RECEPCION"],
                permiso: "CUENTAS_COBRAR_VER",
            },
        ],
    },
    {
        nombre: "Administración",
        elementos: [
            {
                nombre: "Inventario",
                descripcion: "Productos e insumos",
                href: "/inventario",
                icono: Boxes,
                roles: ["SUPER_ADMIN", "ADMIN", "INVENTARIO"],
                permiso: "INVENTARIO_VER",
            },
            {
                nombre: "Compras",
                descripcion: "Compras y proveedores",
                href: "/compras",
                icono: PackageOpen,
                roles: ["SUPER_ADMIN", "ADMIN", "INVENTARIO"],
                permiso: "COMPRAS_VER",
            },
            {
                nombre: "Ingresos y gastos",
                descripcion: "Control financiero",
                href: "/finanzas",
                icono: BarChart3,
                roles: ["SUPER_ADMIN", "ADMIN", "CAJA"],
                permiso: "FINANZAS_VER",
            },
            {
                nombre: "Reportes",
                descripcion: "Resultados del negocio",
                href: "/reportes",
                icono: ClipboardList,
                roles: ["SUPER_ADMIN", "ADMIN"],
                permiso: "REPORTES_VER",
            },
            {
                nombre: "Usuarios y accesos",
                descripcion: "Cuentas, roles y permisos",
                href: "/usuarios",
                icono: UsersRound,
                roles: ["SUPER_ADMIN", "ADMIN"],
                permiso: "USUARIOS_VER",
            },
            {
                nombre: "Configuración",
                descripcion: "Datos del salón",
                href: "/configuracion",
                icono: Settings,
                roles: ["SUPER_ADMIN", "ADMIN"],
                permiso: "CONFIGURACION_VER",
            },
        ],
    },
];

export default function AppShell({
    perfil,
    children,
}: AppShellProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [menuAbierto, setMenuAbierto] = useState(false);
    const [cerrandoSesion, setCerrandoSesion] = useState(false);

    const [permisosUsuario, setPermisosUsuario] =
        useState<Set<string> | null>(null);

    const [panelNotificacionesAbierto, setPanelNotificacionesAbierto] =
        useState(false);
    const [notificaciones, setNotificaciones] =
        useState<NotificacionCampana[]>([]);
    const [cantidadNoLeidas, setCantidadNoLeidas] = useState(0);
    const [cargandoNotificaciones, setCargandoNotificaciones] =
        useState(true);
    const [actualizandoNotificacion, setActualizandoNotificacion] =
        useState<string | null>(null);

    const contenedorCampanaRef = useRef<HTMLDivElement>(null);

    const iniciales = obtenerIniciales(perfil.nombreCompleto);
    const informacionRuta = obtenerInformacionRuta(pathname);

    useEffect(() => {
        let activo = true;
        const supabase = createClient();

        async function cargarPermisos() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user || !activo) {
                return;
            }

            const {
                data,
                error,
            } = await supabase.rpc(
                "obtener_permisos_usuario_actual",
            );

            if (!activo) {
                return;
            }

            if (error) {
                console.error(
                    "Error cargando permisos del AppShell:",
                    error,
                );

                // Seguridad fail-closed:
                // si no podemos verificar permisos, no mostramos modulos.
                setPermisosUsuario(new Set());
                return;
            }

            setPermisosUsuario(
                new Set(
                    (data ?? [])
                        .filter(
                            (item: {
                                permitido: boolean;
                                codigo: string;
                            }) =>
                                item.permitido === true,
                        )
                        .map(
                            (item: {
                                codigo: string;
                            }) => item.codigo,
                        ),
                ),
            );
        }

        cargarPermisos();

        return () => {
            activo = false;
        };
    }, []);

    useEffect(() => {
        let activo = true;
        const supabase = createClient();

        async function cargarNotificaciones() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user || !activo) {
                    return;
                }

                const [
                    resultadoNotificaciones,
                    resultadoConteo,
                ] = await Promise.all([
                    supabase
                        .from("notificaciones_sistema")
                        .select(`
                            id,
                            cita_id,
                            titulo,
                            mensaje,
                            prioridad,
                            enlace,
                            leida,
                            fecha_registro
                        `)
                        .eq("archivada", false)
                        .or(
                            `usuario_id.eq.${user.id},usuario_id.is.null`,
                        )
                        .order("fecha_registro", {
                            ascending: false,
                        })
                        .limit(6),

                    supabase
                        .from("notificaciones_sistema")
                        .select("id", {
                            count: "exact",
                            head: true,
                        })
                        .eq("archivada", false)
                        .eq("leida", false)
                        .or(
                            `usuario_id.eq.${user.id},usuario_id.is.null`,
                        ),
                ]);

                if (!activo) {
                    return;
                }

                if (resultadoNotificaciones.error) {
                    console.error(
                        "Error cargando notificaciones:",
                        resultadoNotificaciones.error,
                    );
                } else {
                    setNotificaciones(
                        (resultadoNotificaciones.data ??
                            []) as NotificacionCampana[],
                    );
                }

                if (resultadoConteo.error) {
                    console.error(
                        "Error contando notificaciones:",
                        resultadoConteo.error,
                    );
                } else {
                    setCantidadNoLeidas(
                        resultadoConteo.count ?? 0,
                    );
                }
            } finally {
                if (activo) {
                    setCargandoNotificaciones(false);
                }
            }
        }

        cargarNotificaciones();

        const canal = supabase
            .channel("app-shell-notificaciones")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notificaciones_sistema",
                },
                () => {
                    cargarNotificaciones();
                },
            )
            .subscribe();

        return () => {
            activo = false;
            supabase.removeChannel(canal);
        };
    }, []);

    useEffect(() => {
        function cerrarPanel(event: MouseEvent) {
            const objetivo = event.target as Node;

            if (
                contenedorCampanaRef.current &&
                !contenedorCampanaRef.current.contains(
                    objetivo,
                )
            ) {
                setPanelNotificacionesAbierto(false);
            }
        }

        function cerrarConEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setPanelNotificacionesAbierto(false);
            }
        }

        document.addEventListener("mousedown", cerrarPanel);
        window.addEventListener("keydown", cerrarConEscape);

        return () => {
            document.removeEventListener(
                "mousedown",
                cerrarPanel,
            );
            window.removeEventListener(
                "keydown",
                cerrarConEscape,
            );
        };
    }, []);

    async function marcarNotificacionLeida(
        notificacion: NotificacionCampana,
    ) {
        if (actualizandoNotificacion) {
            return;
        }

        if (!notificacion.leida) {
            setActualizandoNotificacion(notificacion.id);

            try {
                const supabase = createClient();

                const { error } = await supabase
                    .from("notificaciones_sistema")
                    .update({
                        leida: true,
                        leida_en: new Date().toISOString(),
                    })
                    .eq("id", notificacion.id)
                    .eq("archivada", false);

                if (error) {
                    console.error(
                        "Error marcando notificación:",
                        error,
                    );
                } else {
                    setNotificaciones((actuales) =>
                        actuales.map((item) =>
                            item.id === notificacion.id
                                ? {
                                    ...item,
                                    leida: true,
                                }
                                : item,
                        ),
                    );

                    setCantidadNoLeidas((cantidad) =>
                        Math.max(0, cantidad - 1),
                    );
                }
            } finally {
                setActualizandoNotificacion(null);
            }
        }

        setPanelNotificacionesAbierto(false);

        const destino =
            notificacion.enlace ||
            (notificacion.cita_id
                ? `/agenda/${notificacion.cita_id}`
                : "/notificaciones");

        router.push(destino);
    }

    async function marcarTodasLeidasCampana() {
        if (
            cantidadNoLeidas === 0 ||
            actualizandoNotificacion
        ) {
            return;
        }

        setActualizandoNotificacion("TODAS");

        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                return;
            }

            const { error } = await supabase
                .from("notificaciones_sistema")
                .update({
                    leida: true,
                    leida_en: new Date().toISOString(),
                })
                .eq("archivada", false)
                .eq("leida", false)
                .or(
                    `usuario_id.eq.${user.id},usuario_id.is.null`,
                );

            if (error) {
                console.error(
                    "Error marcando todas las notificaciones:",
                    error,
                );
                return;
            }

            setNotificaciones((actuales) =>
                actuales.map((item) => ({
                    ...item,
                    leida: true,
                })),
            );
            setCantidadNoLeidas(0);
            router.refresh();
        } finally {
            setActualizandoNotificacion(null);
        }
    }

    async function cerrarSesion() {
        if (cerrandoSesion) return;

        setCerrandoSesion(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signOut();

            if (error) {
                throw error;
            }

            router.replace("/login");
            router.refresh();
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            setCerrandoSesion(false);
        }
    }

    function cerrarMenuMovil() {
        setMenuAbierto(false);
    }

    return (
        <div className="min-h-screen bg-[#F6F7F4] text-[#24302C]">
            {menuAbierto && (
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    onClick={cerrarMenuMovil}
                    className="fixed inset-0 z-40 bg-[#26332F]/45 backdrop-blur-sm lg:hidden"
                />
            )}

            <aside
                className={[
                    "fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col",
                    "border-r border-white/5 bg-[#26332F] text-white",
                    "shadow-[14px_0_45px_rgba(36,48,44,0.08)]",
                    "transition-transform duration-300 lg:translate-x-0",
                    menuAbierto ? "translate-x-0" : "-translate-x-full",
                ].join(" ")}
            >
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
                    <Link
                        href="/inicio"
                        onClick={cerrarMenuMovil}
                        className="flex min-w-0 items-center gap-3"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F] shadow-lg shadow-black/10">
                            <Sparkles className="h-5 w-5" strokeWidth={2.1} />
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold tracking-tight text-white">
                                {perfil.salonNombre}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-[#B9C8C1]">
                                {perfil.sucursalNombre}
                            </p>
                        </div>
                    </Link>

                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={cerrarMenuMovil}
                        className="rounded-xl p-2 text-[#B9C8C1] transition hover:bg-white/10 hover:text-white lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-5">
                    <div className="space-y-7">
                        {menu.map((grupo) => {
                            const elementosVisibles = grupo.elementos.filter(
                                (elemento) => {
                                    if (permisosUsuario === null) {
                                        return false;
                                    }

                                    return permisosUsuario.has(
                                        elemento.permiso,
                                    );
                                },
                            );

                            if (elementosVisibles.length === 0) {
                                return null;
                            }

                            return (
                                <section key={grupo.nombre}>
                                    <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#82968D]">
                                        {grupo.nombre}
                                    </p>

                                    <div className="space-y-1">
                                        {elementosVisibles.map((elemento) => (
                                            <ElementoNavegacion
                                                key={elemento.nombre}
                                                elemento={elemento}
                                                activo={
                                                    elemento.href
                                                        ? pathname === elemento.href ||
                                                        pathname.startsWith(
                                                            `${elemento.href}/`,
                                                        )
                                                        : false
                                                }
                                                alNavegar={cerrarMenuMovil}
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </nav>

                <div className="border-t border-white/10 p-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DCE7E2] text-sm font-bold text-[#26332F]">
                                {iniciales}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">
                                    {perfil.nombreCompleto}
                                </p>

                                <p className="mt-0.5 truncate text-xs text-[#AABBB3]">
                                    {formatearRol(perfil.rol)}
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Cerrar sesión"
                                title="Cerrar sesión"
                                onClick={cerrarSesion}
                                disabled={cerrandoSesion}
                                className="rounded-xl p-2 text-[#AABBB3] transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="min-h-screen lg:pl-[286px]">
                <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-[#E3E7E4] bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            aria-label="Abrir menú"
                            onClick={() => setMenuAbierto(true)}
                            className="rounded-xl border border-[#E3E7E4] bg-white p-2.5 text-[#52605A] transition hover:border-[#C9D5D0] hover:bg-[#EEF2EF] lg:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="min-w-0">
                            <h1 className="truncate text-base font-bold tracking-tight text-[#24302C]">
                                {informacionRuta.titulo}
                            </h1>

                            <p className="hidden truncate text-xs text-[#6B756F] sm:block">
                                {informacionRuta.descripcion}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            title="Buscar"
                            aria-label="Buscar"
                            className="hidden rounded-xl border border-[#E3E7E4] bg-white p-2.5 text-[#6B756F] transition hover:border-[#C9D5D0] hover:bg-[#EEF2EF] md:block"
                        >
                            <Search className="h-5 w-5" />
                        </button>

                        <div
                            ref={contenedorCampanaRef}
                            className="relative"
                        >
                            <button
                                type="button"
                                aria-label="Notificaciones"
                                title="Notificaciones"
                                aria-expanded={
                                    panelNotificacionesAbierto
                                }
                                onClick={() =>
                                    setPanelNotificacionesAbierto(
                                        (abierto) => !abierto,
                                    )
                                }
                                className={[
                                    "relative rounded-xl border bg-white p-2.5 transition",
                                    panelNotificacionesAbierto
                                        ? "border-[#9FB7AC] bg-[#EEF2EF] text-[#527064]"
                                        : "border-[#E3E7E4] text-[#6B756F] hover:border-[#C9D5D0] hover:bg-[#EEF2EF]",
                                ].join(" ")}
                            >
                                <Bell className="h-5 w-5" />

                                {cantidadNoLeidas > 0 && (
                                    <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#C79AA1] px-1.5 text-[10px] font-bold text-white ring-2 ring-white">
                                        {cantidadNoLeidas > 99
                                            ? "99+"
                                            : cantidadNoLeidas}
                                    </span>
                                )}
                            </button>

                            {panelNotificacionesAbierto && (
                                <PanelCampana
                                    notificaciones={
                                        notificaciones
                                    }
                                    cantidadNoLeidas={
                                        cantidadNoLeidas
                                    }
                                    cargando={
                                        cargandoNotificaciones
                                    }
                                    actualizando={
                                        actualizandoNotificacion
                                    }
                                    abrirNotificacion={
                                        marcarNotificacionLeida
                                    }
                                    marcarTodas={
                                        marcarTodasLeidasCampana
                                    }
                                    verTodas={() => {
                                        setPanelNotificacionesAbierto(
                                            false,
                                        );
                                        router.push(
                                            "/notificaciones",
                                        );
                                    }}
                                />
                            )}
                        </div>

                        <div className="hidden items-center gap-3 border-l border-[#E3E7E4] pl-3 sm:flex">
                            <div className="text-right">
                                <p className="max-w-44 truncate text-sm font-semibold text-[#24302C]">
                                    {perfil.nombreCompleto}
                                </p>

                                <p className="text-xs text-[#6B756F]">
                                    {formatearRol(perfil.rol)}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE7E2] text-sm font-bold text-[#26332F]">
                                {iniciales}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8">{children}</main>

                <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E3E7E4] bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(36,48,44,0.08)] backdrop-blur-xl lg:hidden">
                    <div className="mx-auto grid h-16 max-w-lg grid-cols-4">
                        {permisosUsuario?.has(
                            "INICIO_VER",
                        ) ? (
                            <AccesoMovil
                                href="/inicio"
                                nombre="Inicio"
                                icono={LayoutDashboard}
                                activo={pathname.startsWith("/inicio")}
                            />
                        ) : (
                            <div />
                        )}

                        {permisosUsuario?.has(
                            "AGENDA_VER",
                        ) ? (
                            <AccesoMovil
                                href="/agenda"
                                nombre="Agenda"
                                icono={CalendarDays}
                                activo={pathname.startsWith("/agenda")}
                            />
                        ) : (
                            <div />
                        )}

                        {permisosUsuario?.has(
                            "CLIENTES_VER",
                        ) ? (
                            <AccesoMovil
                                href="/clientes"
                                nombre="Clientes"
                                icono={UserRound}
                                activo={pathname.startsWith("/clientes")}
                            />
                        ) : (
                            <div />
                        )}

                        <button
                            type="button"
                            onClick={() => setMenuAbierto(true)}
                            className="flex flex-col items-center justify-center gap-1 text-[#6B756F]"
                        >
                            <Menu className="h-5 w-5" />
                            <span className="text-[10px] font-semibold">Más</span>
                        </button>
                    </div>
                </nav>

                <div className="h-16 lg:hidden" />
            </div>
        </div>
    );
}

function PanelCampana({
    notificaciones,
    cantidadNoLeidas,
    cargando,
    actualizando,
    abrirNotificacion,
    marcarTodas,
    verTodas,
}: {
    notificaciones: NotificacionCampana[];
    cantidadNoLeidas: number;
    cargando: boolean;
    actualizando: string | null;
    abrirNotificacion: (
        notificacion: NotificacionCampana,
    ) => void;
    marcarTodas: () => void;
    verTodas: () => void;
}) {
    return (
        <section className="fixed left-4 right-4 top-[74px] z-[80] overflow-hidden rounded-2xl border border-[#DCE3DF] bg-white shadow-[0_22px_65px_rgba(36,48,44,0.22)] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[390px]">
            <header className="flex items-center justify-between gap-4 border-b border-[#E8ECE9] bg-[#FBFCFA] px-4 py-3.5">
                <div>
                    <h2 className="font-bold text-[#24302C]">
                        Notificaciones
                    </h2>
                    <p className="mt-0.5 text-xs text-[#76817B]">
                        {cantidadNoLeidas === 0
                            ? "No tienes avisos pendientes"
                            : `${cantidadNoLeidas} sin leer`}
                    </p>
                </div>

                {cantidadNoLeidas > 0 && (
                    <button
                        type="button"
                        onClick={marcarTodas}
                        disabled={
                            actualizando !== null
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#DCE7E2] px-3 text-[11px] font-bold text-[#43524B] disabled:opacity-50"
                    >
                        {actualizando === "TODAS" ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <CheckCheck className="h-3.5 w-3.5" />
                        )}
                        Marcar todas
                    </button>
                )}
            </header>

            <div className="max-h-[420px] overflow-y-auto">
                {cargando ? (
                    <div className="flex items-center justify-center gap-2 p-10 text-sm text-[#6B756F]">
                        <LoaderCircle className="h-5 w-5 animate-spin text-[#6F8F83]" />
                        Cargando avisos...
                    </div>
                ) : notificaciones.length === 0 ? (
                    <div className="p-10 text-center">
                        <Bell className="mx-auto h-8 w-8 text-[#98A19D]" />
                        <p className="mt-3 font-semibold text-[#33413B]">
                            Todo está al día
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#76817B]">
                            Aquí aparecerán los avisos recientes del salón.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#EEF1EF]">
                        {notificaciones.map(
                            (notificacion) => (
                                <button
                                    key={
                                        notificacion.id
                                    }
                                    type="button"
                                    disabled={
                                        actualizando !==
                                        null
                                    }
                                    onClick={() =>
                                        abrirNotificacion(
                                            notificacion,
                                        )
                                    }
                                    className={[
                                        "flex w-full items-start gap-3 p-4 text-left transition hover:bg-[#F4F7F5] disabled:opacity-60",
                                        notificacion.leida
                                            ? "bg-white"
                                            : "bg-[#F0F5F2]",
                                    ].join(" ")}
                                >
                                    <div
                                        className={[
                                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                            notificacion.prioridad ===
                                                "URGENTE"
                                                ? "bg-[#F8E5E5] text-[#A25E5E]"
                                                : notificacion.prioridad ===
                                                    "ALTA"
                                                    ? "bg-[#FAF0DC] text-[#9A742D]"
                                                    : "bg-[#DCE7E2] text-[#527064]",
                                        ].join(" ")}
                                    >
                                        {actualizando ===
                                            notificacion.id ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <BellRing className="h-4 w-4" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="line-clamp-1 text-sm font-bold text-[#24302C]">
                                                {
                                                    notificacion.titulo
                                                }
                                            </p>

                                            {!notificacion.leida && (
                                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C79AA1]" />
                                            )}
                                        </div>

                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6B756F]">
                                            {
                                                notificacion.mensaje
                                            }
                                        </p>

                                        <p className="mt-2 text-[10px] font-medium text-[#8A948F]">
                                            {formatearTiempoNotificacion(
                                                notificacion.fecha_registro,
                                            )}
                                        </p>
                                    </div>
                                </button>
                            ),
                        )}
                    </div>
                )}
            </div>

            <footer className="border-t border-[#E8ECE9] bg-[#FBFCFA] p-3">
                <button
                    type="button"
                    onClick={verTodas}
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#26332F] px-4 text-sm font-bold text-white transition hover:bg-[#33433D]"
                >
                    Ver todas las notificaciones
                </button>
            </footer>
        </section>
    );
}

function formatearTiempoNotificacion(fecha: string) {
    const fechaNotificacion = new Date(fecha);
    const ahora = new Date();
    const diferencia =
        ahora.getTime() -
        fechaNotificacion.getTime();

    const minutos = Math.floor(
        diferencia / (1000 * 60),
    );
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 1) {
        return "Ahora";
    }

    if (minutos < 60) {
        return `Hace ${minutos} min`;
    }

    if (horas < 24) {
        return `Hace ${horas} h`;
    }

    if (dias < 7) {
        return `Hace ${dias} día${dias === 1 ? "" : "s"}`;
    }

    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Managua",
    }).format(fechaNotificacion);
}

function ElementoNavegacion({
    elemento,
    activo,
    alNavegar,
}: {
    elemento: ElementoMenu;
    activo: boolean;
    alNavegar: () => void;
}) {
    const Icono = elemento.icono;

    if (!elemento.href) {
        return (
            <div
                title="Este módulo se agregará próximamente"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-[#789087] opacity-65"
            >
                <Icono className="h-5 w-5 shrink-0" />

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                        {elemento.nombre}
                    </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#8FA39A]">
                    Pronto
                </span>
            </div>
        );
    }

    return (
        <Link
            href={elemento.href}
            onClick={alNavegar}
            className={[
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                activo
                    ? "bg-[#DCE7E2] text-[#26332F] shadow-sm"
                    : "text-[#C6D2CC] hover:bg-white/[0.07] hover:text-white",
            ].join(" ")}
        >
            {activo && (
                <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#6F8F83]" />
            )}

            <Icono
                className={[
                    "h-5 w-5 shrink-0 transition-colors",
                    activo
                        ? "text-[#527064]"
                        : "text-[#82968D] group-hover:text-[#DCE7E2]",
                ].join(" ")}
            />

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                    {elemento.nombre}
                </p>
            </div>

            {activo && (
                <ChevronRight className="h-4 w-4 text-[#6F8F83]" />
            )}
        </Link>
    );
}

function AccesoMovil({
    href,
    nombre,
    icono: Icono,
    activo,
}: {
    href?: string;
    nombre: string;
    icono: React.ComponentType<{ className?: string }>;
    activo: boolean;
}) {
    if (!href) {
        return (
            <button
                type="button"
                disabled
                className="flex cursor-not-allowed flex-col items-center justify-center gap-1 text-[#A6AEA9]"
            >
                <Icono className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{nombre}</span>
            </button>
        );
    }

    return (
        <Link
            href={href}
            className={[
                "relative flex flex-col items-center justify-center gap-1",
                activo ? "text-[#527064]" : "text-[#6B756F]",
            ].join(" ")}
        >
            {activo && (
                <span className="absolute top-0 h-1 w-8 rounded-b-full bg-[#6F8F83]" />
            )}

            <Icono className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{nombre}</span>
        </Link>
    );
}

function obtenerIniciales(nombre: string) {
    const partes = nombre
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (partes.length === 0) return "US";

    return partes
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
}

function formatearRol(rol: RolUsuario) {
    const nombres: Record<RolUsuario, string> = {
        SUPER_ADMIN: "Superadministrador",
        ADMIN: "Administrador",
        RECEPCION: "Recepción",
        CAJA: "Caja",
        TRABAJADOR: "Trabajador",
        INVENTARIO: "Inventario",
    };

    return nombres[rol];
}

function obtenerInformacionRuta(pathname: string) {
    if (pathname.startsWith("/inicio")) {
        return {
            titulo: "Inicio",
            descripcion: "Resumen general de la actividad del salón",
        };

    }
    if (pathname.startsWith("/notificaciones")) {
        return {
            titulo: "Notificaciones",
            descripcion:
                "Avisos, recordatorios y seguimiento de citas",
        };
    }
    if (pathname === "/agenda/nueva") {
        return {
            titulo: "Nueva cita",
            descripcion:
                "Cliente, servicios, trabajadores y disponibilidad",
        };
    }
    if (
        pathname.startsWith("/agenda/") &&
        pathname !== "/agenda/nueva"
    ) {
        return {
            titulo: "Detalle de cita",
            descripcion:
                "Servicios, estado, historial y administración",
        };
    }
    if (pathname.startsWith("/agenda")) {
        return {
            titulo: "Agenda",
            descripcion: "Citas y disponibilidad del personal",
        };
    }

    if (
        pathname.startsWith("/clientes/") &&
        pathname !== "/clientes"
    ) {
        return {
            titulo: "Perfil del cliente",
            descripcion:
                "Ficha de belleza, fórmulas, notas e historial",
        };
    }

    if (pathname.startsWith("/clientes")) {
        return {
            titulo: "Clientes",
            descripcion: "Perfiles, preferencias e historial",
        };
    }
    if (
        pathname.startsWith("/trabajadores/") &&
        pathname.endsWith("/horarios")
    ) {
        return {
            titulo: "Horario del trabajador",
            descripcion:
                "Días laborales, horas de atención y descansos",
        };
    }
    if (pathname.startsWith("/trabajadores")) {
        return {
            titulo: "Trabajadores",
            descripcion: "Personal, horarios y comisiones",
        };
    }

    if (pathname.startsWith("/servicios")) {
        return {
            titulo: "Servicios",
            descripcion: "Catálogo, precios y duración",
        };
    }

    if (pathname.startsWith("/cuentas-cobrar/abonos")) {
        return {
            titulo: "Historial de abonos",
            descripcion:
                "Pagos recibidos, métodos y movimientos de cuentas por cobrar",
        };
    }

    if (pathname.startsWith("/cuentas-cobrar/reportes")) {
        return {
            titulo: "Reportes de cuentas por cobrar",
            descripcion:
                "Cartera pendiente, vencimientos y recuperación",
        };
    }

    if (
        pathname.includes("/abonar/") &&
        pathname.startsWith("/cuentas-cobrar/")
    ) {
        return {
            titulo: "Registrar abono",
            descripcion:
                "Recibir pagos y reducir el saldo pendiente del cliente",
        };
    }

    if (
        pathname.startsWith("/cuentas-cobrar/") &&
        pathname !== "/cuentas-cobrar"
    ) {
        return {
            titulo: "Estado de cuenta",
            descripcion:
                "Deudas, abonos y saldo del cliente",
        };
    }

    if (pathname.startsWith("/cuentas-cobrar")) {
        return {
            titulo: "Cuentas por cobrar",
            descripcion:
                "Saldos pendientes, abonos y seguimiento de clientes",
        };
    }

    if (pathname.startsWith("/inventario/catalogo/nuevo")) {
        return {
            titulo: "Nuevo producto",
            descripcion:
                "Registrar un producto en el catálogo de inventario",
        };
    }

    if (
        pathname.includes("/editar") &&
        pathname.startsWith("/inventario/catalogo/")
    ) {
        return {
            titulo: "Editar producto",
            descripcion:
                "Actualizar información y configuración del producto",
        };
    }

    if (pathname.startsWith("/inventario/catalogo")) {
        return {
            titulo: "Catálogo de inventario",
            descripcion:
                "Categorías, productos, precios y configuración",
        };
    }

    if (pathname.startsWith("/inventario/movimientos/nuevo")) {
        return {
            titulo: "Entrada / ajuste de stock",
            descripcion:
                "Registrar carga inicial, ajustes y mermas",
        };
    }

    if (pathname.startsWith("/inventario/movimientos")) {
        return {
            titulo: "Movimientos de inventario",
            descripcion:
                "Historial completo de entradas y salidas de stock",
        };
    }

    if (pathname.startsWith("/inventario/alertas")) {
        return {
            titulo: "Alertas de inventario",
            descripcion:
                "Productos con stock bajo o agotado",
        };
    }

    if (pathname.startsWith("/inventario/traslados")) {
        return {
            titulo: "Traslados de inventario",
            descripcion:
                "Movimientos de existencias entre sucursales",
        };
    }

    if (pathname.startsWith("/inventario")) {
        return {
            titulo: "Inventario",
            descripcion:
                "Productos, existencias, alertas y movimientos",
        };
    }

    if (pathname.startsWith("/caja/venta-productos")) {
        return {
            titulo: "Venta de productos",
            descripcion:
                "Venta directa de productos del inventario",
        };
    }

    if (pathname.startsWith("/caja")) {
        return {
            titulo: "Caja y ventas",
            descripcion: "Cobros y movimientos del negocio",
        };
    }

    if (pathname.startsWith("/inventario")) {
        return {
            titulo: "Inventario",
            descripcion: "Productos, insumos y existencias",
        };
    }

    if (pathname.startsWith("/compras/proveedores")) {
        return {
            titulo: "Proveedores",
            descripcion:
                "Directorio, contactos y condiciones comerciales",
        };
    }

    if (pathname.startsWith("/compras/historial")) {
        return {
            titulo: "Historial de compras",
            descripcion:
                "Compras, proveedores, estados y movimientos de abastecimiento",
        };
    }

    if (pathname.startsWith("/compras/cuentas-pagar")) {
        return {
            titulo: "Cuentas por pagar",
            descripcion:
                "Deudas, vencimientos y saldos con proveedores",
        };
    }

    if (pathname.startsWith("/compras")) {
        return {
            titulo: "Compras",
            descripcion:
                "Proveedores, compras y abastecimiento de inventario",
        };
    }

    if (pathname.startsWith("/finanzas/ingresos/nuevo")) {
        return {
            titulo: "Registrar ingreso",
            descripcion:
                "Agregar una entrada manual al control financiero",
        };
    }

    if (pathname.startsWith("/finanzas/gastos/nuevo")) {
        return {
            titulo: "Registrar gasto",
            descripcion:
                "Agregar una salida manual al control financiero",
        };
    }

    if (pathname.startsWith("/finanzas/resumen")) {
        return {
            titulo: "Resumen mensual",
            descripcion:
                "Utilidad, margen y comportamiento financiero del negocio",
        };
    }

    if (pathname.startsWith("/finanzas/historial")) {
        return {
            titulo: "Historial financiero",
            descripcion:
                "Ingresos, gastos, filtros y movimientos del negocio",
        };
    }

    if (pathname.startsWith("/finanzas/categorias")) {
        return {
            titulo: "Categorías financieras",
            descripcion:
                "Organización de ingresos y gastos del salón",
        };
    }

    if (pathname.startsWith("/finanzas")) {
        return {
            titulo: "Ingresos y gastos",
            descripcion:
                "Resumen financiero, movimientos y comportamiento del negocio",
        };
    }

    if (pathname.startsWith("/reportes/comparativos")) {
        return {
            titulo: "Comparativos",
            descripcion:
                "Comparación de resultados entre dos periodos",
        };
    }

    if (pathname.startsWith("/reportes/compras-proveedores")) {
        return {
            titulo: "Compras y proveedores",
            descripcion:
                "Compras, pagos, saldos y análisis de proveedores",
        };
    }

    if (pathname.startsWith("/reportes/inventario")) {
        return {
            titulo: "Reporte de inventario",
            descripcion:
                "Stock, alertas y valoración del inventario",
        };
    }

    if (pathname.startsWith("/reportes/clientes")) {
        return {
            titulo: "Reporte de clientes",
            descripcion:
                "Frecuencia, compras, pagos y saldos de clientes",
        };
    }

    if (pathname.startsWith("/reportes/citas-servicios")) {
        return {
            titulo: "Citas y servicios",
            descripcion:
                "Estados, servicios realizados y actividad del personal",
        };
    }

    if (pathname.startsWith("/reportes/financiero")) {
        return {
            titulo: "Reporte financiero",
            descripcion:
                "Ingresos, gastos, utilidad y análisis financiero",
        };
    }

    if (pathname.startsWith("/reportes/ventas")) {
        return {
            titulo: "Reporte de ventas",
            descripcion:
                "Ventas, cobros, saldos, tipos y métodos de pago",
        };
    }

    if (pathname.startsWith("/reportes")) {
        return {
            titulo: "Reportes",
            descripcion:
                "Resultados, análisis y control del negocio",
        };
    }

    if (pathname === "/usuarios/nuevo") {
        return {
            titulo: "Crear usuario",
            descripcion:
                "Nueva cuenta, rol, sucursal y acceso inicial",
        };
    }

    if (
        pathname.startsWith("/usuarios/") &&
        pathname.endsWith("/permisos")
    ) {
        return {
            titulo: "Permisos del usuario",
            descripcion:
                "Accesos personalizados por módulo y acción",
        };
    }

    if (
        pathname.startsWith("/usuarios/") &&
        pathname.endsWith("/editar")
    ) {
        return {
            titulo: "Editar usuario",
            descripcion:
                "Datos, rol, sucursal y estado de la cuenta",
        };
    }

    if (pathname.startsWith("/usuarios")) {
        return {
            titulo: "Usuarios y accesos",
            descripcion:
                "Cuentas, roles, sucursales y permisos del sistema",
        };
    }

    if (pathname.startsWith("/configuracion")) {
        return {
            titulo: "Configuración",
            descripcion: "Información y preferencias del salón",
        };
    }

    return {
        titulo: "Sistema del salón",
        descripcion: "Administración y control del negocio",
    };
}