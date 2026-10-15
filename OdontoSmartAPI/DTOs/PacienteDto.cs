
using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class PacienteDto
{
    public int IdPaciente { get; set; }
    public string Dni { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public DateOnly FechaNacimiento { get; set; }
    public bool? Activo { get; set; }
    public int? IdObraSocial { get; set; }
    public int IdDireccion { get; set; }
}
