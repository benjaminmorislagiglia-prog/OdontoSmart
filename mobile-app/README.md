# OdontoSmart Mobile

## Descripción

Aplicación móvil complementaria de OdontoSmart, desarrollada con React Native y Expo para el personal interno de una clínica odontológica. Permite consultar información de pacientes y turnos, revisar antecedentes clínicos y realizar acciones breves desde un teléfono.

Forma parte de una solución que también incluye una aplicación web administrativa, una API REST y una base de datos SQL Server. El desarrollo móvil prioriza Android y no está orientado actualmente a pacientes.

## Objetivo

Facilitar el acceso a información relevante de la clínica desde dispositivos móviles y acompañar las tareas de odontólogos y personal administrativo, sin reemplazar la aplicación web.

## Funcionalidades

- Inicio de sesión con validación local, restauración de sesión y cierre de sesión.
- Inicio con fecha, resumen de turnos, próximo turno, pacientes recientes y avisos.
- Agenda por día con búsqueda y filtro de estado.
- Detalle de turno con datos de atención, contacto y observaciones.
- Confirmación de turnos, registro de atención y cancelación con confirmación.
- Listado de pacientes con búsqueda por nombre, DNI o teléfono.
- Detalle de paciente con datos personales, próximos y últimos turnos.
- Historia clínica de lectura, ordenada por fecha.
- Avisos internos con estados leído y no leído.
- Perfil con información básica del usuario.
- Tema claro y oscuro con preferencia guardada.

La navegación combina cinco pestañas —Inicio, Turnos, Pacientes, Avisos y Perfil— con pantallas de detalle. Al cerrar sesión se retira el contenido autenticado.

## Estado de integración

Las pantallas consultan servicios asíncronos separados de la interfaz. Actualmente toda la información clínica y administrativa proviene de datos locales; los servicios todavía no realizan solicitudes al backend.

Existe una base HTTP en `src/services/api.js` y la variable `EXPO_PUBLIC_API_URL` está documentada en `.env.example`. Al integrar la API compartida con la web, se reemplazarán las implementaciones de los servicios según los contratos acordados. El backend previsto utiliza ASP.NET Core Web API, Entity Framework Core y SQL Server.

Los cambios de estado de turnos y la lectura de avisos se mantienen en memoria y se reinician al recargar la aplicación. La sesión y el tema sí persisten mediante AsyncStorage. La autenticación real sigue pendiente; las credenciales locales están definidas en `src/services/authService.js`.

## Tecnologías

- JavaScript, React y React Native.
- Expo SDK 57 y Expo Status Bar.
- React Navigation con Native Stack y Bottom Tabs.
- AsyncStorage.
- Ionicons mediante `@expo/vector-icons`.
- React Native Screens y Safe Area Context.

ESLint y TypeScript se utilizan para revisar el código JavaScript; TypeScript está configurado con `checkJs`. Las versiones concretas se encuentran en `package.json` y `package-lock.json`.

## Estructura del proyecto

```text
src/
├── components/   Controles, tarjetas y estados compartidos
├── context/      Sesión y tema
├── hooks/        Consultas y actualización al recuperar el foco
├── mocks/        Datos locales
├── navigation/   Navegación principal y detalles
├── screens/      Pantallas
├── services/     Operaciones y acceso a datos
├── styles/       Paletas y estilos comunes
└── utils/        Fechas y formatos
```

La entrada se encuentra en `App.js` e `index.js`; los recursos gráficos están en `assets/` y las comprobaciones de servicios en `scripts/`.

## Instalación

Desde la raíz del repositorio, con Node.js y npm instalados:

```sh
cd mobile-app
npm install
```

## Ejecución

```sh
npm start
```

Expo muestra un QR en la terminal. Para abrir la aplicación en Android, utilizar Expo Go compatible con SDK 57 y conectar el teléfono y la computadora a la misma red. No se necesita una API para ejecutar el estado actual.

## Funcionalidades y avance

En las filas marcadas como Parcial, las pantallas y los flujos locales existen, pero falta su integración con el backend.

| Funcionalidad | Estado |
| --- | --- |
| Inicio y cierre de sesión | Parcial |
| Navegación principal y detalles | Implementado |
| Inicio y resumen de la jornada | Parcial |
| Turnos, detalle y cambios de estado | Parcial |
| Pacientes y detalle | Parcial |
| Historia clínica de lectura | Parcial |
| Avisos internos | Parcial |
| Perfil | Parcial |
| Tema claro y oscuro | Implementado |
| Estados de carga, error y ausencia de datos | Implementado |
| Integración con API | Pendiente |
| Autenticación real | Pendiente |

La historia clínica no incluye edición y los avisos no utilizan notificaciones push.

## Verificación

Desde `mobile-app/`:

```sh
npm run lint
npm run typecheck
node scripts/check-services.cjs
npm run export:android
```

El script comprueba sesión, fechas, consultas, cambios de estado, historia clínica y lectura de avisos con almacenamiento sustituido. La exportación Android genera un bundle en `dist/`, no un APK instalable.

La validación visual y funcional en dispositivos físicos o emuladores sigue pendiente, incluyendo teclado, accesibilidad, distintos tamaños de pantalla y persistencia del tema.

## Próximos pasos

- Completar los contratos e integrar los servicios con la API.
- Reemplazar los datos locales por información del backend.
- Incorporar autenticación real y adaptar la gestión de sesión.
- Validar los recorridos completos en dispositivos Android.
- Revisar accesibilidad, manejo de errores y presentación en distintos tamaños de pantalla.

## Integrantes

- Benjamín Moris
- Gonzalo Perea
