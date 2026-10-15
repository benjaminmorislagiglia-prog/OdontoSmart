using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class PrestacionTurno
{
    public int IdPrestacionTurno { get; set; }

    public int IdTurno { get; set; }

    public int IdPrestacion { get; set; }
    public DateOnly? FechaRealizacion { get; set; }
    public decimal? PrecioAplicado { get; set; }
    public int? GarantiaMesesAplicada { get; set; }

    public virtual Prestacion IdPrestacionNavigation { get; set; } = null!;

    public virtual Turno IdTurnoNavigation { get; set; } = null!;
}
