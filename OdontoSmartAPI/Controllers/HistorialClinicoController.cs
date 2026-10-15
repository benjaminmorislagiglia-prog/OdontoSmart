using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class HistorialClinicoController : ControllerBase
{
    private readonly AppDbContext _context;

    public HistorialClinicoController(AppDbContext context)
    {
        _context = context;
    }

    private static HistorialClinicoDto ConvertirDto(
        HistorialClinico historial)
    {
        return new HistorialClinicoDto
        {
            IdHistorialClinico = historial.IdHistorialClinico,
            IdPaciente = historial.IdPaciente,
            IdTurno = historial.IdTurno,
            Diagnostico = historial.Diagnostico,
            TratamientosRealizados = historial.TratamientosRealizados,
            Observaciones = historial.Observaciones,
            Anulado = historial.Anulado,
            MotivoAnulacion = historial.MotivoAnulacion,
            FechaAnulacion = historial.FechaAnulacion
        };
    }

    // 1. GET: api/historialclinico
    [HttpGet]
    public async Task<IActionResult> GetHistoriales()
    {
        var historiales = await _context.Set<HistorialClinico>()
            .AsNoTracking()
            .Select(h => new HistorialClinicoDto
            {
                IdHistorialClinico = h.IdHistorialClinico,
                IdPaciente = h.IdPaciente,
                IdTurno = h.IdTurno,
                Diagnostico = h.Diagnostico,
                TratamientosRealizados = h.TratamientosRealizados,
                Observaciones = h.Observaciones,
                Anulado = h.Anulado,
                MotivoAnulacion = h.MotivoAnulacion,
                FechaAnulacion = h.FechaAnulacion
            })
            .ToListAsync();

        return Ok(historiales);
    }

    // 2. GET: api/historialclinico/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetHistorialPorId(int id)
    {
        var historial = await _context.Set<HistorialClinico>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                h => h.IdHistorialClinico == id);

        if (historial == null)
        {
            return NotFound(
                "No se encontró la historia clínica.");
        }

        return Ok(ConvertirDto(historial));
    }

    // 3. GET: api/historialclinico/paciente/1
    [HttpGet("paciente/{idPaciente:int}")]
    public async Task<IActionResult> GetHistorialPorPaciente(
        int idPaciente)
    {
        var pacienteExiste = await _context.Pacientes
            .AnyAsync(p => p.IdPaciente == idPaciente);

        if (!pacienteExiste)
        {
            return NotFound("El paciente no existe.");
        }

        var historiales = await _context.Set<HistorialClinico>()
            .AsNoTracking()
            .Where(h => h.IdPaciente == idPaciente)
            .OrderByDescending(h => h.IdTurno)
            .Select(h => new HistorialClinicoDto
            {
                IdHistorialClinico = h.IdHistorialClinico,
                IdPaciente = h.IdPaciente,
                IdTurno = h.IdTurno,
                Diagnostico = h.Diagnostico,
                TratamientosRealizados = h.TratamientosRealizados,
                Observaciones = h.Observaciones,
                Anulado = h.Anulado,
                MotivoAnulacion = h.MotivoAnulacion,
                FechaAnulacion = h.FechaAnulacion
            })
            .ToListAsync();

        return Ok(historiales);
    }

    // 4. POST: api/historialclinico
    [HttpPost]
    public async Task<IActionResult> CrearHistorial(
        [FromBody] HistorialClinicoGuardarDto dto)
    {
        var pacienteExiste = await _context.Pacientes
            .AnyAsync(p => p.IdPaciente == dto.IdPaciente);

        if (!pacienteExiste)
        {
            return BadRequest("El paciente no existe.");
        }

        var turno = await _context.Turnos
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdTurno == dto.IdTurno);

        if (turno == null)
        {
            return BadRequest("El turno no existe.");
        }

        if (turno.IdPaciente != dto.IdPaciente)
        {
            return BadRequest(
                "El turno no pertenece al paciente indicado.");
        }


        var historialExistente = await _context.Set<HistorialClinico>()
            .AnyAsync(h => h.IdTurno == dto.IdTurno);

        if (historialExistente)
        {
            return Conflict(
                "Este turno ya tiene una entrada de historia clínica registrada.");
        }

        var historial = new HistorialClinico
        {
            IdPaciente = dto.IdPaciente,
            IdTurno = dto.IdTurno,
            Diagnostico = dto.Diagnostico,
            TratamientosRealizados = dto.TratamientosRealizados,
            Observaciones = dto.Observaciones
        };

        _context.Set<HistorialClinico>().Add(historial);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetHistorialPorId),
            new { id = historial.IdHistorialClinico },
            ConvertirDto(historial));
    }

    // 5. PUT: api/historialclinico/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarHistorial(
        int id,
        [FromBody] HistorialClinicoGuardarDto dto)
    {
        var historial = await _context.Set<HistorialClinico>()
            .FirstOrDefaultAsync(
                h => h.IdHistorialClinico == id);

        if (historial == null)
        {
            return NotFound(
                "No se encontró la historia clínica.");
        }

        if (historial.Anulado)
        {
            return Conflict("No se puede modificar una historia clínica anulada.");
        }

        var pacienteExiste = await _context.Pacientes
            .AnyAsync(p => p.IdPaciente == dto.IdPaciente);

        if (!pacienteExiste)
        {
            return BadRequest("El paciente no existe.");
        }

        var turno = await _context.Turnos
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdTurno == dto.IdTurno);

        if (turno == null)
        {
            return BadRequest("El turno no existe.");
        }

        if (turno.IdPaciente != dto.IdPaciente)
        {
            return BadRequest(
                "El turno no pertenece al paciente indicado.");
        }

        // No permitimos cambiar el paciente ni el turno
        // de una historia clínica ya registrada.
        if (historial.IdPaciente != dto.IdPaciente ||
            historial.IdTurno != dto.IdTurno)
        {
            return Conflict(
                "No se puede cambiar el paciente o turno " +
                "de una historia clínica existente.");
        }

        // La condición se evalúa en SQL para impedir ediciones que compitan con una anulación.
        var updated = await _context.HistorialClinicos
            .Where(h => h.IdHistorialClinico == id && !h.Anulado)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(h => h.Diagnostico, dto.Diagnostico)
                .SetProperty(h => h.TratamientosRealizados, dto.TratamientosRealizados)
                .SetProperty(h => h.Observaciones, dto.Observaciones));
        if (updated == 0)
        {
            return Conflict("La historia clínica ya no admite modificaciones. Volvé a consultarla.");
        }

        return NoContent();
    }

    // POST: api/historialclinico/1/anular. No altera el contenido clínico.
    [HttpPost("{id:int}/anular")]
    public async Task<IActionResult> AnularHistorial(int id, [FromBody] HistorialClinicoAnularDto dto)
    {
        var motivo = dto.Motivo.Trim();
        if (motivo.Length == 0)
            return BadRequest("Debe indicar el motivo de anulación.");

        var fecha = DateTime.UtcNow;
        await _context.HistorialClinicos
            .Where(h => h.IdHistorialClinico == id && !h.Anulado)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(h => h.Anulado, true)
                .SetProperty(h => h.MotivoAnulacion, motivo)
                .SetProperty(h => h.FechaAnulacion, (DateTime?)fecha));

        var historial = await _context.HistorialClinicos.AsNoTracking()
            .FirstOrDefaultAsync(h => h.IdHistorialClinico == id);
        if (historial == null)
            return NotFound("No se encontró la historia clínica.");

        // Los reintentos conservan el primer motivo y la primera fecha.
        return Ok(ConvertirDto(historial));
    }

    // 6. DELETE: api/historialclinico/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarHistorial(int id)
    {
        var historialExiste = await _context.Set<HistorialClinico>()
            .AnyAsync(h => h.IdHistorialClinico == id);

        if (!historialExiste)
        {
            return NotFound(
                "No se encontró la historia clínica.");
        }

        return Conflict(new
        {
            mensaje =
                "No se permite eliminar físicamente una historia clínica. " +
                "Utilizá la acción de anulación " +
                "que conserve la trazabilidad."
        });
    }
}
