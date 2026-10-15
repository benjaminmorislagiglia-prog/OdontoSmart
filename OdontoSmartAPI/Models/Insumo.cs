using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Insumo
{
    public int IdInsumo { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Descripcion { get; set; }

    public string UnidadMedida { get; set; } = null!;

    public int StockActual { get; set; }

    public DateOnly? FechaVencimiento { get; set; }

    public virtual ICollection<TurnoInsumo> TurnoInsumos { get; set; } = new List<TurnoInsumo>();
}
