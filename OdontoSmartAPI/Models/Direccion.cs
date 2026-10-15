using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Direccion
{
    public int IdDireccion { get; set; }

    public string Calle { get; set; } = null!;

    public int Numero { get; set; }

    public string? Barrio { get; set; }

    public string Cp { get; set; } = null!;

    public int IdLocalidad { get; set; }

    public virtual ICollection<Consultorio> Consultorios { get; set; } = new List<Consultorio>();

    public virtual ICollection<Empleado> Empleados { get; set; } = new List<Empleado>();

    public virtual Localidad IdLocalidadNavigation { get; set; } = null!;

    public virtual ICollection<Paciente> Pacientes { get; set; } = new List<Paciente>();
}
