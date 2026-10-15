namespace OdontoSmartAPI.DTOs;
public class PrestacionTurnoDto
{
    public int IdPrestacionTurno { get; set; }
    public int IdTurno { get; set; }
    public int IdPrestacion { get; set; }
    public DateOnly? FechaRealizacion { get; set; }
    public decimal? PrecioAplicado { get; set; }
    public int? GarantiaMesesAplicada { get; set; }
}
