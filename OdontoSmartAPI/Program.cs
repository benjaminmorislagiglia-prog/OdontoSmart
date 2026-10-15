using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();
var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy("Web", policy =>
{
    if (origins.Length > 0)
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
}));

// 1. Registrar Entity Framework Core con SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// 2. Registrar los controladores de la API
builder.Services.AddControllers();

// 3. Configurar OpenAPI
builder.Services.AddOpenApi();

// 4. Registrar Swagger
builder.Services.AddSwaggerGen();

// 5. Construir la aplicación
var app = builder.Build();

// 6. Habilitar OpenAPI y Swagger en desarrollo
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwagger();
    app.UseSwaggerUI();
}

// 7. Redirigir HTTP a HTTPS
app.UseHttpsRedirection();
app.UseCors("Web");
app.Use(async (context, next) =>
{
    try { await next(); }
    catch (Exception ex) when (ex is Microsoft.Data.SqlClient.SqlException ||
        ex is DbUpdateException)
    {
        var sql = ex as Microsoft.Data.SqlClient.SqlException ?? ex.InnerException as Microsoft.Data.SqlClient.SqlException;
        var conflict = sql?.Number is 1205 or 2601 or 2627 or 547 or 51000;
        app.Logger.LogError(ex, "Error al acceder a la base de datos");
        context.Response.StatusCode = conflict ? 409 : 503;
        await context.Response.WriteAsJsonAsync(new { mensaje = conflict
            ? "La operación entra en conflicto con los datos actuales. Revisá los datos e intentá nuevamente."
            : "No se pudo acceder a la base de datos. Verificá la conexión y el esquema instalado." });
    }
});

// 8. Middleware de autorización
app.UseAuthorization();

// 9. Habilitar las rutas de los controladores
app.MapControllers();

// 10. Iniciar la aplicación
app.Run();
