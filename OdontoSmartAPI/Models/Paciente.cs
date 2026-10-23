using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Paciente
{
    public int IdPaciente { get; set; }

    public string Dni { get; set; } = null!;

    public string Nombre { get; set; } = null!;

    public string Apellido { get; set; } = null!;

    public string? Telefono { get; set; }

    public string? Correo { get; set; }
    public string? FotoUrl { get; set; }

    public DateOnly FechaNacimiento { get; set; }

    public bool? Activo { get; set; }

    public int? IdObraSocial { get; set; }

    public int IdDireccion { get; set; }

    public virtual ICollection<HistorialClinico> HistorialClinicos { get; set; } = new List<HistorialClinico>();

    public virtual Direccion IdDireccionNavigation { get; set; } = null!;

    public virtual ObraSocial? IdObraSocialNavigation { get; set; }

    public virtual ICollection<Turno> Turnos { get; set; } = new List<Turno>();
}
