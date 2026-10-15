
using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class OdontologoGuardarDto
{
    [Required(ErrorMessage = "El horario de atención es obligatorio.")]
    [StringLength(50)]
    public string HorarioAtencion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El día de atención es obligatorio.")]
    [StringLength(50)]
    public string DiaAtencion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El número de matrícula es obligatorio.")]
    [StringLength(50)]
    public string NroMatricula { get; set; } = string.Empty;

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un empleado válido.")]
    public int IdEmpleado { get; set; }
}
