# Salarios automáticos

En **Trabajadores → Crear/Editar**, selecciona salario fijo o salario más comisión,
el importe **por período**, la frecuencia y **Registrar salario como gasto automático**.
Elige una fecha inicial de hoy o posterior y guarda. Los empleados existentes requieren
activar esta opción: la instalación no inventa fechas ni genera gastos históricos.

- Semanal: cada 7 días desde la fecha inicial.
- Quincenal: cada 15 días (no equivale a los días 15 y último día del mes).
- Mensual: mismo día del mes; los días 29–31 se ajustan al último día cuando corresponde,
  y se recupera el día original en el mes siguiente.
- El monto completo se registra por período; no hay prorrateos ni cálculo de deducciones.
- Desactivar al trabajador, quitar el salario fijo o desmarcar la opción detiene la
  programación. Para reanudar, actívala con una nueva fecha inicial.

El gasto aparece en Finanzas, Historial financiero, Resumen financiero y su Excel,
así como en Reportes → Financiero y su exportación,
con origen **Salario automático** y categoría **Salarios**. Reduce el resultado
financiero. No ejecuta pagos bancarios, no retira efectivo de una caja, no incluye
comisiones y no constituye confirmación de pago al empleado. No vuelvas a registrar
manualmente el mismo salario como gasto: eso duplicaría el costo.

## Procesamiento y protección

La migración `20261002174604_salarios_automaticos.sql` está aplicada en el proyecto
`sistema-salon-belleza`. El nombre/versionado coincide con su historial remoto.
El job `salarios-automaticos` de pg_cron se ejecuta cada 5 minutos, como `postgres`.
No necesita Vercel Cron, claves administrativas en el cliente ni una sesión abierta.
La fecha contable usa `America/Managua`.

El proceso privado usa un bloqueo de transacción, bloqueo del trabajador y un índice
único trabajador/fecha. Gasto y avance de fecha se confirman en la misma transacción.
Una ejecución repetida no duplica gastos, incluidos los anulados. Las interrupciones
se recuperan desde la próxima fecha pendiente. Solo procesa salones, sucursales y
trabajadores activos con suscripción vigente. Al recuperar acceso puede registrar
períodos pendientes de una programación que siguió activada.

Los cambios de importe se aplican a períodos futuros y conservan los gastos anteriores.
Si hay un período vencido pendiente, primero debe procesarse antes de cambiar importe,
sucursal o programación. Una pausa explícita cancela la programación pendiente.
El importe es el de la moneda configurada en el negocio.

Los roles del navegador no pueden llamar al procesador ni manipular la próxima fecha.
Las políticas existentes por salón se conservan. Los movimientos generados conservan
identidad e importe; se permite su anulación por los permisos existentes, sin regenerarlos.
La auditoría existente registra tanto los gastos como los cambios de programación.

## Verificación

`npm run test:plataforma` incluye pruebas ejecutables con PGlite de fin de mes, año
bisiesto, frecuencias, fechas inválidas, recuperación, idempotencia, aislamiento por
salón, inactividad, suspensión, conservación del monto y permisos.
La integración con los triggers y auditoría reales se comprobó en Supabase en una
transacción revertida, sin dejar registros de prueba.
El primer ciclo real de Cron finalizó con estado `succeeded`.

TypeScript y ESLint de los archivos modificados pasaron. La compilación completa
pasó con Webpack y `experimental.useTypeScriptCli: false` solo durante la prueba:
el entorno de ejecución bloquea el puerto interno de Turbopack y no captura la
salida del subproceso TypeScript CLI. Se restauró `next.config.ts` sin cambios;
estas limitaciones no se trataron como errores del código del salón.

Para comprobar el planificador en Supabase:

```sql
select jobname, schedule, active from cron.job
where jobname = 'salarios-automaticos';

select d.status, d.start_time, d.return_message
from cron.job_run_details d join cron.job j using (jobid)
where j.jobname = 'salarios-automaticos'
order by d.start_time desc limit 10;
```

La revisión de Supabase no detectó avisos de seguridad nuevos en estas funciones.
Persisten avisos anteriores sobre funciones públicas SECURITY DEFINER, search_path
y protección de contraseñas; requieren una revisión separada del sistema existente.
