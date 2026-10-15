using System.ComponentModel.DataAnnotations;
namespace OdontoSmartAPI.DTOs;
public class PrestacionTurnoGuardarDto
{
    [Range(1, int.MaxValue)] public int IdTurno { get; set; }
    [Range(1, int.MaxValue)] public int IdPrestacion { get; set; }
    public DateOnly? FechaRealizacion { get; set; }
    [Range(typeof(decimal), "0", "9999999999999999.99", ParseLimitsInInvariantCulture = true)] public decimal? PrecioAplicado { get; set; }
    [Range(0, int.MaxValue)] public int? GarantiaMesesAplicada { get; set; }
}
