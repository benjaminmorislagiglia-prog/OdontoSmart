
using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class PacienteGuardarDto
{
    [Required(ErrorMessage = "El DNI es obligatorio.")]
    [StringLength(20)]
    public string Dni { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [StringLength(100)]
    public string Apellido { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Telefono { get; set; }

    [EmailAddress]
    [StringLength(100)]
    public string? Correo { get; set; }

    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
    public DateOnly? FechaNacimiento { get; set; }

    public int? IdObraSocial { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar una dirección válida.")]
    public int IdDireccion { get; set; }
}
