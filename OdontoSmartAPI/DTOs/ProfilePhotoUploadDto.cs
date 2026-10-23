using System.ComponentModel.DataAnnotations;

namespace OdontoSmartAPI.DTOs;

public class ProfilePhotoUploadDto
{
    [Required(ErrorMessage = "Seleccioná una foto.")]
    public IFormFile Archivo { get; set; } = null!;
}
