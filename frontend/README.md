# OdontoSmart Web

## Descripción

Aplicación web administrativa de OdontoSmart, un sistema de gestión para una clínica odontológica. Está orientada a administración, secretaría y odontólogos; no funciona como portal para pacientes.

La solución general comprende una aplicación web, una aplicación móvil, una API REST y una base de datos SQL Server. El backend utiliza ASP.NET Core Web API y Entity Framework Core.

## Objetivo

Centralizar la gestión diaria de la clínica desde una interfaz clara y accesible, reuniendo tareas administrativas y operativas que pueden estar distribuidas entre distintas herramientas o realizarse manualmente.

## Funcionalidades actuales

- Inicio y cierre de sesión con validación local y conservación de la sesión durante el uso de la pestaña.
- Dashboard con indicadores, agenda del día, búsqueda por paciente, filtros de estado y actividad reciente. La información se consulta desde la API.
- Gestión de pacientes con listados separados de activos y inactivos, búsqueda, detalle, registro, modificación, desactivación y reactivación.
- Agenda con reserva, detalle, modificación, cancelación y consulta del historial de estados. Incluye Ausente con un badge propio y conserva el turno y sus cambios anteriores.
- Módulo independiente de Empleados: registro, detalle completo, modificación, desactivación y reactivación, con los campos existentes de la API.
- Gestión de odontólogos a partir de un empleado existente, matrícula y días/horarios de atención. Especialidades y su asignación se gestionan desde Odontólogos.
- Registro y consulta de especialidades e historias clínicas; anulación de historias con motivo y fecha, conservando su contenido.
- Catálogo de estados de turno y formulario auxiliar de direcciones. El cambio de estados sigue en Agenda, con su control existente.
- Navegación con menú lateral adaptable, rutas protegidas y página para direcciones inexistentes.
- Configuración con apariencia claro/oscuro, accesibilidad y preferencias de listados guardadas en el navegador.
- Estados de carga, error y ausencia de datos, notificaciones y confirmación antes de desactivar un paciente.

El acceso todavía no valida la identidad contra el backend. Las credenciales locales de desarrollo están definidas en `src/services/authService.js`.

## Configuración de la aplicación

La sección Configuración permite elegir el tema claro u oscuro, usar texto grande, aumentar el contraste y reducir animaciones. Apariencia concentra el selector de tema durante la sesión; la barra superior mantiene el menú del usuario. El tema se conserva al refrescar. Las preferencias anteriores que no sean claro u oscuro se normalizan a claro.

La cantidad de filas (10, 25 o 50) se aplica mediante paginación local a Dashboard, Pacientes, Agenda y los listados de catálogos. Los filtros se aplican al conjunto completo antes de paginar; cambiar un filtro o la cantidad de filas vuelve a la primera página.

Recordar filtros y búsquedas está inactivo inicialmente. Al activarlo, conserva los valores de los controles de esas pantallas; al desactivarlo, elimina los filtros guardados. Las preferencias utilizan `localStorage`, no guardan respuestas de la API ni credenciales y no cambian datos de la clínica. Si el navegador bloquea el almacenamiento, siguen funcionando durante la sesión actual.

Sesión muestra el usuario del contexto de autenticación y permite cerrar sesión con el flujo existente.

## Historia clínica

Al registrar una historia se eligen paciente y turno. Durante la edición esas relaciones están bloqueadas; sólo se modifican diagnóstico, tratamientos y observaciones.

Detalle ofrece Anular registro con confirmación y motivo obligatorio de hasta 300 caracteres. La API guarda el estado, el motivo y la fecha de anulación; el registro sigue en el listado y conserva su contenido. Una historia anulada sólo admite consulta y muestra Anulado, el motivo y la fecha local. La anulación no cancela el turno ni habilita una segunda historia para el mismo turno.

## Integración con API

Pacientes, Empleados, Agenda, Odontólogos, Especialidades, Historia clínica, Estados de turno y Dashboard utilizan Axios y servicios HTTP separados de las páginas para consumir la API ASP.NET Core. Implementa GET y POST sobre `/api/Pacientes`, y GET, PUT y DELETE sobre `/api/Pacientes/{id}`.

Pacientes, Empleados y Odontólogos consultan los inactivos mediante `?activo=false`, permiten consultar su detalle con `?incluirInactivos=true` y reactivan el mismo registro mediante `POST /api/{recurso}/{id}/reactivar`. DELETE conserva la baja lógica. Los tres módulos comparten presentación de tablas, badges, confirmaciones y notificaciones.

Los pacientes inactivos también permiten Modificar desde el listado y el detalle. En el formulario, Guardar paciente conserva su estado inactivo; Guardar y reactivar actualiza sus datos y lo activa en una única operación. Ambos flujos abren después el detalle del mismo paciente, para poder seguir consultándolo. Las validaciones se aplican antes de guardar y reactivar.

## Tipos y validación de campos

Los estados visibles de Pacientes, Empleados y Odontólogos son Activo e Inactivo. Sus acciones conservan los nombres Desactivar y Reactivar.

- DNI: sólo dígitos, hasta 20 caracteres, conservando ceros iniciales. La entrada usa teclado numérico y rechaza letras y símbolos sin convertir el identificador a un número.
- Nombre y apellido: letras, tildes, espacios, puntos, apóstrofes y guiones; no admiten números.
- Teléfono: opcional, con dígitos y formato telefónico (prefijo +, espacios, paréntesis, puntos o guiones), hasta 20 caracteres. Correo utiliza formato de email.
- Número de dirección: entero positivo hasta 2147483647; rechaza decimales y notación exponencial. Calle admite nombres con números, por ejemplo 9 de Julio.
- Código postal: entre 4 y 10 letras o dígitos, con al menos un dígito; admite 5000 y X5000ABC. Matrícula admite letras, números y separadores.
- Atención: días escritos con letras y rango horario de 24 horas, por ejemplo 09:00-17:00 o 09:00 a 17:00. La fecha de nacimiento debe existir y no ser futura.
- Las referencias se seleccionan de los catálogos. Los campos clínicos mantienen texto libre con los límites actuales. Búsquedas, login y preferencias conservan sus tipos correspondientes.

Los errores se muestran junto al campo y se enfoca el primero que requiere corrección. La API valida también los formatos y tipos. No se cambia el esquema de base de datos.

Desde frontend: `node scripts/check-forms.mjs` verifica formatos válidos, inválidos, límites y referencias; `node scripts/check-pacientes.mjs` comprueba el contrato HTTP de pacientes.

El menú principal incluye Empleados. Especialidades se encuentra en `/odontologos/catalogo-especialidades` y la asignación en `/odontologos/especialidades`; las rutas anteriores de especialidades y empleados redirigen a su ubicación actual. Los módulos futuros deshabilitados se conservan.

Un odontólogo sólo está disponible si están activos su propio registro y el empleado asociado. Reactivar al empleado no cambia el campo Activo del odontólogo. Si el empleado está inactivo, la web indica que debe reactivarse primero. El selector de empleados excluye los ya asociados, incluso si su odontólogo está inactivo; la API valida también esta relación única.

Consultorio 1, 2 y 3 se conservan en la base de datos y se consultan desde la API al reservar o modificar turnos. La web no incluye una sección de gestión de consultorios ni formularios para registrarlos, modificarlos o eliminarlos. La ruta anterior `/consultorios` redirige a Agenda.

La URL base se configura mediante `VITE_API_URL`. Copiar `.env.example` a `.env.local`, completar la URL real de la API con su puerto, sin agregar la ruta del recurso, y reiniciar Vite. No colocar contraseñas ni tokens en variables públicas del frontend.

El formulario de pacientes carga las direcciones y obras sociales de la API mediante selectores. Permite acceder a la gestión de direcciones; la obra social es opcional. El odontólogo se vincula con un empleado existente y la historia clínica con el paciente y su turno. La API conserva la validación definitiva.

El contrato actual está en `../docs/api/openapi.json`, generado desde Swagger. La preparación local y las verificaciones se describen en [el informe de integración](../docs/revision-api.md).

Los selectores de estados de Agenda y Dashboard se obtienen del catálogo real de la API. Ausente utiliza el cambio genérico de estado por ID y persiste al refrescar. Se mantiene separado de Cancelado: únicamente la cancelación libera la reserva según la lógica actual de la agenda.

## Tecnologías

- JavaScript, React y React DOM.
- Vite.
- React Router DOM.
- Axios.
- Bootstrap y React Bootstrap.
- React Icons.

Las versiones utilizadas se encuentran en `package.json` y `package-lock.json`.

## Estructura del proyecto

```text
src/
├── components/   Componentes compartidos y formulario de pacientes
├── config/       Módulos habilitados
├── context/      Sesión, tema, preferencias y notificaciones
├── hooks/        Consultas y preferencias
├── layouts/      Estructura administrativa
├── mocks/        Datos anteriores conservados, fuera del flujo activo
├── pages/        Pantallas y rutas
├── services/     Acceso a datos y cliente HTTP
├── styles/       Estilos y adaptación de pantalla
└── utils/        Formatos y validaciones
```

## Instalación

Desde la raíz del repositorio, con Node.js y npm instalados:

```sh
cd frontend
npm install
```

## Ejecución

```sh
npm run dev
```

Abrir la dirección indicada por Vite. La API debe estar ejecutándose y permitir el origen del frontend mediante CORS para utilizar los módulos conectados. El perfil HTTP del backend escucha en `http://localhost:5122`; configurar ese origen en `VITE_API_URL` para las pruebas locales.

Para compilar y comprobar los servicios:

```sh
npm run build
node scripts/check-pacientes.mjs
```

El script verifica el contrato y las validaciones con respuestas controladas; no reemplaza las pruebas contra el backend. No hay un script de lint configurado.

## Estado actual

| Funcionalidad | Estado | Alcance |
| --- | --- | --- |
| Inicio y cierre de sesión | Parcial | Flujo local; falta autenticación con backend |
| Dashboard | Implementado | Indicadores, agenda y actividad desde la API |
| Gestión de pacientes | Implementado | Consulta, alta, modificación y baja lógica con catálogos reales |
| Navegación y temas | Implementado | Menú adaptable, rutas protegidas y preferencias visuales |
| Configuración | Implementado | Apariencia, accesibilidad, paginación, filtros recordados y cierre de sesión |
| Gestión de turnos | Implementado | Reserva, detalle, modificación, cancelación e historial de estados |
| Historia clínica | Implementado | Registro, consulta, modificación y anulación con motivo; conserva contenido y relaciones |
| Odontólogos | Implementado | Gestión conectada a la API, horarios y referencias |
| Consultorios en Agenda | Implementado | Selector con los consultorios existentes de la API, sin módulo de gestión |
| Especialidades y estados | Implementado | Catálogos y asignación de especialidades |

Insumos, Prestaciones y Obras sociales están fuera del alcance del Sprint 1 y permanecen ocultos. Su trabajo se conserva; la habilitación se controla desde `src/config/modules.js`. Especialidades dispone de un catálogo propio y los días/horarios se registran en el odontólogo según el modelo actual.

## Próximos pasos

- Incorporar autenticación real.
- Ampliar la validación de recorridos y accesibilidad en distintos tamaños de pantalla.
- Integrar los módulos futuros cuando se habilite su alcance.

## Integrantes

- Benjamín Moris
- Gonzalo Perea
