
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/provincias")]
[ApiController]
public class ProvinciasController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProvinciasController(AppDbContext context)
    {
        _context = context;
    }

    private static ProvinciaDto ConvertirDto(Provincia p)
    {
        return new ProvinciaDto
        {
            IdProvincia = p.IdProvincia,
            Nombre = p.Nombre,
            Pais = p.Pais
        };
    }

    // 1. GET: api/provincias
    [HttpGet]
    public async Task<IActionResult> GetProvincias()
    {
        var provincias = await _context.Set<Provincia>()
            .AsNoTracking()
            .OrderBy(p => p.Pais)
            .ThenBy(p => p.Nombre)
            .Select(p => new ProvinciaDto
            {
                IdProvincia = p.IdProvincia,
                Nombre = p.Nombre,
                Pais = p.Pais
            })
            .ToListAsync();

        return Ok(provincias);
    }

    // 2. GET: api/provincias/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProvinciaPorId(int id)
    {
        var provincia = await _context.Set<Provincia>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdProvincia == id);

        if (provincia == null)
        {
            return NotFound("La provincia no existe.");
        }

        return Ok(ConvertirDto(provincia));
    }

    // 3. POST: api/provincias
    [HttpPost]
    public async Task<IActionResult> CrearProvincia(
        [FromBody] ProvinciaGuardarDto dto)
    {
        var nombre = dto.Nombre.Trim();
        var pais = dto.Pais.Trim();

        if (string.IsNullOrWhiteSpace(nombre) ||
            string.IsNullOrWhiteSpace(pais))
        {
            return BadRequest(
                "El nombre y el país son obligatorios.");
        }

        // Evitar provincias duplicadas dentro del mismo país
        var provinciaExiste = await _context.Set<Provincia>()
            .AnyAsync(p =>
                p.Nombre == nombre &&
                p.Pais == pais);

        if (provinciaExiste)
        {
            return Conflict(
                "Ya existe una provincia con ese nombre en el país indicado.");
        }

        var provincia = new Provincia
        {
            Nombre = nombre,
            Pais = pais
        };

        _context.Set<Provincia>().Add(provincia);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetProvinciaPorId),
            new { id = provincia.IdProvincia },
            ConvertirDto(provincia));
    }

    // 4. PUT: api/provincias/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarProvincia(
        int id,
        [FromBody] ProvinciaGuardarDto dto)
    {
        var provincia = await _context.Set<Provincia>()
            .FirstOrDefaultAsync(p => p.IdProvincia == id);

        if (provincia == null)
        {
            return NotFound("La provincia no existe.");
        }

        var nombre = dto.Nombre.Trim();
        var pais = dto.Pais.Trim();

        if (string.IsNullOrWhiteSpace(nombre) ||
            string.IsNullOrWhiteSpace(pais))
        {
            return BadRequest(
                "El nombre y el país son obligatorios.");
        }

        // Evitar duplicados, excluyendo la provincia actual
        var provinciaExiste = await _context.Set<Provincia>()
            .AnyAsync(p =>
                p.Nombre == nombre &&
                p.Pais == pais &&
                p.IdProvincia != id);

        if (provinciaExiste)
        {
            return Conflict(
                "Ya existe otra provincia con ese nombre en el país indicado.");
        }

        provincia.Nombre = nombre;
        provincia.Pais = pais;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 5. DELETE: api/provincias/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarProvincia(int id)
    {
        var provincia = await _context.Set<Provincia>()
            .FirstOrDefaultAsync(p => p.IdProvincia == id);

        if (provincia == null)
        {
            return NotFound("La provincia no existe.");
        }

        // No eliminar provincias que tengan localidades
        var tieneLocalidades = await _context.Set<Localidad>()
            .AnyAsync(l => l.IdProvincia == id);

        if (tieneLocalidades)
        {
            return Conflict(
                "No se puede eliminar la provincia porque tiene localidades asociadas.");
        }

        _context.Set<Provincia>().Remove(provincia);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
