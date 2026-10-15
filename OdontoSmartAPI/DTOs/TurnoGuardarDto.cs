
using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs
{
    public class TurnoGuardarDto
    {
        [Required]
        public DateOnly? Fecha { get; set; }

        [Required]
        public TimeOnly? Hora { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int? IdPaciente { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int? IdOdontologo { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int? IdConsultorio { get; set; }
    }
}
