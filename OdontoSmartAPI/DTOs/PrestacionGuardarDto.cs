using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class PrestacionGuardarDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, MinimumLength = 2,
        ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    public string Nombre { get; set; } = null!;

    [Range(typeof(decimal), "0", "99999999.99",
        ParseLimitsInInvariantCulture = true,
        ErrorMessage = "El precio debe ser mayor o igual a cero.")]
    public decimal Precio { get; set; }

    [Range(0, int.MaxValue,
        ErrorMessage = "El plazo de garantía no puede ser negativo.")]
    public int PlazoGarantiaMeses { get; set; }
}
