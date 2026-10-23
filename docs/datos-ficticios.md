# Datos ficticios de desarrollo

El generador `scripts/seed-demo-data.mjs` reemplaza los datos de prueba de la base local por un conjunto nuevo y relacionado:

- 10 pacientes activos, con direcciones y contactos individuales.
- 6 odontólogos activos, cada uno vinculado a un empleado activo, una matrícula y una especialidad.
- 3 consultorios: Consultorio 1, Consultorio 2 y Consultorio 3, utilizados por la agenda sin agregar un módulo de Consultorios a la web.
- 3 obras sociales ficticias; algunos pacientes tienen cobertura y otros no.
- 8 turnos: 2 Pendiente, 2 Confirmado, 2 Atendido, 1 Cancelado y 1 Ausente.
- 2 historias clínicas, exclusivamente de los dos turnos atendidos, con el paciente y la especialidad correspondientes.

Los nombres, DNI, matrículas, domicilios y contactos son ficticios. Los DNI y teléfonos no se repiten dentro de la carga. Los correos usan `example.com` y los teléfonos tienen un bloque `000`; no se deben usar para contactar personas. Las fotos son opcionales y los nuevos registros no tienen una imagen cargada.

Los turnos respetan los días hábiles y el horario de atención de 09:00 a 17:00. No comparten odontólogo, consultorio o paciente a la misma hora. Participan los seis profesionales. Los turnos atendidos y el ausente corresponden a horarios ya transcurridos; los pendientes y confirmados quedan en el futuro. Los cancelados, ausentes y futuros no llevan una historia de atención inventada.

El día de referencia utiliza la zona horaria de Argentina. Si la carga se ejecuta un día hábil entre las 12:00 y las 13:59, los ocho turnos quedan ese mismo día: cuatro por la mañana y cuatro entre las 14:00 y las 15:30. En otros horarios se utilizan el día hábil anterior o el siguiente, según corresponda, para mantener fechas coherentes.

Cada turno empieza con un historial Pendiente. Los atendidos y el ausente pasan primero por Confirmado; las fechas de los cambios son cronológicas y no futuras. Se conservan los turnos cancelados y ausentes en la agenda y el historial. El generador valida los conteos, las relaciones de las historias clínicas y las transiciones antes de confirmar la transacción.

## Ejecución local

Vista previa, sin modificar la base:

```powershell
node scripts/seed-demo-data.mjs
```

Reemplazo de los datos de prueba de la base local `OdontoSmartDB`, usando autenticación integrada de Windows:

```powershell
node scripts/seed-demo-data.mjs --replace --server ".\SQLEXPRESS"
```

El reemplazo elimina los registros de prueba anteriores de todas las tablas del proyecto, excepto EstadoTurno, respetando las dependencias. Esto incluye los datos anteriores de pacientes, empleados, odontólogos, historias, turnos, direcciones y catálogos auxiliares. Insumos, Prestaciones y Equipamiento, junto con sus asociaciones, quedan vacíos; las obras sociales se reemplazan por las tres coberturas ficticias indicadas. Es una operación de preparación de desarrollo expresamente solicitada; no forma parte de las acciones normales de la aplicación. No debe ejecutarse sobre datos clínicos reales.

Antes de modificar registros, crea un backup `COPY_ONLY` con checksum en la carpeta de respaldos de SQL Server y ejecuta `RESTORE VERIFYONLY`. La ruta se informa en consola; el backup no se publica en Git. Si falla el respaldo, no se realiza la carga.

El reemplazo se ejecuta en una transacción, manteniendo las claves foráneas activas y sin reiniciar identidades. Ante un error se revierte la transacción. La agenda usa el mismo bloqueo transaccional de la API durante la carga.

El catálogo **EstadoTurno conserva exactamente sus IDs y nombres**, incluido Ausente. Se reutilizan los cinco estados requeridos desde la base, sin insertar ni reemplazar estados. No se cambia la estructura de las tablas ni Entity Framework. No se modifica código de Dashboard ni del frontend: los indicadores y listados reflejan las consultas a la API. Los archivos de fotos anteriores se conservan localmente para no impedir recuperar el respaldo y permanecen excluidos de Git.

Después de cargar, refrescar la web. La carga modifica la base local; el commit en GitHub publica el generador y esta documentación, no el contenido de SQL Server.
