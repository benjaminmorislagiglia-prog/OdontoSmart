
namespace OdontoSmartAPI.DTOs;

public class OdontologoDto
{
    public int IdOdontologo { get; set; }

    public string HorarioAtencion { get; set; } = string.Empty;

    public string DiaAtencion { get; set; } = string.Empty;

    public string NroMatricula { get; set; } = string.Empty;

    public int IdEmpleado { get; set; }

    public bool Activo { get; set; }
}
