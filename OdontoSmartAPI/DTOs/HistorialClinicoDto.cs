namespace OdontoSmartAPI.DTOs;

public class HistorialClinicoDto
{
    public int IdHistorialClinico { get; set; }

    public int IdPaciente { get; set; }

    public int IdTurno { get; set; }

    public string? Diagnostico { get; set; }

    public string? TratamientosRealizados { get; set; }

    public string? Observaciones { get; set; }
}