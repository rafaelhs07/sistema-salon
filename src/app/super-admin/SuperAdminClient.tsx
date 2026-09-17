"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Building2, ShieldCheck, CreditCard, UsersRound, Plus, Search, ArrowLeft, LogOut, X, CircleCheck, CircleAlert, LoaderCircle, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { estadoSuscripcion, ROLES_NEGOCIO, type Negocio, type Pago, type Resultado, type Suscripcion, type UsuarioPlataforma } from "@/lib/plataforma/modelo";
import { cambiarUsuario, crearNegocio, crearUsuarioPlataforma, guardarAcceso, registrarPago } from "./actions";

type Props = {
  negocios: Negocio[]; suscripciones: Suscripcion[]; usuarios: UsuarioPlataforma[]; pagos: Pago[];
  sucursales: { id: string; salon_id: string; nombre: string }[]; hoy: string;
};
type Dialogo = "negocio" | "acceso" | "pago" | "usuario" | null;
const control = "mt-1.5 w-full rounded-xl border border-[#DCE5E0] bg-[#F8FAF8] px-3 py-2.5 text-sm text-[#26332F] outline-none focus:border-[#6F8F83] focus:ring-2 focus:ring-[#DCE7E2]";
const primario = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#26332F] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#43524B] disabled:opacity-50";
const secundario = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5E0] bg-white px-4 py-2.5 text-sm font-bold text-[#43524B] hover:bg-[#F1F5F2] disabled:opacity-50";
function dinero(valor: number, moneda: string) { return new Intl.NumberFormat("es-NI", { style: "currency", currency: moneda }).format(valor); }
function fecha(valor: string | null) { return valor ? new Date(`${valor}T12:00:00Z`).toLocaleDateString("es-NI", { timeZone: "UTC" }) : "Sin vencimiento"; }
function Campo({ titulo, children }: { titulo: string; children: ReactNode }) { return <label className="block text-sm font-semibold text-[#43524B]">{titulo}{children}</label>; }
function Etiqueta({ estado }: { estado: string }) {
  const activa = estado === "ACTIVO";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${activa ? "bg-[#E7F1EA] text-[#3B7054]" : "bg-[#F9EAEA] text-[#95595F]"}`}>{estado === "ACTIVO" ? "Activo" : estado === "VENCIDO" ? "Vencido" : estado === "SUSPENDIDO" ? "Suspendido" : estado === "INACTIVO" ? "Inactivo" : estado}</span>;
}

export default function SuperAdminClient({ negocios, suscripciones, usuarios, pagos, sucursales, hoy }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [seleccion, setSeleccion] = useState(negocios[0]?.id ?? "");
  const [tab, setTab] = useState<"resumen" | "pagos" | "usuarios">("resumen");
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [aviso, setAviso] = useState<Resultado | null>(null);
  const [pendiente, iniciar] = useTransition();
  const ocupado = useRef(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [pagoId, setPagoId] = useState("");
  const [usuarioObjetivo, setUsuarioObjetivo] = useState<UsuarioPlataforma | null>(null);
  const [operacionUsuario, setOperacionUsuario] = useState("DESACTIVAR");
  const [estadoAcceso, setEstadoAcceso] = useState("ACTIVO");
  const negocio = negocios.find(n => n.id === seleccion);
  const suscripcion = suscripciones.find(s => s.salon_id === seleccion);
  const usuariosNegocio = usuarios.filter(u => u.salon_id === seleccion);
  const pagosNegocio = pagos.filter(p => p.salon_id === seleccion).sort((a, b) => b.fecha_pago.localeCompare(a.fecha_pago));
  const estado = estadoSuscripcion(suscripcion, hoy);
  const visibles = negocios.filter(n => {
    const s = suscripciones.find(s => s.salon_id === n.id);
    return `${n.nombre} ${n.correo ?? ""}`.toLowerCase().includes(busqueda.toLowerCase()) && (filtro === "TODOS" || estadoSuscripcion(s, hoy) === filtro);
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const activos = suscripciones.filter(s => estadoSuscripcion(s, hoy) === "ACTIVO").length;
  const vencidos = suscripciones.filter(s => estadoSuscripcion(s, hoy) === "VENCIDO").length;
  const suspendidos = suscripciones.filter(s => s.estado === "SUSPENDIDO").length;
  const cobrosMes = pagos.filter(p => p.fecha_pago.slice(0, 7) === hoy.slice(0, 7));
  const totales = ["NIO", "USD"].map(m => dinero(cobrosMes.filter(p => p.moneda === m).reduce((a, p) => a + Number(p.monto), 0), m));

  function abrir(tipo: Dialogo) {
    setAviso(null);
    setEstadoAcceso(suscripcion?.estado ?? "ACTIVO");
    if (tipo === "pago") setPagoId(crypto.randomUUID());
    setDialogo(tipo);
  }
  function enviar(accion: (form: FormData) => Promise<Resultado>, datos: FormData) {
    if (ocupado.current) return;
    ocupado.current = true;
    setAviso(null);
    iniciar(async () => {
      try {
        const resultado = await accion(datos);
        setAviso(resultado);
        if (resultado.exito) { setDialogo(null); setUsuarioObjetivo(null); router.refresh(); }
      } catch { setAviso({ exito: false, mensaje: "No se recibió la respuesta. Comprueba la conexión antes de reintentar." }); }
      finally { ocupado.current = false; }
    });
  }
  const modal = dialogo !== null || usuarioObjetivo !== null;
  useEffect(() => {
    if (!modal) return;
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function mantenerFoco(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const elementos = modalRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not([type='hidden']):not(:disabled), select:not(:disabled), textarea:not(:disabled)");
      if (!elementos?.length) return;
      const primero = elementos[0], ultimo = elementos[elementos.length - 1];
      if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo.focus(); }
      else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero.focus(); }
    }
    document.addEventListener("keydown", mantenerFoco);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", mantenerFoco); previo?.focus(); };
  }, [modal]);
  const tituloModal = usuarioObjetivo ? (operacionUsuario === "ELIMINAR" ? "Eliminar cuenta de acceso" : operacionUsuario === "ACTIVAR" ? "Activar usuario" : "Desactivar usuario") : ({ negocio: "Crear nuevo negocio", acceso: "Administrar acceso", pago: "Registrar pago", usuario: "Crear usuario" }[dialogo ?? "negocio"]);
  const avisoVista = aviso && <div role={aviso.exito ? "status" : "alert"} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${aviso.exito ? "border-[#C5DDCE] bg-[#EDF6EF] text-[#365B43]" : "border-[#E9CACA] bg-[#F9EAEA] text-[#95595F]"}`}>{aviso.exito ? <CircleCheck className="h-5 w-5 shrink-0" /> : <CircleAlert className="h-5 w-5 shrink-0" />}{aviso.mensaje}</div>;

  return <main className="min-h-screen bg-[#F4F7F4] text-[#26332F]">
    <header className="border-b border-[#DCE5E0] bg-white"><div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-10">
      <div className="flex items-center gap-3"><span className="rounded-2xl bg-[#26332F] p-3 text-[#DCE7E2]"><ShieldCheck className="h-6 w-6" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6F8F83]">Administración de plataforma</p><p className="text-lg font-extrabold">SUPER_ADMIN</p></div></div>
      <div className="flex gap-2"><Link href="/inicio" className={secundario}><ArrowLeft className="h-4 w-4" />Mi salón</Link><button className={secundario} onClick={async () => { const { error } = await createClient().auth.signOut(); if (!error) { router.replace("/login"); router.refresh(); } else setAviso({ exito: false, mensaje: "No se pudo cerrar sesión." }); }}><LogOut className="h-4 w-4" />Salir</button></div>
    </div></header>
    <div className="mx-auto max-w-[1500px] space-y-6 px-5 py-7 lg:px-10">
      <section className="relative overflow-hidden rounded-[28px] bg-[#26332F] p-7 text-white lg:p-9"><div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full bg-[#6F8F83]/20" /><div className="relative flex flex-wrap items-center justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B7CDC2]">Tus negocios, en un solo lugar</p><h1 className="mt-3 text-3xl font-extrabold lg:text-4xl">Control de salones</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#C4D2CB]">Administra suscripciones, registra pagos y decide quién tiene acceso al sistema.</p></div><button onClick={() => abrir("negocio")} className="inline-flex items-center gap-2 rounded-xl bg-[#DCE7E2] px-5 py-3 font-bold text-[#26332F]"><Plus className="h-5 w-5" />Nuevo negocio</button></div></section>
      {!modal && avisoVista}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de plataforma">
        {[["Negocios activos", String(activos), `${negocios.length} negocios registrados`], ["Suscripciones vencidas", String(vencidos), "Requieren renovación"], ["Accesos suspendidos", String(suspendidos), "Bloqueados manualmente"], ["Cobros de este mes", totales[0], totales[1]]].map(([titulo, valor, nota]) => <article key={titulo} className="rounded-2xl border border-[#DCE5E0] bg-white p-5"><p className="text-sm font-semibold text-[#718078]">{titulo}</p><p className="mt-2 text-2xl font-extrabold">{valor}</p><p className="mt-1 text-xs text-[#718078]">{nota}</p></article>)}
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#DCE5E0] bg-white p-5"><h2 className="font-extrabold">Negocios <span className="ml-2 text-sm text-[#718078]">{negocios.length}</span></h2>
          <label className="relative mt-4 block"><span className="sr-only">Buscar negocio</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-[#718078]" /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar negocio o correo" className={`${control} mt-0 pl-9`} /></label>
          <label className="mt-3 block"><span className="sr-only">Filtrar por estado</span><select value={filtro} onChange={e => setFiltro(e.target.value)} className={control}><option value="TODOS">Todos los estados</option><option value="ACTIVO">Activos</option><option value="VENCIDO">Vencidos</option><option value="SUSPENDIDO">Suspendidos</option></select></label>
          <div className="mt-4 max-h-[650px] space-y-2 overflow-y-auto">{visibles.map(n => <button key={n.id} onClick={() => { setSeleccion(n.id); setAviso(null); }} aria-pressed={seleccion === n.id} className={`w-full rounded-xl border p-4 text-left transition ${seleccion === n.id ? "border-[#6F8F83] bg-[#EDF3EE]" : "border-transparent hover:bg-[#F4F7F4]"}`}><span className="block font-bold">{n.nombre}</span><span className="mb-3 mt-1 block truncate text-xs text-[#718078]">{n.correo || "Sin correo de contacto"}</span><Etiqueta estado={estadoSuscripcion(suscripciones.find(s => s.salon_id === n.id), hoy)} /></button>)}{visibles.length === 0 && <p className="py-8 text-center text-sm text-[#718078]">No se encontraron negocios.</p>}</div>
        </aside>
        {negocio ? <section className="min-w-0 overflow-hidden rounded-2xl border border-[#DCE5E0] bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E6ECE8] p-6"><div><div className="flex items-center gap-3"><Building2 className="h-6 w-6 text-[#6F8F83]" /><h2 className="text-xl font-extrabold">{negocio.nombre}</h2></div><p className="mt-2 text-sm text-[#718078]">{negocio.correo || "Sin correo"} · {negocio.telefono || "Sin teléfono"}</p></div><Etiqueta estado={estado} /></div>
          <div className="flex gap-1 overflow-x-auto border-b border-[#E6ECE8] px-5 pt-3" role="tablist" aria-label="Administrar negocio">{([ ["resumen", "Suscripción", ShieldCheck], ["pagos", "Pagos", CreditCard], ["usuarios", "Usuarios", UsersRound] ] as const).map(([clave, titulo, Icono]) => <button key={clave} role="tab" aria-selected={tab === clave} onClick={() => setTab(clave)} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === clave ? "border-[#6F8F83] text-[#26332F]" : "border-transparent text-[#718078]"}`}><Icono className="h-4 w-4" />{titulo}</button>)}</div>
          <div className="p-6" role="tabpanel">
            {tab === "resumen" && <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3">{[["Cuota acordada", suscripcion ? dinero(Number(suscripcion.cuota), suscripcion.moneda) : "Pendiente"], ["Acceso hasta", fecha(suscripcion?.vence_el ?? null)], ["Usuarios activos", String(usuariosNegocio.filter(u => u.estado === "ACTIVO" && !u.eliminado_en).length)]].map(([titulo, valor]) => <div key={titulo} className="rounded-xl bg-[#F5F8F5] p-4"><p className="text-xs font-semibold text-[#718078]">{titulo}</p><p className="mt-2 font-extrabold">{valor}</p></div>)}</div>
              <div className="rounded-xl border border-[#DCE5E0] p-5"><h3 className="flex items-center gap-2 font-bold"><LockKeyhole className="h-4 w-4 text-[#6F8F83]" />Estado de acceso</h3><p className="mt-2 text-sm leading-relaxed text-[#718078]">{estado === "ACTIVO" ? "Los usuarios activos de este negocio pueden ingresar. El vencimiento incluye el día indicado, según la hora de Nicaragua." : "Los usuarios de este negocio tienen bloqueado el acceso a sus operaciones."}</p>{suscripcion?.motivo && <p className="mt-3 text-sm font-semibold">Motivo: {suscripcion.motivo}</p>}</div>
              <div className="flex flex-wrap gap-3"><button className={primario} onClick={() => abrir("pago")} disabled={!suscripcion}><CreditCard className="h-4 w-4" />Registrar pago</button><button className={secundario} onClick={() => abrir("acceso")} disabled={!suscripcion}><ShieldCheck className="h-4 w-4" />Dar / quitar acceso</button><button className={secundario} onClick={() => abrir("usuario")}><Plus className="h-4 w-4" />Crear usuario</button></div>
            </div>}
            {tab === "pagos" && <div><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">Historial de pagos</h3><p className="mt-1 text-xs text-[#718078]">Pagos por uso del sistema, separados de las ventas del salón.</p></div><button className={primario} onClick={() => abrir("pago")} disabled={!suscripcion}><Plus className="h-4 w-4" />Registrar pago</button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#F4F7F4] text-xs text-[#718078]"><tr>{["Fecha", "Importe", "Cobertura", "Método / referencia"].map(t => <th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>{pagosNegocio.map(p => <tr key={p.id} className="border-b border-[#E6ECE8]"><td className="whitespace-nowrap p-3">{fecha(p.fecha_pago)}</td><td className="whitespace-nowrap p-3 font-bold">{dinero(Number(p.monto), p.moneda)}</td><td className="p-3 text-xs">{fecha(p.periodo_desde)} – {fecha(p.periodo_hasta)}</td><td className="p-3 text-xs"><p>{p.metodo}</p><p className="mt-1 text-[#718078]">{p.referencia || "Sin referencia"}</p>{p.notas && <p className="mt-1">{p.notas}</p>}</td></tr>)}</tbody></table>{!pagosNegocio.length && <p className="py-12 text-center text-sm text-[#718078]">Este negocio todavía no tiene pagos registrados.</p>}</div></div>}
            {tab === "usuarios" && <div><div className="mb-5 flex items-center justify-between gap-3"><h3 className="font-bold">Usuarios del negocio</h3><button className={primario} onClick={() => abrir("usuario")}><Plus className="h-4 w-4" />Crear usuario</button></div><div className="space-y-3">{usuariosNegocio.map(u => <article key={u.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCE5E0] p-4"><div className="min-w-0"><p className="font-bold">{u.nombre_completo || "Usuario"}</p><p className="break-all text-sm text-[#718078]">{u.correo}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs font-semibold">{u.rol}</span><Etiqueta estado={u.eliminado_en ? "ELIMINADO" : u.estado} /></div></div>{u.rol !== "SUPER_ADMIN" && <div className="flex flex-wrap gap-2">{!u.eliminado_en && <button disabled={pendiente} className={secundario} onClick={() => { setAviso(null); setUsuarioObjetivo(u); setOperacionUsuario(u.estado === "ACTIVO" ? "DESACTIVAR" : "ACTIVAR"); }}>{u.estado === "ACTIVO" ? "Desactivar" : "Activar"}</button>}<button disabled={pendiente} className="rounded-xl px-3 py-2 text-sm font-bold text-[#95595F] hover:bg-[#F9EAEA]" onClick={() => { setAviso(null); setUsuarioObjetivo(u); setOperacionUsuario("ELIMINAR"); }}>{u.eliminado_en ? "Reintentar eliminación" : "Eliminar"}</button></div>}</article>)}{!usuariosNegocio.length && <p className="py-10 text-center text-sm text-[#718078]">Crea el primer administrador de este negocio.</p>}</div></div>}
          </div>
        </section> : <section className="rounded-2xl border border-dashed border-[#BFCFC5] bg-white p-12 text-center"><Building2 className="mx-auto mb-4 h-10 w-10 text-[#6F8F83]" /><h2 className="text-xl font-bold">Agrega tu primer negocio</h2><p className="mt-2 text-sm text-[#718078]">Después podrás crear su administrador y registrar sus pagos.</p><button className={`${primario} mt-6`} onClick={() => abrir("negocio")}>Crear negocio</button></section>}
      </div>
      <p className="pb-5 text-center text-xs text-[#718078]">Acceso exclusivo del propietario · Fechas según Nicaragua · Los pagos se registran manualmente</p>
    </div>
    {modal && <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251F]/50 p-4 backdrop-blur-sm" onKeyDown={e => { if (e.key === "Escape" && !pendiente) { setDialogo(null); setUsuarioObjetivo(null); } }}><section role="dialog" aria-modal="true" aria-labelledby="titulo-modal" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between gap-3"><h2 id="titulo-modal" className="text-xl font-extrabold">{tituloModal}</h2><button autoFocus aria-label="Cerrar" disabled={pendiente} onClick={() => { setDialogo(null); setUsuarioObjetivo(null); }} className="rounded-lg p-2 hover:bg-[#F4F7F4]"><X className="h-5 w-5" /></button></div>
      {avisoVista}
      <form className="mt-4 space-y-4" action={datos => enviar(usuarioObjetivo ? cambiarUsuario : dialogo === "negocio" ? crearNegocio : dialogo === "acceso" ? guardarAcceso : dialogo === "pago" ? registrarPago : crearUsuarioPlataforma, datos)}>
        <fieldset disabled={pendiente} className="space-y-4">
          {dialogo !== "negocio" && <input type="hidden" name="salon_id" value={seleccion} />}
          {usuarioObjetivo ? <><input type="hidden" name="usuario_id" value={usuarioObjetivo.id} /><input type="hidden" name="operacion" value={operacionUsuario} /><p className="text-sm leading-relaxed text-[#718078]">{operacionUsuario === "ELIMINAR" ? "Se eliminará de forma irreversible la cuenta de acceso. El historial de operaciones del negocio se conservará." : operacionUsuario === "ACTIVAR" ? "El usuario podrá ingresar si la suscripción del negocio está activa." : "El usuario perderá el acceso al sistema, incluso con una sesión abierta."}</p><p className="break-all font-bold">{usuarioObjetivo.correo}</p>{operacionUsuario === "ELIMINAR" && <Campo titulo="Escribe el correo para confirmar"><input name="confirmacion" type="email" required autoComplete="off" className={control} /></Campo>}</> : <>
          {(dialogo === "negocio" || dialogo === "usuario") && <><Campo titulo={dialogo === "negocio" ? "Nombre del negocio" : "Nombre completo"}><input name="nombre" minLength={2} maxLength={150} required className={control} /></Campo><Campo titulo={dialogo === "negocio" ? "Correo de contacto (opcional)" : "Correo de acceso"}><input name="correo" type="email" required={dialogo === "usuario"} maxLength={254} className={control} /></Campo></>}
          {dialogo === "negocio" && <Campo titulo="Teléfono (opcional)"><input name="telefono" type="tel" maxLength={40} className={control} /></Campo>}
          {(dialogo === "negocio" || dialogo === "acceso") && <>
            {dialogo === "acceso" && <Campo titulo="Estado del acceso"><select name="estado" value={estadoAcceso} onChange={e => setEstadoAcceso(e.target.value)} className={control}><option value="ACTIVO">Dar acceso</option><option value="SUSPENDIDO">Suspender acceso</option></select></Campo>}
            <div className="grid grid-cols-2 gap-4"><Campo titulo="Cuota acordada"><input name="cuota" type="number" min="0" max="9999999999.99" step="0.01" required defaultValue={dialogo === "acceso" ? suscripcion?.cuota : ""} className={control} /></Campo><Campo titulo="Moneda"><select name="moneda" defaultValue={dialogo === "acceso" ? suscripcion?.moneda : "NIO"} className={control}><option value="NIO">NIO · Córdobas</option><option value="USD">USD · Dólares</option></select></Campo></div>
            <Campo titulo="Acceso vigente hasta"><input name="vence_el" type="date" required={dialogo === "negocio"} defaultValue={dialogo === "acceso" ? suscripcion?.vence_el ?? "" : ""} className={control} /></Campo>{dialogo === "acceso" && <><p className="text-xs text-[#718078]">Deja la fecha vacía solo si quieres dar acceso sin vencimiento.</p><Campo titulo="Motivo / observación"><textarea name="motivo" maxLength={500} required={estadoAcceso === "SUSPENDIDO"} defaultValue={suscripcion?.motivo ?? ""} rows={3} className={control} /></Campo></>}
          </>}
          {dialogo === "pago" && <><input type="hidden" name="id" value={pagoId} /><input type="hidden" name="moneda" value={suscripcion?.moneda ?? "NIO"} /><div className="grid grid-cols-2 gap-4"><Campo titulo={`Importe (${suscripcion?.moneda})`}><input name="monto" type="number" min="0.01" max="9999999999.99" step="0.01" required defaultValue={suscripcion?.cuota || ""} className={control} /></Campo><Campo titulo="Fecha del pago"><input name="fecha_pago" type="date" max={hoy} defaultValue={hoy} required className={control} /></Campo><Campo titulo="Período desde"><input name="periodo_desde" type="date" defaultValue={hoy} required className={control} /></Campo><Campo titulo="Período hasta"><input name="periodo_hasta" type="date" required className={control} /></Campo></div><Campo titulo="Método"><select name="metodo" className={control}><option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="OTRO">Otro</option></select></Campo><Campo titulo="Referencia (opcional)"><input name="referencia" maxLength={150} className={control} /></Campo><Campo titulo="Notas (opcional)"><textarea name="notas" maxLength={500} rows={2} className={control} /></Campo><label className="flex items-start gap-3 rounded-xl bg-[#EDF3EE] p-4 text-sm"><input type="checkbox" name="reactivar" defaultChecked className="mt-1" /><span><strong>Reactivar y renovar acceso</strong><br />Habilita el negocio y extiende el vencimiento hasta el final del período pagado.</span></label></>}
          {dialogo === "usuario" && <><Campo titulo="Contraseña inicial"><input name="contrasena" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={control} /></Campo><Campo titulo="Rol"><select name="rol" className={control}>{ROLES_NEGOCIO.map(r => <option key={r}>{r}</option>)}</select></Campo><Campo titulo="Sucursal"><select name="sucursal_id" required className={control}>{sucursales.filter(s => s.salon_id === seleccion).map(s => <option value={s.id} key={s.id}>{s.nombre}</option>)}</select></Campo><p className="text-xs text-[#718078]">La cuenta se crea directamente. Comparte el correo y la contraseña inicial con su titular.</p></>}
          </>}
          <div className="flex justify-end gap-3 border-t border-[#E6ECE8] pt-4"><button type="button" className={secundario} onClick={() => { setDialogo(null); setUsuarioObjetivo(null); }}>Cancelar</button><button type="submit" className={primario}>{pendiente && <LoaderCircle className="h-4 w-4 animate-spin" />}{pendiente ? "Guardando…" : usuarioObjetivo ? "Confirmar" : "Guardar"}</button></div>
        </fieldset>
      </form>
    </section></div>}
  </main>;
}
