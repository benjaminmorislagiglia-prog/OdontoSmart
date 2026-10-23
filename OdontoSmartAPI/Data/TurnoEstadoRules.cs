namespace OdontoSmartAPI.Data;

public static class TurnoEstadoRules
{
    public static string? Validar(string? actual, string nuevo, DateOnly fecha, TimeOnly hora, DateTime ahora)
    {
        if (actual == nuevo) return "El turno ya tiene ese estado como último estado registrado.";

        var permitida = actual switch
        {
            "Pendiente" => nuevo is "Confirmado" or "Cancelado" or "Ausente",
            "Confirmado" => nuevo is "Atendido" or "Cancelado" or "Ausente",
            _ => false
        };
        if (!permitida)
            return actual == null
                ? "El turno no tiene un estado registrado. No se puede realizar el cambio."
                : $"No se puede cambiar un turno {actual} a {nuevo}.";

        // La agenda almacena fecha/hora locales sin offset, igual que DateTime.Now en el historial.
        if (nuevo == "Ausente" && fecha.ToDateTime(hora) > ahora)
            return "No se puede marcar como ausente un turno que todavía no ocurrió.";

        return null;
    }
}
