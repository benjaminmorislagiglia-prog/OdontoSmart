namespace OdontoSmartAPI.DTOs;

public class DireccionDto
{
    public int IdDireccion { get; set; }

    public string Calle { get; set; } = null!;

    public int Numero { get; set; }

    public string? Barrio { get; set; }

    public string Cp { get; set; } = null!;

    public int IdLocalidad { get; set; }
}