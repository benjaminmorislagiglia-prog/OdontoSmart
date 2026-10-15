using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Equipamiento
{
    public int IdEquipamiento { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Marca { get; set; }

    public string? Modelo { get; set; }

    public string? NroSerie { get; set; }

    public DateOnly? FechaAdquisicion { get; set; }

    public int IdConsultorio { get; set; }

    public virtual Consultorio IdConsultorioNavigation { get; set; } = null!;
}
