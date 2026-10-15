using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class HistorialClinico
{
    public int IdHistorialClinico { get; set; }

    public int IdPaciente { get; set; }

    public int IdTurno { get; set; }

    public string? Diagnostico { get; set; }

    public string? TratamientosRealizados { get; set; }

    public string? Observaciones { get; set; }

    public bool Anulado { get; set; }

    public string? MotivoAnulacion { get; set; }

    public DateTime? FechaAnulacion { get; set; }

    public virtual Paciente IdPacienteNavigation { get; set; } = null!;

    public virtual Turno IdTurnoNavigation { get; set; } = null!;
}
