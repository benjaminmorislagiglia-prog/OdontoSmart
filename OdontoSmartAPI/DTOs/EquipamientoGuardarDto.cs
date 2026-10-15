using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class EquipamientoGuardarDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, MinimumLength = 2)]
    public string Nombre { get; set; } = null!;

    [StringLength(100)]
    public string? Marca { get; set; }

    [StringLength(100)]
    public string? Modelo { get; set; }

    [StringLength(100)]
    public string? NroSerie { get; set; }

    public DateOnly? FechaAdquisicion { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un consultorio válido.")]
    public int IdConsultorio { get; set; }
}