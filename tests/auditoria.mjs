// Ejecutar con AUDIT_PGLITE_MODULE apuntando a @electric-sql/pglite instalado fuera del proyecto.
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.AUDIT_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const admin = '00000000-0000-0000-0000-000000000001';
const otro = '00000000-0000-0000-0000-000000000002';
const empleado = '00000000-0000-0000-0000-000000000003';
const superadmin = '00000000-0000-0000-0000-000000000004';
const salonA = '10000000-0000-0000-0000-000000000001';
const salonB = '10000000-0000-0000-0000-000000000002';
const query = async sql => (await db.query(sql)).rows;
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('role',current_setting('request.jwt.claim.role',true))$$;
grant usage on schema auth to authenticated, service_role;
create table public.salones(id uuid primary key, nombre text);
create table public.usuarios_perfiles(id uuid primary key, salon_id uuid references salones, nombre_completo text, rol text, estado text);
create table public.clientes(id int primary key, salon_id uuid references salones, nombre text, detalles jsonb);
create table public.detalles_cliente(id int primary key, cliente_id int references clientes on delete cascade, nota text);
insert into salones values('${salonA}','A'),('${salonB}','B');
insert into usuarios_perfiles values
('${admin}','${salonA}','Admin A','ADMIN','ACTIVO'),
('${otro}','${salonB}','Admin B','ADMIN','ACTIVO'),
('${empleado}','${salonA}','Caja','CAJA','ACTIVO'),
('${superadmin}','${salonA}','Super','SUPER_ADMIN','ACTIVO');
grant select, insert, update, delete on clientes, detalles_cliente to authenticated, service_role;
`);
const files = await readdir(new URL('../supabase/migrations/', import.meta.url));
const migration = await readFile(new URL(`../supabase/migrations/${files.find(f=>f.endsWith('_auditoria_sistema.sql'))}`,import.meta.url),'utf8');
await db.exec(migration);
await db.exec(migration); // Instalación repetible, no duplica triggers.
const login = async (id, role='authenticated') => db.exec(`reset role; set request.jwt.claim.sub='${id}'; set request.jwt.claim.role='${role}'; set role ${role};`);
await login(admin);
await db.exec(`insert into clientes values(1,'${salonA}','Ana','{"password":"never-store","nested":{"access_token":"secret"}}');`);
let events = await query('select * from auditoria_eventos');
assert.equal(events.length,1);
assert.equal(events[0].usuario_id,admin);
assert.equal(events[0].despues.detalles.password,'[PROTEGIDO]');
assert.equal(events[0].despues.detalles.nested.access_token,'[PROTEGIDO]');
await db.exec("update clientes set nombre='Ana María' where id=1; update clientes set nombre=nombre where id=1;");
events = await query("select * from auditoria_eventos where accion='UPDATE'");
assert.equal(events.length,1);
assert.deepEqual(events[0].campos,['nombre']);
assert.equal(events[0].antes.nombre,'Ana');
assert.equal(events[0].despues.nombre,'Ana María');
await db.exec("insert into detalles_cliente values(1,1,'Detalle');");
assert.equal((await query("select salon_id from auditoria_eventos where tabla='detalles_cliente'"))[0].salon_id,salonA);
await db.exec("delete from clientes where id=1");
assert.equal((await query("select * from auditoria_eventos where accion='DELETE'")).length,2);
await login(otro);
assert.equal((await query('select * from auditoria_eventos')).length,0);
await db.exec(`insert into clientes values(2,'${salonB}','B',null)`);
assert.equal((await query('select * from auditoria_eventos')).length,1);
await login(empleado);
assert.equal((await query('select * from auditoria_eventos')).length,0);
for (const sql of ["delete from auditoria_eventos", "update auditoria_eventos set usuario_nombre='Falso'", "insert into auditoria_eventos(usuario_nombre,origen,tabla,accion) values('Falso','USUARIO','clientes','INSERT')", "truncate auditoria_eventos"]) {
    await assert.rejects(()=>db.exec(sql),/permission denied/);
}
// Una cabecera del navegador nunca puede suplantar al actor del JWT.
await db.exec(`set request.headers='{"x-audit-actor-id":"${admin}"}'; insert into clientes values(3,'${salonA}','Caja',null);`);
await login(superadmin);
assert.equal((await query("select usuario_id from auditoria_eventos where registro_id='3'"))[0].usuario_id,empleado);
assert.equal((await query('select * from auditoria_eventos')).length,7);
await login('', 'service_role');
await db.exec(`set request.headers='{"x-audit-actor-id":"${admin}"}'; update clientes set nombre='Servidor' where id=3;`);
await login(superadmin);
assert.equal((await query("select usuario_id from auditoria_eventos where origen='SERVIDOR'"))[0].usuario_id,admin);
await db.exec('reset role');
await db.exec(`update usuarios_perfiles set estado='INACTIVO' where id='${admin}'`);
await login(admin);
assert.equal((await query('select * from auditoria_eventos')).length,0);
await db.exec('reset role');
await db.exec(`update usuarios_perfiles set estado='ACTIVO' where id='${admin}'`);
await login(admin);
const before = (await query('select * from auditoria_eventos')).length;
await db.exec(`begin; insert into clientes values(4,'${salonA}','Rollback',null); rollback;`);
assert.equal((await query('select * from auditoria_eventos')).length,before);
// Cambio de salón: únicamente SUPER_ADMIN ve la instantánea cruzada.
await db.exec(`update clientes set salon_id='${salonB}' where id=3;`);
assert.equal((await query("select * from auditoria_eventos where registro_id='3' and accion='UPDATE' and despues->>'salon_id' <> antes->>'salon_id'")).length,0);
await login(superadmin);
assert.equal((await query("select * from auditoria_eventos where registro_id='3' and salon_id is null")).length,1);
await login('', 'anon');
await assert.rejects(()=>db.exec('select * from auditoria_eventos'),/permission denied/);
console.log('PASS: captura, antes/después, no-op, redacción, FK, cascada, RLS por salón/rol/estado, inmutabilidad, actor, rollback e instalación repetible.');
await db.close();
