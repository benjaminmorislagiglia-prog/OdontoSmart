using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;
namespace OdontoSmartAPI.Controllers;

[ApiController]
[Route("api/prestacionturnos")]
public class PrestacionTurnosController(AppDbContext context) : ControllerBase
{
    private static PrestacionTurnoDto ToDto(PrestacionTurno p) => new()
    {
        IdPrestacionTurno = p.IdPrestacionTurno, IdTurno = p.IdTurno, IdPrestacion = p.IdPrestacion,
        FechaRealizacion = p.FechaRealizacion, PrecioAplicado = p.PrecioAplicado,
        GarantiaMesesAplicada = p.GarantiaMesesAplicada
    };

    [HttpGet]
    public async Task<IActionResult> GetTodos() =>
        Ok((await context.PrestacionTurnos.AsNoTracking().OrderBy(p => p.IdPrestacionTurno).ToListAsync()).Select(ToDto));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPorId(int id)
    {
        var p = await context.PrestacionTurnos.AsNoTracking().FirstOrDefaultAsync(p => p.IdPrestacionTurno == id);
        return p == null ? NotFound("La prestación del turno no existe.") : Ok(ToDto(p));
    }

    [HttpGet("turno/{idTurno:int}")]
    public async Task<IActionResult> GetPorTurno(int idTurno)
    {
        if (!await context.Turnos.AnyAsync(t => t.IdTurno == idTurno)) return NotFound("El turno no existe.");
        return Ok((await context.PrestacionTurnos.AsNoTracking().Where(p => p.IdTurno == idTurno).ToListAsync()).Select(ToDto));
    }

    private async Task<string?> Validar(PrestacionTurnoGuardarDto dto)
    {
        if (!await context.Turnos.AnyAsync(t => t.IdTurno == dto.IdTurno)) return "El turno no existe.";
        if (!await context.Prestacions.AnyAsync(p => p.IdPrestacion == dto.IdPrestacion)) return "La prestación no existe.";
        return null;
    }

    private static void Aplicar(PrestacionTurno p, PrestacionTurnoGuardarDto dto)
    {
        p.IdTurno = dto.IdTurno; p.IdPrestacion = dto.IdPrestacion;
        p.FechaRealizacion = dto.FechaRealizacion; p.PrecioAplicado = dto.PrecioAplicado;
        p.GarantiaMesesAplicada = dto.GarantiaMesesAplicada;
    }

    [HttpPost]
    public async Task<IActionResult> Crear(PrestacionTurnoGuardarDto dto)
    {
        var error = await Validar(dto);
        if (error != null) return BadRequest(error);
        var p = new PrestacionTurno();
        Aplicar(p, dto);
        context.PrestacionTurnos.Add(p);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPorId), new { id = p.IdPrestacionTurno }, ToDto(p));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, PrestacionTurnoGuardarDto dto)
    {
        var p = await context.PrestacionTurnos.FindAsync(id);
        if (p == null) return NotFound("La prestación del turno no existe.");
        var error = await Validar(dto);
        if (error != null) return BadRequest(error);
        Aplicar(p, dto);
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var p = await context.PrestacionTurnos.FindAsync(id);
        if (p == null) return NotFound("La prestación del turno no existe.");
        context.PrestacionTurnos.Remove(p);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
