using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
namespace OdontoSmartAPI.Data;

public static class AgendaRules
{
    // Todas las escrituras de agenda/estado comparten el bloqueo transaccional.
    // Evita que dos solicitudes validen libre el mismo horario simultáneamente.
    public static async Task<IDbContextTransaction> LockAsync(AppDbContext context)
    {
        var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            await context.Database.ExecuteSqlRawAsync("""
                DECLARE @result int;
                EXEC @result = sp_getapplock @Resource = 'OdontoSmart:Agenda',
                    @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 10000;
                IF @result < 0 THROW 51000, 'La agenda está siendo actualizada. Intentá nuevamente.', 1;
                """);
            return transaction;
        }
        catch { await transaction.DisposeAsync(); throw; }
    }

    public static async Task<string?> ConflictAsync(AppDbContext context, DateOnly fecha, TimeOnly hora,
        int odontologo, int consultorio, int exclude = 0)
    {
        var occupied = context.Turnos.Where(t => t.IdTurno != exclude && t.Fecha == fecha && t.Hora == hora)
            .Where(t => t.HistorialEstadoTurnos.OrderByDescending(h => h.FechaHora)
                .ThenByDescending(h => h.IdHistorialEstadoTurno)
                .Select(h => h.IdEstadoTurnoNavigation.Nombre).FirstOrDefault() != "Cancelado");
        if (await occupied.AnyAsync(t => t.IdOdontologo == odontologo)) return "El odontólogo ya tiene un turno en esa fecha y hora.";
        if (await occupied.AnyAsync(t => t.IdConsultorio == consultorio)) return "El consultorio ya está reservado en esa fecha y hora.";
        return null;
    }
}
