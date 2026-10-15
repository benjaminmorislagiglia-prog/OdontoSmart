using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class ObraSocial
{
    public int IdObraSocial { get; set; }

    public string Nombre { get; set; } = null!;

    public virtual ICollection<ObraSocialPrestacion> ObraSocialPrestacions { get; set; } = new List<ObraSocialPrestacion>();

    public virtual ICollection<Paciente> Pacientes { get; set; } = new List<Paciente>();
}
