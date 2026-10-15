
namespace OdontoSmartAPI.DTOs;

public class EmpleadoDto
{
    public int IdEmpleado { get; set; }

    public string Dni { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;

    public string Apellido { get; set; } = string.Empty;

    public string? Telefono { get; set; }

    public int? IdDireccion { get; set; }

    public string? Correo { get; set; }

    public int IdPuesto { get; set; }

    public bool? Activo { get; set; }
}
