namespace OdontoSmartAPI.DTOs;

public class InsumoDto
{
    public int IdInsumo { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Descripcion { get; set; }

    public string UnidadMedida { get; set; } = null!;

    public int StockActual { get; set; }

    public DateOnly? FechaVencimiento { get; set; }
}