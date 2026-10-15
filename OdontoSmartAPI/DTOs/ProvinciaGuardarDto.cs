using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class ProvinciaGuardarDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, MinimumLength = 2)]
    public string Nombre { get; set; } = null!;

    [Required(ErrorMessage = "El país es obligatorio.")]
    [StringLength(100, MinimumLength = 2)]
    public string Pais { get; set; } = null!;
}