using System.Text.RegularExpressions;
using ImageMagick;

namespace OdontoSmartAPI.Services;

public sealed class ProfilePhotoStore
{
    public const long MaxBytes = 5 * 1024 * 1024;
    public const long MaxRequestBytes = MaxBytes + 64 * 1024;
    private const string UrlPrefix = "/api/fotos-perfil/";
    private static readonly Regex FileNamePattern = new("\\A[a-f0-9]{32}\\.webp\\z", RegexOptions.CultureInvariant);
    private readonly string directory;
    private readonly ILogger<ProfilePhotoStore> logger;
    private readonly SemaphoreSlim processing = new(2, 2);

    public ProfilePhotoStore(IWebHostEnvironment environment, ILogger<ProfilePhotoStore> logger)
    {
        directory = Path.Combine(environment.ContentRootPath, "App_Data", "profile-photos");
        this.logger = logger;
        ResourceLimits.Width = 4096;
        ResourceLimits.Height = 4096;
        ResourceLimits.Memory = 128 * 1024 * 1024;
        ResourceLimits.Disk = 0;
        ResourceLimits.Thread = 2;
        ResourceLimits.Time = 15;
    }

    public string? ExistingPath(string name) => FileNamePattern.IsMatch(name) && File.Exists(Path.Combine(directory, name))
        ? Path.Combine(directory, name) : null;

    public async Task<string> ReplaceAsync(IFormFile file, string? previous, Func<string, Task> save, CancellationToken ct)
    {
        var url = await StoreAsync(file, ct);
        try { await save(url); }
        catch { Delete(url); throw; }
        if (previous != url) Delete(previous);
        return url;
    }

    private async Task<string> StoreAsync(IFormFile file, CancellationToken ct)
    {
        if (file.Length <= 0 || file.Length > MaxBytes)
            throw new ArgumentException("La foto debe contener una imagen y pesar como máximo 5 MB.");
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var mime = file.ContentType.ToLowerInvariant();
        var format = extension switch
        {
            ".jpg" or ".jpeg" when mime == "image/jpeg" => MagickFormat.Jpeg,
            ".png" when mime == "image/png" => MagickFormat.Png,
            ".webp" when mime == "image/webp" => MagickFormat.WebP,
            _ => throw new ArgumentException("Usá una imagen JPG, JPEG, PNG o WebP con su tipo de archivo correcto.")
        };
        using var input = new MemoryStream();
        await file.CopyToAsync(input, ct);
        var bytes = input.ToArray();
        if (bytes.Length > MaxBytes) throw new ArgumentException("La foto no puede superar los 5 MB.");
        var headerMatches = format switch
        {
            MagickFormat.Jpeg => bytes.Length >= 3 && bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff,
            MagickFormat.Png => bytes.AsSpan().StartsWith(new byte[] {137,80,78,71,13,10,26,10}),
            MagickFormat.WebP => bytes.Length >= 12 && bytes.AsSpan(0,4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8,4).SequenceEqual("WEBP"u8),
            _ => false
        };
        if (!headerMatches) throw new ArgumentException("El contenido del archivo no corresponde a la imagen indicada.");

        await processing.WaitAsync(ct);
        byte[] normalized;
        try
        {
            // Sólo se invocan decodificadores raster conocidos sobre bytes, nunca rutas suministradas por el cliente.
            var settings = new MagickReadSettings { Format = format, FrameIndex = 0, FrameCount = 1 };
            using var image = new MagickImage();
            var damaged = false;
            image.Warning += (_, _) => damaged = true;
            image.Read(bytes, settings);
            if (damaged || image.Width == 0 || image.Height == 0 || image.Width > 4096 || image.Height > 4096)
                throw new ArgumentException("La imagen está dañada o supera los 4096 píxeles por lado.");
            image.AutoOrient();
            image.Thumbnail(512, 512);
            image.Strip();
            image.Quality = 85;
            normalized = image.ToByteArray(MagickFormat.WebP);
        }
        catch (MagickException)
        {
            throw new ArgumentException("No se pudo leer la imagen. Usá una foto válida de hasta 4096 píxeles por lado.");
        }
        finally { processing.Release(); }

        Directory.CreateDirectory(directory);
        var name = Guid.NewGuid().ToString("N") + ".webp";
        var url = UrlPrefix + name;
        var created = false;
        try
        {
            await using var output = new FileStream(Path.Combine(directory, name), FileMode.CreateNew, FileAccess.Write, FileShare.None);
            created = true;
            await output.WriteAsync(normalized, ct);
        }
        catch { if (created) Delete(url); throw; }
        return url;
    }

    private void Delete(string? url)
    {
        if (url == null || !url.StartsWith(UrlPrefix, StringComparison.Ordinal)) return;
        var name = url[UrlPrefix.Length..];
        if (!FileNamePattern.IsMatch(name)) return;
        try { File.Delete(Path.Combine(directory, name)); }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        { logger.LogWarning(ex, "No se pudo retirar una foto de perfil reemplazada."); }
    }
}
