
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[ApiController]
[Route("api/direcciones")]
public class DireccionesController : ControllerBase
{
    private readonly AppDbContext _context;

    public DireccionesController(AppDbContext context)
    {
        _context = context;
    }

    private static DireccionDto ConvertirDto(Direccion d)
    {
        return new DireccionDto
        {
            IdDireccion = d.IdDireccion,
            Calle = d.Calle,
            Numero = d.Numero,
            Barrio = d.Barrio,
            Cp = d.Cp,
            IdLocalidad = d.IdLocalidad
        };
    }

    // 1. GET: api/direcciones
    [HttpGet]
    public async Task<IActionResult> GetDirecciones()
    {
        var direcciones = await _context.Set<Direccion>()
            .AsNoTracking()
            .OrderBy(d => d.Calle)
            .ThenBy(d => d.Numero)
            .Select(d => new DireccionDto
            {
                IdDireccion = d.IdDireccion,
                Calle = d.Calle,
                Numero = d.Numero,
                Barrio = d.Barrio,
                Cp = d.Cp,
                IdLocalidad = d.IdLocalidad
            })
            .ToListAsync();

        return Ok(direcciones);
    }

    // 2. GET: api/direcciones/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDireccionPorId(int id)
    {
        var direccion = await _context.Set<Direccion>()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.IdDireccion == id);

        if (direccion == null)
        {
            return NotFound("La dirección no existe.");
        }

        return Ok(ConvertirDto(direccion));
    }

    // 3. GET: api/direcciones/localidad/1
    [HttpGet("localidad/{idLocalidad:int}")]
    public async Task<IActionResult> GetPorLocalidad(int idLocalidad)
    {
        var localidadExiste = await _context.Set<Localidad>()
            .AnyAsync(l => l.IdLocalidad == idLocalidad);

        if (!localidadExiste)
        {
            return NotFound("La localidad no existe.");
        }

        var direcciones = await _context.Set<Direccion>()
            .AsNoTracking()
            .Where(d => d.IdLocalidad == idLocalidad)
            .OrderBy(d => d.Calle)
            .ThenBy(d => d.Numero)
            .Select(d => new DireccionDto
            {
                IdDireccion = d.IdDireccion,
                Calle = d.Calle,
                Numero = d.Numero,
                Barrio = d.Barrio,
                Cp = d.Cp,
                IdLocalidad = d.IdLocalidad
            })
            .ToListAsync();

        return Ok(direcciones);
    }

    // 4. POST: api/direcciones
    [HttpPost]
    public async Task<IActionResult> CrearDireccion(
        [FromBody] DireccionGuardarDto dto)
    {
        var calle = dto.Calle?.Trim();
        var barrio = dto.Barrio?.Trim();
        var cp = dto.Cp?.Trim();

        if (string.IsNullOrWhiteSpace(calle) ||
            string.IsNullOrWhiteSpace(cp))
        {
            return BadRequest(
                "La calle y el código postal son obligatorios.");
        }

        if (dto.Numero <= 0)
        {
            return BadRequest(
                "El número debe ser mayor a cero.");
        }

        // Validar que exista la localidad
        var localidadExiste = await _context.Set<Localidad>()
            .AnyAsync(l => l.IdLocalidad == dto.IdLocalidad);

        if (!localidadExiste)
        {
            return BadRequest(
                "La localidad indicada no existe.");
        }

        // Evitar direcciones exactamente duplicadas
        var direccionExiste = await _context.Set<Direccion>()
            .AnyAsync(d =>
                d.Calle == calle &&
                d.Numero == dto.Numero &&
                d.IdLocalidad == dto.IdLocalidad &&
                d.Cp == cp &&
                d.Barrio == (string.IsNullOrWhiteSpace(barrio)
                    ? null : barrio));

        if (direccionExiste)
        {
            return Conflict(
                "Ya existe una dirección con esos datos.");
        }

        var direccion = new Direccion
        {
            Calle = calle,
            Numero = dto.Numero,
            Barrio = string.IsNullOrWhiteSpace(barrio) ? null : barrio,
            Cp = cp,
            IdLocalidad = dto.IdLocalidad
        };

        _context.Set<Direccion>().Add(direccion);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetDireccionPorId),
            new { id = direccion.IdDireccion },
            ConvertirDto(direccion));
    }

    // 5. PUT: api/direcciones/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarDireccion(
        int id,
        [FromBody] DireccionGuardarDto dto)
    {
        var direccion = await _context.Set<Direccion>()
            .FirstOrDefaultAsync(d => d.IdDireccion == id);

        if (direccion == null)
        {
            return NotFound("La dirección no existe.");
        }

        var calle = dto.Calle?.Trim();
        var barrio = dto.Barrio?.Trim();
        var cp = dto.Cp?.Trim();

        if (string.IsNullOrWhiteSpace(calle) ||
            string.IsNullOrWhiteSpace(cp))
        {
            return BadRequest(
                "La calle y el código postal son obligatorios.");
        }

        if (dto.Numero <= 0)
        {
            return BadRequest(
                "El número debe ser mayor a cero.");
        }

        // Validar localidad
        var localidadExiste = await _context.Set<Localidad>()
            .AnyAsync(l => l.IdLocalidad == dto.IdLocalidad);

        if (!localidadExiste)
        {
            return BadRequest(
                "La localidad indicada no existe.");
        }

        // Evitar duplicados, excluyendo la dirección actual
        var direccionExiste = await _context.Set<Direccion>()
            .AnyAsync(d =>
                d.IdDireccion != id &&
                d.Calle == calle &&
                d.Numero == dto.Numero &&
                d.IdLocalidad == dto.IdLocalidad &&
                d.Cp == cp &&
                d.Barrio == (string.IsNullOrWhiteSpace(barrio)
                    ? null : barrio));

        if (direccionExiste)
        {
            return Conflict(
                "Ya existe otra dirección con esos datos.");
        }

        direccion.Calle = calle;
        direccion.Numero = dto.Numero;
        direccion.Barrio =
            string.IsNullOrWhiteSpace(barrio) ? null : barrio;
        direccion.Cp = cp;
        direccion.IdLocalidad = dto.IdLocalidad;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 6. DELETE: api/direcciones/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarDireccion(int id)
    {
        var direccion = await _context.Set<Direccion>()
            .FirstOrDefaultAsync(d => d.IdDireccion == id);

        if (direccion == null)
        {
            return NotFound("La dirección no existe.");
        }

        // Verificar pacientes asociados
        var tienePacientes = await _context.Set<Paciente>()
            .AnyAsync(p => p.IdDireccion == id);

        if (tienePacientes)
        {
            return Conflict(
                "No se puede eliminar la dirección porque tiene pacientes asociados.");
        }

        // Verificar empleados asociados
        var tieneEmpleados = await _context.Set<Empleado>()
            .AnyAsync(e => e.IdDireccion == id);

        if (tieneEmpleados)
        {
            return Conflict(
                "No se puede eliminar la dirección porque tiene empleados asociados.");
        }

        // Verificar consultorios asociados
        var tieneConsultorios = await _context.Set<Consultorio>()
            .AnyAsync(c => c.IdDireccion == id);

        if (tieneConsultorios)
        {
            return Conflict(
                "No se puede eliminar la dirección porque tiene consultorios asociados.");
        }

        _context.Set<Direccion>().Remove(direccion);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
