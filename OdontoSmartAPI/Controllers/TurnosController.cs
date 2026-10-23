using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TurnosController(AppDbContext context) : ControllerBase
{
    private IQueryable<TurnoDto> Query() => context.Turnos.AsNoTracking().Select(t => new TurnoDto
    {
        IdTurno = t.IdTurno, Fecha = t.Fecha, Hora = t.Hora, IdPaciente = t.IdPaciente,
        IdOdontologo = t.IdOdontologo, IdConsultorio = t.IdConsultorio,
        Paciente = t.IdPacienteNavigation.Nombre + " " + t.IdPacienteNavigation.Apellido,
        Odontologo = t.IdOdontologoNavigation.IdEmpleadoNavigation.Nombre + " " + t.IdOdontologoNavigation.IdEmpleadoNavigation.Apellido,
        Consultorio = t.IdConsultorioNavigation.Nombre,
        IdEstadoTurno = t.HistorialEstadoTurnos.OrderByDescending(h => h.FechaHora).ThenByDescending(h => h.IdHistorialEstadoTurno)
            .Select(h => (int?)h.IdEstadoTurno).FirstOrDefault(),
        Estado = t.HistorialEstadoTurnos.OrderByDescending(h => h.FechaHora).ThenByDescending(h => h.IdHistorialEstadoTurno)
            .Select(h => h.IdEstadoTurnoNavigation.Nombre).FirstOrDefault()
    });

    private async Task AgregarEstadosPermitidos(IEnumerable<TurnoDto> turnos)
    {
        var estados = await context.EstadoTurnos.AsNoTracking().ToListAsync();
        var ahora = DateTime.Now;
        foreach (var turno in turnos)
            turno.EstadosPermitidos = estados
                .Where(e => TurnoEstadoRules.Validar(turno.Estado, e.Nombre, turno.Fecha, turno.Hora, ahora) == null)
                .Select(e => e.IdEstadoTurno).ToArray();
    }

    [HttpGet]
    public async Task<IActionResult> GetTurnos()
    {
        var turnos = await Query().OrderBy(t => t.Fecha).ThenBy(t => t.Hora).ToListAsync();
        await AgregarEstadosPermitidos(turnos);
        return Ok(turnos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetTurnoPorId(int id)
    {
        var turno = await Query().FirstOrDefaultAsync(t => t.IdTurno == id);
        if (turno == null) return NotFound("No se encontró el turno.");
        await AgregarEstadosPermitidos([turno]);
        return Ok(turno);
    }

    private async Task<IActionResult?> Validar(TurnoGuardarDto dto, int exclude = 0, bool checkAvailability = true)
    {
        if (!dto.Fecha.HasValue || !dto.Hora.HasValue || !dto.IdPaciente.HasValue ||
            !dto.IdOdontologo.HasValue || !dto.IdConsultorio.HasValue) return BadRequest("Completá todos los datos del turno.");
        if (!await context.Pacientes.AnyAsync(p => p.IdPaciente == dto.IdPaciente && p.Activo == true))
            return BadRequest("El paciente no existe o está dado de baja.");
        if (!await context.Odontologos.AnyAsync(o => o.IdOdontologo == dto.IdOdontologo &&
            o.Activo && o.IdEmpleadoNavigation.Activo == true))
            return BadRequest("El odontólogo no existe o está dado de baja.");
        if (!await context.Consultorios.AnyAsync(c => c.IdConsultorio == dto.IdConsultorio))
            return BadRequest("El consultorio no existe.");
        if (!checkAvailability) return null;
        var conflict = await AgendaRules.ConflictAsync(context, dto.Fecha.Value, dto.Hora.Value,
            dto.IdOdontologo.Value, dto.IdConsultorio.Value, exclude);
        return conflict == null ? null : Conflict(conflict);
    }

    private static void Aplicar(Turno turno, TurnoGuardarDto dto)
    {
        turno.Fecha = dto.Fecha!.Value; turno.Hora = dto.Hora!.Value;
        turno.IdPaciente = dto.IdPaciente!.Value; turno.IdOdontologo = dto.IdOdontologo!.Value;
        turno.IdConsultorio = dto.IdConsultorio!.Value;
    }

    [HttpPost]
    public async Task<IActionResult> CrearTurno(TurnoGuardarDto dto)
    {
        await using var transaction = await AgendaRules.LockAsync(context);
        var error = await Validar(dto);
        if (error != null) return error;
        var initial = await context.EstadoTurnos.FirstOrDefaultAsync(e => e.Nombre == "Pendiente");
        if (initial == null) return Conflict("Falta configurar el estado Pendiente en el catálogo.");
        var turno = new Turno();
        Aplicar(turno, dto);
        turno.HistorialEstadoTurnos.Add(new HistorialEstadoTurno { IdEstadoTurno = initial.IdEstadoTurno, FechaHora = DateTime.Now });
        context.Turnos.Add(turno);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        var creado = await Query().FirstAsync(t => t.IdTurno == turno.IdTurno);
        await AgregarEstadosPermitidos([creado]);
        return CreatedAtAction(nameof(GetTurnoPorId), new { id = turno.IdTurno }, creado);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarTurno(int id, TurnoGuardarDto dto)
    {
        await using var transaction = await AgendaRules.LockAsync(context);
        var turno = await context.Turnos.FindAsync(id);
        if (turno == null) return NotFound("No se encontró el turno.");
        var state = await Query().Where(t => t.IdTurno == id).Select(t => t.Estado).FirstAsync();
        // Un turno cancelado puede editarse sin volver a ocupar el horario.
        var error = await Validar(dto, id, state != "Cancelado");
        if (error != null) return error;
        if (turno.IdPaciente != dto.IdPaciente && await context.HistorialClinicos.AnyAsync(h => h.IdTurno == id))
            return Conflict("No se puede cambiar el paciente de un turno con historia clínica.");
        Aplicar(turno, dto);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }

    // Baja mediante estado; conserva relaciones y todo el historial.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarTurno(int id)
    {
        await using var transaction = await AgendaRules.LockAsync(context);
        var turno = await context.Turnos.FindAsync(id);
        if (turno == null) return NotFound("No se encontró el turno.");
        var current = await Query().Where(t => t.IdTurno == id).Select(t => t.Estado).FirstAsync();
        if (current == "Cancelado") return NoContent();
        var cancelled = await context.EstadoTurnos.FirstOrDefaultAsync(e => e.Nombre == "Cancelado");
        if (cancelled == null) return Conflict("Falta configurar el estado Cancelado en el catálogo de estados.");
        var ahora = DateTime.Now;
        var error = TurnoEstadoRules.Validar(current, cancelled.Nombre, turno.Fecha, turno.Hora, ahora);
        if (error != null) return Conflict(error);
        context.HistorialEstadoTurnos.Add(new HistorialEstadoTurno
        { IdTurno = id, IdEstadoTurno = cancelled.IdEstadoTurno, FechaHora = ahora });
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }
}
