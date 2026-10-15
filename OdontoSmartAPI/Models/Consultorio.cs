    using System;
    using System.Collections.Generic;

    namespace OdontoSmartAPI.Models;

    public partial class Consultorio
    {
        public int IdConsultorio { get; set; }

        public string Nombre { get; set; } = null!;

        public int IdDireccion { get; set; }

        public virtual ICollection<Equipamiento> Equipamientos { get; set; } = new List<Equipamiento>();

        public virtual Direccion IdDireccionNavigation { get; set; } = null!;

        public virtual ICollection<Turno> Turnos { get; set; } = new List<Turno>();
    }
