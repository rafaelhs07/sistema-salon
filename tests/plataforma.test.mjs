import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const owner = '00000000-0000-4000-8000-000000000001';
const admin = '00000000-0000-4000-8000-000000000002';
const other = '00000000-0000-4000-8000-000000000003';
const salon = '10000000-0000-4000-8000-000000000001';
const salon2 = '10000000-0000-4000-8000-000000000002';
const payment = '20000000-0000-4000-8000-000000000001';
async function identity(id, role = 'authenticated') {
  await db.exec(`reset role; set role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claim.role',$2,false)", [id, role]);
}
async function system() { await db.exec("reset role; select set_config('request.jwt.claim.role','service_role',false)"); }
async function active() { return (await db.query('select public.plataforma_acceso_actual() as activo')).rows[0].activo; }

before(async () => {
  // Contrato mínimo deducido del repositorio. No sustituye la prueba en Supabase real.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role', true) $$;
    grant usage on schema auth to anon,authenticated,service_role;
    grant execute on all functions in schema auth to anon,authenticated,service_role;
    create table salones(id uuid primary key default gen_random_uuid(), nombre text not null, nombre_comercial text, correo text, telefono text);
    create table sucursales(id uuid primary key default gen_random_uuid(), salon_id uuid references salones, nombre text not null);
    create table configuracion_salon(salon_id uuid primary key references salones,nombre_salon text,moneda text,simbolo_moneda text,hora_apertura time,hora_cierre time,intervalo_citas_minutos int,permitir_credito boolean,permitir_pago_combinado boolean,mensaje_recibo text);
    create table usuarios_perfiles(id uuid primary key,salon_id uuid references salones,rol text,estado text,correo text);
    create table clientes(id uuid primary key default gen_random_uuid(),salon_id uuid references salones,nombre text);
    insert into salones(id,nombre) values('${salon}','Salón A'),('${salon2}','Salón B');
    insert into usuarios_perfiles values('${owner}','${salon}','SUPER_ADMIN','ACTIVO','owner@example.com'),('${admin}','${salon}','ADMIN','ACTIVO','admin@example.com'),('${other}','${salon2}','ADMIN','ACTIVO','other@example.com');
    insert into clientes(salon_id,nombre) values('${salon}','Cliente A'),('${salon2}','Cliente B');
    grant all on all tables in schema public to authenticated, service_role;
    alter table usuarios_perfiles enable row level security;
    create policy perfil_propio on usuarios_perfiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
    alter table clientes enable row level security;
    create policy clientes_salon on clientes for all to authenticated using(salon_id=(select salon_id from usuarios_perfiles where id=auth.uid())) with check(salon_id=(select salon_id from usuarios_perfiles where id=auth.uid()));
    create function usuario_actual_tiene_permiso(p_permiso text) returns boolean language sql security definer as $$ select true $$;
    create function registrar_venta_directa(p_nombre text default 'nuevo') returns integer language plpgsql security definer as $$ begin insert into clientes(salon_id,nombre) values('${salon}',p_nombre); return 1; end $$;
    create function obtener_permisos_usuario_actual() returns table(codigo text,permitido boolean) language sql security definer as $$ select 'INICIO_VER'::text,true $$;
    create function configurar_perfil_usuario_creado(p_usuario_id uuid) returns void language plpgsql security definer as $$ begin null; end $$;
  `);
  await db.exec(readFileSync(new URL('../supabase/migrations/202609170001_panel_super_admin.sql', import.meta.url), 'utf8'));
});
after(() => db.close());

test('conserva negocios existentes y respeta el aislamiento por salón', async () => {
  await identity(admin);
  assert.equal(await active(), true);
  assert.deepEqual((await db.query('select nombre from clientes')).rows, [{ nombre: 'Cliente A' }]);
  assert.equal((await db.query('select * from plataforma_pagos')).rows.length, 0);
  assert.equal((await db.query('select * from obtener_permisos_usuario_actual()')).rows[0].codigo, 'INICIO_VER');
});

test('rechaza ADMIN y llamadas directas a mutaciones o implementaciones internas', async () => {
  await identity(admin);
  assert.equal((await db.query('select plataforma_es_super_admin() as permitido')).rows[0].permitido, false);
  await assert.rejects(db.query('select plataforma_validar_actor($1)', [owner]), /permission denied/);
  await assert.rejects(db.query("select _plataforma_base_usuario_actual_tiene_permiso('INICIO_VER')"), /permission denied/);
  await assert.rejects(db.query('select configurar_perfil_usuario_creado($1)', [admin]), /permission denied/);
  await assert.rejects(db.query("update usuarios_perfiles set rol='SUPER_ADMIN' where id=$1", [admin]), /requiere el servidor/);
});

test('suspensión bloquea RLS y RPC con sesión existente, pero permite leer el perfil propio', async () => {
  await system();
  await db.query("select plataforma_guardar_acceso($1,$2,'SUSPENDIDO',null,500,'NIO','Falta de pago')", [owner, salon]);
  await identity(admin);
  assert.equal(await active(), false);
  assert.equal((await db.query('select * from clientes')).rows.length, 0);
  assert.equal((await db.query('select id from usuarios_perfiles')).rows.length, 1);
  await assert.rejects(db.query("select registrar_venta_directa('No debe insertarse')"), /suspendido o vencido/);
  await assert.rejects(db.query("select usuario_actual_tiene_permiso('CAJA_COBRAR')"), /suspendido o vencido/);
  await identity(other);
  assert.equal(await active(), true);
  await identity(owner);
  assert.equal(await active(), true);
});

test('vencimiento incluye todo el día de Nicaragua y SUPER_ADMIN no queda bloqueado', async () => {
  await system();
  await db.query("update plataforma_suscripciones set estado='ACTIVO',vence_el=(now() at time zone 'America/Managua')::date where salon_id=$1", [salon]);
  await identity(admin); assert.equal(await active(), true);
  await system();
  await db.query("update plataforma_suscripciones set vence_el=(now() at time zone 'America/Managua')::date-1 where salon_id=$1", [salon]);
  await identity(admin); assert.equal(await active(), false);
  await identity(owner); assert.equal(await active(), true);
});

test('pago reactiva de forma atómica y un reintento no duplica ni altera el acceso', async () => {
  await system();
  const sql = `select plataforma_registrar_pago($1,$2,$3,500,'NIO',(now() at time zone 'America/Managua')::date,(now() at time zone 'America/Managua')::date+30,(now() at time zone 'America/Managua')::date,'TRANSFERENCIA','REF-1','',true)`;
  await db.query(sql, [owner, payment, salon]);
  await db.query(sql, [owner, payment, salon]);
  assert.equal((await db.query('select count(*)::int as n from plataforma_pagos')).rows[0].n, 1);
  await identity(admin); assert.equal(await active(), true);
  await system();
  await db.query("update plataforma_suscripciones set estado='SUSPENDIDO' where salon_id=$1", [salon]);
  await db.query(sql, [owner, payment, salon]);
  await identity(admin); assert.equal(await active(), false);
});

test('pago con moneda incorrecta se revierte sin modificar acceso ni historial', async () => {
  await system();
  await assert.rejects(db.query(`select plataforma_registrar_pago($1,gen_random_uuid(),$2,500,'USD',current_date,current_date+30,current_date-1,'EFECTIVO','','',true)`, [owner, salon]), /moneda/);
  assert.equal((await db.query('select count(*)::int as n from plataforma_pagos')).rows[0].n, 1);
  await identity(admin); assert.equal(await active(), false);
});

test('crear negocio genera sucursal, configuración, suscripción y auditoría en una transacción', async () => {
  await system();
  const id = (await db.query("select plataforma_crear_negocio($1,'Salón C','c@example.com','88888888',current_date+30,40,'USD') as id", [owner])).rows[0].id;
  for (const tabla of ['sucursales','configuracion_salon','plataforma_suscripciones','plataforma_auditoria']) {
    assert.equal((await db.query(`select count(*)::int as n from ${tabla} where salon_id=$1`, [id])).rows[0].n, 1);
  }
  const antes = (await db.query('select count(*)::int as n from salones')).rows[0].n;
  await assert.rejects(db.query("select plataforma_crear_negocio($1,'Inválido','','',current_date+30,40,'INVALIDA')", [owner]));
  assert.equal((await db.query('select count(*)::int as n from salones')).rows[0].n, antes);
});

test('cuenta eliminada sigue bloqueada aunque una ruta antigua cambie estado a ACTIVO', async () => {
  await system();
  await db.query("update usuarios_perfiles set eliminado_en=now(),estado='ACTIVO' where id=$1", [other]);
  await identity(other); assert.equal(await active(), false);
});

test('SUPER_ADMIN inactivo no puede administrar ni utilizar RPC de plataforma', async () => {
  await system();
  await db.query("update usuarios_perfiles set estado='INACTIVO' where id=$1", [owner]);
  await identity(owner);
  assert.equal(await active(), false);
  assert.equal((await db.query('select plataforma_es_super_admin() as permitido')).rows[0].permitido, false);
  await system();
  await assert.rejects(db.query('select plataforma_validar_actor($1)', [owner]), /SUPER_ADMIN activo/);
});
