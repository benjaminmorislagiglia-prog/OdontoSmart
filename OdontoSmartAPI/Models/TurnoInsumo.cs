using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class TurnoInsumo
{
    public int IdTurnoInsumo { get; set; }

    public int IdInsumo { get; set; }

    public int IdTurno { get; set; }

    public int Cantidad { get; set; }

    public virtual Insumo IdInsumoNavigation { get; set; } = null!;

    public virtual Turno IdTurnoNavigation { get; set; } = null!;
}
