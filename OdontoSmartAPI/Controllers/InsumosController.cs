
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[ApiController]
[Route("api/insumos")]
public class InsumosController : ControllerBase
{
    private readonly AppDbContext _context;

    public InsumosController(AppDbContext context)
    {
        _context = context;
    }

    private static InsumoDto ConvertirDto(Insumo i)
    {
        return new InsumoDto
        {
            IdInsumo = i.IdInsumo,
            Nombre = i.Nombre,
            Descripcion = i.Descripcion,
            UnidadMedida = i.UnidadMedida,
            StockActual = i.StockActual,
            FechaVencimiento = i.FechaVencimiento
        };
    }

    // 1. GET: api/insumos
    [HttpGet]
    public async Task<IActionResult> GetInsumos()
    {
        var insumos = await _context.Set<Insumo>()
            .AsNoTracking()
            .OrderBy(i => i.Nombre)
            .Select(i => new InsumoDto
            {
                IdInsumo = i.IdInsumo,
                Nombre = i.Nombre,
                Descripcion = i.Descripcion,
                UnidadMedida = i.UnidadMedida,
                StockActual = i.StockActual,
                FechaVencimiento = i.FechaVencimiento
            })
            .ToListAsync();

        return Ok(insumos);
    }

    // 2. GET: api/insumos/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetInsumoPorId(int id)
    {
        var insumo = await _context.Set<Insumo>()
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.IdInsumo == id);

        if (insumo == null)
        {
            return NotFound("El insumo no existe.");
        }

        return Ok(ConvertirDto(insumo));
    }

    // 3. GET: api/insumos/stock-bajo/5
    [HttpGet("stock-bajo/{cantidad:int}")]
    public async Task<IActionResult> GetStockBajo(int cantidad)
    {
        if (cantidad < 0)
        {
            return BadRequest(
                "La cantidad mínima no puede ser negativa.");
        }

        var insumos = await _context.Set<Insumo>()
            .AsNoTracking()
            .Where(i => i.StockActual <= cantidad)
            .OrderBy(i => i.StockActual)
            .Select(i => new InsumoDto
            {
                IdInsumo = i.IdInsumo,
                Nombre = i.Nombre,
                Descripcion = i.Descripcion,
                UnidadMedida = i.UnidadMedida,
                StockActual = i.StockActual,
                FechaVencimiento = i.FechaVencimiento
            })
            .ToListAsync();

        return Ok(insumos);
    }

    // 4. GET: api/insumos/vencidos
    [HttpGet("vencidos")]
    public async Task<IActionResult> GetInsumosVencidos()
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);

        var insumos = await _context.Set<Insumo>()
            .AsNoTracking()
            .Where(i =>
                i.FechaVencimiento.HasValue &&
                i.FechaVencimiento.Value < hoy)
            .OrderBy(i => i.FechaVencimiento)
            .Select(i => new InsumoDto
            {
                IdInsumo = i.IdInsumo,
                Nombre = i.Nombre,
                Descripcion = i.Descripcion,
                UnidadMedida = i.UnidadMedida,
                StockActual = i.StockActual,
                FechaVencimiento = i.FechaVencimiento
            })
            .ToListAsync();

        return Ok(insumos);
    }

    // 5. POST: api/insumos
    [HttpPost]
    public async Task<IActionResult> CrearInsumo(
        [FromBody] InsumoGuardarDto dto)
    {
        var nombre = dto.Nombre?.Trim();
        var descripcion = dto.Descripcion?.Trim();
        var unidadMedida = dto.UnidadMedida?.Trim();

        if (string.IsNullOrWhiteSpace(nombre) ||
            string.IsNullOrWhiteSpace(unidadMedida))
        {
            return BadRequest(
                "El nombre y la unidad de medida son obligatorios.");
        }

        if (dto.StockActual < 0)
        {
            return BadRequest(
                "El stock no puede ser negativo.");
        }

        // Evitar insumos duplicados con igual nombre y unidad
        var existe = await _context.Set<Insumo>()
            .AnyAsync(i =>
                i.Nombre == nombre &&
                i.UnidadMedida == unidadMedida);

        if (existe)
        {
            return Conflict(
                "Ya existe un insumo con ese nombre y unidad de medida.");
        }

        var insumo = new Insumo
        {
            Nombre = nombre,
            Descripcion = string.IsNullOrWhiteSpace(descripcion)
                ? null : descripcion,
            UnidadMedida = unidadMedida,
            StockActual = dto.StockActual,
            FechaVencimiento = dto.FechaVencimiento
        };

        _context.Set<Insumo>().Add(insumo);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetInsumoPorId),
            new { id = insumo.IdInsumo },
            ConvertirDto(insumo));
    }

    // 6. PUT: api/insumos/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarInsumo(
        int id,
        [FromBody] InsumoGuardarDto dto)
    {
        var insumo = await _context.Set<Insumo>()
            .FirstOrDefaultAsync(i => i.IdInsumo == id);

        if (insumo == null)
        {
            return NotFound("El insumo no existe.");
        }

        var nombre = dto.Nombre?.Trim();
        var descripcion = dto.Descripcion?.Trim();
        var unidadMedida = dto.UnidadMedida?.Trim();

        if (string.IsNullOrWhiteSpace(nombre) ||
            string.IsNullOrWhiteSpace(unidadMedida))
        {
            return BadRequest(
                "El nombre y la unidad de medida son obligatorios.");
        }

        if (dto.StockActual < 0)
        {
            return BadRequest(
                "El stock no puede ser negativo.");
        }

        var existe = await _context.Set<Insumo>()
            .AnyAsync(i =>
                i.IdInsumo != id &&
                i.Nombre == nombre &&
                i.UnidadMedida == unidadMedida);

        if (existe)
        {
            return Conflict(
                "Ya existe otro insumo con ese nombre y unidad de medida.");
        }

        insumo.Nombre = nombre;
        insumo.Descripcion =
            string.IsNullOrWhiteSpace(descripcion) ? null : descripcion;
        insumo.UnidadMedida = unidadMedida;
        insumo.StockActual = dto.StockActual;
        insumo.FechaVencimiento = dto.FechaVencimiento;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 7. DELETE: api/insumos/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarInsumo(int id)
    {
        var insumo = await _context.Set<Insumo>()
            .FirstOrDefaultAsync(i => i.IdInsumo == id);

        if (insumo == null)
        {
            return NotFound("El insumo no existe.");
        }

        // Proteger el historial de insumos utilizados en turnos
        var tieneTurnos = await _context.Set<Insumo>()
            .Where(i => i.IdInsumo == id)
            .AnyAsync(i => i.TurnoInsumos.Any());

        if (tieneTurnos)
        {
            return Conflict(
                "No se puede eliminar el insumo porque está asociado a turnos.");
        }

        _context.Set<Insumo>().Remove(insumo);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
