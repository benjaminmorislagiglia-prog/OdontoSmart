
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/prestaciones")]
[ApiController]
public class PrestacionesController : ControllerBase
{
    private readonly AppDbContext _context;

    public PrestacionesController(AppDbContext context)
    {
        _context = context;
    }

    private static PrestacionDto ConvertirDto(Prestacion p)
    {
        return new PrestacionDto
        {
            IdPrestacion = p.IdPrestacion,
            Nombre = p.Nombre,
            Precio = p.Precio,
            PlazoGarantiaMeses = p.PlazoGarantiaMeses
        };
    }

    // 1. GET: api/prestaciones
    [HttpGet]
    public async Task<IActionResult> GetPrestaciones()
    {
        var prestaciones = await _context.Set<Prestacion>()
            .AsNoTracking()
            .OrderBy(p => p.Nombre)
            .Select(p => new PrestacionDto
            {
                IdPrestacion = p.IdPrestacion,
                Nombre = p.Nombre,
                Precio = p.Precio,
                PlazoGarantiaMeses = p.PlazoGarantiaMeses
            })
            .ToListAsync();

        return Ok(prestaciones);
    }

    // 2. GET: api/prestaciones/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPrestacionPorId(int id)
    {
        var prestacion = await _context.Set<Prestacion>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPrestacion == id);

        if (prestacion == null)
        {
            return NotFound("La prestación no existe.");
        }

        return Ok(ConvertirDto(prestacion));
    }

    // 3. POST: api/prestaciones
    [HttpPost]
    public async Task<IActionResult> CrearPrestacion(
        [FromBody] PrestacionGuardarDto dto)
    {
        var nombre = dto.Nombre?.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre de la prestación es obligatorio.");
        }

        if (dto.Precio < 0)
        {
            return BadRequest(
                "El precio no puede ser negativo.");
        }

        if (dto.PlazoGarantiaMeses < 0)
        {
            return BadRequest(
                "El plazo de garantía no puede ser negativo.");
        }

        // Evitar prestaciones con el mismo nombre
        var nombreExiste = await _context.Set<Prestacion>()
            .AnyAsync(p => p.Nombre == nombre);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe una prestación con ese nombre.");
        }

        var prestacion = new Prestacion
        {
            Nombre = nombre,
            Precio = dto.Precio,
            PlazoGarantiaMeses = dto.PlazoGarantiaMeses
        };

        _context.Set<Prestacion>().Add(prestacion);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetPrestacionPorId),
            new { id = prestacion.IdPrestacion },
            ConvertirDto(prestacion));
    }

    // 4. PUT: api/prestaciones/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarPrestacion(
        int id,
        [FromBody] PrestacionGuardarDto dto)
    {
        var prestacion = await _context.Set<Prestacion>()
            .FirstOrDefaultAsync(p => p.IdPrestacion == id);

        if (prestacion == null)
        {
            return NotFound("La prestación no existe.");
        }

        var nombre = dto.Nombre?.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre de la prestación es obligatorio.");
        }

        if (dto.Precio < 0)
        {
            return BadRequest(
                "El precio no puede ser negativo.");
        }

        if (dto.PlazoGarantiaMeses < 0)
        {
            return BadRequest(
                "El plazo de garantía no puede ser negativo.");
        }

        // Evitar duplicados, excluyendo la prestación actual
        var nombreExiste = await _context.Set<Prestacion>()
            .AnyAsync(p =>
                p.Nombre == nombre &&
                p.IdPrestacion != id);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe otra prestación con ese nombre.");
        }

        prestacion.Nombre = nombre;
        prestacion.Precio = dto.Precio;
        prestacion.PlazoGarantiaMeses = dto.PlazoGarantiaMeses;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 5. DELETE: api/prestaciones/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarPrestacion(int id)
    {
        var prestacion = await _context.Set<Prestacion>()
            .FirstOrDefaultAsync(p => p.IdPrestacion == id);

        if (prestacion == null)
        {
            return NotFound("La prestación no existe.");
        }

        // Verificar asociaciones con obras sociales
        var tieneObrasSociales = await _context.Set<Prestacion>()
            .Where(p => p.IdPrestacion == id)
            .AnyAsync(p => p.ObraSocialPrestacions.Any());

        if (tieneObrasSociales)
        {
            return Conflict(
                "No se puede eliminar la prestación porque está asociada a una obra social.");
        }

        // Verificar asociaciones con turnos
        var tieneTurnos = await _context.Set<Prestacion>()
            .Where(p => p.IdPrestacion == id)
            .AnyAsync(p => p.PrestacionTurnos.Any());

        if (tieneTurnos)
        {
            return Conflict(
                "No se puede eliminar la prestación porque está asociada a turnos.");
        }

        _context.Set<Prestacion>().Remove(prestacion);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
