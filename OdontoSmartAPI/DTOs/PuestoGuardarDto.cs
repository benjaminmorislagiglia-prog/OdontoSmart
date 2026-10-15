using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class PuestoGuardarDto
{
    [Required(ErrorMessage = "El nombre del puesto es obligatorio.")]
    [StringLength(100, MinimumLength = 2,
        ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    public string Nombre { get; set; } = null!;
}