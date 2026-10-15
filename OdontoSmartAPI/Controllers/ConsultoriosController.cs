using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/consultorios")]
[ApiController]
public class ConsultoriosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ConsultoriosController(AppDbContext context)
    {
        _context = context;
    }

    private static ConsultorioDto ConvertirDto(Consultorio c)
    {
        return new ConsultorioDto
        {
            IdConsultorio = c.IdConsultorio,
            Nombre = c.Nombre,
            IdDireccion = c.IdDireccion
        };
    }

    // 1. GET: api/consultorios
    [HttpGet]
    public async Task<IActionResult> GetConsultorios()
    {
        var consultorios = await _context.Set<Consultorio>()
            .AsNoTracking()
            .OrderBy(c => c.Nombre)
            .Select(c => new ConsultorioDto
            {
                IdConsultorio = c.IdConsultorio,
                Nombre = c.Nombre,
                IdDireccion = c.IdDireccion
            })
            .ToListAsync();

        return Ok(consultorios);
    }

    // 2. GET: api/consultorios/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetConsultorioPorId(int id)
    {
        var consultorio = await _context.Set<Consultorio>()
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdConsultorio == id);

        if (consultorio == null)
        {
            return NotFound("El consultorio no existe.");
        }

        return Ok(ConvertirDto(consultorio));
    }

    // 3. POST: api/consultorios
    [HttpPost]
    public async Task<IActionResult> CrearConsultorio(
        [FromBody] ConsultorioGuardarDto dto)
    {
        var nombre = dto.Nombre.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre del consultorio es obligatorio.");
        }

        // Validar que la dirección exista
        var direccionExiste = await _context.Set<Direccion>()
            .AnyAsync(d => d.IdDireccion == dto.IdDireccion);

        if (!direccionExiste)
        {
            return BadRequest(
                "La dirección indicada no existe.");
        }

        // Evitar nombres duplicados
        var nombreExiste = await _context.Set<Consultorio>()
            .AnyAsync(c => c.Nombre == nombre);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe un consultorio con ese nombre.");
        }

        var consultorio = new Consultorio
        {
            Nombre = nombre,
            IdDireccion = dto.IdDireccion
        };

        _context.Set<Consultorio>().Add(consultorio);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetConsultorioPorId),
            new { id = consultorio.IdConsultorio },
            ConvertirDto(consultorio));
    }

    // 4. PUT: api/consultorios/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarConsultorio(
        int id,
        [FromBody] ConsultorioGuardarDto dto)
    {
        var consultorio = await _context.Set<Consultorio>()
            .FirstOrDefaultAsync(c => c.IdConsultorio == id);

        if (consultorio == null)
        {
            return NotFound("El consultorio no existe.");
        }

        var nombre = dto.Nombre.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre del consultorio es obligatorio.");
        }

        // Validar dirección
        var direccionExiste = await _context.Set<Direccion>()
            .AnyAsync(d => d.IdDireccion == dto.IdDireccion);

        if (!direccionExiste)
        {
            return BadRequest(
                "La dirección indicada no existe.");
        }

        // Evitar nombres duplicados
        var nombreExiste = await _context.Set<Consultorio>()
            .AnyAsync(c =>
                c.Nombre == nombre &&
                c.IdConsultorio != id);

        if (nombreExiste)
        {
            return Conflict(
                "Ya existe otro consultorio con ese nombre.");
        }

        consultorio.Nombre = nombre;
        consultorio.IdDireccion = dto.IdDireccion;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 5. DELETE: api/consultorios/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarConsultorio(int id)
    {
        var consultorio = await _context.Set<Consultorio>()
            .FirstOrDefaultAsync(c => c.IdConsultorio == id);

        if (consultorio == null)
        {
            return NotFound("El consultorio no existe.");
        }

        // Comprobar turnos asociados
        var tieneTurnos = await _context.Set<Turno>()
            .AnyAsync(t => t.IdConsultorio == id);

        if (tieneTurnos)
        {
            return Conflict(
                "No se puede eliminar el consultorio porque " +
                "tiene turnos asociados.");
        }

        // Comprobar equipamientos asociados
        var tieneEquipamientos = await _context.Set<Consultorio>()
            .Where(c => c.IdConsultorio == id)
            .AnyAsync(c => c.Equipamientos.Any());

        if (tieneEquipamientos)
        {
            return Conflict(
                "No se puede eliminar el consultorio porque " +
                "tiene equipamientos asociados.");
        }

        _context.Set<Consultorio>().Remove(consultorio);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}