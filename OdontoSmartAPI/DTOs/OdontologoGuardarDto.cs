
using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;
using OdontoSmartAPI.Validation;

public class OdontologoGuardarDto
{
    [Required(ErrorMessage = "El horario de atención es obligatorio.")]
    [StringLength(50)]
    [RegularExpression(InputPatterns.Hours, ErrorMessage = "Usá un rango de horas válido, por ejemplo 09:00-17:00.")]
    public string HorarioAtencion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El día de atención es obligatorio.")]
    [StringLength(50)]
    [RegularExpression(InputPatterns.Days, ErrorMessage = "Indicá los días con letras, por ejemplo Lunes a viernes.")]
    public string DiaAtencion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El número de matrícula es obligatorio.")]
    [StringLength(50)]
    [RegularExpression(InputPatterns.Registration, ErrorMessage = "La matrícula admite letras, números y separadores: espacio, punto, guion o barra.")]
    public string NroMatricula { get; set; } = string.Empty;

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un empleado válido.")]
    public int IdEmpleado { get; set; }
}
