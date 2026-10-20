using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Validation;

public class DireccionGuardarDto
{
    [Required(ErrorMessage = "La calle es obligatoria.")]
    [StringLength(100, MinimumLength = 2)]
    public string Calle { get; set; } = null!;

    [Range(1, int.MaxValue,
        ErrorMessage = "El número debe ser mayor a cero.")]
    public int Numero { get; set; }

    [StringLength(100)]
    public string? Barrio { get; set; }

    [Required(ErrorMessage = "El código postal es obligatorio.")]
    [StringLength(10, MinimumLength = 4)]
    [RegularExpression(InputPatterns.PostalCode, ErrorMessage = "Usá entre 4 y 10 letras o números, incluyendo al menos un número.")]
    public string Cp { get; set; } = null!;

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar una localidad válida.")]
    public int IdLocalidad { get; set; }
}
