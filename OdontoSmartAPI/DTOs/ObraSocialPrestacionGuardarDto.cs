using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class ObraSocialPrestacionGuardarDto
{
    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar una obra social válida.")]
    public int IdObraSocial { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar una prestación válida.")]
    public int IdPrestacion { get; set; }

    [Range(typeof(decimal), "0", "99999999.99",
        ParseLimitsInInvariantCulture = true,
        ErrorMessage = "El monto cubierto no puede ser negativo.")]
    public decimal MontoCubierto { get; set; }
}
