using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/localidades")]
[ApiController]
public class LocalidadesController : ControllerBase
{
    private readonly AppDbContext _context;

    public LocalidadesController(AppDbContext context)
    {
        _context = context;
    }

    private static LocalidadDto ConvertirDto(Localidad l)
    {
        return new LocalidadDto
        {
            IdLocalidad = l.IdLocalidad,
            Nombre = l.Nombre,
            IdProvincia = l.IdProvincia
        };
    }

    // 1. GET: api/localidades
    [HttpGet]
    public async Task<IActionResult> GetLocalidades()
    {
        var localidades = await _context.Set<Localidad>()
            .AsNoTracking()
            .OrderBy(l => l.Nombre)
            .Select(l => new LocalidadDto
            {
                IdLocalidad = l.IdLocalidad,
                Nombre = l.Nombre,
                IdProvincia = l.IdProvincia
            })
            .ToListAsync();

        return Ok(localidades);
    }

    // 2. GET: api/localidades/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetLocalidadPorId(int id)
    {
        var localidad = await _context.Set<Localidad>()
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.IdLocalidad == id);

        if (localidad == null)
        {
            return NotFound("La localidad no existe.");
        }

        return Ok(ConvertirDto(localidad));
    }

    // 3. GET: api/localidades/provincia/1
    [HttpGet("provincia/{idProvincia:int}")]
    public async Task<IActionResult> GetLocalidadesPorProvincia(
        int idProvincia)
    {
        var provinciaExiste = await _context.Set<Provincia>()
            .AnyAsync(p => p.IdProvincia == idProvincia);

        if (!provinciaExiste)
        {
            return NotFound("La provincia no existe.");
        }

        var localidades = await _context.Set<Localidad>()
            .AsNoTracking()
            .Where(l => l.IdProvincia == idProvincia)
            .OrderBy(l => l.Nombre)
            .Select(l => new LocalidadDto
            {
                IdLocalidad = l.IdLocalidad,
                Nombre = l.Nombre,
                IdProvincia = l.IdProvincia
            })
            .ToListAsync();

        return Ok(localidades);
    }

    // 4. POST: api/localidades
    [HttpPost]
    public async Task<IActionResult> CrearLocalidad(
        [FromBody] LocalidadGuardarDto dto)
    {
        var nombre = dto.Nombre.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre de la localidad es obligatorio.");
        }

        // Verificar que la provincia exista
        var provinciaExiste = await _context.Set<Provincia>()
            .AnyAsync(p => p.IdProvincia == dto.IdProvincia);

        if (!provinciaExiste)
        {
            return BadRequest(
                "La provincia indicada no existe.");
        }

        // Evitar localidades duplicadas en la misma provincia
        var localidadExiste = await _context.Set<Localidad>()
            .AnyAsync(l =>
                l.Nombre == nombre &&
                l.IdProvincia == dto.IdProvincia);

        if (localidadExiste)
        {
            return Conflict(
                "Ya existe una localidad con ese nombre " +
                "en la provincia indicada.");
        }

        var localidad = new Localidad
        {
            Nombre = nombre,
            IdProvincia = dto.IdProvincia
        };

        _context.Set<Localidad>().Add(localidad);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetLocalidadPorId),
            new { id = localidad.IdLocalidad },
            ConvertirDto(localidad));
    }

    // 5. PUT: api/localidades/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarLocalidad(
        int id,
        [FromBody] LocalidadGuardarDto dto)
    {
        var localidad = await _context.Set<Localidad>()
            .FirstOrDefaultAsync(l => l.IdLocalidad == id);

        if (localidad == null)
        {
            return NotFound("La localidad no existe.");
        }

        var nombre = dto.Nombre.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre de la localidad es obligatorio.");
        }

        // Verificar provincia
        var provinciaExiste = await _context.Set<Provincia>()
            .AnyAsync(p => p.IdProvincia == dto.IdProvincia);

        if (!provinciaExiste)
        {
            return BadRequest(
                "La provincia indicada no existe.");
        }

        // Evitar duplicados en la misma provincia
        var localidadExiste = await _context.Set<Localidad>()
            .AnyAsync(l =>
                l.Nombre == nombre &&
                l.IdProvincia == dto.IdProvincia &&
                l.IdLocalidad != id);

        if (localidadExiste)
        {
            return Conflict(
                "Ya existe otra localidad con ese nombre " +
                "en la provincia indicada.");
        }

        localidad.Nombre = nombre;
        localidad.IdProvincia = dto.IdProvincia;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 6. DELETE: api/localidades/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarLocalidad(int id)
    {
        var localidad = await _context.Set<Localidad>()
            .FirstOrDefaultAsync(l => l.IdLocalidad == id);

        if (localidad == null)
        {
            return NotFound("La localidad no existe.");
        }

        // No eliminar localidades con direcciones asociadas
        var tieneDirecciones = await _context.Set<Localidad>()
            .Where(l => l.IdLocalidad == id)
            .AnyAsync(l => l.Direccions.Any());

        if (tieneDirecciones)
        {
            return Conflict(
                "No se puede eliminar la localidad porque " +
                "tiene direcciones asociadas.");
        }

        _context.Set<Localidad>().Remove(localidad);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}