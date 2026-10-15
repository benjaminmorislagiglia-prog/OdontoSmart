using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class InsumoGuardarDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, MinimumLength = 2)]
    public string Nombre { get; set; } = null!;

    [StringLength(255)]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "La unidad de medida es obligatoria.")]
    [StringLength(50, MinimumLength = 1)]
    public string UnidadMedida { get; set; } = null!;

    [Range(0, int.MaxValue,
        ErrorMessage = "El stock no puede ser negativo.")]
    public int StockActual { get; set; }

    public DateOnly? FechaVencimiento { get; set; }
}
