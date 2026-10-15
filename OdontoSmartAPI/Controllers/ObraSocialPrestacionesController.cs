
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[ApiController]
[Route("api/obrasocialprestaciones")]
public class ObraSocialPrestacionesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ObraSocialPrestacionesController(AppDbContext context)
    {
        _context = context;
    }

    private static ObraSocialPrestacionDto ConvertirDto(
        ObraSocialPrestacion osp)
    {
        return new ObraSocialPrestacionDto
        {
            IdObraSocialPrestacion = osp.IdObraSocialPrestacion,
            IdObraSocial = osp.IdObraSocial,
            IdPrestacion = osp.IdPrestacion,
            MontoCubierto = osp.MontoCubierto
        };
    }

    // 1. GET: api/obrasocialprestaciones
    [HttpGet]
    public async Task<IActionResult> GetTodos()
    {
        var coberturas = await _context
            .Set<ObraSocialPrestacion>()
            .AsNoTracking()
            .OrderBy(c => c.IdObraSocial)
            .ThenBy(c => c.IdPrestacion)
            .Select(c => new ObraSocialPrestacionDto
            {
                IdObraSocialPrestacion =
                    c.IdObraSocialPrestacion,
                IdObraSocial = c.IdObraSocial,
                IdPrestacion = c.IdPrestacion,
                MontoCubierto = c.MontoCubierto
            })
            .ToListAsync();

        return Ok(coberturas);
    }

    // 2. GET: api/obrasocialprestaciones/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPorId(int id)
    {
        var cobertura = await _context
            .Set<ObraSocialPrestacion>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.IdObraSocialPrestacion == id);

        if (cobertura == null)
        {
            return NotFound(
                "La cobertura de obra social no existe.");
        }

        return Ok(ConvertirDto(cobertura));
    }

    // 3. GET: api/obrasocialprestaciones/obrasocial/1
    [HttpGet("obrasocial/{idObraSocial:int}")]
    public async Task<IActionResult> GetPorObraSocial(
        int idObraSocial)
    {
        var obraSocialExiste = await _context.Set<ObraSocial>()
            .AnyAsync(o => o.IdObraSocial == idObraSocial);

        if (!obraSocialExiste)
        {
            return NotFound("La obra social no existe.");
        }

        var coberturas = await _context
            .Set<ObraSocialPrestacion>()
            .AsNoTracking()
            .Where(c => c.IdObraSocial == idObraSocial)
            .OrderBy(c => c.IdPrestacion)
            .Select(c => new ObraSocialPrestacionDto
            {
                IdObraSocialPrestacion =
                    c.IdObraSocialPrestacion,
                IdObraSocial = c.IdObraSocial,
                IdPrestacion = c.IdPrestacion,
                MontoCubierto = c.MontoCubierto
            })
            .ToListAsync();

        return Ok(coberturas);
    }

    // 4. GET: api/obrasocialprestaciones/prestacion/1
    [HttpGet("prestacion/{idPrestacion:int}")]
    public async Task<IActionResult> GetPorPrestacion(
        int idPrestacion)
    {
        var prestacionExiste = await _context.Set<Prestacion>()
            .AnyAsync(p => p.IdPrestacion == idPrestacion);

        if (!prestacionExiste)
        {
            return NotFound("La prestación no existe.");
        }

        var coberturas = await _context
            .Set<ObraSocialPrestacion>()
            .AsNoTracking()
            .Where(c => c.IdPrestacion == idPrestacion)
            .OrderBy(c => c.IdObraSocial)
            .Select(c => new ObraSocialPrestacionDto
            {
                IdObraSocialPrestacion =
                    c.IdObraSocialPrestacion,
                IdObraSocial = c.IdObraSocial,
                IdPrestacion = c.IdPrestacion,
                MontoCubierto = c.MontoCubierto
            })
            .ToListAsync();

        return Ok(coberturas);
    }

    // 5. POST: api/obrasocialprestaciones
    [HttpPost]
    public async Task<IActionResult> CrearCobertura(
        [FromBody] ObraSocialPrestacionGuardarDto dto)
    {
        // Validar obra social
        var obraSocialExiste = await _context.Set<ObraSocial>()
            .AnyAsync(o => o.IdObraSocial == dto.IdObraSocial);

        if (!obraSocialExiste)
        {
            return BadRequest(
                "La obra social indicada no existe.");
        }

        // Validar prestación y obtener su precio
        var prestacion = await _context.Set<Prestacion>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.IdPrestacion == dto.IdPrestacion);

        if (prestacion == null)
        {
            return BadRequest(
                "La prestación indicada no existe.");
        }

        if (dto.MontoCubierto < 0)
        {
            return BadRequest(
                "El monto cubierto no puede ser negativo.");
        }

        if (dto.MontoCubierto > prestacion.Precio)
        {
            return BadRequest(
                "El monto cubierto no puede superar el precio de la prestación.");
        }

        // Evitar asociaciones duplicadas
        var duplicado = await _context
            .Set<ObraSocialPrestacion>()
            .AnyAsync(c =>
                c.IdObraSocial == dto.IdObraSocial &&
                c.IdPrestacion == dto.IdPrestacion);

        if (duplicado)
        {
            return Conflict(
                "Ya existe una cobertura para esa obra social y prestación.");
        }

        var cobertura = new ObraSocialPrestacion
        {
            IdObraSocial = dto.IdObraSocial,
            IdPrestacion = dto.IdPrestacion,
            MontoCubierto = dto.MontoCubierto
        };

        _context.Set<ObraSocialPrestacion>().Add(cobertura);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetPorId),
            new { id = cobertura.IdObraSocialPrestacion },
            ConvertirDto(cobertura));
    }

    // 6. PUT: api/obrasocialprestaciones/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarCobertura(
        int id,
        [FromBody] ObraSocialPrestacionGuardarDto dto)
    {
        var cobertura = await _context
            .Set<ObraSocialPrestacion>()
            .FirstOrDefaultAsync(
                c => c.IdObraSocialPrestacion == id);

        if (cobertura == null)
        {
            return NotFound(
                "La cobertura de obra social no existe.");
        }

        // Validar obra social
        var obraSocialExiste = await _context.Set<ObraSocial>()
            .AnyAsync(o => o.IdObraSocial == dto.IdObraSocial);

        if (!obraSocialExiste)
        {
            return BadRequest(
                "La obra social indicada no existe.");
        }

        // Validar prestación
        var prestacion = await _context.Set<Prestacion>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.IdPrestacion == dto.IdPrestacion);

        if (prestacion == null)
        {
            return BadRequest(
                "La prestación indicada no existe.");
        }

        if (dto.MontoCubierto < 0)
        {
            return BadRequest(
                "El monto cubierto no puede ser negativo.");
        }

        if (dto.MontoCubierto > prestacion.Precio)
        {
            return BadRequest(
                "El monto cubierto no puede superar el precio de la prestación.");
        }

        // Evitar duplicados, excluyendo la cobertura actual
        var duplicado = await _context
            .Set<ObraSocialPrestacion>()
            .AnyAsync(c =>
                c.IdObraSocialPrestacion != id &&
                c.IdObraSocial == dto.IdObraSocial &&
                c.IdPrestacion == dto.IdPrestacion);

        if (duplicado)
        {
            return Conflict(
                "Ya existe otra cobertura con esa obra social y prestación.");
        }

        cobertura.IdObraSocial = dto.IdObraSocial;
        cobertura.IdPrestacion = dto.IdPrestacion;
        cobertura.MontoCubierto = dto.MontoCubierto;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 7. DELETE: api/obrasocialprestaciones/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarCobertura(int id)
    {
        var cobertura = await _context
            .Set<ObraSocialPrestacion>()
            .FirstOrDefaultAsync(
                c => c.IdObraSocialPrestacion == id);

        if (cobertura == null)
        {
            return NotFound(
                "La cobertura de obra social no existe.");
        }

        // Se elimina únicamente la relación de cobertura.
        // No se elimina la obra social ni la prestación.
        _context.Set<ObraSocialPrestacion>()
            .Remove(cobertura);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
