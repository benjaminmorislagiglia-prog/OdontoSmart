# Integración temporal del módulo Pacientes

## Contrato

EndPointconswagger.json se copió del Escritorio sin modificar sus bytes. Es una referencia temporal reemplazable por una versión posterior. No incluye servers, URL ni puerto.

El Swagger utiliza /api/Pacientes (P mayúscula). Solo se conectan sus operaciones:

| Método | Ruta | Uso |
|--------|------|-----|
| GET | /api/Pacientes | Listado de PacienteDto |
| GET | /api/Pacientes/{id} | Detalle de PacienteDto |
| POST | /api/Pacientes | Alta mediante PacienteGuardarDto |
| PUT | /api/Pacientes/{id} | Edición mediante PacienteGuardarDto |
| DELETE | /api/Pacientes/{id} | Baja lógica confirmada por el equipo |

PUT y DELETE no documentan cuerpo de respuesta: se acepta éxito HTTP y luego se consulta nuevamente. No se fuerza activo=false localmente ni se asume que GET excluye inactivos.

## Configuración

Copiar frontend/.env.example a frontend/.env.local y completar VITE_API_URL con el origen donde esté ejecutándose la API, incluido su puerto y esquema HTTP/HTTPS, sin agregar /api/Pacientes. Reiniciar Vite.

URL confirmada por el equipo: https://localhost:44357. Se configuró en frontend/.env.local como VITE_API_URL=https://localhost:44357. Este archivo está excluido de Git. No hay fallback al servidor frontend cuando falta la URL. VITE_API_BASE_URL sigue aceptándose por compatibilidad; VITE_API_URL tiene prioridad.

## DTO y limitaciones

El listado muestra nombre, apellido, DNI, teléfono, correo y activo. El detalle incluye fechaNacimiento, idObraSocial e idDireccion, sin inventar nombres relacionados.

El formulario envía exclusivamente dni, nombre, apellido, telefono, correo, fechaNacimiento, idObraSocial e idDireccion. Campos opcionales vacíos se envían como null; las fechas se envían como YYYY-MM-DD; los IDs son enteros. No se envía activo ni idPaciente en POST/PUT.

La dirección requiere un ID positivo y existente. No hay endpoints auxiliares confirmados para seleccionar dirección u obra social. Se agregó un ingreso manual de IDs claramente identificado como temporal; el equipo debe proporcionar IDs válidos para probar el alta. La obra social puede omitirse. No se conectan otros endpoints del Swagger.

## Verificación y CORS

Build de producción correcto. Pruebas con adaptador controlado: cinco métodos HTTP, rutas del Swagger, payload, fechas inválidas, campos obligatorios, IDs y mensajes de error. Esto no demuestra disponibilidad del backend.

En navegador se comprobó login local, acceso a Pacientes, error por configuración ausente con Reintentar y validación de campos vacíos del alta.

Frontend de verificación: http://127.0.0.1:5174. Vite también puede usar otro puerto; consultar su terminal. API configurada: https://localhost:44357. Al comprobar GET /api/Pacientes el 13/10/2026, la conexión fue rechazada por localhost:44357. No se recibió una respuesta HTTP; no se pudo verificar CORS ni completar pruebas reales de los endpoints. Es necesario iniciar la API en esa dirección.

Si aparece un error de conexión, el navegador puede ocultar la diferencia entre CORS y API caída. Revisar Network/Console antes de atribuir la causa. El backend debe permitir el origen exacto del frontend, los métodos GET/POST/PUT/DELETE y OPTIONS y la cabecera Content-Type para el JSON. No se añadió proxy ni se deshabilitó la seguridad del navegador o la validación de certificados.

## Solicitar al desarrollador de la API

- Forma de iniciar la API en la URL confirmada https://localhost:44357.
- ID de dirección existente para altas y, opcionalmente, ID de obra social.
- Contratos futuros de los catálogos de direcciones y obras sociales.
- Origen frontend autorizado por CORS.
- Confirmación de si GET devuelve pacientes inactivos y cómo se informa un DNI duplicado.

Dashboard, login simulado, Turnos y demás módulos mantienen su implementación anterior. Mobile, backend y SQL no se modifican.
