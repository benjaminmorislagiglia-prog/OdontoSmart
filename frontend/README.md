# OdontoSmart · Frontend web

Sistema administrativo: layout responsive, Dashboard con datos ficticios y login simulado. El módulo Pacientes consume la API mediante Axios; requiere configurar su URL real. No incluye backend ni autenticación real.

## Login simulado

Las credenciales temporales están definidas en `src/services/authService.js`: usuario `admin`, contraseña `1234`. No se guarda la contraseña. `sessionStorage` conserva únicamente `{ username: 'admin' }` al recargar la pestaña y descarta la sesión cuando se cierra. Esta simulación controla la navegación del prototipo; la API futura deberá validar el acceso real.

`AuthContext` comparte usuario, estado de sesión, login y logout. `ProtectedRoute` protege todo el layout administrativo, incluyendo rutas inexistentes. Sin sesión redirige a `/login`; con sesión, `/login` redirige a `/dashboard`. `/` conserva compatibilidad y redirige al Dashboard. Cerrar sesión elimina el registro y provoca la redirección a login.

Para probar:

1. Sin sesión, visitar `/dashboard` o `/pacientes`: debe aparecer `/login`.
2. Enviar campos vacíos: verificar ambos mensajes y foco en el primer campo inválido.
3. Ingresar credenciales incorrectas: verificar mensaje sin recarga.
4. Ingresar `admin` / `1234`: verificar carga, Dashboard y nombre de usuario.
5. Recargar: debe conservar la sesión. Visitar `/login`: debe volver al Dashboard.
6. Usar mostrar/ocultar contraseña antes de entrar y comprobar navegación por teclado.
7. Cerrar sesión desde la topbar; probar Atrás o acceder directamente a una ruta administrativa: debe continuar sin acceso.

Cuando exista la API, reemplazar las operaciones de `authService` y acordar persistencia/validación de sesión con backend. Mantener la interfaz del contexto y las rutas; no hay endpoints ni tokens implementados. Roles y permisos quedan como mejora futura.

## Ejecutar

Requiere Node.js 20.19+ o 22.12+ (se utilizó Node 24).

```sh
cd frontend
npm install
npm run dev
```

Abrir la dirección indicada por Vite. Para compilar: `npm run build`.

## Arquitectura

### Alcance del Sprint 1

`src/config/modules.js` centraliza los módulos mediante `enabled`. Sidebar de escritorio/móvil y rutas de secciones utilizan `activeModules`; el Dashboard consulta `isModuleEnabled` para mostrar el inventario y la información de prestaciones.

Insumos, Prestaciones y Obras sociales tienen `enabled: false`: no aparecen en la navegación y sus rutas directas llegan al 404 existente. Se conservan la definición de cada módulo, PendingPage, los mocks de inventario y tratamientos, el panel de inventario y todos sus estilos. Para reactivar cualquiera de esos módulos, cambiar su propio `enabled` a `true`; recuperar esto no implica que el módulo esté desarrollado.

Este ajuste conserva la integración de Pacientes y el estado anterior de Agenda, Odontólogos, Historia clínica y Consultorios. No implementa los flujos aún pendientes de esas secciones ni crea módulos nuevos de Especialidades u Horarios.

- `layouts/AdminLayout.jsx`: sidebar, menú móvil y topbar.
- `pages/DashboardPage.jsx`: consulta el servicio, muestra indicadores, turnos, alertas y actividad.
- `pages/PendingPage.jsx`: módulos pendientes y ruta no encontrada.
- `components/`: encabezado y estados reutilizables.
- `mocks/dashboard.js`: datos de demostración separados de la interfaz.
- `services/dashboardService.js`: acceso a los datos. Sustituir su implementación cuando se acuerde la API; conservar el formato que utiliza la página o adaptar la respuesta aquí.
- `services/api.js`: cliente Axios centralizado. Copiar `.env.example` a `.env.local`, completar `VITE_API_URL` con el origen real de la API (incluido el puerto, sin /api/Pacientes) y reiniciar Vite. Se conserva compatibilidad con `VITE_API_BASE_URL`. Las variables VITE son públicas: no colocar secretos.
- `styles/app.css`: estilos compartidos y responsive.

## Dependencias utilizadas

React y React DOM para componentes; Vite para desarrollo y compilación; Bootstrap para estilos base; React Bootstrap para componentes accesibles; React Router DOM para navegación; React Icons para iconografía; Axios para las solicitudes del módulo Pacientes.

## Cómo probar esta etapa

1. Abrir el Dashboard: verificar indicadores, tabla, alertas y actividad.
2. Buscar un paciente y combinar la búsqueda con el filtro de estado. Probar una búsqueda sin resultados.
3. Navegar por el sidebar y volver al Dashboard. Pacientes dispone de listado, detalle, alta, edición y baja lógica; los demás módulos indican que están pendientes.
4. Reducir la ventana a tamaño tablet/móvil: abrir/cerrar el menú, seleccionar una sección y desplazarse horizontalmente por la tabla.
5. Usar Tab para navegar y comprobar el enlace «Saltar al contenido», los labels y el foco visible.
6. Visitar una dirección inexistente: debe aparecer la pantalla correspondiente.

Los turnos se presentan como una jornada ficticia de hoy. Los indicadores generales y la actividad también son simulados; no constituyen información clínica real.

## Próxima etapa

Validar Pacientes con la API ejecutándose y completar los catálogos de direcciones y obras sociales cuando se confirmen sus contratos. Agenda y los demás módulos conservan su estado anterior.

## Integración inicial de Pacientes

Contrato temporal copiado sin modificaciones desde el Escritorio: `../docs/api/EndPointconswagger.json`. Ver [notas de integración](../docs/api/pacientes.md).

Se implementaron listado/búsqueda, detalle, alta y edición con formulario compartido, y baja lógica con ConfirmModal. Las rutas son `/pacientes`, `/pacientes/nuevo`, `/pacientes/:id` y `/pacientes/:id/editar`. El servicio usa las rutas `/api/Pacientes` del Swagger, conserva los DTOs y no interpreta la baja como borrado físico.

El formulario necesita un ID de dirección existente. Hasta contar con catálogos confirmados, los IDs se ingresan manualmente en una sección identificada como integración temporal de desarrollo; no existen direcciones ni obras sociales inventadas. La obra social es opcional. La API mantiene la validación definitiva.

El listado y detalle consultan exclusivamente la API, sin fallback a mocks. El Dashboard y el login siguen siendo simulados. No había un mock ni una pantalla funcional previa de Pacientes: su ruta mostraba PendingPage.

`node scripts/check-pacientes.mjs` comprueba los cinco métodos, rutas y payload contra el Swagger usando un adaptador controlado de Axios, sin acceder a una API real. `npm run build` compila la interfaz. No hay script de lint configurado.

## Mejoras visuales y experiencia de usuario

### Componentes y ajustes adicionales

- `ErrorState`: `title`, `message`, `icon` (opcional, `null` lo oculta), `onAction` y `actionText` (por defecto «Reintentar»). Ejemplo: `<ErrorState title="No pudimos cargar los datos" message="Intentá nuevamente." onAction={reload} />`. Se integra en el manejo de errores ya existente del Dashboard, sin simular fallos nuevos.
- `ConfirmModal`: `show`, `title`, `message`, `confirmText`, `cancelText`, `variant`, `onConfirm` y `onCancel`. Ejemplo: `<ConfirmModal show={open} title="Confirmar acción" message="¿Deseás continuar?" onConfirm={handleConfirm} onCancel={() => setOpen(false)} />`. El consumidor controla el cierre. Reutiliza React Bootstrap para foco, Escape, backdrop y restauración del foco; el foco inicial va a Cancelar. Está preparado, sin agregar confirmaciones a operaciones actuales.
- `NotFoundPage` reemplaza el uso de PendingPage como 404. El wildcard permanece dentro de ProtectedRoute: sin sesión redirige a login; con sesión muestra una 404 propia y un enlace al Dashboard. PendingPage solo representa módulos pendientes.
- La sesión se obtiene sincrónicamente en el inicializador de AuthContext, antes de renderizar las rutas. No se agregó splash ni demora artificial para restaurarla.
- La topbar tiene breadcrumb semántico «Inicio / sección», con enlace al Dashboard y `aria-current`. Reemplaza la ubicación que ya existía, sin una segunda fila.
- El menú del usuario muestra su nombre y Cerrar sesión, con navegación de teclado de Dropdown de React Bootstrap. No hay perfiles ni roles nuevos.
- El login aclara que ambos campos son obligatorios; conserva labels, errores asociados, validación y tamaño de inputs. La tabla mantiene sus filtros y datos locales; el contenedor desplazable ahora recibe foco y tiene nombre accesible. No se extrajo una tabla genérica para una única pantalla ni se agregó paginación.
- `utils/formatters.js`: `formatDate` devuelve `dd/mm/yyyy`, `formatTime` devuelve `HH:mm` y `formatCurrency` usa ARS con dos decimales. Fechas ISO sin hora se interpretan como fechas locales para evitar cambios de día por UTC. Valores vacíos o inválidos devuelven «—». Dashboard utiliza fecha y hora; moneda queda preparada para cuando haya importes.
- El footer muestra discretamente la versión de package.json, sin sistema de releases.

Archivos creados en esta etapa: `components/ErrorState.jsx`, `components/ConfirmModal.jsx`, `pages/NotFoundPage.jsx`, `utils/formatters.js`. Modificados: `App.jsx`, `layouts/AdminLayout.jsx`, `pages/LoginPage.jsx`, `pages/DashboardPage.jsx`, `pages/PendingPage.jsx`, `styles/enhancements.css`, `README.md`. Sin dependencias adicionales.

Verificación: build de producción, formatos (fechas inválidas, medianoche, hora fuera de rango, moneda), login/logout, persistencia al recargar, rutas protegidas, 404, temas, sidebar y menú del usuario. ErrorState y ConfirmModal se probaron en un montaje temporal aislado, eliminado al terminar: reintento, confirmar, cancelar y Escape. Revisar manualmente comodidad de lectura, teclado y desplazamiento de tablas en la resolución habitual del equipo. No hay lint configurado.

- Sidebar: el botón superior contrae/expande el menú de escritorio. Los iconos conservan nombres accesibles y tooltips al pasar el mouse o enfocar con teclado. `odontosmart.sidebar-collapsed` guarda la preferencia en localStorage. En tablet se conserva el menú Offcanvas completo.
- Tema: el botón de sol/luna está disponible en topbar y login. `ThemeProvider` guarda `odontosmart.theme` en localStorage; sin preferencia usa la del sistema. Los tokens están en `src/styles/enhancements.css`; `data-bs-theme` adapta también los componentes de Bootstrap. Si el almacenamiento está bloqueado, los controles siguen funcionando durante la sesión.
- Notificaciones: `NotificationProvider` reutiliza Toast de React Bootstrap. `useNotification().notify('Mensaje', 'success')` permite `success`, `info`, `warning` y `error`. Éxito e información se cierran a los 5,5 segundos; advertencias y errores requieren cierre manual. Se muestran hasta cuatro avisos, con icono, título, cierre accesible y región viva. Login y logout usan avisos sin agregar operaciones de negocio.
- Carga: `<LoadingState message="Cargando turnos…" />` muestra un estado centrado; `inline` permite usarlo en botones. Se utiliza en Dashboard y en el botón de login.
- Vacío: `<EmptyState icon={FiSearch} title="Sin resultados" message="Probá otros filtros." action={<button>Acción existente</button>} />`. Icono, mensaje y acción son opcionales; el título describe el estado. El Dashboard lo usa cuando no hay coincidencias y ofrece limpiar los filtros existentes.
- Detalles: colores compartidos para ambos temas, texto secundario con más contraste, hover de filas, foco visible, estados disabled, sidebar desplazable en ventanas bajas y respeto por la preferencia de reducir movimiento.

Archivos nuevos: `hooks/useStoredPreference.js`, `context/ThemeContext.jsx`, `context/NotificationContext.jsx`, `components/ThemeToggle.jsx`, `components/LoadingState.jsx`, `components/EmptyState.jsx`, `styles/enhancements.css`.

Archivos modificados: `main.jsx`, `context/AuthContext.jsx`, `layouts/AdminLayout.jsx`, `pages/LoginPage.jsx`, `pages/DashboardPage.jsx` y este README. No se agregaron dependencias ni se cambiaron versiones.

Para verificar: iniciar sesión, contraer y expandir sidebar, enfocar un icono para ver su tooltip, alternar temas, recargar y comprobar ambas preferencias. Buscar un paciente inexistente y limpiar filtros. Probar login/logout y el cierre de sus notificaciones. Revisar en tablet y con navegación por teclado. Build disponible con `npm run build`; no hay script de lint configurado.
