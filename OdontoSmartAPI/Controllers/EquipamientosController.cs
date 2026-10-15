
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/equipamientos")]
[ApiController]
public class EquipamientosController : ControllerBase
{
    private readonly AppDbContext _context;

    public EquipamientosController(AppDbContext context)
    {
        _context = context;
    }

    private static EquipamientoDto ConvertirDto(Equipamiento e)
    {
        return new EquipamientoDto
        {
            IdEquipamiento = e.IdEquipamiento,
            Nombre = e.Nombre,
            Marca = e.Marca,
            Modelo = e.Modelo,
            NroSerie = e.NroSerie,
            FechaAdquisicion = e.FechaAdquisicion,
            IdConsultorio = e.IdConsultorio
        };
    }

    // 1. GET: api/equipamientos
    [HttpGet]
    public async Task<IActionResult> GetEquipamientos()
    {
        var equipamientos = await _context.Set<Equipamiento>()
            .AsNoTracking()
            .OrderBy(e => e.Nombre)
            .Select(e => new EquipamientoDto
            {
                IdEquipamiento = e.IdEquipamiento,
                Nombre = e.Nombre,
                Marca = e.Marca,
                Modelo = e.Modelo,
                NroSerie = e.NroSerie,
                FechaAdquisicion = e.FechaAdquisicion,
                IdConsultorio = e.IdConsultorio
            })
            .ToListAsync();

        return Ok(equipamientos);
    }

    // 2. GET: api/equipamientos/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetEquipamientoPorId(int id)
    {
        var equipamiento = await _context.Set<Equipamiento>()
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdEquipamiento == id);

        if (equipamiento == null)
        {
            return NotFound("El equipamiento no existe.");
        }

        return Ok(ConvertirDto(equipamiento));
    }

    // 3. GET: api/equipamientos/consultorio/1
    [HttpGet("consultorio/{idConsultorio:int}")]
    public async Task<IActionResult> GetPorConsultorio(int idConsultorio)
    {
        var consultorioExiste = await _context.Set<Consultorio>()
            .AnyAsync(c => c.IdConsultorio == idConsultorio);

        if (!consultorioExiste)
        {
            return NotFound("El consultorio no existe.");
        }

        var equipamientos = await _context.Set<Equipamiento>()
            .AsNoTracking()
            .Where(e => e.IdConsultorio == idConsultorio)
            .OrderBy(e => e.Nombre)
            .Select(e => new EquipamientoDto
            {
                IdEquipamiento = e.IdEquipamiento,
                Nombre = e.Nombre,
                Marca = e.Marca,
                Modelo = e.Modelo,
                NroSerie = e.NroSerie,
                FechaAdquisicion = e.FechaAdquisicion,
                IdConsultorio = e.IdConsultorio
            })
            .ToListAsync();

        return Ok(equipamientos);
    }

    // 4. POST: api/equipamientos
    [HttpPost]
    public async Task<IActionResult> CrearEquipamiento(
        [FromBody] EquipamientoGuardarDto dto)
    {
        var nombre = dto.Nombre?.Trim();
        var marca = dto.Marca?.Trim();
        var modelo = dto.Modelo?.Trim();
        var nroSerie = dto.NroSerie?.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre del equipamiento es obligatorio.");
        }

        // Validar que el consultorio exista
        var consultorioExiste = await _context.Set<Consultorio>()
            .AnyAsync(c => c.IdConsultorio == dto.IdConsultorio);

        if (!consultorioExiste)
        {
            return BadRequest(
                "El consultorio indicado no existe.");
        }

        // Evitar números de serie duplicados cuando se informan
        if (!string.IsNullOrWhiteSpace(nroSerie))
        {
            var serieExiste = await _context.Set<Equipamiento>()
                .AnyAsync(e => e.NroSerie == nroSerie);

            if (serieExiste)
            {
                return Conflict(
                    "Ya existe un equipamiento con ese número de serie.");
            }
        }

        // No permitir fechas futuras de adquisición
        if (dto.FechaAdquisicion.HasValue &&
            dto.FechaAdquisicion.Value > DateOnly.FromDateTime(DateTime.Today))
        {
            return BadRequest(
                "La fecha de adquisición no puede ser futura.");
        }

        var equipamiento = new Equipamiento
        {
            Nombre = nombre,
            Marca = string.IsNullOrWhiteSpace(marca) ? null : marca,
            Modelo = string.IsNullOrWhiteSpace(modelo) ? null : modelo,
            NroSerie = string.IsNullOrWhiteSpace(nroSerie) ? null : nroSerie,
            FechaAdquisicion = dto.FechaAdquisicion,
            IdConsultorio = dto.IdConsultorio
        };

        _context.Set<Equipamiento>().Add(equipamiento);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetEquipamientoPorId),
            new { id = equipamiento.IdEquipamiento },
            ConvertirDto(equipamiento));
    }

    // 5. PUT: api/equipamientos/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarEquipamiento(
        int id,
        [FromBody] EquipamientoGuardarDto dto)
    {
        var equipamiento = await _context.Set<Equipamiento>()
            .FirstOrDefaultAsync(e => e.IdEquipamiento == id);

        if (equipamiento == null)
        {
            return NotFound("El equipamiento no existe.");
        }

        var nombre = dto.Nombre?.Trim();
        var marca = dto.Marca?.Trim();
        var modelo = dto.Modelo?.Trim();
        var nroSerie = dto.NroSerie?.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest(
                "El nombre del equipamiento es obligatorio.");
        }

        // Validar consultorio
        var consultorioExiste = await _context.Set<Consultorio>()
            .AnyAsync(c => c.IdConsultorio == dto.IdConsultorio);

        if (!consultorioExiste)
        {
            return BadRequest(
                "El consultorio indicado no existe.");
        }

        // Evitar número de serie duplicado en otro equipo
        if (!string.IsNullOrWhiteSpace(nroSerie))
        {
            var serieExiste = await _context.Set<Equipamiento>()
                .AnyAsync(e =>
                    e.NroSerie == nroSerie &&
                    e.IdEquipamiento != id);

            if (serieExiste)
            {
                return Conflict(
                    "Ya existe otro equipamiento con ese número de serie.");
            }
        }

        if (dto.FechaAdquisicion.HasValue &&
            dto.FechaAdquisicion.Value > DateOnly.FromDateTime(DateTime.Today))
        {
            return BadRequest(
                "La fecha de adquisición no puede ser futura.");
        }

        equipamiento.Nombre = nombre;
        equipamiento.Marca =
            string.IsNullOrWhiteSpace(marca) ? null : marca;
        equipamiento.Modelo =
            string.IsNullOrWhiteSpace(modelo) ? null : modelo;
        equipamiento.NroSerie =
            string.IsNullOrWhiteSpace(nroSerie) ? null : nroSerie;
        equipamiento.FechaAdquisicion = dto.FechaAdquisicion;
        equipamiento.IdConsultorio = dto.IdConsultorio;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 6. DELETE: api/equipamientos/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarEquipamiento(int id)
    {
        var equipamiento = await _context.Set<Equipamiento>()
            .FirstOrDefaultAsync(e => e.IdEquipamiento == id);

        if (equipamiento == null)
        {
            return NotFound("El equipamiento no existe.");
        }

        _context.Set<Equipamiento>().Remove(equipamiento);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
