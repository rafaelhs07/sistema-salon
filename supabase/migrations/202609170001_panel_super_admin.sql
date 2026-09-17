-- Ejecutar completa en Supabase SQL Editor antes de desplegar el código.
-- No modifica ni promociona el rol de ningún usuario existente.
begin;

alter table public.usuarios_perfiles add column if not exists eliminado_en timestamptz;

create table if not exists public.plataforma_suscripciones (
  salon_id uuid primary key references public.salones(id) on delete restrict,
  estado text not null default 'ACTIVO' check (estado in ('ACTIVO', 'SUSPENDIDO')),
  vence_el date,
  cuota numeric(12,2) not null default 0 check (cuota >= 0),
  moneda text not null default 'NIO' check (moneda ~ '^[A-Z]{3}$'),
  motivo text,
  actualizado_en timestamptz not null default now()
);
-- Preservar acceso de negocios existentes hasta que el dueño les asigne vencimiento.
insert into public.plataforma_suscripciones(salon_id)
select id from public.salones on conflict do nothing;

create table if not exists public.plataforma_pagos (
  id uuid primary key, -- clave de idempotencia generada al abrir el formulario
  salon_id uuid not null references public.salones(id) on delete restrict,
  monto numeric(12,2) not null check (monto > 0),
  moneda text not null check (moneda ~ '^[A-Z]{3}$'),
  periodo_desde date not null,
  periodo_hasta date not null check (periodo_hasta >= periodo_desde),
  fecha_pago date not null,
  metodo text not null check (metodo in ('EFECTIVO','TRANSFERENCIA','TARJETA','OTRO')),
  referencia text,
  notas text,
  registrado_por uuid not null references public.usuarios_perfiles(id),
  reactivar_acceso boolean not null default false,
  creado_en timestamptz not null default now()
);
create index if not exists plataforma_pagos_salon_fecha on public.plataforma_pagos(salon_id, fecha_pago desc);
create table if not exists public.plataforma_auditoria (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.usuarios_perfiles(id),
  salon_id uuid references public.salones(id),
  accion text not null,
  detalle jsonb not null default '{}',
  creado_en timestamptz not null default now()
);

create or replace function public.plataforma_es_super_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.usuarios_perfiles
    where id = auth.uid() and rol = 'SUPER_ADMIN' and estado = 'ACTIVO' and eliminado_en is null);
$$;

create or replace function public.plataforma_acceso_actual()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.usuarios_perfiles p
    left join public.plataforma_suscripciones s on s.salon_id = p.salon_id
    where p.id = auth.uid() and p.estado = 'ACTIVO' and p.eliminado_en is null
      and (p.rol = 'SUPER_ADMIN' or (s.estado = 'ACTIVO'
        and (s.vence_el is null or s.vence_el >= (now() at time zone 'America/Managua')::date)))
  );
$$;
revoke all on function public.plataforma_es_super_admin() from public, anon;
revoke all on function public.plataforma_acceso_actual() from public, anon;
grant execute on function public.plataforma_es_super_admin(), public.plataforma_acceso_actual() to authenticated, service_role;

-- Datos de facturación de la plataforma: ninguna política de salones los expone.
alter table public.plataforma_suscripciones enable row level security;
alter table public.plataforma_pagos enable row level security;
alter table public.plataforma_auditoria enable row level security;
revoke all on public.plataforma_suscripciones, public.plataforma_pagos, public.plataforma_auditoria from anon, authenticated;
grant select on public.plataforma_suscripciones, public.plataforma_pagos, public.plataforma_auditoria to authenticated;
grant all on public.plataforma_suscripciones, public.plataforma_pagos, public.plataforma_auditoria to service_role;
grant usage, select on sequence public.plataforma_auditoria_id_seq to service_role;
create policy plataforma_suscripciones_lectura on public.plataforma_suscripciones for select to authenticated using (public.plataforma_es_super_admin());
create policy plataforma_pagos_lectura on public.plataforma_pagos for select to authenticated using (public.plataforma_es_super_admin());
create policy plataforma_auditoria_lectura on public.plataforma_auditoria for select to authenticated using (public.plataforma_es_super_admin());

-- Capa RESTRICTIVA: las políticas existentes continúan decidiendo permisos y salón.
-- Se aplica también a tablas de detalle sin salon_id. No se conceden permisos nuevos.
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p') and c.relname not like 'plataforma_%'
  loop
    execute format('alter table public.%I enable row level security', t.relname);
    if t.relname = 'usuarios_perfiles' then
      -- El propio perfil sigue legible para mostrar el bloqueo y permitir cerrar sesión.
      execute 'create policy plataforma_acceso_lectura on public.usuarios_perfiles as restrictive for select to authenticated using (id = auth.uid() or public.plataforma_acceso_actual())';
      execute 'create policy plataforma_acceso_insert on public.usuarios_perfiles as restrictive for insert to authenticated with check (public.plataforma_acceso_actual())';
      execute 'create policy plataforma_acceso_update on public.usuarios_perfiles as restrictive for update to authenticated using (public.plataforma_acceso_actual()) with check (public.plataforma_acceso_actual())';
      execute 'create policy plataforma_acceso_delete on public.usuarios_perfiles as restrictive for delete to authenticated using (public.plataforma_acceso_actual())';
    else
      execute format('create policy plataforma_acceso on public.%I as restrictive for all to authenticated using (public.plataforma_acceso_actual()) with check (public.plataforma_acceso_actual())', t.relname);
    end if;
  end loop;
end $$;

-- Impedir que clientes REST o RPC antiguas eleven roles o reactiven perfiles eliminados.
create or replace function public.plataforma_proteger_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' and not public.plataforma_es_super_admin() then
    if tg_op = 'DELETE' then
      raise exception 'Solo la plataforma puede eliminar cuentas';
    elsif tg_op = 'INSERT' then
      raise exception 'Crea usuarios desde el servidor autorizado';
    elsif old.rol = 'SUPER_ADMIN' or new.rol = 'SUPER_ADMIN'
      or new.id is distinct from old.id
      or new.salon_id is distinct from old.salon_id
      or new.rol is distinct from old.rol or new.estado is distinct from old.estado
      or new.eliminado_en is distinct from old.eliminado_en or old.eliminado_en is not null then
      raise exception 'El cambio de acceso requiere el servidor autorizado';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger plataforma_proteger_perfil before insert or update or delete on public.usuarios_perfiles
for each row execute function public.plataforma_proteger_perfil();

-- Las RPC SECURITY DEFINER evaden RLS. Envolver las RPC operativas existentes
-- conservando sus firmas/defaults y retirando acceso público a la implementación.
-- Las funciones SECURITY INVOKER ya quedan sujetas a RLS.
do $$
declare f record; argumentos text; llamada text; cuerpo text; interna text;
begin
  for f in select p.*, pg_get_function_arguments(p.oid) as firma,
      pg_get_function_identity_arguments(p.oid) as identidad,
      pg_get_function_result(p.oid) as resultado
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef and p.prokind='f' and p.proname = any(array[
      'usuario_actual_tiene_permiso','obtener_permisos_usuario_actual','obtener_permisos_usuario',
      'establecer_permiso_usuario','actualizar_vencimientos_cuentas','confirmar_compra',
      'anular_compra','registrar_compra_borrador','registrar_abono_cuenta_pagar',
      'registrar_venta_productos','registrar_venta_directa','registrar_venta_cita',
      'registrar_movimiento_manual_caja','cerrar_caja','anular_venta','cambiar_vencimiento_cuenta',
      'registrar_abono_cuenta','registrar_traslado_inventario','registrar_ajuste_inventario',
      'registrar_ingreso_manual_financiero','registrar_gasto_manual_financiero'])
  loop
    interna := '_plataforma_base_' || f.proname;
    select string_agg('$' || i::text, ', ' order by i) into argumentos from generate_series(1, f.pronargs) i;
    llamada := format('public.%I(%s)', interna, coalesce(argumentos, ''));
    if f.proretset then cuerpo := 'return query select * from ' || llamada || ';';
    elsif f.resultado = 'void' then cuerpo := 'perform ' || llamada || '; return;';
    else cuerpo := 'return ' || llamada || ';'; end if;
    execute format('alter function public.%I(%s) rename to %I', f.proname, f.identidad, interna);
    execute format('revoke all on function public.%I(%s) from public, anon, authenticated', interna, f.identidad);
    execute format('create function public.%I(%s) returns %s language plpgsql security definer set search_path=public as %L',
      f.proname, f.firma, f.resultado,
      'begin if not public.plataforma_acceso_actual() then raise exception ''El acceso al negocio está suspendido o vencido''; end if; ' || cuerpo || ' end');
    execute format('revoke all on function public.%I(%s) from public, anon', f.proname, f.identidad);
    execute format('grant execute on function public.%I(%s) to authenticated, service_role', f.proname, f.identidad);
  end loop;
  -- Esta RPC de provisionamiento debe utilizarse solo con service_role.
  for f in select p.proname, pg_get_function_identity_arguments(p.oid) as identidad
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='configurar_perfil_usuario_creado'
  loop
    execute format('revoke all on function public.%I(%s) from public, anon, authenticated', f.proname, f.identidad);
    execute format('grant execute on function public.%I(%s) to service_role', f.proname, f.identidad);
  end loop;
end $$;

create or replace function public.plataforma_validar_actor(p_actor uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.usuarios_perfiles where id=p_actor and rol='SUPER_ADMIN' and estado='ACTIVO' and eliminado_en is null) then
    raise exception 'SUPER_ADMIN activo requerido';
  end if;
end $$;

create or replace function public.plataforma_crear_negocio(p_actor uuid, p_nombre text, p_correo text, p_telefono text, p_vence date, p_cuota numeric, p_moneda text)
returns uuid language plpgsql security definer set search_path=public as $$
declare negocio uuid;
begin
  perform public.plataforma_validar_actor(p_actor);
  if length(trim(p_nombre)) < 2 or p_cuota < 0 or p_vence is null then raise exception 'Datos inválidos'; end if;
  insert into public.salones(nombre, nombre_comercial, correo, telefono)
    values(trim(p_nombre),trim(p_nombre),nullif(p_correo,''),nullif(p_telefono,'')) returning id into negocio;
  insert into public.sucursales(salon_id, nombre) values(negocio, 'Sucursal principal');
  -- Compatible con una instalación que cree configuración mediante trigger.
  insert into public.configuracion_salon(salon_id, nombre_salon, moneda, simbolo_moneda, hora_apertura, hora_cierre, intervalo_citas_minutos, permitir_credito, permitir_pago_combinado, mensaje_recibo)
    select negocio, trim(p_nombre), p_moneda, case when p_moneda='NIO' then 'C$' else '$' end, '08:00', '18:00', 30, true, true, 'Gracias por preferir nuestros servicios.'
    where not exists(select 1 from public.configuracion_salon where salon_id=negocio);
  insert into public.plataforma_suscripciones(salon_id, vence_el, cuota, moneda) values(negocio,p_vence,p_cuota,p_moneda);
  insert into public.plataforma_auditoria(actor_id,salon_id,accion) values(p_actor,negocio,'NEGOCIO_CREADO');
  return negocio;
end $$;

create or replace function public.plataforma_guardar_acceso(p_actor uuid, p_salon uuid, p_estado text, p_vence date, p_cuota numeric, p_moneda text, p_motivo text)
returns void language plpgsql security definer set search_path=public as $$
declare anterior jsonb;
begin
  perform public.plataforma_validar_actor(p_actor);
  select to_jsonb(s) into anterior from public.plataforma_suscripciones s where salon_id=p_salon for update;
  if not found then raise exception 'Negocio no encontrado'; end if;
  update public.plataforma_suscripciones set estado=p_estado, vence_el=p_vence, cuota=p_cuota,
    moneda=p_moneda, motivo=nullif(trim(p_motivo),''), actualizado_en=now() where salon_id=p_salon;
  insert into public.plataforma_auditoria(actor_id,salon_id,accion,detalle)
    values(p_actor,p_salon,'ACCESO_ACTUALIZADO',jsonb_build_object('anterior',anterior,'estado',p_estado,'vence_el',p_vence));
end $$;

create or replace function public.plataforma_registrar_pago(p_actor uuid, p_id uuid, p_salon uuid, p_monto numeric, p_moneda text, p_desde date, p_hasta date, p_fecha date, p_metodo text, p_referencia text, p_notas text, p_reactivar boolean)
returns void language plpgsql security definer set search_path=public as $$
declare s public.plataforma_suscripciones; anterior public.plataforma_pagos;
begin
  perform public.plataforma_validar_actor(p_actor);
  select * into s from public.plataforma_suscripciones where salon_id=p_salon for update;
  if not found then raise exception 'Negocio no encontrado'; end if;
  select * into anterior from public.plataforma_pagos where id=p_id;
  if found then
    if anterior.salon_id is distinct from p_salon or anterior.monto is distinct from p_monto
      or anterior.moneda is distinct from p_moneda or anterior.periodo_desde is distinct from p_desde
      or anterior.periodo_hasta is distinct from p_hasta or anterior.fecha_pago is distinct from p_fecha
      or anterior.metodo is distinct from p_metodo or anterior.referencia is distinct from nullif(p_referencia,'')
      or anterior.notas is distinct from nullif(p_notas,'') or anterior.reactivar_acceso is distinct from p_reactivar
      then raise exception 'La solicitud ya fue utilizada con otros datos'; end if;
    return;
  end if;
  if p_moneda <> s.moneda then raise exception 'La moneda no coincide con la suscripción'; end if;
  if p_fecha > (now() at time zone 'America/Managua')::date then raise exception 'El pago no puede tener fecha futura'; end if;
  if p_reactivar and p_hasta < (now() at time zone 'America/Managua')::date then raise exception 'Para reactivar, la cobertura debe estar vigente'; end if;
  insert into public.plataforma_pagos(id,salon_id,monto,moneda,periodo_desde,periodo_hasta,fecha_pago,metodo,referencia,notas,registrado_por,reactivar_acceso)
    values(p_id,p_salon,p_monto,p_moneda,p_desde,p_hasta,p_fecha,p_metodo,nullif(p_referencia,''),nullif(p_notas,''),p_actor,p_reactivar);
  update public.plataforma_suscripciones set
    vence_el=case when p_reactivar then greatest(vence_el,p_hasta) else vence_el end,
    estado=case when p_reactivar then 'ACTIVO' else estado end,
    motivo=case when p_reactivar then null else motivo end, actualizado_en=now() where salon_id=p_salon;
  insert into public.plataforma_auditoria(actor_id,salon_id,accion,detalle)
    values(p_actor,p_salon,'PAGO_REGISTRADO',jsonb_build_object('pago_id',p_id,'reactivado',p_reactivar));
end $$;

-- Todas las mutaciones anteriores se ejecutan exclusivamente desde el servidor.
do $$ declare f record;
begin
  for f in select p.proname,pg_get_function_identity_arguments(p.oid) as firma
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('plataforma_validar_actor','plataforma_crear_negocio','plataforma_guardar_acceso','plataforma_registrar_pago')
  loop
    execute format('revoke all on function public.%I(%s) from public,anon,authenticated',f.proname,f.firma);
    execute format('grant execute on function public.%I(%s) to service_role',f.proname,f.firma);
  end loop;
end $$;
notify pgrst, 'reload schema';
commit;
