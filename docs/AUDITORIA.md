# Auditoría del sistema

La ruta `/auditoria` aparece en **Administración → Auditoría** para ADMIN y SUPER_ADMIN activos. Permite filtrar por tabla/módulo, usuario, acción, registro y fechas (Nicaragua), navegar por páginas y desplegar una comparación por campo. La autorización se comprueba en el servidor y mediante RLS en la base de datos.

## Activación

1. Seleccionar **sistema-salon-belleza**, de **rafasteel's org**, en Supabase.
2. Ejecutar completo `supabase/migrations/20260929185451_auditoria_sistema.sql` desde SQL Editor, como propietario de la base. Es transaccional y se puede repetir sin duplicar los disparadores ni borrar el historial.
3. Modificar un cliente o una cita con una sesión del sistema y abrir Auditoría como administrador.
4. Confirmar el nombre del responsable y los valores anteriores/nuevos. Verificar también con un usuario no administrador y con un administrador de otro salón.

La migración **no fue aplicada al proyecto remoto** durante esta entrega: la conexión disponible solo mostró la organización Proyectitos, sin proyectos. Se validó en PostgreSQL embebido (PGlite), con tablas de prueba que representan perfiles, salones y relaciones entre registros; el esquema real del proyecto aún requiere verificación.

No ejecutar esta migración en otro proyecto por tener acceso a él. No requiere una clave administrativa nueva ni variables públicas adicionales.

## Captura y protección

- Registra INSERT, UPDATE y DELETE en todas las tablas actuales del esquema `public`, exceptuando el propio historial. Los cambios de funciones RPC y disparadores también quedan registrados.
- Los eventos forman parte de la transacción: un rollback revierte también su auditoría. UPDATE sin cambios no genera eventos.
- Guarda instantáneas anterior/nueva, campos modificados, fecha, clave primaria, usuario, rol, origen y salón. No agrega FK desde el historial a los datos de negocio: eliminar un usuario o registro no elimina sus eventos.
- Las contraseñas, tokens, secretos y claves identificados por nombre de campo se sustituyen por `[PROTEGIDO]`, incluso dentro de JSON anidado. Los campos de texto libre pueden contener información sensible y deben tratarse como datos del negocio.
- ADMIN solo consulta eventos de su salón. SUPER_ADMIN consulta todos, incluidos eventos globales, ambiguos o cambios de pertenencia entre salones.
- El salón se obtiene de `salon_id`, de `salones.id` o de relaciones FK declaradas, hasta seis niveles. Si no se puede determinar, no se adivina a partir del usuario: el evento queda disponible solo para SUPER_ADMIN. Las eliminaciones en cascada pueden resolver padres mediante eventos de la misma transacción.
- El navegador no puede insertar, actualizar, eliminar ni truncar el historial. El registro se escribe mediante funciones internas SECURITY DEFINER en un esquema privado, con search_path vacío y sin permiso de ejecución pública. Los propietarios de la base conservan su capacidad administrativa.
- La identidad habitual viene de `auth.uid()`. Las acciones administrativas de creación/edición de usuarios envían el actor ya verificado mediante una cabecera del cliente de servidor. La base solo acepta esa cabecera cuando el JWT es `service_role`; una cabecera del navegador no suplanta identidades.
- Una operación directa sin usuario autenticado aparece como `Proceso del sistema`, no atribuida a una persona inventada.

## Alcance y mantenimiento

El historial empieza al instalar la migración; no reconstruye cambios pasados. Este módulo registra cambios de filas de negocio, no lecturas, inicio de sesión, archivos binarios de Storage, cambios en `auth.users` (incluidas contraseñas), cambios de esquema, despliegues de código ni TRUNCATE de tablas de negocio. Las actualizaciones de perfiles públicos sí se registran.

Al agregar tablas nuevas, volver a ejecutar el bloque final de instalación de disparadores de la migración. Revisar que todas las tablas de negocio tengan `salon_id` o FK apropiadas. Las nuevas escrituras administrativas deben pasar el actor autenticado a `createAdminClient(actor.id)` después de comprobar permisos.

El historial no tiene borrado desde la aplicación. Revisar crecimiento y definir retención con el propietario antes de habilitar limpieza automática.

## Verificación

Prueba aislada, sin datos reales ni cambios de dependencias del sistema:

```bash
npm install --prefix /tmp/salon-audit-test --no-audit --no-fund @electric-sql/pglite@0.3.14
AUDIT_PGLITE_MODULE=/tmp/salon-audit-test/node_modules/@electric-sql/pglite/dist/index.js node tests/auditoria.mjs
npx tsc --noEmit
npm run build
```

La prueba valida instalación repetible, INSERT/UPDATE/DELETE, antes/después, ausencia de duplicados en UPDATE sin cambios, redacción anidada, relaciones FK, eliminación en cascada, aislamiento entre salones, roles no administrativos, cuentas inactivas, prohibición de alteración del historial, actor autenticado frente a cabeceras falsas y rollback.

Consulta de cobertura para el proyecto real (debe devolver cero filas):

```sql
select c.relname as tabla_sin_auditoria
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
  and not c.relispartition and c.relname <> 'auditoria_eventos'
  and (not exists (select 1 from pg_trigger t where t.tgrelid=c.oid and t.tgname='auditoria_guardar' and t.tgenabled <> 'D')
    or not exists (select 1 from pg_trigger t where t.tgrelid=c.oid and t.tgname='auditoria_eliminar' and t.tgenabled <> 'D'));
```

Después de activar en el proyecto, ejecutar también los asesores de seguridad de Supabase y revisar con las políticas reales de `usuarios_perfiles`.
