using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class EstadoTurnoGuardarDto
{
    [Required(ErrorMessage = "El nombre del estado es obligatorio.")]
    [StringLength(50, MinimumLength = 2,
    ErrorMessage = "El nombre debe tener entre 2 y 50 caracteres.")]
    public string Nombre { get; set; } = null!;
}
