using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class OdontologoEspecialidad
{
    public int IdOdontologoEspecialidad { get; set; }

    public int IdEspecialidad { get; set; }

    public int IdOdontologo { get; set; }

    public virtual Especialidad IdEspecialidadNavigation { get; set; } = null!;

    public virtual Odontologo IdOdontologoNavigation { get; set; } = null!;
}
