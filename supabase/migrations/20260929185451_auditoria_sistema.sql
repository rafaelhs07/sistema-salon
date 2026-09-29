begin;
create schema if not exists auditoria_privada;
revoke all on schema auditoria_privada from public, anon, authenticated;

create table if not exists public.auditoria_eventos (
    id bigint generated always as identity primary key,
    fecha timestamptz not null default clock_timestamp(),
    transaccion bigint not null default txid_current(),
    salon_id uuid,
    usuario_id uuid,
    usuario_nombre text not null,
    usuario_rol text,
    origen text not null,
    tabla text not null,
    accion text not null check (accion in ('INSERT','UPDATE','DELETE')),
    registro_id text,
    antes jsonb,
    despues jsonb,
    campos text[] not null default '{}'
);
create index if not exists auditoria_salon_fecha_idx on public.auditoria_eventos(salon_id, fecha desc, id desc);
create index if not exists auditoria_fecha_idx on public.auditoria_eventos(fecha desc, id desc);
create index if not exists auditoria_tabla_fecha_idx on public.auditoria_eventos(tabla, fecha desc);
create index if not exists auditoria_transaccion_idx on public.auditoria_eventos(transaccion);
alter table public.auditoria_eventos enable row level security;
revoke all on public.auditoria_eventos from public, anon, authenticated, service_role;
grant select on public.auditoria_eventos to authenticated;
revoke all on sequence public.auditoria_eventos_id_seq from public, anon, authenticated, service_role;

create or replace function auditoria_privada.puede_leer(p_salon uuid)
returns boolean language sql stable security definer set search_path = '' as $$
    select auth.uid() is not null and exists (
        select 1 from public.usuarios_perfiles p
        where p.id = auth.uid() and p.estado = 'ACTIVO'
        and (p.rol = 'SUPER_ADMIN' or (p.rol = 'ADMIN' and p.salon_id = p_salon))
    );
$$;
revoke all on function auditoria_privada.puede_leer(uuid) from public, anon;
grant usage on schema auditoria_privada to authenticated;
grant execute on function auditoria_privada.puede_leer(uuid) to authenticated;
drop policy if exists auditoria_solo_administradores on public.auditoria_eventos;
create policy auditoria_solo_administradores on public.auditoria_eventos for select to authenticated
using (auditoria_privada.puede_leer(salon_id));

-- Redacción recursiva: nunca persistir contraseñas, tokens ni claves, ni siquiera en JSON anidado.
create or replace function auditoria_privada.redactar(dato jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare resultado jsonb; item record;
begin
    if jsonb_typeof(dato) = 'object' then
        resultado := '{}';
        for item in select key, value from jsonb_each(dato) loop
            resultado := resultado || jsonb_build_object(item.key,
                case when item.key ~* '(password|contras[eñn]a|token|secret|api.?key|authorization|credential|clave)'
                then '"[PROTEGIDO]"'::jsonb else auditoria_privada.redactar(item.value) end);
        end loop;
        return resultado;
    elsif jsonb_typeof(dato) = 'array' then
        select coalesce(jsonb_agg(auditoria_privada.redactar(value)), '[]') into resultado from jsonb_array_elements(dato);
        return resultado;
    end if;
    return dato;
end;
$$;

-- Resolver pertenencia por salon_id, salones.id o FK declaradas (incluye detalles y tablas puente).
create or replace function auditoria_privada.salon_fila(tabla_oid oid, fila jsonb, profundidad integer default 0)
returns uuid language plpgsql security definer set search_path = '' as $$
declare fk record; padre jsonb; candidato uuid; encontrado uuid; filtro jsonb; par record; condiciones text;
begin
    if fila is null or profundidad > 6 then return null; end if;
    if fila->>'salon_id' is not null then return (fila->>'salon_id')::uuid; end if;
    if tabla_oid = 'public.salones'::regclass then return (fila->>'id')::uuid; end if;
    for fk in select c.confrelid, c.conkey, c.confkey, n.nspname, t.relname
        from pg_catalog.pg_constraint c join pg_catalog.pg_class t on t.oid=c.confrelid
        join pg_catalog.pg_namespace n on n.oid=t.relnamespace
        where c.conrelid=tabla_oid and c.contype='f' and n.nspname='public'
        and t.relname <> 'auditoria_eventos'
    loop
        filtro := '{}';
        condiciones := '';
        for par in select a.attname hijo, b.attname padre
            from unnest(fk.conkey, fk.confkey) k(h,p)
            join pg_catalog.pg_attribute a on a.attrelid=tabla_oid and a.attnum=k.h
            join pg_catalog.pg_attribute b on b.attrelid=fk.confrelid and b.attnum=k.p
        loop
            filtro := filtro || jsonb_build_object(par.padre, fila->par.hijo);
            condiciones := condiciones || case when condiciones = '' then '' else ' and ' end
                || format('p.%I = referencia.%I', par.padre, par.padre);
        end loop;
        if exists(select 1 from jsonb_each(filtro) where value='null'::jsonb) then continue; end if;
        execute format('select to_jsonb(p) from %I.%I p, jsonb_populate_record(null::%I.%I, $1) referencia where %s limit 1',
            fk.nspname, fk.relname, fk.nspname, fk.relname, condiciones)
            into padre using filtro;
        if padre is null then
            -- En un DELETE CASCADE el padre puede haber desaparecido, pero su evento pertenece a esta transacción.
            select e.antes into padre from public.auditoria_eventos e
            where e.transaccion=txid_current() and e.tabla=fk.relname and e.accion='DELETE' and e.antes @> filtro
            order by e.id desc limit 1;
        end if;
        candidato := auditoria_privada.salon_fila(fk.confrelid, padre, profundidad + 1);
        if candidato is not null then
            if encontrado is not null and encontrado <> candidato then return null; end if;
            encontrado := candidato;
        end if;
    end loop;
    return encontrado;
end;
$$;

create or replace function auditoria_privada.registrar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
    previo jsonb; nuevo jsonb; fila jsonb; cambios text[]; actor uuid := auth.uid();
    nombre text; rol_actor text; origen_actor text; salon uuid; salon_anterior uuid;
    cabeceras jsonb; clave jsonb;
begin
    if TG_OP <> 'INSERT' then previo := to_jsonb(OLD); end if;
    if TG_OP <> 'DELETE' then nuevo := to_jsonb(NEW); end if;
    if TG_OP = 'UPDATE' and previo = nuevo then return NEW; end if;
    select coalesce(array_agg(k order by k), '{}') into cambios
    from (select jsonb_object_keys(coalesce(previo,'{}') || coalesce(nuevo,'{}')) k) campos
    where (previo->k) is distinct from (nuevo->k);
    fila := coalesce(nuevo, previo);
    salon := auditoria_privada.salon_fila(TG_RELID, fila);
    if TG_OP = 'UPDATE' then
        salon_anterior := auditoria_privada.salon_fila(TG_RELID, previo);
        -- No exponer los datos del nuevo salón al administrador del salón anterior.
        if salon is distinct from salon_anterior then salon := null; end if;
    end if;
    origen_actor := case when actor is null then 'BASE_DE_DATOS' else 'USUARIO' end;
    -- Solo el backend autenticado con service_role puede proporcionar el actor verificado.
    if auth.jwt()->>'role' = 'service_role' then
        origen_actor := 'SERVIDOR';
        cabeceras := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
        if cabeceras->>'x-audit-actor-id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
            actor := (cabeceras->>'x-audit-actor-id')::uuid;
        end if;
    end if;
    select p.nombre_completo, p.rol into nombre, rol_actor from public.usuarios_perfiles p where p.id=actor;
    select jsonb_object_agg(a.attname, fila->a.attname) into clave
    from pg_catalog.pg_index i join pg_catalog.pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
    where i.indrelid=TG_RELID and i.indisprimary;
    insert into public.auditoria_eventos(salon_id,usuario_id,usuario_nombre,usuario_rol,origen,tabla,accion,registro_id,antes,despues,campos)
    values(salon,actor,coalesce(nombre,case when actor is null then 'Proceso del sistema' else actor::text end),rol_actor,
        origen_actor,TG_TABLE_NAME,TG_OP,coalesce(fila->>'id',clave::text),
        auditoria_privada.redactar(previo),auditoria_privada.redactar(nuevo),cambios);
    if TG_OP='DELETE' then return OLD; end if;
    return NEW;
end;
$$;
revoke all on function auditoria_privada.redactar(jsonb) from public, anon, authenticated;
revoke all on function auditoria_privada.salon_fila(oid,jsonb,integer) from public, anon, authenticated;
revoke all on function auditoria_privada.registrar() from public, anon, authenticated;

-- Todas las tablas públicas actuales, sin auditar el propio historial.
-- Repetir este bloque después de agregar tablas de negocio nuevas.
do $$ declare t record; begin
    for t in select c.relname from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind in ('r','p') and not c.relispartition and c.relname <> 'auditoria_eventos'
    loop
        execute format('drop trigger if exists auditoria_guardar on public.%I',t.relname);
        execute format('drop trigger if exists auditoria_eliminar on public.%I',t.relname);
        execute format('create trigger auditoria_guardar after insert or update on public.%I for each row execute function auditoria_privada.registrar()',t.relname);
        execute format('create trigger auditoria_eliminar before delete on public.%I for each row execute function auditoria_privada.registrar()',t.relname);
    end loop;
end $$;
commit;
