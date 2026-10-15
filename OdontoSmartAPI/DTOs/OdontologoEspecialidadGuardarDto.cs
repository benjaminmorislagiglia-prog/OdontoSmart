using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class OdontologoEspecialidadGuardarDto
{
    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar un odontólogo válido.")]
    public int IdOdontologo { get; set; }

    [Range(1, int.MaxValue,
        ErrorMessage = "Debe indicar una especialidad válida.")]
    public int IdEspecialidad { get; set; }
}