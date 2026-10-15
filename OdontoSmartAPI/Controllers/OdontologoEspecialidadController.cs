
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[ApiController]
[Route("api/odontologoespecialidades")]
public class OdontologoEspecialidadesController : ControllerBase
{
    private readonly AppDbContext _context;

    public OdontologoEspecialidadesController(AppDbContext context)
    {
        _context = context;
    }

    private static OdontologoEspecialidadDto ConvertirDto(
        OdontologoEspecialidad oe)
    {
        return new OdontologoEspecialidadDto
        {
            IdOdontologoEspecialidad = oe.IdOdontologoEspecialidad,
            IdOdontologo = oe.IdOdontologo,
            IdEspecialidad = oe.IdEspecialidad
        };
    }

    // 1. GET: api/odontologoespecialidades
    [HttpGet]
    public async Task<IActionResult> GetTodos()
    {
        var asociaciones = await _context
            .Set<OdontologoEspecialidad>()
            .AsNoTracking()
            .OrderBy(oe => oe.IdOdontologo)
            .ThenBy(oe => oe.IdEspecialidad)
            .Select(oe => new OdontologoEspecialidadDto
            {
                IdOdontologoEspecialidad =
                    oe.IdOdontologoEspecialidad,
                IdOdontologo = oe.IdOdontologo,
                IdEspecialidad = oe.IdEspecialidad
            })
            .ToListAsync();

        return Ok(asociaciones);
    }

    // 2. GET: api/odontologoespecialidades/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPorId(int id)
    {
        var asociacion = await _context
            .Set<OdontologoEspecialidad>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                oe => oe.IdOdontologoEspecialidad == id);

        if (asociacion == null)
        {
            return NotFound(
                "La asociación odontólogo-especialidad no existe.");
        }

        return Ok(ConvertirDto(asociacion));
    }

    // 3. GET: api/odontologoespecialidades/odontologo/1
    [HttpGet("odontologo/{idOdontologo:int}")]
    public async Task<IActionResult> GetPorOdontologo(
        int idOdontologo)
    {
        var odontologoExiste = await _context.Set<Odontologo>()
            .AnyAsync(o => o.IdOdontologo == idOdontologo);

        if (!odontologoExiste)
        {
            return NotFound("El odontólogo no existe.");
        }

        var asociaciones = await _context
            .Set<OdontologoEspecialidad>()
            .AsNoTracking()
            .Where(oe => oe.IdOdontologo == idOdontologo)
            .OrderBy(oe => oe.IdEspecialidad)
            .Select(oe => new OdontologoEspecialidadDto
            {
                IdOdontologoEspecialidad =
                    oe.IdOdontologoEspecialidad,
                IdOdontologo = oe.IdOdontologo,
                IdEspecialidad = oe.IdEspecialidad
            })
            .ToListAsync();

        return Ok(asociaciones);
    }

    // 4. GET: api/odontologoespecialidades/especialidad/1
    [HttpGet("especialidad/{idEspecialidad:int}")]
    public async Task<IActionResult> GetPorEspecialidad(
        int idEspecialidad)
    {
        var especialidadExiste = await _context.Set<Especialidad>()
            .AnyAsync(e => e.IdEspecialidad == idEspecialidad);

        if (!especialidadExiste)
        {
            return NotFound("La especialidad no existe.");
        }

        var asociaciones = await _context
            .Set<OdontologoEspecialidad>()
            .AsNoTracking()
            .Where(oe => oe.IdEspecialidad == idEspecialidad)
            .OrderBy(oe => oe.IdOdontologo)
            .Select(oe => new OdontologoEspecialidadDto
            {
                IdOdontologoEspecialidad =
                    oe.IdOdontologoEspecialidad,
                IdOdontologo = oe.IdOdontologo,
                IdEspecialidad = oe.IdEspecialidad
            })
            .ToListAsync();

        return Ok(asociaciones);
    }

    // 5. POST: api/odontologoespecialidades
    [HttpPost]
    public async Task<IActionResult> CrearAsociacion(
        [FromBody] OdontologoEspecialidadGuardarDto dto)
    {
        // Validar odontólogo
        var odontologo = await _context.Set<Odontologo>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                o => o.IdOdontologo == dto.IdOdontologo);

        if (odontologo == null)
        {
            return BadRequest(
                "El odontólogo indicado no existe.");
        }

        // No asignar especialidades a odontólogos inactivos
        if (!odontologo.Activo)
        {
            return Conflict(
                "No se pueden asignar especialidades a un odontólogo inactivo.");
        }

        // Validar especialidad
        var especialidadExiste = await _context.Set<Especialidad>()
            .AnyAsync(
                e => e.IdEspecialidad == dto.IdEspecialidad);

        if (!especialidadExiste)
        {
            return BadRequest(
                "La especialidad indicada no existe.");
        }

        // Evitar duplicar la misma relación
        var asociacionExiste = await _context
            .Set<OdontologoEspecialidad>()
            .AnyAsync(oe =>
                oe.IdOdontologo == dto.IdOdontologo &&
                oe.IdEspecialidad == dto.IdEspecialidad);

        if (asociacionExiste)
        {
            return Conflict(
                "El odontólogo ya tiene asignada esa especialidad.");
        }

        var asociacion = new OdontologoEspecialidad
        {
            IdOdontologo = dto.IdOdontologo,
            IdEspecialidad = dto.IdEspecialidad
        };

        _context.Set<OdontologoEspecialidad>().Add(asociacion);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetPorId),
            new { id = asociacion.IdOdontologoEspecialidad },
            ConvertirDto(asociacion));
    }

    // 6. PUT: api/odontologoespecialidades/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarAsociacion(
        int id,
        [FromBody] OdontologoEspecialidadGuardarDto dto)
    {
        var asociacion = await _context
            .Set<OdontologoEspecialidad>()
            .FirstOrDefaultAsync(
                oe => oe.IdOdontologoEspecialidad == id);

        if (asociacion == null)
        {
            return NotFound(
                "La asociación odontólogo-especialidad no existe.");
        }

        // Validar odontólogo
        var odontologo = await _context.Set<Odontologo>()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                o => o.IdOdontologo == dto.IdOdontologo);

        if (odontologo == null)
        {
            return BadRequest(
                "El odontólogo indicado no existe.");
        }

        if (!odontologo.Activo)
        {
            return Conflict(
                "No se pueden asignar especialidades a un odontólogo inactivo.");
        }

        // Validar especialidad
        var especialidadExiste = await _context.Set<Especialidad>()
            .AnyAsync(
                e => e.IdEspecialidad == dto.IdEspecialidad);

        if (!especialidadExiste)
        {
            return BadRequest(
                "La especialidad indicada no existe.");
        }

        // Evitar duplicados, excluyendo la asociación actual
        var duplicado = await _context
            .Set<OdontologoEspecialidad>()
            .AnyAsync(oe =>
                oe.IdOdontologoEspecialidad != id &&
                oe.IdOdontologo == dto.IdOdontologo &&
                oe.IdEspecialidad == dto.IdEspecialidad);

        if (duplicado)
        {
            return Conflict(
                "Ya existe otra asociación con ese odontólogo y especialidad.");
        }

        asociacion.IdOdontologo = dto.IdOdontologo;
        asociacion.IdEspecialidad = dto.IdEspecialidad;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 7. DELETE: api/odontologoespecialidades/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarAsociacion(int id)
    {
        var asociacion = await _context
            .Set<OdontologoEspecialidad>()
            .FirstOrDefaultAsync(
                oe => oe.IdOdontologoEspecialidad == id);

        if (asociacion == null)
        {
            return NotFound(
                "La asociación odontólogo-especialidad no existe.");
        }

        // Se elimina únicamente la relación.
        // No se elimina el odontólogo ni la especialidad.
        _context.Set<OdontologoEspecialidad>()
            .Remove(asociacion);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
