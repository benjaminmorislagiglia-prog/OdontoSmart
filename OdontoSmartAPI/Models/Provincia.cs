using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Provincia
{
    public int IdProvincia { get; set; }

    public string Nombre { get; set; } = null!;

    public string Pais { get; set; } = null!;

    public virtual ICollection<Localidad> Localidads { get; set; } = new List<Localidad>();
}
