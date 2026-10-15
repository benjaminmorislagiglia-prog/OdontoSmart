using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class EstadoTurno
{
    public int IdEstadoTurno { get; set; }

    public string Nombre { get; set; } = null!;

    public virtual ICollection<HistorialEstadoTurno> HistorialEstadoTurnos { get; set; } = new List<HistorialEstadoTurno>();
}
