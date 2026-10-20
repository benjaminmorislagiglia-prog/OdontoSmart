namespace OdontoSmartAPI.Validation;

public static class InputPatterns
{
    public const string Dni = @"[0-9]{1,20}";
    public const string PersonName = @"(?=.*\p{L})[\p{L}\p{M} .'’-]+";
    public const string Phone = @"(?=.*[0-9])[+]?[0-9() .-]+";
    public const string PostalCode = @"(?=.*[0-9])[A-Za-z0-9]{4,10}";
    public const string Registration = @"[A-Za-z0-9]+(?:[ ./\-][A-Za-z0-9]+)*";
    public const string Days = @"(?=.*\p{L})[\p{L}\p{M} ,/.\-]+";
    public const string Hours = @"(?:[01][0-9]|2[0-3]):[0-5][0-9]\s*(?:-|a)\s*(?:[01][0-9]|2[0-3]):[0-5][0-9]";
}
