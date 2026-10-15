using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class HistorialClinicoGuardarDto
{
    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un paciente válido.")]
    public int IdPaciente { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un turno válido.")]
    public int IdTurno { get; set; }

    [StringLength(500)]
    public string? Diagnostico { get; set; }

    [StringLength(500)]
    public string? TratamientosRealizados { get; set; }

    [StringLength(500)]
    public string? Observaciones { get; set; }
}
