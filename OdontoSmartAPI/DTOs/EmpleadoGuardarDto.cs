
using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class EmpleadoGuardarDto
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

    public int? IdDireccion { get; set; }

    [EmailAddress(ErrorMessage = "El correo electrónico no es válido.")]
    [StringLength(100)]
    public string? Correo { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un puesto válido.")]
    public int IdPuesto { get; set; }
}
