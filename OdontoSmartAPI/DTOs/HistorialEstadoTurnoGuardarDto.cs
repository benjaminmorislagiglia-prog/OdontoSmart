using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class HistorialEstadoTurnoGuardarDto
{
    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un turno válido.")]
    public int IdTurno { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un estado de turno válido.")]
    public int IdEstadoTurno { get; set; }
}