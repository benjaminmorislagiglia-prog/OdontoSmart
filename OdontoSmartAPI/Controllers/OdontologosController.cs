
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OdontologosController : ControllerBase
{
    private readonly AppDbContext _context;

    public OdontologosController(AppDbContext context)
    {
        _context = context;
    }

    private static OdontologoDto ConvertirDto(Odontologo o)
    {
        return new OdontologoDto
        {
            IdOdontologo = o.IdOdontologo,
            HorarioAtencion = o.HorarioAtencion,
            DiaAtencion = o.DiaAtencion,
            NroMatricula = o.NroMatricula,
            IdEmpleado = o.IdEmpleado,
            Activo = o.Activo
        };
    }

    // GET: api/odontologos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OdontologoDto>>>
        GetOdontologos()
    {
        var odontologos = await _context.Odontologos
            .AsNoTracking()
            .Where(o => o.Activo == true)
            .Select(o => new OdontologoDto
            {
                IdOdontologo = o.IdOdontologo,
                HorarioAtencion = o.HorarioAtencion,
                DiaAtencion = o.DiaAtencion,
                NroMatricula = o.NroMatricula,
                IdEmpleado = o.IdEmpleado,
                Activo = o.Activo
            })
            .ToListAsync();

        return Ok(odontologos);
    }

    // GET: api/odontologos/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<OdontologoDto>>
        GetOdontologo(int id)
    {
        var odontologo = await _context.Odontologos
            .AsNoTracking()
            .FirstOrDefaultAsync(o =>
                o.IdOdontologo == id && o.Activo == true);

        if (odontologo == null)
            return NotFound("Odontólogo no encontrado.");

        return Ok(ConvertirDto(odontologo));
    }

    // POST: api/odontologos
    [HttpPost]
    public async Task<ActionResult<OdontologoDto>>
        PostOdontologo(OdontologoGuardarDto dto)
    {
        // Validar empleado
        var empleadoDisponible = await _context.Set<Empleado>()
     .AnyAsync(e =>
         e.IdEmpleado == dto.IdEmpleado &&
         e.Activo == true);

        if (!empleadoDisponible)
        {
            return BadRequest(
                "El empleado no existe o está dado de baja.");
        }


        // Validar matrícula duplicada
        var matriculaExiste = await _context.Odontologos
            .AnyAsync(o => o.NroMatricula == dto.NroMatricula);

        if (matriculaExiste)
            return Conflict("Ya existe un odontólogo con esa matrícula.");

        var empleadoAsignado = await _context.Odontologos
    .AnyAsync(o => o.IdEmpleado == dto.IdEmpleado);

        if (empleadoAsignado)
        {
            return Conflict(
                "El empleado ya está registrado como odontólogo.");
        }

        var odontologo = new Odontologo
        {
            HorarioAtencion = dto.HorarioAtencion,
            DiaAtencion = dto.DiaAtencion,
            NroMatricula = dto.NroMatricula,
            IdEmpleado = dto.IdEmpleado,
            Activo = true
        };

        _context.Odontologos.Add(odontologo);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetOdontologo),
            new { id = odontologo.IdOdontologo },
            ConvertirDto(odontologo)
        );
    }

    // PUT: api/odontologos/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult>
        PutOdontologo(int id, OdontologoGuardarDto dto)
    {
        var odontologo = await _context.Odontologos
            .FirstOrDefaultAsync(o =>
                o.IdOdontologo == id && o.Activo == true);

        if (odontologo == null)
            return NotFound("Odontólogo no encontrado.");

        // Validar empleado
        var empleadoExiste = await _context.Empleados
    .AnyAsync(e => e.IdEmpleado == dto.IdEmpleado && e.Activo == true);

        if (!empleadoExiste)
            return BadRequest("El empleado indicado no existe.");

        // Validar matrícula duplicada
        var matriculaExiste = await _context.Odontologos
            .AnyAsync(o =>
                o.NroMatricula == dto.NroMatricula &&
                o.IdOdontologo != id);

        if (matriculaExiste)
            return Conflict("La matrícula pertenece a otro odontólogo.");

        var empleadoAsignado = await _context.Odontologos
    .AnyAsync(o =>
        o.IdEmpleado == dto.IdEmpleado &&
        o.IdOdontologo != id);

        if (empleadoAsignado)
        {
            return Conflict(
                "El empleado ya está asignado a otro odontólogo.");
        }

        odontologo.HorarioAtencion = dto.HorarioAtencion;
        odontologo.DiaAtencion = dto.DiaAtencion;
        odontologo.NroMatricula = dto.NroMatricula;
        odontologo.IdEmpleado = dto.IdEmpleado;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/odontologos/5
    // Baja lógica: conserva el historial
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteOdontologo(int id)
    {
        var odontologo = await _context.Odontologos
            .FirstOrDefaultAsync(o =>
                o.IdOdontologo == id && o.Activo == true);

        if (odontologo == null)
        {
            return NotFound(new
            {
                mensaje = "El odontólogo no existe o ya está dado de baja."
            });
        }

        odontologo.Activo = false;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
