
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[ApiController]
[Route("api/turnoinsumos")]
public class TurnoInsumosController : ControllerBase
{
    private readonly AppDbContext _context;

    public TurnoInsumosController(AppDbContext context)
    {
        _context = context;
    }

    private static TurnoInsumoDto ConvertirDto(TurnoInsumo ti)
    {
        return new TurnoInsumoDto
        {
            IdTurnoInsumo = ti.IdTurnoInsumo,
            IdTurno = ti.IdTurno,
            IdInsumo = ti.IdInsumo,
            Cantidad = ti.Cantidad
        };
    }

    // 1. GET: api/turnoinsumos
    [HttpGet]
    public async Task<IActionResult> GetTodos()
    {
        var registros = await _context.Set<TurnoInsumo>()
            .AsNoTracking()
            .OrderBy(ti => ti.IdTurno)
            .ThenBy(ti => ti.IdInsumo)
            .Select(ti => new TurnoInsumoDto
            {
                IdTurnoInsumo = ti.IdTurnoInsumo,
                IdTurno = ti.IdTurno,
                IdInsumo = ti.IdInsumo,
                Cantidad = ti.Cantidad
            })
            .ToListAsync();

        return Ok(registros);
    }

    // 2. GET: api/turnoinsumos/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPorId(int id)
    {
        var registro = await _context.Set<TurnoInsumo>()
            .AsNoTracking()
            .FirstOrDefaultAsync(ti => ti.IdTurnoInsumo == id);

        if (registro == null)
        {
            return NotFound("El registro de turno-insumo no existe.");
        }

        return Ok(ConvertirDto(registro));
    }

    // 3. GET: api/turnoinsumos/turno/1
    [HttpGet("turno/{idTurno:int}")]
    public async Task<IActionResult> GetPorTurno(int idTurno)
    {
        var turnoExiste = await _context.Set<Turno>()
            .AnyAsync(t => t.IdTurno == idTurno);

        if (!turnoExiste)
        {
            return NotFound("El turno no existe.");
        }

        var registros = await _context.Set<TurnoInsumo>()
            .AsNoTracking()
            .Where(ti => ti.IdTurno == idTurno)
            .OrderBy(ti => ti.IdInsumo)
            .Select(ti => new TurnoInsumoDto
            {
                IdTurnoInsumo = ti.IdTurnoInsumo,
                IdTurno = ti.IdTurno,
                IdInsumo = ti.IdInsumo,
                Cantidad = ti.Cantidad
            })
            .ToListAsync();

        return Ok(registros);
    }

    // 4. GET: api/turnoinsumos/insumo/1
    [HttpGet("insumo/{idInsumo:int}")]
    public async Task<IActionResult> GetPorInsumo(int idInsumo)
    {
        var insumoExiste = await _context.Set<Insumo>()
            .AnyAsync(i => i.IdInsumo == idInsumo);

        if (!insumoExiste)
        {
            return NotFound("El insumo no existe.");
        }

        var registros = await _context.Set<TurnoInsumo>()
            .AsNoTracking()
            .Where(ti => ti.IdInsumo == idInsumo)
            .OrderBy(ti => ti.IdTurno)
            .Select(ti => new TurnoInsumoDto
            {
                IdTurnoInsumo = ti.IdTurnoInsumo,
                IdTurno = ti.IdTurno,
                IdInsumo = ti.IdInsumo,
                Cantidad = ti.Cantidad
            })
            .ToListAsync();

        return Ok(registros);
    }

    // 5. POST: api/turnoinsumos
    [HttpPost]
    public async Task<IActionResult> CrearRegistro(
        [FromBody] TurnoInsumoGuardarDto dto)
    {
        if (dto.Cantidad <= 0)
        {
            return BadRequest(
                "La cantidad debe ser mayor que cero.");
        }

        var turnoExiste = await _context.Set<Turno>()
            .AnyAsync(t => t.IdTurno == dto.IdTurno);

        if (!turnoExiste)
        {
            return BadRequest("El turno indicado no existe.");
        }

        // Transacción con aislamiento serializable:
        // protege también la verificación de duplicados.
        await using var transaccion = await _context.Database
            .BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

        var duplicado = await _context.Set<TurnoInsumo>()
            .AnyAsync(ti =>
                ti.IdTurno == dto.IdTurno &&
                ti.IdInsumo == dto.IdInsumo);

        if (duplicado)
        {
            return Conflict(
                "Este insumo ya está registrado en el turno.");
        }

        var hoy = DateOnly.FromDateTime(DateTime.Today);

        // Descontar solamente si existe, no está vencido
        // y tiene stock suficiente.
        var filasActualizadas = await _context.Set<Insumo>()
            .Where(i =>
                i.IdInsumo == dto.IdInsumo &&
                i.StockActual >= dto.Cantidad &&
                (!i.FechaVencimiento.HasValue ||
                 i.FechaVencimiento.Value >= hoy))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(
                    i => i.StockActual,
                    i => i.StockActual - dto.Cantidad));

        if (filasActualizadas == 0)
        {
            var insumo = await _context.Set<Insumo>()
                .AsNoTracking()
                .FirstOrDefaultAsync(i =>
                    i.IdInsumo == dto.IdInsumo);

            if (insumo == null)
            {
                return BadRequest(
                    "El insumo indicado no existe.");
            }

            if (insumo.FechaVencimiento.HasValue &&
                insumo.FechaVencimiento.Value < hoy)
            {
                return Conflict(
                    "No se puede utilizar un insumo vencido.");
            }

            return Conflict(
                "No hay stock suficiente para registrar el consumo.");
        }

        var registro = new TurnoInsumo
        {
            IdTurno = dto.IdTurno,
            IdInsumo = dto.IdInsumo,
            Cantidad = dto.Cantidad
        };

        _context.Set<TurnoInsumo>().Add(registro);

        await _context.SaveChangesAsync();
        await transaccion.CommitAsync();

        return CreatedAtAction(
            nameof(GetPorId),
            new { id = registro.IdTurnoInsumo },
            ConvertirDto(registro));
    }

    // 6. PUT: api/turnoinsumos/1
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarRegistro(
        int id,
        [FromBody] TurnoInsumoGuardarDto dto)
    {
        if (dto.Cantidad <= 0)
        {
            return BadRequest(
                "La cantidad debe ser mayor que cero.");
        }

        await using var transaccion = await _context.Database
            .BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

        var registro = await _context.Set<TurnoInsumo>()
            .FirstOrDefaultAsync(ti => ti.IdTurnoInsumo == id);

        if (registro == null)
        {
            return NotFound(
                "El registro de turno-insumo no existe.");
        }

        // Para evitar transferencias accidentales de stock,
        // este PUT solo modifica la cantidad.
        if (registro.IdTurno != dto.IdTurno ||
            registro.IdInsumo != dto.IdInsumo)
        {
            return BadRequest(
                "No se permite cambiar el turno ni el insumo. " +
                "Para otra asociación, creá un registro nuevo.");
        }

        var diferencia = (long)dto.Cantidad - registro.Cantidad;

        if (diferencia > 0)
        {
            // Necesitamos consumir más unidades.
            var hoy = DateOnly.FromDateTime(DateTime.Today);

            var filas = await _context.Set<Insumo>()
                .Where(i =>
                    i.IdInsumo == registro.IdInsumo &&
                    i.StockActual >= diferencia &&
                    (!i.FechaVencimiento.HasValue ||
                     i.FechaVencimiento.Value >= hoy))
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(
                        i => i.StockActual,
                        i => i.StockActual - (int)diferencia));

            if (filas == 0)
            {
                return Conflict(
                    "No hay stock suficiente o el insumo está vencido.");
            }
        }
        else if (diferencia < 0)
        {
            // Se consumieron menos unidades de las registradas.
            var devolucion = (int)(-diferencia);

            var filas = await _context.Set<Insumo>()
                .Where(i =>
                    i.IdInsumo == registro.IdInsumo &&
                    i.StockActual <= int.MaxValue - devolucion)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(
                        i => i.StockActual,
                        i => i.StockActual + devolucion));

            if (filas == 0)
            {
                return Conflict(
                    "No se pudo devolver el stock al insumo.");
            }
        }

        registro.Cantidad = dto.Cantidad;

        await _context.SaveChangesAsync();
        await transaccion.CommitAsync();

        return NoContent();
    }

    // 7. DELETE: api/turnoinsumos/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarRegistro(int id)
    {
        await using var transaccion = await _context.Database
            .BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

        var registro = await _context.Set<TurnoInsumo>()
            .FirstOrDefaultAsync(ti => ti.IdTurnoInsumo == id);

        if (registro == null)
        {
            return NotFound(
                "El registro de turno-insumo no existe.");
        }

        // Devolver al inventario la cantidad registrada.
        var filas = await _context.Set<Insumo>()
            .Where(i =>
                i.IdInsumo == registro.IdInsumo &&
                i.StockActual <= int.MaxValue - registro.Cantidad)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(
                    i => i.StockActual,
                    i => i.StockActual + registro.Cantidad));

        if (filas == 0)
        {
            return Conflict(
                "No se pudo devolver el stock al insumo.");
        }

        _context.Set<TurnoInsumo>().Remove(registro);

        await _context.SaveChangesAsync();
        await transaccion.CommitAsync();

        return NoContent();
    }
}
