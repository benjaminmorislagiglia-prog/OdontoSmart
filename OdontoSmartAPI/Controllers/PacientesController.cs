
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PacientesController : ControllerBase
{
    private readonly AppDbContext _context;

    public PacientesController(AppDbContext context)
    {
        _context = context;
    }

    private static PacienteDto ConvertirDto(Paciente p)
    {
        return new PacienteDto
        {
            IdPaciente = p.IdPaciente,
            Dni = p.Dni,
            Nombre = p.Nombre,
            Apellido = p.Apellido,
            Telefono = p.Telefono,
            Correo = p.Correo,
            FechaNacimiento = p.FechaNacimiento,
            Activo = p.Activo,
            IdObraSocial = p.IdObraSocial,
            IdDireccion = p.IdDireccion
        };
    }

    // GET: api/pacientes
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PacienteDto>>>
        GetPacientes([FromQuery] bool activo = true)
    {
        var pacientes = await _context.Pacientes
            .AsNoTracking()
            .Where(p => activo ? p.Activo == true : p.Activo != true)
            .Select(p => new PacienteDto
            {
                IdPaciente = p.IdPaciente,
                Dni = p.Dni,
                Nombre = p.Nombre,
                Apellido = p.Apellido,
                Telefono = p.Telefono,
                Correo = p.Correo,
                FechaNacimiento = p.FechaNacimiento,
                Activo = p.Activo,
                IdObraSocial = p.IdObraSocial,
                IdDireccion = p.IdDireccion
            })
            .ToListAsync();

        return Ok(pacientes);
    }

    // GET: api/pacientes/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PacienteDto>>
        GetPaciente(int id, [FromQuery] bool incluirInactivos = false)
    {
        var paciente = await _context.Pacientes
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.IdPaciente == id && (incluirInactivos || p.Activo == true));

        if (paciente == null)
            return NotFound("Paciente no encontrado.");

        return Ok(ConvertirDto(paciente));
    }

    // POST: api/pacientes
    [HttpPost]
    public async Task<ActionResult<PacienteDto>>
        PostPaciente(PacienteGuardarDto dto)
    {

        var direccionExiste = await _context.Direccions
    .AnyAsync(d => d.IdDireccion == dto.IdDireccion);

        if (!direccionExiste)
        {
            return BadRequest("La dirección indicada no existe.");
        }

        var dniExiste = await _context.Pacientes
            .AnyAsync(p => p.Dni == dto.Dni);

        if (dniExiste)
            return Conflict("Ya existe un paciente con ese DNI.");


        // Validar obra social
        if (dto.IdObraSocial.HasValue)
        {
            var obraSocialExiste = await _context.ObraSocials
                .AnyAsync(o => o.IdObraSocial == dto.IdObraSocial.Value);

            if (!obraSocialExiste)
            {
                return BadRequest("La obra social indicada no existe.");
            }
        }

        var paciente = new Paciente
        {
            Dni = dto.Dni,
            Nombre = dto.Nombre,
            Apellido = dto.Apellido,
            Telefono = dto.Telefono,
            Correo = dto.Correo,
            FechaNacimiento = dto.FechaNacimiento!.Value,
            Activo = true,
            IdObraSocial = dto.IdObraSocial,
            IdDireccion = dto.IdDireccion
        };

        _context.Pacientes.Add(paciente);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetPaciente),
            new { id = paciente.IdPaciente },
            ConvertirDto(paciente)
        );
    }

    // PUT: api/pacientes/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult>
        PutPaciente(int id, PacienteGuardarDto dto)
    {

        var direccionExiste = await _context.Direccions
    .AnyAsync(d => d.IdDireccion == dto.IdDireccion);

        if (!direccionExiste)
        {
            return BadRequest("La dirección indicada no existe.");
        }



        var paciente = await _context.Pacientes
            .FirstOrDefaultAsync(p =>
                p.IdPaciente == id && p.Activo == true);

        if (paciente == null)
            return NotFound("Paciente no encontrado.");

        var dniExiste = await _context.Pacientes
            .AnyAsync(p =>
                p.Dni == dto.Dni && p.IdPaciente != id);

        if (dniExiste)
            return Conflict("El DNI pertenece a otro paciente.");

        // Validar que la obra social exista, si se indicó una
        if (dto.IdObraSocial.HasValue)
        {
            bool obraSocialExiste = await _context.ObraSocials
                .AnyAsync(o =>
                    o.IdObraSocial == dto.IdObraSocial.Value);

            if (!obraSocialExiste)
            {
                return BadRequest(new
                {
                    mensaje = "La obra social indicada no existe."
                });
            }
        }


        paciente.Dni = dto.Dni;
        paciente.Nombre = dto.Nombre;
        paciente.Apellido = dto.Apellido;
        paciente.Telefono = dto.Telefono;
        paciente.Correo = dto.Correo;
        paciente.FechaNacimiento = dto.FechaNacimiento!.Value;
        paciente.IdObraSocial = dto.IdObraSocial;
        paciente.IdDireccion = dto.IdDireccion;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Reactivación: recupera el mismo registro y todas sus relaciones.
    [HttpPost("{id:int}/reactivar")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(string), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReactivarPaciente(int id)
    {
        var registro = await _context.Pacientes.FirstOrDefaultAsync(r => r.IdPaciente == id);
        if (registro == null) return NotFound("No se encontró el registro.");

        registro.Activo = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/pacientes/5
    // Baja lógica: no elimina el historial del paciente
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePaciente(int id)
    {
        var paciente = await _context.Pacientes
            .FirstOrDefaultAsync(p =>
                p.IdPaciente == id && p.Activo == true);

        if (paciente == null)
        {
            return NotFound(new
            {
                mensaje = "El paciente no existe o ya está desactivado."
            });
        }

        paciente.Activo = false;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
