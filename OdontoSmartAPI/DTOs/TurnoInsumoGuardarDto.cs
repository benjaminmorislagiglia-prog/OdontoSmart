using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class TurnoInsumoGuardarDto
{
    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un turno válido.")]
    public int IdTurno { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un insumo válido.")]
    public int IdInsumo { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "La cantidad debe ser mayor que cero.")]
    public int Cantidad { get; set; }
}