# OdontoSmart Mobile

Aplicación móvil de OdontoSmart para consultar información y realizar acciones rápidas en una clínica odontológica. Forma parte de un proyecto que incluye una aplicación web, una API y una base de datos SQL Server.

## Descripción

OdontoSmart Mobile está orientada al personal interno de la clínica, especialmente odontólogos y personal administrativo. Permite consultar la agenda, información de pacientes, historia clínica y avisos internos desde un teléfono.

Actualmente utiliza datos simulados y prioriza Android. No está orientada a pacientes.

## Problemática

La gestión de una clínica requiere consultar información que puede estar distribuida entre diferentes herramientas. El proyecto busca mejorar:

- La consulta rápida de turnos y el seguimiento de su estado.
- El acceso móvil a datos de pacientes y antecedentes clínicos.
- La organización de información administrativa y avisos internos.

## Objetivo

Proporcionar acceso rápido y organizado desde dispositivos móviles a las funciones más relevantes de OdontoSmart. Se centra en consultas y acciones breves, como confirmar un turno o revisar un paciente, sin reemplazar completamente la aplicación web administrativa.

## Integrantes

- Benjamín Moris
- Gonzalo Perea

## Tecnologías utilizadas

- **JavaScript, React y React Native:** desarrollo de la aplicación.
- **Expo SDK 57:** entorno de desarrollo y exportación.
- **React Navigation:** navegación con Native Stack y Bottom Tabs.
- **AsyncStorage:** persistencia local de sesión y preferencia visual.
- **Ionicons mediante @expo/vector-icons:** iconos de la interfaz.
- **react-native-safe-area-context y react-native-screens:** soporte de áreas seguras y navegación nativa.

Como herramientas de desarrollo se utilizan ESLint y TypeScript para verificar los archivos JavaScript mediante `checkJs`. Las versiones concretas están en `package.json` y `package-lock.json`.

## Arquitectura e integración

Flujo actual de las consultas:

```text
OdontoSmart Mobile
        ↓
     Services
        ↓
Datos locales (mocks)
```

Las pantallas consumen servicios asíncronos separados de los datos. La sesión y el tema se gestionan mediante contextos; sus preferencias se guardan en AsyncStorage.

Integración futura prevista:

```text
OdontoSmart Mobile / Aplicación web
                ↓
       ASP.NET Core Web API
                ↓
       Entity Framework Core
                ↓
      SQL Server / OdontoSmartDB
```

Mobile y web consumirán la misma API. ASP.NET Core, Entity Framework Core y SQL Server corresponden a esa integración futura; no son dependencias del proyecto móvil.

Existe una preparación HTTP en `src/services/api.js` y una variable `EXPO_PUBLIC_API_URL` documentada en `.env.example`. Los servicios actuales no utilizan esa conexión ni tienen endpoints definitivos.

## Features y estado actual

**Criterio:** ✅ Implementado indica que el alcance descrito existe en el código; ⚠️ Parcial indica que la interfaz y el flujo local existen, pero falta integración real; ⏳ Pendiente indica que la funcionalidad aún no está desarrollada. Estos estados no sustituyen la validación en dispositivos.

| Feature | Descripción y alcance actual | Estado |
|---------|------------------------------|--------|
| Login | Validación de campos y credenciales locales, mostrar/ocultar contraseña. Falta autenticación real. | ⚠️ Parcial |
| Sesión y cierre de sesión | Restauración del usuario local con AsyncStorage y logout. Falta gestión de sesión del backend. | ⚠️ Parcial |
| Navegación | Login, cinco pestañas y pantallas de detalle en Stack; árbol autenticado separado. | ✅ Implementado |
| Dashboard / Inicio | Fecha, turnos de hoy, pendientes, próximo turno, pacientes recientes y avisos con datos locales. | ⚠️ Parcial |
| Turnos | Consulta por día, filtros por estado y búsqueda por paciente u odontólogo. | ⚠️ Parcial |
| Detalle de turno | Datos del turno, contacto, observaciones y acceso al paciente. | ⚠️ Parcial |
| Acciones sobre turnos | Confirmar, marcar atendido y cancelar con confirmación; cambios solo en memoria. | ⚠️ Parcial |
| Pacientes | Listado y búsqueda por nombre, DNI o teléfono; datos de contacto y cobertura. | ⚠️ Parcial |
| Detalle de paciente | Datos personales, próximos y últimos turnos y acceso a historia clínica. | ⚠️ Parcial |
| Historia clínica | Consulta cronológica de registros locales, sin edición. | ⚠️ Parcial |
| Notificaciones internas | Avisos locales con estados leído/no leído; sin notificaciones push. | ⚠️ Parcial |
| Perfil | Nombre y cargo locales, usuario de sesión y acceso al cierre de sesión. | ⚠️ Parcial |
| Tema claro y oscuro | Paletas compartidas y preferencia guardada en AsyncStorage. | ✅ Implementado |
| Estados de consulta | Componentes reutilizables de carga, error con reintento y ausencia de datos. | ✅ Implementado |
| Integración con API | Sustitución de datos locales por consultas y operaciones del backend compartido. | ⏳ Pendiente |
| Autenticación real | Validación de identidad y sesión mediante la API futura. | ⏳ Pendiente |

Actualizar esta tabla al completar cada alcance y su integración, manteniendo separadas las capacidades locales de las operaciones del backend.

## Navegación

```text
Login
└── App
    ├── Inicio
    ├── Turnos → Detalle del turno → Detalle del paciente
    ├── Pacientes → Detalle del paciente → Historia clínica
    ├── Avisos
    └── Perfil
```

Los detalles se abren sobre las pestañas. Al cerrar sesión se desmonta la navegación autenticada.

## Estructura del proyecto

```text
mobile-app/
├── assets/
├── scripts/
│   └── check-services.cjs
├── src/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── mocks/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── styles/
│   └── utils/
├── .env.example
├── App.js
├── app.json
├── index.js
├── package.json
└── package-lock.json
```

Los componentes comunes incluyen botones, entradas, encabezados, tarjetas de turno, indicadores de estado y modal de confirmación. Las utilidades presentan fechas en formato argentino `dd/mm/yyyy` y horas `HH:mm`.

## Instalación y ejecución

Desde la raíz del repositorio, con Node.js y npm instalados:

```sh
cd mobile-app
npm install
npm start
```

El entorno utilizado para las verificaciones fue Node.js 24. Expo muestra un QR en la terminal: abrirlo desde Expo Go compatible con SDK 57 en un Android conectado a la misma red que la computadora. Para acceder desde el teléfono, iniciar sin `--localhost`.

Credenciales actuales de acceso local:

- Usuario: `admin`
- Contraseña: `1234`

AsyncStorage guarda únicamente el usuario de sesión, nunca la contraseña. No se necesita configurar una API para ejecutar el estado actual.

## Verificación

Comandos disponibles y comprobados durante el desarrollo, ejecutados desde `mobile-app/`:

```sh
npm run lint
npm run typecheck
node scripts/check-services.cjs
npm run export:android
```

Se verificaron lint, tipos, servicios locales, arranque de Metro y exportación Android/Hermes. El script comprueba login/logout con almacenamiento sustituido, fechas, consultas, transiciones de turnos, historia clínica y lectura de avisos.

La exportación genera un bundle en `dist/`, no un APK instalable. Está pendiente la validación visual y funcional en dispositivos o emuladores Android, incluyendo navegación, teclado, TalkBack, tamaños de pantalla y persistencia del tema.

## Estado actual

OdontoSmart Mobile se encuentra en desarrollo activo. Las pantallas principales, navegación y flujos locales están desarrollados; la integración con la API y la autenticación real siguen pendientes.

Los cambios de estado de turnos y la lectura de avisos se mantienen en memoria y se reinician al recargar la aplicación. La sesión local y el tema sí persisten. La historia clínica es de lectura y los avisos internos utilizan datos predefinidos.

## Próximos pasos

- Acordar los contratos de la API compartida con la aplicación web.
- Reemplazar los mocks por servicios conectados al backend.
- Incorporar autenticación real y adaptar la gestión de sesión.
- Validar pantallas y recorridos completos en dispositivos Android.
- Comprobar accesibilidad, teclado, tamaños de pantalla y manejo de errores con respuestas reales.
