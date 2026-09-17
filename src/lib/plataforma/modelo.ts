export type Suscripcion = {
  salon_id: string;
  estado: "ACTIVO" | "SUSPENDIDO";
  vence_el: string | null;
  cuota: number;
  moneda: string;
  motivo: string | null;
};
export type Negocio = { id: string; nombre: string; correo: string | null; telefono: string | null };
export type UsuarioPlataforma = {
  id: string; salon_id: string; nombre_completo: string; correo: string;
  rol: string; estado: string; eliminado_en: string | null;
};
export type Pago = {
  id: string; salon_id: string; monto: number; moneda: string;
  periodo_desde: string; periodo_hasta: string; fecha_pago: string;
  metodo: string; referencia: string | null; notas: string | null;
};
export type Resultado = { exito: boolean; mensaje: string };
export const ROLES_NEGOCIO = ["ADMIN", "RECEPCION", "CAJA", "TRABAJADOR", "INVENTARIO"] as const;
export function fechaNegocio(ahora = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Managua", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(ahora);
  const parte = (tipo: string) => partes.find(p => p.type === tipo)!.value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}
export function estadoSuscripcion(s: Suscripcion | undefined, hoy: string) {
  if (!s) return "SIN CONFIGURAR";
  if (s.estado === "SUSPENDIDO") return "SUSPENDIDO";
  return s.vence_el && s.vence_el < hoy ? "VENCIDO" : "ACTIVO";
}
export function fechaValida(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T12:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}
