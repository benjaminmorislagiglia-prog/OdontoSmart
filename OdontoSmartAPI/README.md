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

## Consulta de desactivados y reactivación

Pacientes, Empleados y Odontólogos reutilizan sus campos Activo y sus endpoints GET, POST, PUT y DELETE. No hay cambios de tablas, DTOs ni mapeos EF.

| Operación | Pacientes | Empleados | Odontólogos |
| --- | --- | --- | --- |
| Activos (comportamiento por defecto) | GET /api/Pacientes | GET /api/Empleados | GET /api/Odontologos |
| Desactivados | GET /api/Pacientes?activo=false | GET /api/Empleados?activo=false | GET /api/Odontologos?activo=false |
| Detalle, admitiendo desactivados | GET /api/Pacientes/{id}?incluirInactivos=true | GET /api/Empleados/{id}?incluirInactivos=true | GET /api/Odontologos/{id}?incluirInactivos=true |
| Reactivar el mismo registro | POST /api/Pacientes/{id}/reactivar | POST /api/Empleados/{id}/reactivar | POST /api/Odontologos/{id}/reactivar |

Los nuevos POST son idempotentes y devuelven 204; si no existe el registro, devuelven 404. La reactivación sólo modifica Activo y conserva las relaciones e historial. DELETE sigue realizando baja lógica. Para pacientes y empleados un Activo nulo se considera desactivado.

`PUT /api/Pacientes/{id}` admite editar pacientes activos o desactivados y conserva su estado por defecto. La opción `?reactivar=true` guarda los datos y Activo = true juntos mediante el mismo SaveChangesAsync. Conserva las validaciones existentes de campos, DNI, dirección y obra social; si fallan, no guarda los cambios ni reactiva. No requiere cambios de DTOs ni tablas. La reactivación directa desde el listado sigue usando el POST existente.

El listado de odontólogos aplica la misma disponibilidad que Turnos: odontólogo y empleado deben estar activos. La consulta de desactivados incluye tanto odontólogos desactivados por su propio campo como los vinculados con un empleado desactivado. El DTO conserva el valor original de Odontologo.Activo. Reactivar un odontólogo con empleado desactivado devuelve 409; reactivar un empleado no altera el estado propio del odontólogo. La restricción existente de un odontólogo por empleado sigue incluyendo los registros desactivados.

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

La prueba consulta los estados sin crearlos, verifica 24 solicitudes HTTP, crea tres turnos con catálogos existentes y conserva su historial: uno queda Ausente y los otros dos Cancelado. No reemplaza los datos de demostración ni ejecuta el generador de datos.

## Anulación de historia clínica

`POST /api/HistorialClinico/{id}/anular` recibe `{ "motivo": "Registro cargado por error" }`. Exige un motivo no vacío de hasta 300 caracteres y devuelve el DTO con `anulado`, `motivoAnulacion` y `fechaAnulacion` (UTC). Los GET generales, por ID y por paciente incluyen las historias anuladas.

La actualización es atómica y los reintentos conservan el primer motivo y fecha. PUT devuelve 409 para registros anulados; tampoco permite cambiar paciente o turno. DELETE continúa bloqueando la eliminación física con 409. La restricción de una historia por turno se mantiene incluso después de anular; no se incorporan usuarios ni reglas de auditoría nuevas.
