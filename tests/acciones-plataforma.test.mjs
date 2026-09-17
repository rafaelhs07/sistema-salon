import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function cargar(archivo, imports = {}) {
  const source = readFileSync(new URL(archivo, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const contexto = { exports: {}, require: name => { if (!(name in imports)) throw new Error(`Import inesperado: ${name}`); return imports[name]; }, console: { error() {} }, Date, Intl, Set, Error };
  vm.runInNewContext(js, contexto);
  return contexto.exports;
}
const modelo = cargar('../src/lib/plataforma/modelo.ts');
function acciones(autorizar) {
  return cargar('../src/app/super-admin/actions.ts', {
    'next/cache': { revalidatePath() {} },
    '@/lib/plataforma/server': { exigirSuperAdmin: autorizar },
    '@/lib/plataforma/modelo': modelo,
  });
}
function formulario(datos) { const f = new FormData(); for (const [k,v] of Object.entries(datos)) f.set(k,v); return f; }
const salon = '10000000-0000-4000-8000-000000000001';
const id = '20000000-0000-4000-8000-000000000001';

test('todas las acciones requieren autorización del propietario antes de mutar', async () => {
  const app = acciones(async () => { throw new Error('SUPER_ADMIN requerido'); });
  for (const nombre of ['crearNegocio','guardarAcceso','registrarPago','crearUsuarioPlataforma','cambiarUsuario']) {
    const r = await app[nombre](new FormData());
    assert.equal(r.exito, false); assert.match(r.mensaje, /SUPER_ADMIN/);
  }
});

test('validación de calendario rechaza fechas imposibles y usa fecha de Nicaragua', () => {
  assert.equal(modelo.fechaValida('2026-02-30'), false);
  assert.equal(modelo.fechaValida('2028-02-29'), true);
  assert.equal(modelo.fechaNegocio(new Date('2026-09-18T05:59:59Z')), '2026-09-17');
  assert.equal(modelo.fechaNegocio(new Date('2026-09-18T06:00:00Z')), '2026-09-18');
});

test('rechaza suspensión sin motivo y reactivación con fecha vencida', async () => {
  let llamadas = 0;
  const app = acciones(async () => ({ actorId: id, admin: { rpc() { llamadas++; return { error: null }; } } }));
  const base = { salon_id: salon, estado: 'SUSPENDIDO', vence_el: '', cuota: '40', moneda: 'USD', motivo: '' };
  assert.equal((await app.guardarAcceso(formulario(base))).exito, false);
  assert.equal((await app.guardarAcceso(formulario({ ...base, estado: 'ACTIVO', vence_el: '2000-01-01' }))).exito, false);
  assert.equal(llamadas, 0);
});

test('pago rechaza monto negativo, fechas invertidas y método desconocido antes de llamar a BD', async () => {
  let llamadas = 0;
  const app = acciones(async () => ({ actorId: id, admin: { rpc() { llamadas++; return { error: null }; } } }));
  const base = { id, salon_id: salon, monto: '40', moneda: 'USD', periodo_desde: '2026-01-01', periodo_hasta: '2026-02-01', fecha_pago: '2026-01-01', metodo: 'EFECTIVO', referencia: '', notas: '' };
  for (const cambio of [{ monto: '-1' }, { periodo_hasta: '2025-12-31' }, { metodo: 'INVALIDO' }, { monto: '40.001' }]) {
    assert.equal((await app.registrarPago(formulario({ ...base, ...cambio }))).exito, false);
  }
  assert.equal(llamadas, 0);
});

test('no permite crear SUPER_ADMIN mediante el formulario de negocios', async () => {
  const app = acciones(async () => ({ actorId: id, admin: { from() { throw new Error('No debe acceder a BD'); } } }));
  const r = await app.crearUsuarioPlataforma(formulario({ salon_id: salon, sucursal_id: id, nombre: 'Prueba', correo: 'test@example.com', contrasena: 'test-password', rol: 'SUPER_ADMIN' }));
  assert.equal(r.exito, false); assert.match(r.mensaje, /rol del negocio/);
});

test('protege cuenta propietaria incluso ante una petición de eliminación forjada', async () => {
  const objetivo = { id, salon_id: salon, rol: 'SUPER_ADMIN', correo: 'owner@example.com', eliminado_en: null };
  const query = { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: objetivo, error: null }; } };
  const app = acciones(async () => ({ actorId: salon, admin: { from() { return query; } } }));
  const r = await app.cambiarUsuario(formulario({ usuario_id: id, operacion: 'ELIMINAR', confirmacion: 'owner@example.com' }));
  assert.equal(r.exito, false); assert.match(r.mensaje, /protegidas/);
});
