# OdontoSmart API

API ASP.NET Core sobre .NET 10, Entity Framework Core 10 y SQL Server. Utiliza controladores y DTOs; conserva el esquema relacional de OdontoSmart.

## Preparación local

Requiere .NET SDK 10 y una instancia de SQL Server disponible.

1. Para una instalación nueva, ejecutar OdontoSmart.sql de la raíz en SQL Server. No ejecutarlo sobre una base existente.
2. Ejecutar Actualizacion Prestacion-Turno.sql y Actualizacion Estados-Turno.sql. Ambos son idempotentes.
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
