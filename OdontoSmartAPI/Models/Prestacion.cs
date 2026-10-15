using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Prestacion
{
    public int IdPrestacion { get; set; }

    public string Nombre { get; set; } = null!;

    public decimal Precio { get; set; }

    public int PlazoGarantiaMeses { get; set; }

    public virtual ICollection<ObraSocialPrestacion> ObraSocialPrestacions { get; set; } = new List<ObraSocialPrestacion>();

    public virtual ICollection<PrestacionTurno> PrestacionTurnos { get; set; } = new List<PrestacionTurno>();
}
