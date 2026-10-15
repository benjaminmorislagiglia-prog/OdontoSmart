namespace OdontoSmartAPI.DTOs;

public class HistorialEstadoTurnoDto
{
    public int IdHistorialEstadoTurno { get; set; }

    public int IdTurno { get; set; }

    public int IdEstadoTurno { get; set; }

    public DateTime FechaHora { get; set; }
}