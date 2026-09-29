import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Evento = {
    id: number;
    fecha: string;
    salon_id: string | null;
    usuario_id: string | null;
    usuario_nombre: string;
    usuario_rol: string | null;
    origen: string;
    tabla: string;
    accion: "INSERT" | "UPDATE" | "DELETE";
    registro_id: string | null;
    antes: Record<string, unknown> | null;
    despues: Record<string, unknown> | null;
    campos: string[];
};
const acciones = { INSERT: "Creación", UPDATE: "Modificación", DELETE: "Eliminación" };
const colores = { INSERT: "bg-emerald-50 text-emerald-800", UPDATE: "bg-amber-50 text-amber-800", DELETE: "bg-red-50 text-red-800" };
const TAMANO = 25;
const input = "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm";
function texto(valor: unknown): string {
    if (valor === undefined) return "— No existía —";
    if (valor === null) return "Sin valor";
    if (typeof valor === "boolean") return valor ? "Sí" : "No";
    if (typeof valor === "object") return JSON.stringify(valor, null, 2);
    return String(valor);
}
function etiqueta(valor: string) { return valor.replaceAll("_", " "); }
function fechaValida(valor: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor)) && new Date(valor).toISOString().slice(0, 10) === valor;
}

export default async function AuditoriaPage({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect("/login");
    const { data: perfil, error: perfilError } = await supabase.from("usuarios_perfiles")
        .select("salon_id, rol, estado").eq("id", user.id).single();
    if (perfilError || !perfil || perfil.estado !== "ACTIVO") redirect("/login");
    if (!["ADMIN", "SUPER_ADMIN"].includes(perfil.rol)) redirect("/inicio");
    const params = await searchParams;
    const obtener = (key: string) => typeof params[key] === "string" ? params[key].trim().slice(0, 150) : "";
    const tabla = obtener("tabla"), usuario = obtener("usuario"), registro = obtener("registro");
    const accion = obtener("accion"), desde = obtener("desde"), hasta = obtener("hasta");
    const pagina = Math.min(100000, Math.max(1, Number.parseInt(obtener("pagina"), 10) || 1));
    const fechaError = (desde && !fechaValida(desde)) || (hasta && !fechaValida(hasta)) || (desde && hasta && desde > hasta);
    let consulta = supabase.from("auditoria_eventos").select("*", { count: "exact" });
    if (perfil.rol !== "SUPER_ADMIN") consulta = consulta.eq("salon_id", perfil.salon_id);
    // Escapar comodines para que la búsqueda sea literal; sin construir expresiones .or().
    const patron = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
    if (tabla) consulta = consulta.ilike("tabla", patron(tabla));
    if (usuario) consulta = consulta.ilike("usuario_nombre", patron(usuario));
    if (registro) consulta = consulta.ilike("registro_id", patron(registro));
    if (["INSERT", "UPDATE", "DELETE"].includes(accion)) consulta = consulta.eq("accion", accion);
    if (desde && fechaValida(desde)) consulta = consulta.gte("fecha", `${desde}T00:00:00-06:00`);
    if (hasta && fechaValida(hasta)) {
        const limite = new Date(`${hasta}T00:00:00-06:00`);
        limite.setUTCDate(limite.getUTCDate() + 1);
        consulta = consulta.lt("fecha", limite.toISOString());
    }
    const resultado = fechaError ? null : await consulta.order("fecha", { ascending: false })
        .order("id", { ascending: false }).range((pagina - 1) * TAMANO, pagina * TAMANO - 1);
    const eventos = (resultado?.data ?? []) as Evento[];
    const total = resultado?.count ?? 0;
    const paginas = Math.max(1, Math.ceil(total / TAMANO));
    const sinInstalar = ["42P01", "PGRST205"].includes(resultado?.error?.code ?? "");
    const enlace = (numero: number) => {
        const query = new URLSearchParams();
        for (const key of ["tabla", "usuario", "registro", "accion", "desde", "hasta"]) {
            if (obtener(key)) query.set(key, obtener(key));
        }
        query.set("pagina", String(numero));
        return `/auditoria?${query}`;
    };
    const formatoFecha = new Intl.DateTimeFormat("es-NI", { dateStyle: "medium", timeStyle: "medium", timeZone: "America/Managua" });

    return <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-primary-soft p-3 text-primary-strong"><ClipboardList size={28} /></div>
                <div><p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Administración</p>
                    <h1 className="mt-1 text-3xl font-semibold">Auditoría del sistema</h1>
                    <p className="mt-1 text-sm text-text-secondary">Consulta quién cambió los datos y compara el antes y el después.</p></div>
            </div>
            <Link href={enlace(pagina)} className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium">Actualizar</Link>
        </header>
        <div className="rounded-2xl border border-border bg-primary-soft-2 p-4 text-sm text-text-secondary">
            {perfil.rol === "SUPER_ADMIN" ? "Vista de todos los salones, incluidos cambios globales o sin salón identificado." : "Historial de tu salón. Solo los administradores activos pueden consultarlo."}
            <span className="mt-1 block">Se registran creaciones, modificaciones y eliminaciones desde la activación de la auditoría. Horarios de Nicaragua.</span>
        </div>
        <form action="/auditoria" className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1 text-sm font-medium">Módulo / tabla<input className={input} name="tabla" defaultValue={tabla} placeholder="Ej. citas, clientes, ventas" maxLength={150} /></label>
            <label className="space-y-1 text-sm font-medium">Usuario<input className={input} name="usuario" defaultValue={usuario} placeholder="Nombre del responsable" maxLength={150} /></label>
            <label className="space-y-1 text-sm font-medium">Acción<select className={input} name="accion" defaultValue={accion}><option value="">Todas las acciones</option>{Object.entries(acciones).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label className="space-y-1 text-sm font-medium">ID del registro<input className={input} name="registro" defaultValue={registro} placeholder="Buscar registro afectado" maxLength={150} /></label>
            <label className="space-y-1 text-sm font-medium">Desde<input className={input} type="date" name="desde" defaultValue={desde} /></label>
            <label className="space-y-1 text-sm font-medium">Hasta<input className={input} type="date" name="hasta" defaultValue={hasta} /></label>
            <div className="flex items-end gap-3 sm:col-span-2"><button className="flex items-center gap-2 rounded-xl bg-primary-strong px-5 py-2.5 text-sm font-semibold text-white"><Search size={16} />Filtrar cambios</button><Link className="px-3 py-2.5 text-sm underline" href="/auditoria">Limpiar filtros</Link></div>
        </form>
        {fechaError ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">Revisa las fechas: el inicio debe ser anterior o igual al final.</p>
            : resultado?.error ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><h2 className="font-semibold">{sinInstalar ? "Auditoría pendiente de activación" : "No se pudo cargar el historial"}</h2><p className="mt-1 text-sm">{sinInstalar ? "Falta instalar la migración de auditoría en Supabase. Cuando esté activa, los cambios comenzarán a aparecer aquí." : "Vuelve a intentarlo. Si el problema continúa, revisa la instalación y los permisos de auditoría."}</p></div>
                : <section aria-label="Historial de cambios" className="space-y-3">
                    <div className="flex flex-wrap justify-between gap-2 text-sm text-text-secondary"><p><strong className="text-foreground">{total.toLocaleString("es-NI")}</strong> cambios encontrados</p><p>Página {pagina} de {paginas}</p></div>
                    {eventos.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center"><ClipboardList className="mx-auto mb-3 text-text-muted" size={32} /><h2 className="font-semibold">No hay cambios para mostrar</h2><p className="mt-2 text-sm text-text-secondary">Prueba otros filtros o realiza un cambio después de activar la auditoría.</p></div> : eventos.map(evento => <details key={evento.id} className="group overflow-hidden rounded-2xl border border-border bg-surface">
                        <summary className="cursor-pointer p-5 marker:text-primary-strong">
                            <span className={`ml-2 inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${colores[evento.accion]}`}>{acciones[evento.accion]}</span>
                            <span className="ml-3 font-semibold capitalize">{etiqueta(evento.tabla)}</span>
                            <span className="ml-3 text-xs text-text-muted">#{evento.id}</span>
                            <span className="mt-3 flex flex-wrap justify-between gap-2 text-sm"><span>{evento.usuario_nombre} <span className="text-text-muted">· {evento.usuario_rol ?? evento.origen}</span></span><time dateTime={evento.fecha} className="text-text-secondary">{formatoFecha.format(new Date(evento.fecha))}</time></span>
                            <span className="mt-2 block break-all text-xs text-text-muted">Registro: {evento.registro_id ?? "Sin clave primaria"} · {evento.campos.length} campos · Ver detalles</span>
                        </summary>
                        <div className="border-t border-border p-5">
                            <dl className="mb-4 grid gap-3 text-xs text-text-secondary sm:grid-cols-2"><div><dt className="font-semibold">ID de usuario</dt><dd className="break-all">{evento.usuario_id ?? "Operación sin usuario autenticado"}</dd></div><div><dt className="font-semibold">Origen</dt><dd>{evento.origen}</dd></div>{perfil.rol === "SUPER_ADMIN" && <div><dt className="font-semibold">Salón</dt><dd>{evento.salon_id ?? "Global / sin identificar"}</dd></div>}</dl>
                            <div className="overflow-x-auto"><table className="w-full table-fixed text-left text-sm"><caption className="mb-3 text-left text-xs text-text-muted">{evento.accion === "UPDATE" ? "Solo se muestran los campos modificados." : "Valores del registro en el momento de la operación."} Los valores protegidos no se almacenan.</caption><thead className="bg-surface-soft"><tr><th className="w-1/4 p-3">Campo</th><th className="p-3">Antes</th><th className="p-3">Después</th></tr></thead><tbody>{evento.campos.map(campo => <tr key={campo} className="border-b border-border last:border-0"><th scope="row" className="break-words p-3 align-top font-medium capitalize">{etiqueta(campo)}</th><td className="whitespace-pre-wrap break-words p-3 align-top text-text-secondary">{texto(evento.antes?.[campo])}</td><td className="whitespace-pre-wrap break-words p-3 align-top">{texto(evento.despues?.[campo])}</td></tr>)}</tbody></table></div>
                        </div>
                    </details>)}
                    <nav aria-label="Paginación" className="flex items-center justify-end gap-3 py-3">{pagina > 1 && <Link className="rounded-xl border border-border bg-surface px-4 py-2 text-sm" href={enlace(pagina - 1)}>Anterior</Link>}{pagina < paginas && <Link className="rounded-xl bg-primary-strong px-4 py-2 text-sm text-white" href={enlace(pagina + 1)}>Siguiente</Link>}</nav>
                </section>}
    </div>;
}
