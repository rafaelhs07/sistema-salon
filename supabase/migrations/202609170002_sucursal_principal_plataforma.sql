-- Aplicar después de 202609170001_panel_super_admin.sql.
-- Corrige la sucursal de los negocios nuevos; conserva los datos existentes.
begin;

create or replace function public.plataforma_crear_negocio(p_actor uuid, p_nombre text, p_correo text, p_telefono text, p_vence date, p_cuota numeric, p_moneda text)
returns uuid language plpgsql security definer set search_path=public as $$
declare negocio uuid;
begin
  perform public.plataforma_validar_actor(p_actor);
  if length(trim(p_nombre)) < 2 or p_cuota < 0 or p_vence is null then raise exception 'Datos inválidos'; end if;
  insert into public.salones(nombre, nombre_comercial, correo, telefono)
    values(trim(p_nombre),trim(p_nombre),nullif(p_correo,''),nullif(p_telefono,'')) returning id into negocio;
  insert into public.sucursales(salon_id, nombre, es_principal, estado)
    values(negocio, 'Sucursal principal', true, 'ACTIVA');
  -- Compatible con una instalación que cree configuración mediante trigger.
  insert into public.configuracion_salon(salon_id, nombre_salon, moneda, simbolo_moneda, hora_apertura, hora_cierre, intervalo_citas_minutos, permitir_credito, permitir_pago_combinado, mensaje_recibo)
    select negocio, trim(p_nombre), p_moneda, case when p_moneda='NIO' then 'C$' else '$' end, '08:00', '18:00', 30, true, true, 'Gracias por preferir nuestros servicios.'
    where not exists(select 1 from public.configuracion_salon where salon_id=negocio);
  insert into public.plataforma_suscripciones(salon_id, vence_el, cuota, moneda) values(negocio,p_vence,p_cuota,p_moneda);
  insert into public.plataforma_auditoria(actor_id,salon_id,accion) values(p_actor,negocio,'NEGOCIO_CREADO');
  return negocio;
end $$;

revoke all on function public.plataforma_crear_negocio(uuid,text,text,text,date,numeric,text)
  from public, anon, authenticated;
grant execute on function public.plataforma_crear_negocio(uuid,text,text,text,date,numeric,text)
  to service_role;

notify pgrst, 'reload schema';
commit;
