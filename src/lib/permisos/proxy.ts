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

export async function proxy(
    request: NextRequest,
) {
    let response =
        NextResponse.next({
            request,
        });

    const supabase =
        createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
                            }) =>
                                request.cookies.set(
                                    name,
                                    value,
                                ),
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
                            }) =>
                                response.cookies.set(
                                    name,
                                    value,
                                    options,
                                ),
                        );
                    },
                },
            },
        );

    const {
        data: {
            user,
        },
    } =
        await supabase.auth.getUser();

    if (
        !user
    ) {
        const loginUrl =
            request.nextUrl.clone();

        loginUrl.pathname =
            "/login";

        loginUrl.searchParams.set(
            "redirect",
            request.nextUrl.pathname,
        );

        return NextResponse.redirect(
            loginUrl,
        );
    }

    const permiso =
        obtenerPermisoRuta(
            request.nextUrl.pathname,
        );

    if (
        !permiso
    ) {
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

    if (
        error ||
        permitido !==
        true
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
            request.nextUrl.pathname,
        );

        return NextResponse.redirect(
            sinAccesoUrl,
        );
    }

    return response;
}

export const config = {
    matcher: [
        "/inicio/:path*",
        "/notificaciones/:path*",
        "/agenda/:path*",
        "/clientes/:path*",
        "/trabajadores/:path*",
        "/servicios/:path*",
        "/caja/:path*",
        "/cuentas-cobrar/:path*",
        "/inventario/:path*",
        "/compras/:path*",
        "/finanzas/:path*",
        "/reportes/:path*",
        "/configuracion/:path*",
        "/usuarios/:path*",
    ],
};
