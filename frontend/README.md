# OdontoSmart Web

## Descripción

Aplicación web administrativa de OdontoSmart, un sistema de gestión para una clínica odontológica. Está orientada a administración, secretaría y odontólogos; no funciona como portal para pacientes.

La solución general comprende una aplicación web, una aplicación móvil, una API REST y una base de datos SQL Server. El backend utiliza ASP.NET Core Web API y Entity Framework Core.

## Objetivo

Centralizar la gestión diaria de la clínica desde una interfaz clara y accesible, reuniendo tareas administrativas y operativas que pueden estar distribuidas entre distintas herramientas o realizarse manualmente.

## Funcionalidades actuales

- Inicio y cierre de sesión con validación local y conservación de la sesión durante el uso de la pestaña.
- Dashboard con indicadores, agenda del día, búsqueda por paciente, filtros de estado y actividad reciente. La información se consulta desde la API.
- Gestión de pacientes: listado, búsqueda, consulta de detalle, registro, modificación y desactivación mediante baja lógica.
- Agenda con reserva, detalle, modificación, cancelación y consulta del historial de estados.
- Gestión de odontólogos, días/horarios de atención y asignación de especialidades.
- Registro y consulta de consultorios, especialidades e historias clínicas.
- Catálogo de estados de turno y formularios auxiliares de empleados y direcciones.
- Navegación con menú lateral adaptable, rutas protegidas y página para direcciones inexistentes.
- Tema claro y oscuro con preferencia guardada.
- Estados de carga, error y ausencia de datos, notificaciones y confirmación antes de desactivar un paciente.

El acceso todavía no valida la identidad contra el backend. Las credenciales locales de desarrollo están definidas en `src/services/authService.js`.

## Integración con API

Pacientes, Agenda, Odontólogos, Especialidades, Consultorios, Historia clínica, Estados de turno y Dashboard utilizan Axios y servicios HTTP separados de las páginas para consumir la API ASP.NET Core. Implementa GET y POST sobre `/api/Pacientes`, y GET, PUT y DELETE sobre `/api/Pacientes/{id}`.

La URL base se configura mediante `VITE_API_URL`. Copiar `.env.example` a `.env.local`, completar la URL real de la API con su puerto, sin agregar la ruta del recurso, y reiniciar Vite. No colocar contraseñas ni tokens en variables públicas del frontend.

El formulario de pacientes carga las direcciones y obras sociales de la API mediante selectores. Permite acceder a la gestión de direcciones; la obra social es opcional. El odontólogo se vincula con un empleado existente y la historia clínica con el paciente y su turno. La API conserva la validación definitiva.

El contrato actual está en `../docs/api/openapi.json`, generado desde Swagger. La preparación local y las verificaciones se describen en [el informe de integración](../docs/revision-api.md).

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
├── context/      Sesión, tema y notificaciones
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
| Gestión de turnos | Implementado | Reserva, detalle, modificación, cancelación e historial de estados |
| Historia clínica | Implementado | Registro, consulta y modificación; conserva las relaciones originales |
| Odontólogos y consultorios | Implementado | Gestión conectada a la API, horarios y referencias |
| Especialidades y estados | Implementado | Catálogos y asignación de especialidades |

Insumos, Prestaciones y Obras sociales están fuera del alcance del Sprint 1 y permanecen ocultos. Su trabajo se conserva; la habilitación se controla desde `src/config/modules.js`. Especialidades dispone de un catálogo propio y los días/horarios se registran en el odontólogo según el modelo actual.

## Próximos pasos

- Incorporar autenticación real.
- Ampliar la validación de recorridos y accesibilidad en distintos tamaños de pantalla.
- Integrar los módulos futuros cuando se habilite su alcance.

## Integrantes

- Benjamín Moris
- Gonzalo Perea
