using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class ObraSocialPrestacion
{
    public int IdObraSocialPrestacion { get; set; }

    public int IdPrestacion { get; set; }

    public int IdObraSocial { get; set; }

    public decimal MontoCubierto { get; set; }

    public virtual ObraSocial IdObraSocialNavigation { get; set; } = null!;

    public virtual Prestacion IdPrestacionNavigation { get; set; } = null!;
}
