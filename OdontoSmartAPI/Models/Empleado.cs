using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Empleado
{
    public int IdEmpleado { get; set; }

    public string Dni { get; set; } = null!;

    public string Nombre { get; set; } = null!;

    public string Apellido { get; set; } = null!;

    public string? Telefono { get; set; }

    public int? IdDireccion { get; set; }

    public string? Correo { get; set; }
    public string? FotoUrl { get; set; }

    public int IdPuesto { get; set; }

    public bool? Activo { get; set; }

    public virtual Direccion? IdDireccionNavigation { get; set; }

    public virtual Puesto IdPuestoNavigation { get; set; } = null!;

    public virtual Odontologo? Odontologo { get; set; }
}
