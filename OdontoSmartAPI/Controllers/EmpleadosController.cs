
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;
using OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EmpleadosController : ControllerBase
{
    private readonly AppDbContext _context;

    public EmpleadosController(AppDbContext context)
    {
        _context = context;
    }

    private static EmpleadoDto ConvertirDto(Empleado e)
    {
        return new EmpleadoDto
        {
            IdEmpleado = e.IdEmpleado,
            Dni = e.Dni,
            Nombre = e.Nombre,
            Apellido = e.Apellido,
            Telefono = e.Telefono,
            IdDireccion = e.IdDireccion,
            Correo = e.Correo,
            IdPuesto = e.IdPuesto,
            Activo = e.Activo
        };
    }

    // GET: api/empleados
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmpleadoDto>>>
        GetEmpleados()
    {
        var empleados = await _context.Set<Empleado>()
            .AsNoTracking()
            .Where(e => e.Activo == true)
            .Select(e => new EmpleadoDto
            {
                IdEmpleado = e.IdEmpleado,
                Dni = e.Dni,
                Nombre = e.Nombre,
                Apellido = e.Apellido,
                Telefono = e.Telefono,
                IdDireccion = e.IdDireccion,
                Correo = e.Correo,
                IdPuesto = e.IdPuesto,
                Activo = e.Activo
            })
            .ToListAsync();

        return Ok(empleados);
    }

    // GET: api/empleados/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmpleadoDto>>
        GetEmpleado(int id)
    {
        var empleado = await _context.Set<Empleado>()
            .AsNoTracking()
            .FirstOrDefaultAsync(e =>
                e.IdEmpleado == id && e.Activo == true);

        if (empleado == null)
            return NotFound("Empleado no encontrado.");

        return Ok(ConvertirDto(empleado));
    }

    // POST: api/empleados
    [HttpPost]
    public async Task<ActionResult<EmpleadoDto>>
        PostEmpleado(EmpleadoGuardarDto dto)
    {
        // Validar DNI duplicado
        var dniExiste = await _context.Set<Empleado>()
            .AnyAsync(e => e.Dni == dto.Dni);

        if (dniExiste)
            return Conflict("Ya existe un empleado con ese DNI.");

        // Validar puesto
        var puestoExiste = await _context.Set<Puesto>()
            .AnyAsync(p => p.IdPuesto == dto.IdPuesto);

        if (!puestoExiste)
            return BadRequest("El puesto indicado no existe.");

        // Validar dirección, si se indicó
        if (dto.IdDireccion.HasValue)
        {
            var direccionExiste = await _context.Set<Direccion>()
                .AnyAsync(d =>
                    d.IdDireccion == dto.IdDireccion.Value);

            if (!direccionExiste)
                return BadRequest("La dirección indicada no existe.");
        }

        var empleado = new Empleado
        {
            Dni = dto.Dni,
            Nombre = dto.Nombre,
            Apellido = dto.Apellido,
            Telefono = dto.Telefono,
            IdDireccion = dto.IdDireccion,
            Correo = dto.Correo,
            IdPuesto = dto.IdPuesto,
            Activo = true
        };

        _context.Set<Empleado>().Add(empleado);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetEmpleado),
            new { id = empleado.IdEmpleado },
            ConvertirDto(empleado)
        );
    }

    // PUT: api/empleados/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult>
        PutEmpleado(int id, EmpleadoGuardarDto dto)
    {
        var empleado = await _context.Set<Empleado>()
            .FirstOrDefaultAsync(e =>
                e.IdEmpleado == id && e.Activo == true);

        if (empleado == null)
            return NotFound("Empleado no encontrado.");

        // Validar DNI duplicado
        var dniExiste = await _context.Set<Empleado>()
            .AnyAsync(e =>
                e.Dni == dto.Dni &&
                e.IdEmpleado != id);

        if (dniExiste)
            return Conflict("El DNI pertenece a otro empleado.");

        // Validar puesto
        var puestoExiste = await _context.Set<Puesto>()
            .AnyAsync(p => p.IdPuesto == dto.IdPuesto);

        if (!puestoExiste)
            return BadRequest("El puesto indicado no existe.");

        // Validar dirección, si se indicó
        if (dto.IdDireccion.HasValue)
        {
            var direccionExiste = await _context.Set<Direccion>()
                .AnyAsync(d =>
                    d.IdDireccion == dto.IdDireccion.Value);

            if (!direccionExiste)
                return BadRequest("La dirección indicada no existe.");
        }

        empleado.Dni = dto.Dni;
        empleado.Nombre = dto.Nombre;
        empleado.Apellido = dto.Apellido;
        empleado.Telefono = dto.Telefono;
        empleado.IdDireccion = dto.IdDireccion;
        empleado.Correo = dto.Correo;
        empleado.IdPuesto = dto.IdPuesto;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/empleados/5
    // Baja lógica: conserva el historial
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteEmpleado(int id)
    {
        var empleado = await _context.Set<Empleado>()
            .FirstOrDefaultAsync(e =>
                e.IdEmpleado == id && e.Activo == true);

        if (empleado == null)
        {
            return NotFound(new
            {
                mensaje = "El empleado no existe o ya está dado de baja."
            });
        }

        empleado.Activo = false;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
