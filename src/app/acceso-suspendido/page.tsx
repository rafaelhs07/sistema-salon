"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogOut, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AccesoSuspendidoPage() {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function comprobar() {
    setOcupado(true);
    const { data, error } = await createClient().rpc("plataforma_acceso_actual");
    if (!error && data === true) { router.replace("/"); router.refresh(); }
    else setMensaje("El acceso aún no está habilitado. Contacta al proveedor del sistema.");
    setOcupado(false);
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#F4F7F4] p-5"><section className="w-full max-w-lg rounded-3xl border border-[#DCE5E0] bg-white p-9 text-center text-[#26332F]"><LockKeyhole className="mx-auto h-12 w-12 text-[#6F8F83]" /><h1 className="mt-5 text-2xl font-extrabold">Acceso no disponible</h1><p className="mt-4 leading-relaxed text-[#718078]">Tu cuenta o la suscripción de tu negocio no está activa. Contacta al proveedor del sistema para revisar el pago o solicitar la reactivación.</p><p className="mt-3 text-sm text-[#718078]">La información del negocio se conserva.</p>{mensaje && <p role="status" className="mt-4 rounded-xl bg-[#EDF3EE] p-3 text-sm">{mensaje}</p>}<div className="mt-7 flex flex-wrap justify-center gap-3"><button disabled={ocupado} onClick={comprobar} className="flex items-center gap-2 rounded-xl bg-[#26332F] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><RefreshCw className="h-4 w-4" />Comprobar acceso</button><button disabled={ocupado} onClick={async () => { const { error } = await createClient().auth.signOut(); if (!error) { router.replace("/login"); router.refresh(); } else setMensaje("No se pudo cerrar sesión. Intenta nuevamente."); }} className="flex items-center gap-2 rounded-xl border border-[#DCE5E0] px-4 py-3 text-sm font-bold"><LogOut className="h-4 w-4" />Cerrar sesión</button></div></section></main>;
}
