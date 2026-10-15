using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class HistorialClinicoAnularDto
{
    [Required(ErrorMessage = "Debe indicar el motivo de anulación.")]
    [StringLength(300)]
    public string Motivo { get; set; } = string.Empty;
}
