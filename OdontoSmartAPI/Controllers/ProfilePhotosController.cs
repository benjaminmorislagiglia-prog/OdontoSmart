using Microsoft.AspNetCore.Mvc;
using OdontoSmartAPI.Services;

namespace OdontoSmartAPI.Controllers;

[ApiController]
[Route("api/fotos-perfil")]
public class ProfilePhotosController(ProfilePhotoStore photos) : ControllerBase
{
    [HttpGet("{name}")]
    public IActionResult GetPhoto(string name)
    {
        var path = photos.ExistingPath(name);
        if (path == null) return NotFound();
        Response.Headers.XContentTypeOptions = "nosniff";
        Response.Headers.CacheControl = "private, max-age=3600";
        return PhysicalFile(path, "image/webp");
    }
}
