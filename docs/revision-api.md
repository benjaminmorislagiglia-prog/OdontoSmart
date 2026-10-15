# Revisión e integración de API y web

Revisión realizada el 15/10/2026 sobre el backend incorporado al repositorio. Se mantienen ASP.NET Core, Entity Framework Core 10 y SQL Server, y React/Vite en la web. Mobile no se modificó.

## Resultado por módulo

| Módulo | Situación encontrada | Resultado |
| --- | --- | --- |
| Pacientes | CRUD con baja lógica y validación de relaciones existente | Se conserva; probado con SQL Server e integrado con catálogos web |
| Turnos | Sin control de doble reserva; DELETE físico; sin estado en la respuesta | Reservas protegidas, estado y nombres en DTO, cancelación conservando historial |
| Odontólogos | CRUD y horarios existentes; PUT aceptaba empleados inactivos | PUT valida empleado activo y longitudes; web conectada |
| Especialidades / OdontólogoEspecialidad | Catálogo y asignaciones existentes | Se conservan; gestión y asignación disponibles en web |
| Consultorios | CRUD y control de relaciones existentes | Se conserva; web conectada |
| Historia clínica | CRUD con trazabilidad y bloqueo de eliminación existente | Web conectada; anulación con motivo y fecha, conservación del contenido y bloqueo de edición posterior |
| EstadoTurno | Catálogo existente | Límite de texto acorde a SQL y protección del significado de Cancelado ya utilizado |
| HistorialEstadoTurno | Historial inmutable existente | Cambios coordinados con agenda; valida disponibilidad al reactivar un turno |
| PrestacionTurno | Solo relación EF, sin DTOs/controlador ni campos históricos | Se completó modelo, mapeo, DTOs y seis operaciones |
| ObraSocialPrestacion | CRUD, validación de cobertura y duplicados existente | Se conserva; se ajustó el máximo decimal al tipo SQL |
| TurnoInsumo | Stock transaccional, devolución y vencimientos ya implementados | Se conserva y se comprueba contra SQL Server |
| Direcciones / Localidades / Provincias | CRUD y relaciones existentes | Se conservan; dirección usa límites acordes a SQL |
| Empleados / Puestos / Equipamientos | CRUD existente | Se conserva; empleados se usan como referencia para odontólogos |
| Obras sociales / Prestaciones / Insumos | CRUD existente | Se conserva; catálogos auxiliares y pruebas HTTP, sin habilitar módulos web fuera del Sprint 1 |

La lectura del resto de controladores, modelos, DTOs, DbContext, Program y scripts no mostró un controlador faltante adicional a PrestacionTurno. La clasificación no implica que todos los casos de cada endpoint estén cubiertos por pruebas.

## Cambios de backend

- Historia clínica incorpora Anulado, MotivoAnulacion (nvarchar(300)) y FechaAnulacion (datetime2, UTC). El script Actualizacion Historia-Clinica.sql amplía bases existentes de forma idempotente y el script base contiene el mismo esquema para nuevas instalaciones. POST /api/HistorialClinico/{id}/anular exige motivo y conserva contenido, paciente y turno. Los reintentos mantienen la primera anulación; PUT de una historia anulada devuelve 409, con actualización condicional en SQL para cubrir solicitudes simultáneas. Todos los GET mantienen visibles los registros anulados; DELETE físico sigue bloqueado.

- PrestacionTurno refleja FechaRealizacion (date nullable), PrecioAplicado (decimal(18,2) nullable) y GarantiaMesesAplicada (int nullable), según el script. Los valores opcionales conservan compatibilidad con registros anteriores; no se completan precios o garantías automáticamente.
- Endpoints nuevos: GET/POST /api/prestacionturnos; GET/PUT/DELETE /api/prestacionturnos/{id}; GET /api/prestacionturnos/turno/{idTurno}.
- Valida existencia del turno y prestación, IDs positivos, precio y garantía no negativos y límites de SQL.
- Turnos devuelve TurnoDto con estado actual y nombres reales de paciente, odontólogo y consultorio.
- POST y PUT impiden la misma fecha/hora para el odontólogo o el consultorio. Se excluyen turnos cancelados y, en PUT, el propio registro.
- Una transacción SQL con bloqueo de aplicación compartido por las escrituras de agenda/estado coordina las solicitudes simultáneas. Es un bloqueo global de agenda adecuado a esta etapa; puede revisarse si aumenta la concurrencia.
- DELETE de Turnos agrega Cancelado al historial y no elimina el turno ni sus relaciones. Repetir la cancelación no duplica el historial.
- Reactivar mediante historial comprueba que el horario siga libre. No se crean reglas nuevas de duración, superposición de intervalos ni transiciones clínicas.
- Se impide cambiar el paciente de un turno con historia clínica.
- Se corrigieron límites de texto/decimal que podían superar las columnas SQL y una excepción de Range causada por la cultura regional.
- CORS usa una lista explícita de orígenes configurables, sin permitir todos los orígenes.
- Errores SQL devuelven mensajes controlados sin exponer la cadena de conexión.
- La conexión de cada equipo queda en appsettings.Local.json, excluido de Git, o en ConnectionStrings__DefaultConnection.
- Pkcs se actualizó de la versión transitiva vulnerable 9.0.4 a 9.0.21. La compilación final no reporta avisos de NuGet.

## Web conectada

Pacientes, Agenda, Odontólogos, Especialidades, Consultorios, Historia clínica, Estados de turno y Dashboard consultan la API. También se utilizan los catálogos de empleados, puestos, direcciones, localidades y obras sociales necesarios para las relaciones.

Se reutilizan layout, temas, formularios, estados de carga/error/vacío, notificaciones y ConfirmModal. Las páginas de catálogo comparten un componente y su definición de campos; Agenda conserva un flujo propio. Se mantienen las rutas anteriores y se agregan Especialidades, Estados de turno y rutas auxiliares.

Los datos anteriores del Dashboard permanecen en su archivo, pero no se consumen desde la web activa. El login conserva su validación local; la autenticación real no forma parte de estos cambios. Obras sociales, Prestaciones e Insumos siguen ocultos como módulos principales. Mobile continúa con sus datos locales.

## Entorno y scripts SQL

Se detectó SQL Express local disponible, sin OdontoSmartDB. Se creó una base nueva con el script revisado; no se reemplazó una base existente.

OdontoSmart.sql conserva esquema y semillas, corrige el INSERT de Odontologo sin Activo y deja las ubicaciones de archivos y compatibilidad a la instancia, evitando rutas fijas de otro equipo y opciones exclusivas de SQL Server 2025.

Sobre una base existente aplicar solamente los scripts idempotentes de Prestacion-Turno y Estados-Turno. El script de creación no es una migración y no debe ejecutarse sobre una base ya instalada.

## Verificaciones

- dotnet build OdontoSmart.sln: correcto, cero errores y cero advertencias.
- npm run build en frontend: correcto; Vite informa avisos de directivas use client de React Router/React Bootstrap.
- node scripts/check-pacientes.mjs en frontend: correcto contra el OpenAPI actualizado, con adaptador controlado.
- scripts/check-api.mjs: 98 comprobaciones HTTP contra la API y SQL Server, incluyendo Pacientes, relaciones, PrestacionTurno, stock, vencimientos, reservas simultáneas, conflictos de edición, historial, cancelación y anulación de historias clínicas.
- CORS: preflight desde http://127.0.0.1:5173 devuelve el origen permitido.
- Navegador: Dashboard real, catálogos de pacientes, edición/refresco de paciente, alta/modificación de especialidad, reserva, detalle, confirmación y cancelación conservando historial.
- Sin script de lint en frontend. No se agregó una herramienta nueva para esta tarea.

Las pruebas de API crean registros identificados por Verificación en la base de desarrollo. Conservan registros con historial en lugar de borrarlos para mantener las reglas de trazabilidad. No ejecutar esas pruebas sobre una base de producción.

El OpenAPI en docs/api/openapi.json se obtuvo de /swagger/v1/swagger.json; no se editaron endpoints manualmente. Se respetó la eliminación de la documentación antigua.

## Archivos principales

Backend incorporado: OdontoSmart.sln, OdontoSmartAPI/ y scripts SQL. Ajustados: Program.cs, appsettings.json, csproj, AppDbContext, PrestacionTurno, TurnosController, HistorialEstadoTurnoController, EstadoTurnoController, OdontologosController y DTOs con límites incompatibles. Nuevos: AgendaRules, TurnoDto, DTOs/controlador de PrestacionTurno y configuración local de ejemplo.

Web: App, módulos, servicio central de errores, dashboardService, formularios/detalle de pacientes, formatos, prueba de Pacientes y README. Nuevos: clinicService, clinicPages, ClinicEntityPage y AgendaPage.

También se incorporaron .gitignore, documentación de ejecución, scripts/check-api.mjs y OpenAPI generado. Los archivos locales de configuración, dependencias y compilación quedan excluidos.
