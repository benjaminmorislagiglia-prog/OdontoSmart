
using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Validation;

public class PacienteGuardarDto : IValidatableObject
{
    [Required(ErrorMessage = "El DNI es obligatorio.")]
    [StringLength(20)]
    [RegularExpression(InputPatterns.Dni, ErrorMessage = "El DNI sólo admite números, sin puntos ni espacios.")]
    public string Dni { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100)]
    [RegularExpression(InputPatterns.PersonName, ErrorMessage = "El nombre sólo admite letras, espacios, apóstrofes o guiones.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [StringLength(100)]
    [RegularExpression(InputPatterns.PersonName, ErrorMessage = "El apellido sólo admite letras, espacios, apóstrofes o guiones.")]
    public string Apellido { get; set; } = string.Empty;

    [StringLength(20)]
    [RegularExpression(InputPatterns.Phone, ErrorMessage = "El teléfono debe contener números y un formato telefónico válido.")]
    public string? Telefono { get; set; }

    [EmailAddress]
    [StringLength(100)]
    public string? Correo { get; set; }

    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
    public DateOnly? FechaNacimiento { get; set; }

    [Range(1, int.MaxValue)]
    public int? IdObraSocial { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar una dirección válida.")]
    public int IdDireccion { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (FechaNacimiento > DateOnly.FromDateTime(DateTime.Today))
            yield return new ValidationResult("La fecha de nacimiento no puede ser futura.", [nameof(FechaNacimiento)]);
    }
}
