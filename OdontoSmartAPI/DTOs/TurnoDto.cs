namespace OdontoSmartAPI.DTOs;
public class TurnoDto
{
    public int IdTurno { get; set; }
    public DateOnly Fecha { get; set; }
    public TimeOnly Hora { get; set; }
    public int IdPaciente { get; set; }
    public int IdOdontologo { get; set; }
    public int IdConsultorio { get; set; }
    public string Paciente { get; set; } = "";
    public string Odontologo { get; set; } = "";
    public string Consultorio { get; set; } = "";
    public int? IdEstadoTurno { get; set; }
    public string? Estado { get; set; }
}
