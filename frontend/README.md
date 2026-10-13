# OdontoSmart Web

## Descripción

Aplicación web administrativa de OdontoSmart, un sistema de gestión para una clínica odontológica. Está orientada a administración, secretaría y odontólogos; no funciona como portal para pacientes.

La solución general comprende una aplicación web, una aplicación móvil, una API REST y una base de datos SQL Server. El backend previsto utiliza ASP.NET Core Web API y Entity Framework Core.

## Objetivo

Centralizar la gestión diaria de la clínica desde una interfaz clara y accesible, reuniendo tareas administrativas y operativas que pueden estar distribuidas entre distintas herramientas o realizarse manualmente.

## Funcionalidades actuales

- Inicio y cierre de sesión con validación local y conservación de la sesión durante el uso de la pestaña.
- Dashboard con indicadores, agenda del día, búsqueda por paciente, filtros de estado y actividad reciente. Actualmente utiliza datos locales.
- Gestión de pacientes: listado, búsqueda, consulta de detalle, registro, modificación y desactivación mediante baja lógica.
- Navegación con menú lateral adaptable, rutas protegidas y página para direcciones inexistentes.
- Tema claro y oscuro con preferencia guardada.
- Estados de carga, error y ausencia de datos, notificaciones y confirmación antes de desactivar un paciente.

El acceso todavía no valida la identidad contra el backend. Las credenciales locales de desarrollo están definidas en `src/services/authService.js`.

## Integración con API

El módulo Pacientes utiliza Axios y servicios HTTP separados de las páginas para consumir la API ASP.NET Core. Implementa GET y POST sobre `/api/Pacientes`, y GET, PUT y DELETE sobre `/api/Pacientes/{id}`.

La URL base se configura mediante `VITE_API_URL`. Copiar `.env.example` a `.env.local`, completar la URL real de la API con su puerto, sin agregar la ruta del recurso, y reiniciar Vite. No colocar contraseñas ni tokens en variables públicas del frontend.

El alta requiere un ID de dirección existente. Hasta disponer de los catálogos correspondientes, el formulario permite ingresar IDs en una sección identificada como temporal; la obra social es opcional. La API conserva la validación definitiva.

El contrato de referencia está en `../docs/api/EndPointconswagger.json`. Las condiciones y limitaciones de integración se describen en [las notas de Pacientes](../docs/api/pacientes.md).

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
├── mocks/        Datos locales del Dashboard
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

Abrir la dirección indicada por Vite. La API debe estar ejecutándose y permitir el origen del frontend mediante CORS para utilizar Pacientes.

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
| Dashboard | Parcial | Interfaz y filtros implementados con datos locales |
| Gestión de pacientes | Parcial | Servicios HTTP y formularios implementados; falta completar validación con API y catálogos |
| Navegación y temas | Implementado | Menú adaptable, rutas protegidas y preferencias visuales |
| Gestión de turnos | Pendiente | El Dashboard muestra una agenda local; el módulo operativo aún no está desarrollado |
| Historia clínica | Pendiente | Ruta definida, sin flujo de registro o consulta |
| Odontólogos y consultorios | Pendiente | Secciones de navegación definidas, sin gestión funcional |

Insumos, Prestaciones y Obras sociales están fuera del alcance del Sprint 1 y permanecen ocultos. Su trabajo se conserva; la habilitación se controla desde `src/config/modules.js`. Especialidades y horarios forman parte del alcance previsto, pero todavía no tienen módulos propios implementados.

## Próximos pasos

- Validar las operaciones de Pacientes con la API disponible.
- Completar la selección de direcciones y obras sociales cuando existan sus contratos.
- Incorporar autenticación real.
- Desarrollar los flujos pendientes del Sprint 1 y validar su uso en distintos tamaños de pantalla.

## Integrantes

- Benjamín Moris
- Gonzalo Perea
