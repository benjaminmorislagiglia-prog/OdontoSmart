using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Especialidad
{
    public int IdEspecialidad { get; set; }

    public string Nombre { get; set; } = null!;

    public virtual ICollection<OdontologoEspecialidad> OdontologoEspecialidads { get; set; } = new List<OdontologoEspecialidad>();
}
