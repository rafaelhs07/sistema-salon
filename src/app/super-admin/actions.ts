"use server";

import { revalidatePath } from "next/cache";
import { exigirSuperAdmin } from "@/lib/plataforma/server";
import { fechaNegocio, fechaValida, ROLES_NEGOCIO, type Resultado } from "@/lib/plataforma/modelo";

function texto(form: FormData, campo: string, max = 250) {
  const valor = form.get(campo);
  if (typeof valor !== "string" || valor.length > max) throw new Error(`Revisa el campo ${campo}.`);
  return valor.trim();
}
function uuid(form: FormData, campo: string) {
  const valor = texto(form, campo, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)) throw new Error("Identificador inválido.");
  return valor;
}
function fecha(form: FormData, campo: string, opcional = false) {
  const valor = texto(form, campo, 10);
  if (!valor && opcional) return null;
  if (!fechaValida(valor)) throw new Error("Escribe una fecha válida.");
  return valor;
}
function monto(form: FormData, campo: string, permitirCero = false) {
  const valor = texto(form, campo, 16);
  if (!/^\d+(\.\d{1,2})?$/.test(valor)) throw new Error("El importe debe tener hasta dos decimales.");
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero > 9999999999.99 || numero < (permitirCero ? 0 : 0.01)) throw new Error("Importe inválido.");
  return numero;
}
function moneda(form: FormData) {
  const valor = texto(form, "moneda", 3).toUpperCase();
  if (!["NIO", "USD"].includes(valor)) throw new Error("Selecciona córdobas o dólares.");
  return valor;
}
function revisar(error: { message: string } | null, mensaje: string) {
  if (error) {
    console.error(mensaje, error);
    throw new Error(mensaje);
  }
}
async function ejecutar(operacion: () => Promise<string>): Promise<Resultado> {
  try {
    const mensaje = await operacion();
    revalidatePath("/super-admin");
    revalidatePath("/usuarios");
    return { exito: true, mensaje };
  } catch (error) {
    return { exito: false, mensaje: error instanceof Error ? error.message : "No se pudo completar la operación." };
  }
}

export async function crearNegocio(form: FormData): Promise<Resultado> {
  return ejecutar(async () => {
    const { admin, actorId } = await exigirSuperAdmin();
    const nombre = texto(form, "nombre", 150);
    const correo = texto(form, "correo", 254).toLowerCase();
    if (nombre.length < 2) throw new Error("Escribe el nombre del negocio.");
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error("Correo inválido.");
    const { error } = await admin.rpc("plataforma_crear_negocio", {
      p_actor: actorId, p_nombre: nombre, p_correo: correo, p_telefono: texto(form, "telefono", 40),
      p_vence: fecha(form, "vence_el"), p_cuota: monto(form, "cuota", true), p_moneda: moneda(form),
    });
    revisar(error, "No se pudo crear el negocio. Verifica que se aplicó la migración y revisa el registro del servidor.");
    return "Negocio creado con sucursal principal. Ahora puedes crear su usuario administrador.";
  });
}

export async function guardarAcceso(form: FormData): Promise<Resultado> {
  return ejecutar(async () => {
    const { admin, actorId } = await exigirSuperAdmin();
    const estado = texto(form, "estado", 20);
    const vence = fecha(form, "vence_el", true);
    const motivo = texto(form, "motivo", 500);
    if (!["ACTIVO", "SUSPENDIDO"].includes(estado)) throw new Error("Estado inválido.");
    if (estado === "ACTIVO" && vence && vence < fechaNegocio()) throw new Error("Para dar acceso, indica una fecha vigente o deja el vencimiento vacío.");
    if (estado === "SUSPENDIDO" && motivo.length < 3) throw new Error("Indica el motivo de suspensión.");
    const { error } = await admin.rpc("plataforma_guardar_acceso", {
      p_actor: actorId, p_salon: uuid(form, "salon_id"), p_estado: estado, p_vence: vence,
      p_cuota: monto(form, "cuota", true), p_moneda: moneda(form), p_motivo: motivo,
    });
    revisar(error, "No se pudo actualizar el acceso del negocio.");
    return estado === "SUSPENDIDO" ? "Acceso suspendido para todos los usuarios del negocio." : "Acceso y suscripción actualizados.";
  });
}

export async function registrarPago(form: FormData): Promise<Resultado> {
  return ejecutar(async () => {
    const { admin, actorId } = await exigirSuperAdmin();
    const desde = fecha(form, "periodo_desde")!;
    const hasta = fecha(form, "periodo_hasta")!;
    const pagado = fecha(form, "fecha_pago")!;
    const reactivar = form.get("reactivar") === "on";
    const metodo = texto(form, "metodo", 20);
    if (hasta < desde) throw new Error("El final del período debe ser posterior o igual al inicio.");
    if (pagado > fechaNegocio()) throw new Error("El pago no puede tener fecha futura.");
    if (reactivar && hasta < fechaNegocio()) throw new Error("Para reactivar, el período pagado debe estar vigente.");
    if (!["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"].includes(metodo)) throw new Error("Método inválido.");
    const { error } = await admin.rpc("plataforma_registrar_pago", {
      p_actor: actorId, p_id: uuid(form, "id"), p_salon: uuid(form, "salon_id"),
      p_monto: monto(form, "monto"), p_moneda: moneda(form), p_desde: desde, p_hasta: hasta,
      p_fecha: pagado, p_metodo: metodo, p_referencia: texto(form, "referencia", 150),
      p_notas: texto(form, "notas", 500), p_reactivar: reactivar,
    });
    revisar(error, "No se pudo registrar el pago. Revisa la moneda y los datos de la suscripción.");
    return reactivar ? "Pago registrado y acceso renovado hasta el período cubierto." : "Pago registrado. El acceso conserva su estado anterior.";
  });
}

export async function crearUsuarioPlataforma(form: FormData): Promise<Resultado> {
  return ejecutar(async () => {
    const { admin, actorId } = await exigirSuperAdmin();
    const salonId = uuid(form, "salon_id");
    const sucursalId = uuid(form, "sucursal_id");
    const nombre = texto(form, "nombre", 150);
    const correo = texto(form, "correo", 254).toLowerCase();
    const clave = form.get("contrasena");
    const rol = texto(form, "rol", 20);
    if (nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error("Revisa nombre y correo.");
    if (typeof clave !== "string" || clave.length < 8 || clave.length > 128) throw new Error("La contraseña debe tener entre 8 y 128 caracteres.");
    if (!ROLES_NEGOCIO.some(r => r === rol)) throw new Error("Selecciona un rol del negocio.");
    const { data: sucursal, error: sucursalError } = await admin.from("sucursales").select("id").eq("id", sucursalId).eq("salon_id", salonId).maybeSingle();
    if (sucursalError || !sucursal) throw new Error("La sucursal no pertenece al negocio.");
    const { data, error } = await admin.auth.admin.createUser({
      email: correo, password: clave, email_confirm: true,
      user_metadata: { nombre, salon_id: salonId, sucursal_id: sucursalId, rol },
    });
    revisar(error, "No se pudo crear la cuenta. Comprueba si ese correo ya está registrado.");
    if (!data.user) throw new Error("No se obtuvo la cuenta creada.");
    const id = data.user.id;
    const { error: perfilError } = await admin.rpc("configurar_perfil_usuario_creado", {
      p_usuario_id: id, p_salon_id: salonId, p_sucursal_id: sucursalId,
      p_nombre_completo: nombre, p_correo: correo, p_rol: rol, p_estado: "ACTIVO",
    });
    const { data: perfil, error: verificacionError } = await admin.from("usuarios_perfiles").select("salon_id,sucursal_id,rol,estado,eliminado_en").eq("id", id).maybeSingle();
    if (perfilError || verificacionError || !perfil || perfil.salon_id !== salonId || perfil.sucursal_id !== sucursalId || perfil.rol !== rol || perfil.estado !== "ACTIVO" || perfil.eliminado_en) {
      const { error: rollback } = await admin.auth.admin.deleteUser(id);
      if (rollback) {
        await admin.from("usuarios_perfiles").update({ estado: "INACTIVO" }).eq("id", id);
        await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
        throw new Error("Falló la configuración y la limpieza de la cuenta. Revisa Auth y el registro del servidor antes de reintentar.");
      }
      throw new Error("No se pudo configurar el perfil. La cuenta creada fue revertida.");
    }
    const { error: auditoriaError } = await admin.from("plataforma_auditoria").insert({ actor_id: actorId, salon_id: salonId, accion: "USUARIO_CREADO", detalle: { usuario_id: id, rol } });
    return auditoriaError ? "Usuario creado; no se pudo registrar la auditoría." : "Usuario creado. Ya puede ingresar con su correo y contraseña si el negocio está habilitado.";
  });
}

export async function cambiarUsuario(form: FormData): Promise<Resultado> {
  return ejecutar(async () => {
    const { admin, actorId } = await exigirSuperAdmin();
    const id = uuid(form, "usuario_id");
    const operacion = texto(form, "operacion", 20);
    if (!["ACTIVAR", "DESACTIVAR", "ELIMINAR"].includes(operacion)) throw new Error("Operación inválida.");
    const { data: objetivo, error } = await admin.from("usuarios_perfiles").select("id,salon_id,rol,correo,eliminado_en").eq("id", id).maybeSingle();
    if (error || !objetivo) throw new Error("Usuario no encontrado.");
    if (id === actorId || objetivo.rol === "SUPER_ADMIN") throw new Error("Las cuentas SUPER_ADMIN están protegidas.");
    if (objetivo.eliminado_en && operacion !== "ELIMINAR") throw new Error("Esta cuenta fue eliminada y no se puede reactivar.");
    if (operacion === "ELIMINAR" && texto(form, "confirmacion", 254).toLowerCase() !== objetivo.correo.toLowerCase()) throw new Error("Escribe el correo del usuario para confirmar su eliminación.");
    // Primero bloquear el perfil: cualquier fallo posterior mantiene el acceso cerrado.
    const cambios = operacion === "ACTIVAR" ? { estado: "ACTIVO" } : {
      estado: "INACTIVO", ...(operacion === "ELIMINAR" ? { eliminado_en: objetivo.eliminado_en ?? new Date().toISOString() } : {}),
    };
    const { error: cambioError } = await admin.from("usuarios_perfiles").update(cambios).eq("id", id).neq("rol", "SUPER_ADMIN");
    revisar(cambioError, "No se pudo cambiar el acceso del usuario.");
    if (operacion === "ELIMINAR") {
      // Soft delete de Auth es irreversible y conserva las referencias históricas.
      const { error: eliminarError } = await admin.auth.admin.deleteUser(id, true);
      revisar(eliminarError, "El acceso quedó bloqueado, pero Auth no pudo eliminarse. Puedes reintentar la eliminación.");
    }
    const { error: auditoriaError } = await admin.from("plataforma_auditoria").insert({ actor_id: actorId, salon_id: objetivo.salon_id, accion: `USUARIO_${operacion}`, detalle: { usuario_id: id } });
    if (auditoriaError) return "Acceso actualizado; no se pudo registrar la auditoría.";
    return operacion === "ELIMINAR" ? "Cuenta de acceso eliminada. El historial del negocio se conserva." : "Acceso del usuario actualizado. La suscripción del negocio también debe estar activa.";
  });
}
