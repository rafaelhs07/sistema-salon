import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function actualizarSesion(request: NextRequest) {
    let response = NextResponse.next({
        request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
        throw new Error(
            "Faltan las variables de entorno de Supabase en .env.local",
        );
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabasePublishableKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },

                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value);
                    });

                    response = NextResponse.next({
                        request,
                    });

                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        },
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    const esRutaPublica =
        pathname === "/login" ||
        pathname.startsWith("/auth");

    if (!user && !esRutaPublica) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (user && pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/inicio";
        return NextResponse.redirect(url);
    }

    return response;
}