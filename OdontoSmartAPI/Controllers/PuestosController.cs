
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/puestos")]
[ApiController]
public class PuestosController : ControllerBase
{
    private readonly AppDbContext _context;

    public PuestosController(AppDbContext context)
    {
        _context = context;
    }

    private static PuestoDto ConvertirDto(Puesto puesto)
    {
        return new PuestoDto
        {
            IdPuesto = puesto.IdPuesto,
            Nombre = puesto.Nombre
        };
    }

    // 1. GET: api/puestos
    [HttpGet]
    public async Task<IActionResult> GetPuestos()
    {
        var puestos = await _context.Set<Puesto>()
            .AsNoTracking()
            .OrderBy(p => p.Nombre)
            .Select(p => new PuestoDto
            {
                IdPuesto = p.IdPuesto,
                Nombre = p.Nombre
            })
            .ToListAsync();

        return Ok(puestos);
    }

    // 2. GET: api/puestos/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPuestoPorId(int id)
    {
        var puesto = await _context.Set<Puesto>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPuesto == id);

        if (puesto == null)
        {
            return NotFound("El puesto no existe.");
        }

        return Ok(ConvertirDto(puesto));
    }

    // 3. POST: api/puestos
    [HttpPost]
    public async Task<IActionResult> CrearPuesto(
        [FromBody] PuestoGuardarDto dto)
    {
        var nombre = dto.Nombre?.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre del puesto es obligatorio.");
        }

        // Evitar nombres duplicados
        var nombreExiste = await _context.Set<Puesto>()
            .AnyAsync(p => p.Nombre == nombre);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe un puesto con ese nombre.");
        }

        var puesto = new Puesto
        {
            Nombre = nombre
        };

        _context.Set<Puesto>().Add(puesto);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetPuestoPorId),
            new { id = puesto.IdPuesto },
            ConvertirDto(puesto));
    }

    // 4. PUT: api/puestos/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarPuesto(
        int id,
        [FromBody] PuestoGuardarDto dto)
    {
        var puesto = await _context.Set<Puesto>()
            .FirstOrDefaultAsync(p => p.IdPuesto == id);

        if (puesto == null)
        {
            return NotFound("El puesto no existe.");
        }

        var nombre = dto.Nombre?.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre del puesto es obligatorio.");
        }

        // Evitar duplicados, excluyendo el puesto actual
        var nombreExiste = await _context.Set<Puesto>()
            .AnyAsync(p =>
                p.Nombre == nombre &&
                p.IdPuesto != id);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe otro puesto con ese nombre.");
        }

        puesto.Nombre = nombre;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 5. DELETE: api/puestos/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarPuesto(int id)
    {
        var puesto = await _context.Set<Puesto>()
            .FirstOrDefaultAsync(p => p.IdPuesto == id);

        if (puesto == null)
        {
            return NotFound("El puesto no existe.");
        }

        // No eliminar puestos utilizados por empleados
        var tieneEmpleados = await _context.Set<Empleado>()
            .AnyAsync(e => e.IdPuesto == id);

        if (tieneEmpleados)
        {
            return Conflict(
                "No se puede eliminar el puesto porque tiene empleados asociados.");
        }

        _context.Set<Puesto>().Remove(puesto);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
