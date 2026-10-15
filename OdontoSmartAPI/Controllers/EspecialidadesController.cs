using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/especialidades")]
[ApiController]
public class EspecialidadesController : ControllerBase
{
    private readonly AppDbContext _context;

    public EspecialidadesController(AppDbContext context)
    {
        _context = context;
    }

    private static EspecialidadDto ConvertirDto(Especialidad e)
    {
        return new EspecialidadDto
        {
            IdEspecialidad = e.IdEspecialidad,
            Nombre = e.Nombre
        };
    }

    // 1. GET: api/especialidades
    [HttpGet]
    public async Task<IActionResult> GetEspecialidades()
    {
        var especialidades = await _context.Set<Especialidad>()
            .AsNoTracking()
            .OrderBy(e => e.Nombre)
            .Select(e => new EspecialidadDto
            {
                IdEspecialidad = e.IdEspecialidad,
                Nombre = e.Nombre
            })
            .ToListAsync();

        return Ok(especialidades);
    }

    // 2. GET: api/especialidades/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetEspecialidadPorId(int id)
    {
        var especialidad = await _context.Set<Especialidad>()
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdEspecialidad == id);

        if (especialidad == null)
        {
            return NotFound("La especialidad no existe.");
        }

        return Ok(ConvertirDto(especialidad));
    }

    // 3. POST: api/especialidades
    [HttpPost]
    public async Task<IActionResult> CrearEspecialidad(
        [FromBody] EspecialidadGuardarDto dto)
    {
        var nombre = dto.Nombre.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre de la especialidad es obligatorio.");
        }

        var nombreExiste = await _context.Set<Especialidad>()
            .AnyAsync(e => e.Nombre == nombre);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe una especialidad con ese nombre.");
        }

        var especialidad = new Especialidad
        {
            Nombre = nombre
        };

        _context.Set<Especialidad>().Add(especialidad);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetEspecialidadPorId),
            new { id = especialidad.IdEspecialidad },
            ConvertirDto(especialidad));
    }

    // 4. PUT: api/especialidades/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarEspecialidad(
        int id,
        [FromBody] EspecialidadGuardarDto dto)
    {
        var especialidad = await _context.Set<Especialidad>()
            .FirstOrDefaultAsync(e => e.IdEspecialidad == id);

        if (especialidad == null)
        {
            return NotFound("La especialidad no existe.");
        }

        var nombre = dto.Nombre.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre de la especialidad es obligatorio.");
        }

        var nombreExiste = await _context.Set<Especialidad>()
            .AnyAsync(e =>
                e.Nombre == nombre &&
                e.IdEspecialidad != id);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe otra especialidad con ese nombre.");
        }

        especialidad.Nombre = nombre;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 5. DELETE: api/especialidades/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarEspecialidad(int id)
    {
        var especialidad = await _context.Set<Especialidad>()
            .FirstOrDefaultAsync(e => e.IdEspecialidad == id);

        if (especialidad == null)
        {
            return NotFound("La especialidad no existe.");
        }

        // Verificar si está asignada a algún odontólogo
        var estaAsignada = await _context
            .Set<OdontologoEspecialidad>()
            .AnyAsync(oe => oe.IdEspecialidad == id);

        if (estaAsignada)
        {
            return Conflict(
                "No se puede eliminar la especialidad porque " +
                "está asignada a uno o más odontólogos.");
        }

        _context.Set<Especialidad>().Remove(especialidad);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}