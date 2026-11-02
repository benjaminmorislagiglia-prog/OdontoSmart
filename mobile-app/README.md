OdontoSmartapp

Benjamín Moris
Gonzalo Perea

////////////////////////////////////////////////////////////////////////////////////////////////////

Cómo ejecutar la aplicación mobile

Se necesita Node.js y .NET SDK 10 en la computadora, y Expo Go compatible con SDK 58 en el teléfono. La base de datos debe estar disponible y configurada para la API de OdontoSmart.

La aplicación utiliza la API de OdontoSmart. Para iniciar la API y Expo se cuenta con un iniciador automático.

1. Conectar la computadora y el teléfono a la misma red Wi-Fi o LAN.

2. Si las dependencias todavía no están instaladas, abrir una terminal en mobile-app y ejecutar: npm install.

3. Ir a la carpeta principal del proyecto.

4. Ejecutar con doble clic el archivo Iniciar-OdontoSmart-Mobile.cmd.

5. El iniciador detectará la IP local de la computadora, preparará mobile-app/.env.local e iniciará la API y Expo en ventanas separadas. Si ya están ejecutándose con la configuración correcta, los reutilizará.

6. Abrir Expo Go en el teléfono y escanear el código QR que muestra la ventana de Expo.

7. Para detener la API y Expo, presionar Ctrl+C en cada ventana. Las ventanas permanecen abiertas para consultar los mensajes.

////////////////////////////////////////////////////////////////////////////////////////////////////

Funcionalidades agregadas

- Aplicación mobile desarrollada con React Native y Expo SDK 58.
- Conexión con la API real de OdontoSmart.
- Consulta de pacientes registrados en el sistema.
- Visualización detallada de la información de los pacientes.
- Consulta de historias clínicas reales vinculadas a cada paciente.
- Consulta y gestión de turnos.
- Posibilidad de agendar un turno directamente desde un paciente activo.
- Selección de odontólogo, consultorio, fecha y hora para nuevos turnos.
- Actualización de los estados de los turnos según los cambios permitidos por la API.
- Dashboard con información obtenida desde la API.
- Uso de TanStack Query para consultas, caché y actualización de información.
- Uso de Zustand para el manejo de la sesión local de la aplicación.
- Uso de cámara y galería para modificar y guardar la foto de perfil de un paciente.
- Animaciones mediante React Native Animated API.
- Animaciones visibles al presionar botones, tarjetas y accesos principales.
- Soporte para reducción de movimiento por accesibilidad.
- Inicio automático de API y Expo mediante Iniciar-OdontoSmart-Mobile.cmd.
- Detección automática de la IP local para conectar el teléfono con la API.

////////////////////////////////////////////////////////////////////////////////////////////////////
