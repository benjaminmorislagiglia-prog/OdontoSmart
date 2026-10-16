# Datos ficticios de desarrollo

El generador `scripts/seed-demo-data.mjs` prepara 20 pacientes, 6 odontólogos con empleados y especialidades, 3 consultorios (Central, Sur y Norte), direcciones y turnos relacionados. Los nombres, DNI, matrículas, domicilios y contactos son ficticios. Los correos usan `example.com` y los teléfonos tienen un bloque `000`; no se deben usar para contactar personas.

Los turnos se distribuyen en días hábiles anteriores, el día de ejecución cuando es hábil y días próximos, dentro de 09:00–17:00. No comparten odontólogo, consultorio o paciente a la misma hora. Las historias pertenecen a turnos atendidos y su contenido corresponde a la especialidad del profesional; los controles de hoy continúan tratamientos previos. Los turnos cancelados o futuros no llevan una historia de atención inventada.

El día de referencia utiliza la zona horaria de Argentina. La cantidad de historias depende de los turnos que ya finalizaron al momento de generar la carga.

## Ejecución local

Vista previa, sin modificar la base:

```powershell
node scripts/seed-demo-data.mjs
```

Reemplazo de los datos de prueba de la base local `OdontoSmartDB`, usando autenticación integrada de Windows:

```powershell
node scripts/seed-demo-data.mjs --replace --server ".\SQLEXPRESS"
```

El reemplazo elimina los datos anteriores de los módulos indicados, incluidos turnos e historias clínicas, y sus catálogos auxiliares de direcciones, localidades, provincias y puestos. Es una operación de preparación de desarrollo expresamente solicitada; no forma parte de las acciones normales de la aplicación. No debe ejecutarse sobre datos clínicos reales.

Antes de modificar registros, crea un backup `COPY_ONLY` con checksum en la carpeta de respaldos de SQL Server y ejecuta `RESTORE VERIFYONLY`. La ruta se informa en consola; el backup no se publica en Git. Si falla el respaldo, no se realiza la carga.

El reemplazo se ejecuta en una transacción, manteniendo las claves foráneas activas y sin reiniciar identidades. Ante un error se revierte la transacción. La agenda usa el mismo bloqueo transaccional de la API durante la carga.

El catálogo **EstadoTurno conserva exactamente sus IDs y nombres**. Se reutilizan sus estados para el historial de los nuevos turnos. No se modifica código de Dashboard; los indicadores reflejan las consultas a la API. Tampoco se reemplazan Insumos, Prestaciones u Obras Sociales, fuera del alcance de los módulos visibles. Si existen consumos, prestaciones asociadas a turnos o equipamiento asociado a consultorios, el script se detiene para evitar eliminar relaciones fuera de su alcance.

Después de cargar, refrescar la web. La carga modifica la base local; el commit en GitHub publica el generador y esta documentación, no el contenido de SQL Server.
