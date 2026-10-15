namespace OdontoSmartAPI.DTOs;

public class PrestacionDto
{
    public int IdPrestacion { get; set; }

    public string Nombre { get; set; } = null!;

    public decimal Precio { get; set; }

    public int PlazoGarantiaMeses { get; set; }
}