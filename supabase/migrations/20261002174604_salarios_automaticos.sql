-- No activa ni genera salarios históricos de trabajadores existentes.
alter table public.trabajadores
  add column salario_automatico boolean not null default false,
  add column salario_fecha_inicio date,
  add column salario_proximo_pago date,
  add constraint trabajadores_salario_programado_check check (
    not salario_automatico or (
      modalidad_pago in ('SALARIO_FIJO', 'SALARIO_MAS_COMISION')
      and salario_fijo > 0 and salario_fijo <> 'NaN'::numeric
      and estado = 'ACTIVO' and sucursal_id is not null
      and salario_fecha_inicio is not null and salario_proximo_pago is not null
    )
  );

alter table public.movimientos_financieros
  add column salario_trabajador_id uuid references public.trabajadores(id) on delete restrict,
  add column salario_fecha date,
  drop constraint movimientos_financieros_origen_check,
  add constraint movimientos_financieros_origen_check check (
    origen in ('VENTA','PAGO_PROVEEDOR','COMISION_POS','MOVIMIENTO_CAJA','MANUAL','AJUSTE','OTRO','SALARIO')
  ),
  add constraint movimientos_financieros_salario_check check (
    (origen = 'SALARIO' and tipo = 'GASTO' and salario_trabajador_id is not null and salario_fecha is not null)
    or (origen <> 'SALARIO' and salario_trabajador_id is null and salario_fecha is null)
  );

-- Incluye anulados: una anulación no autoriza a volver a generar el mismo pago.
create unique index movimientos_salario_fecha_unica
  on public.movimientos_financieros(salario_trabajador_id, salario_fecha)
  where salario_trabajador_id is not null;
create index trabajadores_salarios_pendientes
  on public.trabajadores(salario_proximo_pago) where salario_automatico;

create function public.proteger_movimiento_salario()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user <> 'postgres' then
    if tg_op = 'INSERT' and new.origen = 'SALARIO' then
      raise exception 'Los salarios automáticos se generan mediante la programación del trabajador.';
    elsif tg_op = 'DELETE' and old.origen = 'SALARIO' then
      raise exception 'No se puede eliminar un salario automático. Conserva su historial.';
    elsif tg_op = 'UPDATE' and (old.origen = 'SALARIO' or new.origen = 'SALARIO') then
      -- Permite anular conservando identidad, fecha y monto para impedir duplicados.
      if (to_jsonb(new) - array['estado','anulado_por','motivo_anulacion','fecha_anulacion','actualizado_en'])
         is distinct from
         (to_jsonb(old) - array['estado','anulado_por','motivo_anulacion','fecha_anulacion','actualizado_en']) then
        raise exception 'No se puede modificar el importe o la identidad de un salario generado.';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.origen = 'SALARIO' and not exists (
    select 1 from public.trabajadores t where t.id = new.salario_trabajador_id and t.salon_id = new.salon_id
  ) then
    raise exception 'El salario debe pertenecer a un trabajador del mismo salón.';
  end if;
  return new;
end;
$$;
revoke all on function public.proteger_movimiento_salario() from public, anon, authenticated;
create trigger proteger_movimiento_salario
  before insert or update or delete on public.movimientos_financieros
  for each row execute function public.proteger_movimiento_salario();

create schema if not exists nomina_privada;
revoke all on schema nomina_privada from public, anon, authenticated;

create function nomina_privada.siguiente_fecha(p_fecha date, p_inicio date, p_frecuencia text)
returns date language plpgsql immutable strict security invoker set search_path = '' as $$
declare v_mes date;
begin
  if p_frecuencia = 'SEMANAL' then return p_fecha + 7; end if;
  if p_frecuencia = 'QUINCENAL' then return p_fecha + 15; end if;
  if p_frecuencia <> 'MENSUAL' then raise exception 'Frecuencia de salario no válida'; end if;
  v_mes := (date_trunc('month', p_fecha) + interval '1 month')::date;
  return v_mes + (least(extract(day from p_inicio)::int,
    extract(day from (v_mes + interval '1 month - 1 day'))::int) - 1);
end;
$$;
revoke all on function nomina_privada.siguiente_fecha(date,date,text) from public, anon, authenticated;

create function public.validar_programacion_salario()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_hoy date := (now() at time zone 'America/Managua')::date;
  v_reprogramar boolean;
begin
  -- Solo el proceso interno puede avanzar el cursor sin cambiar la programación.
  if tg_op = 'UPDATE' and current_user <> 'postgres'
     and new.salario_proximo_pago is distinct from old.salario_proximo_pago then
    raise exception 'La próxima fecha de salario la administra el sistema.';
  end if;
  if new.estado <> 'ACTIVO' or new.modalidad_pago not in ('SALARIO_FIJO','SALARIO_MAS_COMISION') then
    new.salario_automatico := false;
  end if;
  if not new.salario_automatico then
    new.salario_proximo_pago := null;
    return new;
  end if;
  if new.salario_fijo is null or new.salario_fijo <= 0 or new.salario_fijo = 'NaN'::numeric then
    raise exception 'El salario por período debe ser mayor que cero.';
  end if;
  if not exists(select 1 from public.sucursales s where s.id = new.sucursal_id
    and s.salon_id = new.salon_id and s.estado = 'ACTIVA') then
    raise exception 'Selecciona una sucursal activa del mismo salón.';
  end if;
  if tg_op = 'INSERT' then
    v_reprogramar := true;
  else
    v_reprogramar := not old.salario_automatico
      or new.salario_fecha_inicio is distinct from old.salario_fecha_inicio
      or new.frecuencia_pago is distinct from old.frecuencia_pago;
    -- No modificar el importe o destino de períodos que aún están pendientes.
    if old.salario_automatico and old.salario_proximo_pago <= v_hoy
       and (v_reprogramar or new.salario_fijo is distinct from old.salario_fijo
         or new.sucursal_id is distinct from old.sucursal_id) then
      raise exception 'Hay un salario pendiente de procesar. Espera unos minutos y vuelve a guardar.';
    end if;
  end if;
  if v_reprogramar then
    if new.salario_fecha_inicio is null or new.salario_fecha_inicio < v_hoy then
      raise exception 'Para activar o reprogramar, elige una fecha inicial de hoy o posterior.';
    end if;
    new.salario_proximo_pago := new.salario_fecha_inicio;
  end if;
  return new;
end;
$$;
revoke all on function public.validar_programacion_salario() from public, anon, authenticated;
create trigger validar_programacion_salario
  before insert or update on public.trabajadores
  for each row execute function public.validar_programacion_salario();

-- No es RPC pública: Cron ejecuta como postgres, sin SECURITY DEFINER ni claves HTTP.
create function nomina_privada.procesar_salarios()
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  t record;
  v_fecha date;
  v_hoy date := (now() at time zone 'America/Managua')::date;
  v_categoria uuid;
  v_total integer := 0;
  v_insertados integer;
begin
  if not pg_try_advisory_xact_lock(726019, 1) then return 0; end if;
  for t in
    select tr.* from public.trabajadores tr
    join public.salones s on s.id = tr.salon_id and s.estado = 'ACTIVO'
    join public.sucursales su on su.id = tr.sucursal_id and su.salon_id = tr.salon_id and su.estado = 'ACTIVA'
    join public.plataforma_suscripciones ps on ps.salon_id = tr.salon_id
      and ps.estado = 'ACTIVO' and (ps.vence_el is null or ps.vence_el >= v_hoy)
    where tr.salario_automatico and tr.estado = 'ACTIVO'
      and tr.modalidad_pago in ('SALARIO_FIJO','SALARIO_MAS_COMISION')
      and tr.salario_proximo_pago <= v_hoy
    order by tr.id for update of tr skip locked
  loop
    select id into v_categoria from public.categorias_financieras
      where salon_id = t.salon_id and tipo = 'GASTO' and nombre = 'Salarios' and estado = 'ACTIVA'
      order by creado_en, id limit 1;
    if v_categoria is null then
      insert into public.categorias_financieras(salon_id,nombre,tipo,descripcion,sistema)
      values(t.salon_id,'Salarios','GASTO','Salarios fijos programados de trabajadores',true)
      returning id into v_categoria;
    end if;
    v_fecha := t.salario_proximo_pago;
    while v_fecha <= v_hoy loop
      insert into public.movimientos_financieros(
        salon_id,sucursal_id,categoria_id,tipo,origen,concepto,descripcion,monto,
        referencia,fecha_movimiento,estado,salario_trabajador_id,salario_fecha
      ) values (
        t.salon_id,t.sucursal_id,v_categoria,'GASTO','SALARIO',
        'Salario de ' || t.nombre_completo,
        'Salario fijo ' || lower(t.frecuencia_pago) || '. Registro automático; no realiza transferencia bancaria ni retiro de caja. No incluye comisiones.',
        t.salario_fijo,'SALARIO:' || t.id || ':' || v_fecha,
        v_fecha::timestamp at time zone 'America/Managua','APLICADO',t.id,v_fecha
      ) on conflict (salario_trabajador_id,salario_fecha)
        where salario_trabajador_id is not null do nothing;
      get diagnostics v_insertados = row_count;
      v_total := v_total + v_insertados;
      v_fecha := nomina_privada.siguiente_fecha(v_fecha,t.salario_fecha_inicio,t.frecuencia_pago);
    end loop;
    update public.trabajadores set salario_proximo_pago = v_fecha where id = t.id;
  end loop;
  return v_total;
end;
$$;
revoke all on function nomina_privada.procesar_salarios() from public, anon, authenticated, service_role;

-- Cron recupera también fechas vencidas tras una interrupción, una sola vez por fecha.
create extension if not exists pg_cron;
select cron.schedule('salarios-automaticos', '*/5 * * * *',
  'select nomina_privada.procesar_salarios();');
