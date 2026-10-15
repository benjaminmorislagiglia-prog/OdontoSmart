using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Localidad
{
    public int IdLocalidad { get; set; }

    public string Nombre { get; set; } = null!;

    public int IdProvincia { get; set; }

    public virtual ICollection<Direccion> Direccions { get; set; } = new List<Direccion>();

    public virtual Provincia IdProvinciaNavigation { get; set; } = null!;
}
