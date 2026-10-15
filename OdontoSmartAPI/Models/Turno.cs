using System;
using System.Collections.Generic;

namespace OdontoSmartAPI.Models;

public partial class Turno
{
    public int IdTurno { get; set; }

    public DateOnly Fecha { get; set; }

    public TimeOnly Hora { get; set; }

    public int IdPaciente { get; set; }

    public int IdOdontologo { get; set; }

    public int IdConsultorio { get; set; }

    public virtual ICollection<HistorialClinico> HistorialClinicos { get; set; } = new List<HistorialClinico>();

    public virtual ICollection<HistorialEstadoTurno> HistorialEstadoTurnos { get; set; } = new List<HistorialEstadoTurno>();

    public virtual Consultorio IdConsultorioNavigation { get; set; } = null!;

    public virtual Odontologo IdOdontologoNavigation { get; set; } = null!;

    public virtual Paciente IdPacienteNavigation { get; set; } = null!;

    public virtual ICollection<PrestacionTurno> PrestacionTurnos { get; set; } = new List<PrestacionTurno>();

    public virtual ICollection<TurnoInsumo> TurnoInsumos { get; set; } = new List<TurnoInsumo>();
}
