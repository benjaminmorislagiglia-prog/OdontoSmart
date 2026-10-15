
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[ApiController]
[Route("api/estadosturno")]
public class EstadosTurnoController : ControllerBase
{
    private readonly AppDbContext _context;

    public EstadosTurnoController(AppDbContext context)
    {
        _context = context;
    }

    private static EstadoTurnoDto ConvertirDto(EstadoTurno e)
    {
        return new EstadoTurnoDto
        {
            IdEstadoTurno = e.IdEstadoTurno,
            Nombre = e.Nombre
        };
    }

    // 1. GET: api/estadosturno
    [HttpGet]
    public async Task<IActionResult> GetEstadosTurno()
    {
        var estados = await _context.Set<EstadoTurno>()
            .AsNoTracking()
            .OrderBy(e => e.Nombre)
            .Select(e => new EstadoTurnoDto
            {
                IdEstadoTurno = e.IdEstadoTurno,
                Nombre = e.Nombre
            })
            .ToListAsync();

        return Ok(estados);
    }

    // 2. GET: api/estadosturno/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetEstadoTurnoPorId(int id)
    {
        var estado = await _context.Set<EstadoTurno>()
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdEstadoTurno == id);

        if (estado == null)
        {
            return NotFound("El estado de turno no existe.");
        }

        return Ok(ConvertirDto(estado));
    }

    // 3. POST: api/estadosturno
    [HttpPost]
    public async Task<IActionResult> CrearEstadoTurno(
        [FromBody] EstadoTurnoGuardarDto dto)
    {
        var nombre = dto.Nombre?.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre del estado es obligatorio.");
        }

        // Evitar nombres duplicados
        var nombreExiste = await _context.Set<EstadoTurno>()
            .AnyAsync(e => e.Nombre == nombre);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe un estado de turno con ese nombre.");
        }

        var estado = new EstadoTurno
        {
            Nombre = nombre
        };

        _context.Set<EstadoTurno>().Add(estado);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetEstadoTurnoPorId),
            new { id = estado.IdEstadoTurno },
            ConvertirDto(estado));
    }

    // 4. PUT: api/estadosturno/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarEstadoTurno(
        int id,
        [FromBody] EstadoTurnoGuardarDto dto)
    {
        var estado = await _context.Set<EstadoTurno>()
            .FirstOrDefaultAsync(e => e.IdEstadoTurno == id);

        if (estado == null)
        {
            return NotFound("El estado de turno no existe.");
        }

        var nombre = dto.Nombre?.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre del estado es obligatorio.");
        }

        // Evitar duplicados, excluyendo el estado actual
        var nombreExiste = await _context.Set<EstadoTurno>()
            .AnyAsync(e =>
                e.Nombre == nombre &&
                e.IdEstadoTurno != id);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe otro estado de turno con ese nombre.");
        }

        if (nombre != estado.Nombre && (nombre == "Cancelado" || estado.Nombre == "Cancelado") &&
            await _context.HistorialEstadoTurnos.AnyAsync(h => h.IdEstadoTurno == id))
            return Conflict("No se puede cambiar el significado de cancelación de un estado utilizado en el historial.");
        estado.Nombre = nombre;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 5. DELETE: api/estadosturno/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarEstadoTurno(int id)
    {
        var estado = await _context.Set<EstadoTurno>()
            .FirstOrDefaultAsync(e => e.IdEstadoTurno == id);

        if (estado == null)
        {
            return NotFound("El estado de turno no existe.");
        }

        // No eliminar estados utilizados en el historial
        var tieneHistorial = await _context.Set<EstadoTurno>()
            .Where(e => e.IdEstadoTurno == id)
            .AnyAsync(e => e.HistorialEstadoTurnos.Any());

        if (tieneHistorial)
        {
            return Conflict(
                "No se puede eliminar el estado porque está utilizado en el historial de turnos.");
        }

        _context.Set<EstadoTurno>().Remove(estado);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
