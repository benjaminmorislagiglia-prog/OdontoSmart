using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class ConsultorioGuardarDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, MinimumLength = 2,
        ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    public string Nombre { get; set; } = null!;

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar una dirección válida.")]
    public int IdDireccion { get; set; }
}