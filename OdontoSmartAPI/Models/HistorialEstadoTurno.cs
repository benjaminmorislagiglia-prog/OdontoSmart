using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class HistorialEstadoTurno
{
    public int IdHistorialEstadoTurno { get; set; }

    public int IdTurno { get; set; }

    public int IdEstadoTurno { get; set; }

    public DateTime FechaHora { get; set; }

    public virtual EstadoTurno IdEstadoTurnoNavigation { get; set; } = null!;

    public virtual Turno IdTurnoNavigation { get; set; } = null!;
}
