import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('salarios: fechas, generación, permisos, aislamiento e idempotencia', async () => {
  const db = new PGlite();
  const rows = async sql => (await db.query(sql)).rows;
  const scalar = async sql => Object.values((await rows(sql))[0])[0];
  const today = "(now() at time zone 'America/Managua')::date";
  const salon = '10000000-0000-0000-0000-000000000001';
  const other = '10000000-0000-0000-0000-000000000002';
  const branch = '20000000-0000-0000-0000-000000000001';
  const worker = '30000000-0000-0000-0000-000000000001';
  try {
    await db.exec('create role anon; create role authenticated; create role service_role;');
    await db.exec(await readFile(new URL('./fixtures/nomina-schema.sql', import.meta.url), 'utf8'));
    const migration = await readFile(new URL('../supabase/migrations/20261002174604_salarios_automaticos.sql', import.meta.url), 'utf8');
    // pg_cron no está disponible en PGlite; se verifica también en Supabase real.
    await db.exec(migration.split('create extension if not exists pg_cron;')[0]);
    await db.exec(`
      insert into salones(id,nombre) values('${salon}','Salón A'),('${other}','Salón B');
      insert into sucursales(id,salon_id,nombre) values('${branch}','${salon}','Principal');
      insert into plataforma_suscripciones(salon_id,estado) values('${salon}','ACTIVO');
      insert into trabajadores(id,salon_id,sucursal_id,nombre_completo,modalidad_pago,salario_fijo)
      values('${worker}','${salon}','${branch}','Prueba','SALARIO_MAS_COMISION',1200);
    `);
    assert.equal(await scalar('select nomina_privada.procesar_salarios()'), 0, 'no activa salarios existentes');
    for (const [fecha, inicio, frecuencia, esperado] of [
      ['2026-01-31','2026-01-31','MENSUAL','2026-02-28'],
      ['2026-02-28','2026-01-31','MENSUAL','2026-03-31'],
      ['2028-01-31','2028-01-31','MENSUAL','2028-02-29'],
      ['2026-12-31','2026-01-31','MENSUAL','2027-01-31'],
      ['2026-12-28','2026-12-28','SEMANAL','2027-01-04'],
      ['2026-12-28','2026-12-28','QUINCENAL','2027-01-12'],
    ]) assert.equal(await scalar(`select nomina_privada.siguiente_fecha('${fecha}','${inicio}','${frecuencia}')::text`), esperado);

    await assert.rejects(db.exec(`update trabajadores set salario_automatico=true,salario_fecha_inicio=${today}-1 where id='${worker}'`), /hoy o posterior/);
    await assert.rejects(db.exec(`update trabajadores set salario_automatico=true,salario_fecha_inicio=${today},salon_id='${other}' where id='${worker}'`), /mismo salón/);
    await db.exec(`update trabajadores set salario_automatico=true,salario_fecha_inicio=${today},frecuencia_pago='SEMANAL' where id='${worker}'`);
    await assert.rejects(db.exec(`update trabajadores set salario_fijo=1500 where id='${worker}'`), /pendiente/);
    assert.equal(await scalar('select nomina_privada.procesar_salarios()'), 1);
    assert.equal(await scalar('select nomina_privada.procesar_salarios()'), 0);
    assert.equal(await scalar("select count(*)::int from movimientos_financieros where origen='SALARIO' and tipo='GASTO' and estado='APLICADO'"), 1);
    assert.equal(Number(await scalar('select sum(monto) from movimientos_financieros')), 1200);
    assert.equal(await scalar("select count(*)::int from movimientos_financieros where caja_sesion_id is not null or metodo_pago is not null"), 0);
    assert.equal(await scalar(`select salario_proximo_pago=${today}+7 from trabajadores where id='${worker}'`), true);
    // Una repetición por recuperación tampoco recrea una fecha anulada.
    await db.exec(`update movimientos_financieros set estado='ANULADO'; update trabajadores set salario_proximo_pago=${today} where id='${worker}'`);
    assert.equal(await scalar('select nomina_privada.procesar_salarios()'), 0);
    await db.exec(`update trabajadores set salario_fijo=1500 where id='${worker}'`);
    assert.equal(Number(await scalar('select monto from movimientos_financieros')), 1200, 'historial no cambia');
    // Simula una interrupción: recupera tres fechas, usando su fecha local original.
    await db.exec(`update trabajadores set salario_proximo_pago=${today}-21 where id='${worker}'`);
    assert.equal(await scalar('select nomina_privada.procesar_salarios()'), 3);
    assert.equal(await scalar('select count(*)::int from categorias_financieras'), 1);
    assert.equal(await scalar("select bool_and((fecha_movimiento at time zone 'America/Managua')::date=salario_fecha) from movimientos_financieros"), true);

    await db.exec(`update trabajadores set estado='INACTIVO' where id='${worker}'`);
    assert.equal(await scalar(`select salario_automatico from trabajadores where id='${worker}'`), false);
    await db.exec(`update trabajadores set estado='ACTIVO' where id='${worker}'`);
    assert.equal(await scalar('select nomina_privada.procesar_salarios()'), 0);
    await db.exec(`update trabajadores set salario_automatico=true,salario_fecha_inicio=${today} where id='${worker}'; update plataforma_suscripciones set estado='SUSPENDIDO';`);
    assert.equal(await scalar('select nomina_privada.procesar_salarios()'), 0);
    await db.exec(`update plataforma_suscripciones set estado='ACTIVO'; update trabajadores set modalidad_pago='SOLO_COMISION' where id='${worker}'`);
    assert.equal(await scalar(`select salario_automatico from trabajadores where id='${worker}'`), false);

    // Modela las políticas por salón vigentes y prueba bajo el rol real del navegador.
    await db.exec(`
      grant select,insert,update,delete on trabajadores,movimientos_financieros to authenticated;
      grant select on sucursales to authenticated;
      alter table trabajadores enable row level security;
      alter table movimientos_financieros enable row level security;
      create policy tenant on trabajadores to authenticated using(salon_id = current_setting('test.salon')::uuid) with check(salon_id = current_setting('test.salon')::uuid);
      create policy tenant on movimientos_financieros to authenticated using(salon_id = current_setting('test.salon')::uuid) with check(salon_id = current_setting('test.salon')::uuid);
      set test.salon='${salon}'; set role authenticated;
    `);
    await assert.rejects(db.exec('select nomina_privada.procesar_salarios()'), /permission denied/);
    await assert.rejects(db.exec(`update trabajadores set salario_proximo_pago=${today} where id='${worker}'`), /administra el sistema/);
    await assert.rejects(db.exec('delete from movimientos_financieros'), /No se puede eliminar/);
    await assert.rejects(db.exec('update movimientos_financieros set monto=1'), /No se puede modificar/);
    await db.exec(`update trabajadores set modalidad_pago='SALARIO_FIJO',salario_automatico=true,salario_fecha_inicio=${today}+1 where id='${worker}'`);
    assert.equal(await scalar(`select salario_proximo_pago=${today}+1 from trabajadores where id='${worker}'`), true);
    await db.exec(`set test.salon='${other}'`);
    assert.equal(await scalar('select count(*)::int from movimientos_financieros'), 0);
    assert.equal(await scalar('select count(*)::int from trabajadores'), 0);
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.exec('select nomina_privada.procesar_salarios()'), /permission denied/);
  } finally { await db.close(); }
});
