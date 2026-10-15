
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/obrasociales")]
[ApiController]
public class ObrasSocialesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ObrasSocialesController(AppDbContext context)
    {
        _context = context;
    }

    private static ObraSocialDto ConvertirDto(ObraSocial o)
    {
        return new ObraSocialDto
        {
            IdObraSocial = o.IdObraSocial,
            Nombre = o.Nombre
        };
    }

    // 1. GET: api/obrasociales
    [HttpGet]
    public async Task<IActionResult> GetObrasSociales()
    {
        var obrasSociales = await _context.Set<ObraSocial>()
            .AsNoTracking()
            .OrderBy(o => o.Nombre)
            .Select(o => new ObraSocialDto
            {
                IdObraSocial = o.IdObraSocial,
                Nombre = o.Nombre
            })
            .ToListAsync();

        return Ok(obrasSociales);
    }

    // 2. GET: api/obrasociales/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetObraSocialPorId(int id)
    {
        var obraSocial = await _context.Set<ObraSocial>()
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.IdObraSocial == id);

        if (obraSocial == null)
        {
            return NotFound("La obra social no existe.");
        }

        return Ok(ConvertirDto(obraSocial));
    }

    // 3. POST: api/obrasociales
    [HttpPost]
    public async Task<IActionResult> CrearObraSocial(
        [FromBody] ObraSocialGuardarDto dto)
    {
        var nombre = dto.Nombre.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre de la obra social es obligatorio.");
        }

        // Evitar nombres duplicados
        var nombreExiste = await _context.Set<ObraSocial>()
            .AnyAsync(o => o.Nombre == nombre);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe una obra social con ese nombre.");
        }

        var obraSocial = new ObraSocial
        {
            Nombre = nombre
        };

        _context.Set<ObraSocial>().Add(obraSocial);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetObraSocialPorId),
            new { id = obraSocial.IdObraSocial },
            ConvertirDto(obraSocial));
    }

    // 4. PUT: api/obrasociales/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarObraSocial(
        int id,
        [FromBody] ObraSocialGuardarDto dto)
    {
        var obraSocial = await _context.Set<ObraSocial>()
            .FirstOrDefaultAsync(o => o.IdObraSocial == id);

        if (obraSocial == null)
        {
            return NotFound("La obra social no existe.");
        }

        var nombre = dto.Nombre.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre de la obra social es obligatorio.");
        }

        // Evitar nombres duplicados
        var nombreExiste = await _context.Set<ObraSocial>()
            .AnyAsync(o =>
                o.Nombre == nombre &&
                o.IdObraSocial != id);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe otra obra social con ese nombre.");
        }

        obraSocial.Nombre = nombre;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 5. DELETE: api/obrasociales/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarObraSocial(int id)
    {
        var obraSocial = await _context.Set<ObraSocial>()
            .FirstOrDefaultAsync(o => o.IdObraSocial == id);

        if (obraSocial == null)
        {
            return NotFound("La obra social no existe.");
        }

        // Comprobar pacientes asociados
        var tienePacientes = await _context.Set<Paciente>()
            .AnyAsync(p => p.IdObraSocial == id);

        if (tienePacientes)
        {
            return Conflict(
                "No se puede eliminar la obra social porque tiene pacientes asociados.");
        }

        // Comprobar prestaciones asociadas
        var tienePrestaciones = await _context.Set<ObraSocial>()
            .Where(o => o.IdObraSocial == id)
            .AnyAsync(o => o.ObraSocialPrestacions.Any());

        if (tienePrestaciones)
        {
            return Conflict(
                "No se puede eliminar la obra social porque tiene prestaciones asociadas.");
        }

        _context.Set<ObraSocial>().Remove(obraSocial);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
