import {
    createServerClient,
} from "@supabase/ssr";

import {
    cookies,
} from "next/headers";

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

export async function createClient() {
    const cookieStore =
        await cookies();

    const {
        url,
        key,
    } =
        obtenerConfiguracionSupabase();

    return createServerClient(
        url,
        key,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },

                setAll(
                    cookiesToSet,
                ) {
                    try {
                        cookiesToSet.forEach(
                            ({
                                name,
                                value,
                                options,
                            }) => {
                                cookieStore.set(
                                    name,
                                    value,
                                    options,
                                );
                            },
                        );
                    } catch {
                        /*
                         * Puede ejecutarse desde un Server Component
                         * donde modificar cookies no está permitido.
                         *
                         * El proxy mantiene actualizada la sesión.
                         */
                    }
                },
            },
        },
    );
}
