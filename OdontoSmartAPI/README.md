# OdontoSmart API

API ASP.NET Core sobre .NET 10, Entity Framework Core 10 y SQL Server. Utiliza controladores y DTOs; conserva el esquema relacional de OdontoSmart.

## Preparación local

Requiere .NET SDK 10 y una instancia de SQL Server disponible.

1. Para una instalación nueva, ejecutar OdontoSmart.sql de la raíz en SQL Server. No ejecutarlo sobre una base existente.
2. Ejecutar Actualizacion Prestacion-Turno.sql, Actualizacion Estados-Turno.sql y Actualizacion Historia-Clinica.sql. Son idempotentes; el último agrega la anulación a bases existentes sin eliminar historias. El script base ya incluye las columnas de anulación para instalaciones nuevas.
3. Copiar appsettings.Local.example.json a appsettings.Local.json dentro de OdontoSmartAPI y ajustar la conexión de la instancia. Este archivo no se publica. También puede usarse ConnectionStrings__DefaultConnection.
4. Configurar Cors:AllowedOrigins con el origen exacto de Vite si difiere de localhost/127.0.0.1:5173 o :5174.

Desde la raíz:

```sh
dotnet build OdontoSmart.sln
dotnet run --project OdontoSmartAPI --launch-profile http
```

El perfil HTTP escucha en http://localhost:5122. El perfil HTTPS existente utiliza https://localhost:7122 y requiere un certificado de desarrollo confiable. IIS Express conserva su configuración propia en launchSettings.json.

Swagger UI: http://localhost:5122/swagger. OpenAPI: http://localhost:5122/swagger/v1/swagger.json. Se habilitan en Development.

En frontend/.env.local configurar VITE_API_URL con el origen elegido y reiniciar Vite. Las URLs no se repiten en componentes.

## Pruebas

```powershell
$env:ODONTOSMART_API_URL = 'http://localhost:5122'
node scripts/check-api.mjs --allow-write
```

Ejecutar desde la raíz y únicamente sobre una base local de desarrollo. El script crea datos identificados de verificación y conserva su historial. No configura ni restaura bases automáticamente.

Ver [informe de revisión e integración](../docs/revision-api.md) para los cambios, contratos y límites de la verificación.

La autenticación real sigue pendiente: el login actual de la web controla navegación localmente.

## Consulta de inactivos y reactivación

Pacientes, Empleados y Odontólogos reutilizan sus campos Activo y sus endpoints GET, POST, PUT y DELETE. Se conservan las tablas, los campos de los DTOs y los mapeos EF.

| Operación | Pacientes | Empleados | Odontólogos |
| --- | --- | --- | --- |
| Activos (comportamiento por defecto) | GET /api/Pacientes | GET /api/Empleados | GET /api/Odontologos |
| Desactivados | GET /api/Pacientes?activo=false | GET /api/Empleados?activo=false | GET /api/Odontologos?activo=false |
| Detalle, admitiendo inactivos | GET /api/Pacientes/{id}?incluirInactivos=true | GET /api/Empleados/{id}?incluirInactivos=true | GET /api/Odontologos/{id}?incluirInactivos=true |
| Reactivar el mismo registro | POST /api/Pacientes/{id}/reactivar | POST /api/Empleados/{id}/reactivar | POST /api/Odontologos/{id}/reactivar |

Los nuevos POST son idempotentes y devuelven 204; si no existe el registro, devuelven 404. La reactivación sólo modifica Activo y conserva las relaciones e historial. DELETE sigue realizando baja lógica. Para pacientes y empleados un Activo nulo se considera inactivo.

`PUT /api/Pacientes/{id}` admite editar pacientes activos o inactivos y conserva su estado por defecto. La opción `?reactivar=true` guarda los datos y Activo = true juntos mediante el mismo SaveChangesAsync. Conserva las validaciones existentes de campos, DNI, dirección y obra social; si fallan, no guarda los cambios ni reactiva. No agrega campos a los DTOs ni cambia tablas. La reactivación directa desde el listado sigue usando el POST existente.

Los DTOs de pacientes y empleados validan DNI numérico conservado como string, nombres con letras y teléfono con formato telefónico. Pacientes también rechaza nacimiento futuro. Direcciones exige número entero positivo y CP alfanumérico de 4 a 10 caracteres con algún dígito; Odontólogos valida matrícula, días escritos y rango horario HH:mm-HH:mm (también admite HH:mm a HH:mm). Las expresiones comunes están en `Validation/InputPatterns.cs`. Las restricciones previas de longitud, email y referencias se mantienen. Los DTOs numéricos de los demás recursos ya utilizan tipos int/decimal y rangos.

Prueba específica, con la API local en ejecución:

```powershell
$env:ODONTOSMART_API_URL = 'http://localhost:5122'
node scripts/check-input-validation.mjs
```

Comprueba errores de validación por campo, tipos JSON incorrectos y formatos válidos. Usa PUT sobre un ID previamente comprobado inexistente, sin crear o modificar registros. `check-management.mjs` comprueba además altas con DNI que conserva ceros iniciales, edición y reactivación.

El listado de odontólogos aplica la misma disponibilidad que Turnos: odontólogo y empleado deben estar activos. La consulta de inactivos incluye tanto odontólogos inactivos por su propio campo como los vinculados con un empleado inactivo. El DTO conserva el valor original de Odontologo.Activo. Reactivar un odontólogo con empleado inactivo devuelve 409; reactivar un empleado no altera el estado propio del odontólogo. La restricción existente de un odontólogo por empleado sigue incluyendo los registros inactivos.

Prueba del circuito completo, desde la raíz con la API en ejecución:

```powershell
$env:ODONTOSMART_API_URL = 'http://localhost:5122'
node scripts/check-management.mjs --allow-write
```

La prueba crea registros identificados con “Verificación”, valida CRUD, reactivación, disponibilidad, especialidades, consultorios y los cinco estados de Agenda. Conserva el turno cancelado y su historia clínica, desactiva el paciente, empleado y odontólogo de prueba y retira únicamente su especialidad, asociación y consultorio temporales sin historial. No modifica los registros existentes.

## Estados de turno y Ausente

El catálogo incluye Pendiente, Confirmado, Atendido, Cancelado y Ausente. `Actualizacion Estados-Turno.sql` incorpora los faltantes mediante `IF NOT EXISTS`, conservando IDs y nombres existentes. El script general `OdontoSmart.sql` también incluye el catálogo completo para nuevas instalaciones. No se modifican tablas, columnas ni mapeos de Entity Framework.

`GET /api/estadosturno` devuelve el catálogo. Para marcar Ausente se reutiliza `POST /api/historialestadoturno` con `idTurno` e `idEstadoTurno` obtenidos de la API. El controlador conserva el turno, agrega un registro al historial con `DateTime.Now` y el último estado aparece en `GET /api/Turnos`. Ausente no cancela ni libera la reserva; Cancelado mantiene su comportamiento existente.

Prueba específica desde la raíz, sólo contra una base local de desarrollo:

```powershell
$env:ODONTOSMART_API_URL = 'http://localhost:5122'
node scripts/check-ausente.mjs --allow-write
```

La prueba consulta los estados sin crearlos y crea tres turnos con catálogos existentes: uno queda Ausente, otro Atendido y otro Cancelado. Comprueba que no puede cancelarse el turno Atendido. No reemplaza los datos de demostración ni ejecuta el generador de datos.

## Transiciones de estados de turno

La validación compartida está en `Data/TurnoEstadoRules.cs` y se aplica tanto al POST del historial como al DELETE de Turnos (cancelación lógica). No se modifican tablas ni mapeos EF.

| Estado actual | Destinos permitidos |
| --- | --- |
| Pendiente | Confirmado, Cancelado, Ausente |
| Confirmado | Atendido, Cancelado, Ausente |
| Atendido, Cancelado, Ausente | Ninguno: son finales |

Ausente sólo se permite cuando ya llegó la fecha/hora del turno. Se comparan `Fecha` y `Hora` con la hora local del servidor, igual que el historial existente (`DateTime.Now`); la instalación local usa Argentina (UTC−03:00). Al alojar la API en otro servidor debe conservarse la zona horaria de la clínica. Los turnos no llevan offset y no se convierten a UTC.

Los cambios inválidos y los POST que repiten el estado actual devuelven HTTP 409 con un mensaje, sin escribir. Repetir DELETE sobre un turno Cancelado sigue devolviendo 204 sin duplicar historial. Cada transición válida agrega un registro con su fecha/hora, conservando el turno y el historial anterior. El bloqueo transaccional de agenda también evita duplicados por solicitudes simultáneas.

Los DTO de Turnos incluyen `estadosPermitidos` con IDs del catálogo real, calculados por la API. Agenda usa esos IDs para su selector y para habilitar Cancelar turno. Se actualizan al consultar el listado o abrir el detalle; al llegar la hora de un turno futuro debe reabrirse el detalle para obtener Ausente. La API vuelve a validar siempre al guardar.

Prueba específica (siete turnos nuevos sobre catálogos activos existentes; no cambia registros previos y conserva los historiales de prueba):

```powershell
$env:ODONTOSMART_API_URL = 'http://localhost:5122'
node scripts/check-status-transitions.mjs --allow-write
```

Verifica las seis transiciones permitidas, todas las salidas de estados finales, repeticiones, Ausente futuro, cancelación por DELETE, concurrencia y persistencia por GET. `check-api.mjs`, `check-management.mjs` y `check-ausente.mjs` también respetan los estados finales.

## Anulación de historia clínica

`POST /api/HistorialClinico/{id}/anular` recibe `{ "motivo": "Registro cargado por error" }`. Exige un motivo no vacío de hasta 300 caracteres y devuelve el DTO con `anulado`, `motivoAnulacion` y `fechaAnulacion` (UTC). Los GET generales, por ID y por paciente incluyen las historias anuladas.

La actualización es atómica y los reintentos conservan el primer motivo y fecha. PUT devuelve 409 para registros anulados; tampoco permite cambiar paciente o turno. DELETE continúa bloqueando la eliminación física con 409. La restricción de una historia por turno se mantiene incluso después de anular; no se incorporan usuarios ni reglas de auditoría nuevas.
