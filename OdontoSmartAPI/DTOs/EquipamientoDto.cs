namespace OdontoSmartAPI.DTOs;

public class EquipamientoDto
{
    public int IdEquipamiento { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Marca { get; set; }

    public string? Modelo { get; set; }

    public string? NroSerie { get; set; }

    public DateOnly? FechaAdquisicion { get; set; }

    public int IdConsultorio { get; set; }
}