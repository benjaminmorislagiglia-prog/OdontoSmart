using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Odontologo
{
    public int IdOdontologo { get; set; }

    public string HorarioAtencion { get; set; } = null!;

    public string DiaAtencion { get; set; } = null!;

    public string NroMatricula { get; set; } = null!;

    public bool Activo { get; set; }

    public int IdEmpleado { get; set; }

    public virtual Empleado IdEmpleadoNavigation { get; set; } = null!;

    public virtual ICollection<OdontologoEspecialidad> OdontologoEspecialidads { get; set; } = new List<OdontologoEspecialidad>();

    public virtual ICollection<Turno> Turnos { get; set; } = new List<Turno>();


}
