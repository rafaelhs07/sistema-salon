import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Revalida contra la BD en cada petición; nunca confía en metadata del navegador. */
export async function exigirSuperAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Inicia sesión para continuar.");
  const { data: permitido, error: permisoError } = await supabase.rpc("plataforma_es_super_admin");
  if (permisoError || permitido !== true) throw new Error("Esta operación es exclusiva del SUPER_ADMIN activo.");
  // La clave administrativa se utiliza únicamente después de autorizar al actor.
  return { admin: createAdminClient(), actorId: user.id };
}
