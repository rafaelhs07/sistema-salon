import "server-only";

import {
    createClient as createSupabaseClient,
} from "@supabase/supabase-js";

/**
 * Cliente administrativo de Supabase.
 *
 * IMPORTANTE:
 * - Solo debe importarse desde Server Actions / Server Components.
 * - Nunca importar este archivo en un componente "use client".
 * - SUPABASE_SERVICE_ROLE_KEY nunca debe usar prefijo NEXT_PUBLIC_.
 */
export function createAdminClient() {
    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        throw new Error(
            "Falta NEXT_PUBLIC_SUPABASE_URL.",
        );
    }

    if (!serviceRoleKey) {
        throw new Error(
            "Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor.",
        );
    }

    return createSupabaseClient(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        },
    );
}
