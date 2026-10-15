
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[ApiController]
[Route("api/historialestadoturno")]
public class HistorialEstadoTurnoController : ControllerBase
{
    private readonly AppDbContext _context;

    public HistorialEstadoTurnoController(AppDbContext context)
    {
        _context = context;
    }

    private static HistorialEstadoTurnoDto ConvertirDto(
        HistorialEstadoTurno h)
    {
        return new HistorialEstadoTurnoDto
        {
            IdHistorialEstadoTurno = h.IdHistorialEstadoTurno,
            IdTurno = h.IdTurno,
            IdEstadoTurno = h.IdEstadoTurno,
            FechaHora = h.FechaHora
        };
    }

    // 1. GET: api/historialestadoturno
    [HttpGet]
    public async Task<IActionResult> GetHistorial()
    {
        var historial = await _context.Set<HistorialEstadoTurno>()
            .AsNoTracking()
            .OrderByDescending(h => h.FechaHora)
            .ThenByDescending(h => h.IdHistorialEstadoTurno)
            .Select(h => new HistorialEstadoTurnoDto
            {
                IdHistorialEstadoTurno = h.IdHistorialEstadoTurno,
                IdTurno = h.IdTurno,
                IdEstadoTurno = h.IdEstadoTurno,
                FechaHora = h.FechaHora
            })
            .ToListAsync();

        return Ok(historial);
    }

    // 2. GET: api/historialestadoturno/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetHistorialPorId(int id)
    {
        var registro = await _context.Set<HistorialEstadoTurno>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                h => h.IdHistorialEstadoTurno == id);

        if (registro == null)
        {
            return NotFound(
                "El registro de historial no existe.");
        }

        return Ok(ConvertirDto(registro));
    }

    // 3. GET: api/historialestadoturno/turno/1
    [HttpGet("turno/{idTurno:int}")]
    public async Task<IActionResult> GetHistorialPorTurno(
        int idTurno)
    {
        var turnoExiste = await _context.Set<Turno>()
            .AnyAsync(t => t.IdTurno == idTurno);

        if (!turnoExiste)
        {
            return NotFound("El turno no existe.");
        }

        var historial = await _context.Set<HistorialEstadoTurno>()
            .AsNoTracking()
            .Where(h => h.IdTurno == idTurno)
            .OrderBy(h => h.FechaHora)
            .ThenBy(h => h.IdHistorialEstadoTurno)
            .Select(h => new HistorialEstadoTurnoDto
            {
                IdHistorialEstadoTurno = h.IdHistorialEstadoTurno,
                IdTurno = h.IdTurno,
                IdEstadoTurno = h.IdEstadoTurno,
                FechaHora = h.FechaHora
            })
            .ToListAsync();

        return Ok(historial);
    }

    // 4. POST: api/historialestadoturno
    [HttpPost]
    public async Task<IActionResult> CrearRegistro(
        [FromBody] HistorialEstadoTurnoGuardarDto dto)
    {
        // Validar existencia del turno
        await using var transaction = await AgendaRules.LockAsync(_context);
        var turnoExiste = await _context.Set<Turno>()
            .AnyAsync(t => t.IdTurno == dto.IdTurno);

        if (!turnoExiste)
        {
            return BadRequest(
                "El turno indicado no existe.");
        }

        // Validar existencia del estado
        var estadoExiste = await _context.Set<EstadoTurno>()
            .AnyAsync(e =>
                e.IdEstadoTurno == dto.IdEstadoTurno);

        if (!estadoExiste)
        {
            return BadRequest(
                "El estado de turno indicado no existe.");
        }

        // Obtener el último estado registrado
        var ultimoEstado = await _context
            .Set<HistorialEstadoTurno>()
            .AsNoTracking()
            .Where(h => h.IdTurno == dto.IdTurno)
            .OrderByDescending(h => h.FechaHora)
            .ThenByDescending(h => h.IdHistorialEstadoTurno)
            .Select(h => (int?)h.IdEstadoTurno)
            .FirstOrDefaultAsync();

        // Evitar registrar dos veces seguidas el mismo estado
        if (ultimoEstado == dto.IdEstadoTurno)
        {
            return Conflict(
                "El turno ya tiene ese estado como último estado registrado.");
        }

        var targetName = await _context.EstadoTurnos.Where(e => e.IdEstadoTurno == dto.IdEstadoTurno)
            .Select(e => e.Nombre).FirstAsync();
        if (targetName != "Cancelado")
        {
            var turno = await _context.Turnos.FirstAsync(t => t.IdTurno == dto.IdTurno);
            var error = await AgendaRules.ConflictAsync(_context, turno.Fecha, turno.Hora,
                turno.IdOdontologo, turno.IdConsultorio, turno.IdTurno);
            if (error != null) return Conflict(error);
        }

        var registro = new HistorialEstadoTurno
        {
            IdTurno = dto.IdTurno,
            IdEstadoTurno = dto.IdEstadoTurno,
            FechaHora = DateTime.Now
        };

        _context.Set<HistorialEstadoTurno>().Add(registro);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return CreatedAtAction(
            nameof(GetHistorialPorId),
            new { id = registro.IdHistorialEstadoTurno },
            ConvertirDto(registro));
    }

    // 5. PUT: api/historialestadoturno/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarRegistro(
        int id,
        [FromBody] HistorialEstadoTurnoGuardarDto dto)
    {
        var existe = await _context.Set<HistorialEstadoTurno>()
            .AnyAsync(h => h.IdHistorialEstadoTurno == id);

        if (!existe)
        {
            return NotFound(
                "El registro de historial no existe.");
        }

        return Conflict(
            "Los registros históricos de estados no pueden modificarse. Registrá un nuevo cambio de estado mediante POST.");
    }

    // 6. DELETE: api/historialestadoturno/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarRegistro(int id)
    {
        var existe = await _context.Set<HistorialEstadoTurno>()
            .AnyAsync(h => h.IdHistorialEstadoTurno == id);

        if (!existe)
        {
            return NotFound(
                "El registro de historial no existe.");
        }

        return Conflict(
            "No se puede eliminar un registro del historial de estados de turno.");
    }
}
