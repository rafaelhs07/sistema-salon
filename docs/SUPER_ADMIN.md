# Panel SUPER_ADMIN

Ruta: `/super-admin`. Solo puede entrar un perfil `SUPER_ADMIN` activo. Al iniciar sesión, ese rol abre directamente el panel. También aparece en el menú lateral del salón.

## Activar esta versión

1. Incorpora la rama `feat/panel-super-admin` a tu copia del proyecto.
2. En Supabase, abre SQL Editor y ejecuta **una sola vez y completo** `supabase/migrations/202609170001_panel_super_admin.sql`. Después ejecuta `supabase/migrations/202609170002_sucursal_principal_plataforma.sql` para marcar correctamente la sucursal principal de los negocios nuevos. Si ya aplicaste la primera migración, ejecuta únicamente la segunda. Primero aplícalo en un proyecto de prueba o respaldo de tu esquema. La migración es transaccional: si falla, no se aplican cambios parciales.
3. Verifica que tu cuenta existente tenga `rol = 'SUPER_ADMIN'` y `estado = 'ACTIVO'` en `usuarios_perfiles`. Esta migración no asciende a ningún usuario. Conserva tu cuenta de propietario separada de las cuentas ADMIN de los negocios.
4. Mantén estas variables en `.env.local` y en el servidor de producción:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

   La última clave es privada y se utiliza exclusivamente en el servidor. No la subas a GitHub.
5. En Supabase Auth deshabilita el registro público de usuarios: las cuentas se crean desde el panel. Revisa cualquier trigger propio de `auth.users` que convierta metadata proporcionada por el usuario en roles: esa metadata nunca debe otorgar `SUPER_ADMIN`.
6. En Windows CMD, dentro de tu carpeta real del proyecto:

   ```bat
   npm install
   npm run dev
   ```

   Abre `http://localhost:3000/super-admin`. En producción, ejecuta `npm run build` y reinicia el servicio después de aplicar la migración.

**La migración debe aplicarse antes del código.** Si faltan las funciones de acceso, el sistema bloquea el acceso por seguridad. No requiere un proceso programado: verifica el vencimiento en cada petición y consulta a la base de datos.

## Uso

- **Nuevo negocio:** nombre, contacto, cuota, moneda y fecha de acceso. Crea en una transacción el salón, su sucursal principal, la configuración inicial y la suscripción. Después selecciona el negocio y crea su administrador en Usuarios. No crea una cuenta Auth si falla la creación del negocio.
- **Dar / quitar acceso:** cambia a Dar acceso o Suspender acceso. Suspender exige un motivo. Dar acceso exige una fecha vigente o dejar la fecha vacía para acceso sin vencimiento.
- **Registrar pago:** importe, moneda de la suscripción, fecha efectiva, período cubierto, método, referencia y notas. La opción Reactivar y renovar acceso habilita el salón y extiende la fecha hasta el período pagado; nunca acorta una cobertura posterior. Si la desmarcas, el registro no modifica el acceso. Las solicitudes repetidas conservan un identificador para no duplicar pagos.
- **Vencimiento:** el día indicado es inclusivo, según `America/Managua`. Si vence el 30, se bloquea el 1 a las 00:00 de Nicaragua. Vencido y suspendido manualmente se muestran por separado.
- **Usuarios:** crea cuentas con contraseña directamente, sin correos de invitación. Selecciona negocio, sucursal y rol ADMIN, RECEPCION, CAJA, TRABAJADOR o INVENTARIO. Se verifica que la sucursal pertenezca al negocio.
- **Desactivar / activar usuario:** cambia solo esa cuenta. Reactivar una cuenta no reactiva el negocio.
- **Eliminar usuario:** exige escribir su correo. Bloquea el perfil y utiliza eliminación irreversible de Auth con conservación de referencias (`shouldSoftDelete`). El historial de ventas y operaciones sigue vinculado al perfil archivado. Una cuenta eliminada no puede reactivarse. Si Auth falla, permanece bloqueada y puede reintentarse. Las cuentas SUPER_ADMIN están protegidas.
- Los pagos de la plataforma no se mezclan con ventas, caja ni gastos de los salones. El resumen mensual separa NIO y USD. La cuota es de referencia; no genera facturas, deudas ni cobros bancarios automáticos.
- Los salones existentes reciben inicialmente acceso sin vencimiento; asígnales su fecha y cuota desde el panel.

## Protección y alcance de la migración

- Se revalida al propietario en el servidor antes de crear un cliente administrativo.
- La suspensión afecta a todos los usuarios ordinarios del salón, incluso con sesiones abiertas: el siguiente acceso, acción o consulta queda bloqueado. Los datos ya descargados en una pantalla abierta no pueden retirarse del navegador.
- Se agrega una política RLS restrictiva a las tablas públicas existentes, manteniendo las políticas de permisos y aislamiento originales. Las tablas que aún no tuvieran políticas permisivas dejarán de ser accesibles para usuarios normales: revisar ese caso en la base real antes del despliegue.
- El usuario bloqueado puede leer su propio perfil para mostrar el estado y cerrar sesión. SUPER_ADMIN activo conserva acceso a la plataforma aunque su salón asociado esté vencido.
- Las RPC operativas SECURITY DEFINER utilizadas por el repositorio se envuelven con validación de acceso. Se conservan sus firmas, parámetros y lógica, y se revocan los permisos de las implementaciones internas. `configurar_perfil_usuario_creado` queda restringida a `service_role`.
- La migración toma como contrato las tablas y columnas observadas en el código. El repositorio no contiene el esquema completo, políticas originales ni triggers de Supabase. Si `salones` o `sucursales` tienen otros campos obligatorios sin valor predeterminado, adapta `plataforma_crear_negocio` a ese esquema antes de utilizar la función.
- Para nuevas tablas públicas, agrega la política restrictiva `plataforma_acceso_actual()` además de sus políticas de aislamiento. Para nuevas RPC SECURITY DEFINER, valida el acceso dentro de cada función; las RPC no presentes en este repositorio requieren revisión individual. Las políticas de Storage y los procesos externos que utilizan service_role requieren su propia validación.
- Las operaciones de acceso, creación y pagos dejan registro en `plataforma_auditoria`. Los pagos y cambios de suscripción se guardan junto con su auditoría en una transacción. Auth y Postgres no comparten transacción: las cuentas nuevas se revierten ante fallos del perfil, y la eliminación falla manteniendo el acceso bloqueado.

## Verificación

```bat
npm run test:plataforma
npx tsc --noEmit
npm run build
```

Las pruebas ejecutan PostgreSQL mediante PGlite con un esquema mínimo compatible y datos ficticios. Cubren aislamiento de salones, acceso de ADMIN/SUPER_ADMIN, bloqueo de peticiones directas, vencimiento, pagos idempotentes, transacciones y cuentas eliminadas. No conectan ni modifican la base de producción.

Antes de activar negocios reales, prueba en Supabase con una cuenta SUPER_ADMIN y dos cuentas ADMIN de distintos salones: crea un negocio y su usuario, registra un pago, suspende un salón con una sesión abierta, comprueba el bloqueo y reactívalo; el otro salón debe continuar funcionando. Verifica también el trigger real de creación de perfiles y una eliminación de una cuenta de prueba.
