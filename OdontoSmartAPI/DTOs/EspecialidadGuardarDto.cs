using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class EspecialidadGuardarDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, MinimumLength = 2,
        ErrorMessage = "El nombre debe tener entre 2 y 60 caracteres.")]
    public string Nombre { get; set; } = null!;
}