import {
    NextResponse,
    type NextRequest,
} from "next/server";

import {
    createServerClient,
} from "@supabase/ssr";

import {
    obtenerPermisoRuta,
} from "@/lib/permisos/rutas";

function obtenerConfiguracionSupabase() {
    const url =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

    const key =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url) {
        throw new Error(
            "Falta NEXT_PUBLIC_SUPABASE_URL en .env.local",
        );
    }

    if (!key) {
        throw new Error(
            "Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
        );
    }

    return {
        url,
        key,
    };
}

export async function proxy(
    request: NextRequest,
) {
    let response =
        NextResponse.next({
            request,
        });

    const {
        url,
        key,
    } =
        obtenerConfiguracionSupabase();

    const supabase =
        createServerClient(
            url,
            key,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },

                    setAll(
                        cookiesToSet,
                    ) {
                        cookiesToSet.forEach(
                            ({
                                name,
                                value,
                            }) => {
                                request.cookies.set(
                                    name,
                                    value,
                                );
                            },
                        );

                        response =
                            NextResponse.next({
                                request,
                            });

                        cookiesToSet.forEach(
                            ({
                                name,
                                value,
                                options,
                            }) => {
                                response.cookies.set(
                                    name,
                                    value,
                                    options,
                                );
                            },
                        );
                    },
                },
            },
        );

    const pathname =
        request.nextUrl.pathname;

    const rutasPublicas = [
        "/login",
        "/sin-acceso",
        "/acceso-suspendido",
    ];

    const esRutaPublica =
        rutasPublicas.some(
            (
                ruta,
            ) =>
                pathname === ruta ||
                pathname.startsWith(
                    `${ruta}/`,
                ),
        );

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();

    if (esRutaPublica) {
        return response;
    }

    if (!user) {
        const loginUrl =
            request.nextUrl.clone();

        loginUrl.pathname =
            "/login";

        loginUrl.searchParams.set(
            "redirect",
            pathname,
        );

        return NextResponse.redirect(
            loginUrl,
        );
    }

    // Comprobar en cada petición, incluidas las Server Actions de sesiones abiertas.
    const { data: accesoActivo, error: accesoError } = await supabase.rpc("plataforma_acceso_actual");
    function redirigir(destino: string) {
        const url = request.nextUrl.clone();
        url.pathname = destino;
        url.search = "";
        const redireccion = NextResponse.redirect(url);
        response.cookies.getAll().forEach(cookie => redireccion.cookies.set(cookie));
        return redireccion;
    }
    if (accesoError || accesoActivo !== true) return redirigir("/acceso-suspendido");
    if (pathname === "/super-admin" || pathname.startsWith("/super-admin/")) {
        const { data: esSuperAdmin, error } = await supabase.rpc("plataforma_es_super_admin");
        if (error || esSuperAdmin !== true) return redirigir("/sin-acceso");
        return response;
    }

    const permiso =
        obtenerPermisoRuta(
            pathname,
        );

    if (!permiso) {
        return response;
    }

    const {
        data: permitido,
        error,
    } =
        await supabase.rpc(
            "usuario_actual_tiene_permiso",
            {
                p_permiso:
                    permiso,
            },
        );

    if (error) {
        console.error(
            `Error validando permiso ${permiso}:`,
            error,
        );
    }

    if (
        error ||
        permitido !== true
    ) {
        const sinAccesoUrl =
            request.nextUrl.clone();

        sinAccesoUrl.pathname =
            "/sin-acceso";

        sinAccesoUrl.searchParams.set(
            "permiso",
            permiso,
        );

        sinAccesoUrl.searchParams.set(
            "ruta",
            pathname,
        );

        return NextResponse.redirect(
            sinAccesoUrl,
        );
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};