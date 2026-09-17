import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
    const supabase = await createClient();
    const { data } = await supabase.rpc("plataforma_es_super_admin");
    redirect(data === true ? "/super-admin" : "/inicio");
}
