import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exigirSuperAdmin } from "@/lib/plataforma/server";
import { fechaNegocio, type Negocio, type Pago, type Suscripcion, type UsuarioPlataforma } from "@/lib/plataforma/modelo";
import SuperAdminClient from "./SuperAdminClient";

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: perfil } = await supabase.from("usuarios_perfiles").select("rol,estado").eq("id", user.id).maybeSingle();
  if (perfil?.rol !== "SUPER_ADMIN" || perfil.estado !== "ACTIVO") redirect("/sin-acceso");

  let contenido: React.ComponentProps<typeof SuperAdminClient> | null = null;
  try {
    const { admin } = await exigirSuperAdmin();
    async function todos<T>(tabla: string, columnas: string, orden: string): Promise<T[]> {
      const filas: T[] = [];
      for (let desde = 0; ; desde += 500) {
        const { data, error } = await admin.from(tabla).select(columnas).order(orden).range(desde, desde + 499);
        if (error) throw new Error(`No se pudo leer ${tabla}: ${error.message}`);
        filas.push(...(data as unknown as T[]));
        if (data.length < 500) return filas;
      }
    }
    const [negocios, suscripciones, usuarios, pagos, sucursales] = await Promise.all([
      todos<Negocio>("salones", "id,nombre,correo,telefono", "id"),
      todos<Suscripcion>("plataforma_suscripciones", "salon_id,estado,vence_el,cuota,moneda,motivo", "salon_id"),
      todos<UsuarioPlataforma>("usuarios_perfiles", "id,salon_id,nombre_completo,correo,rol,estado,eliminado_en", "id"),
      todos<Pago>("plataforma_pagos", "id,salon_id,monto,moneda,periodo_desde,periodo_hasta,fecha_pago,metodo,referencia,notas", "id"),
      todos<{ id: string; salon_id: string; nombre: string }>("sucursales", "id,salon_id,nombre", "id"),
    ]);
    contenido = { negocios, suscripciones, usuarios, pagos, sucursales, hoy: fechaNegocio() };
  } catch (error) {
    console.error("Panel SUPER_ADMIN:", error);
  }
  if (!contenido) {
    return <main className="mx-auto max-w-2xl p-8"><h1 className="text-2xl font-bold">Panel SUPER_ADMIN</h1><p className="mt-4">No se pudo cargar la administración. Comprueba que ejecutaste la migración de la plataforma y que SUPABASE_SERVICE_ROLE_KEY está configurada en el servidor.</p><a className="mt-6 inline-block underline" href="/inicio">Volver al sistema</a></main>;
  }
  return <SuperAdminClient {...contenido} />;
}
