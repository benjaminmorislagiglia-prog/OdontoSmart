USE [OdontoSmartDB];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM dbo.ObraSocial WHERE Nombre = N'Apross')
        INSERT dbo.ObraSocial(Nombre) VALUES (N'Apross');
    IF NOT EXISTS (SELECT 1 FROM dbo.ObraSocial WHERE Nombre = N'OSSOELSAC')
        INSERT dbo.ObraSocial(Nombre) VALUES (N'OSSOELSAC');

    DECLARE @Apross int = (SELECT IdObraSocial FROM dbo.ObraSocial WHERE Nombre = N'Apross');
    DECLARE @Ossoelsac int = (SELECT IdObraSocial FROM dbo.ObraSocial WHERE Nombre = N'OSSOELSAC');
    DECLARE @Anteriores TABLE(Id int PRIMARY KEY, Reemplazo int NOT NULL);
    INSERT @Anteriores(Id, Reemplazo)
    SELECT IdObraSocial, CASE WHEN Nombre = N'Salud Integral Centro (ficticia)' THEN @Ossoelsac ELSE @Apross END
    FROM dbo.ObraSocial
    WHERE Nombre IN (N'Cobertura Dental Norte (ficticia)', N'Salud Integral Centro (ficticia)', N'Plan Odontológico Sur (ficticio)');

    -- Las prestaciones y sus importes requieren una definición de cobertura de la clínica.
    IF EXISTS (SELECT 1 FROM dbo.ObraSocialPrestacion p JOIN @Anteriores a ON a.Id = p.IdObraSocial)
        THROW 51000, 'Hay prestaciones asociadas a coberturas ficticias. Revisar antes de reemplazarlas.', 1;

    UPDATE p SET IdObraSocial = a.Reemplazo
    FROM dbo.Paciente p JOIN @Anteriores a ON a.Id = p.IdObraSocial;

    DELETE o FROM dbo.ObraSocial o JOIN @Anteriores a ON a.Id = o.IdObraSocial;

    COMMIT TRANSACTION;
    SELECT IdObraSocial, Nombre FROM dbo.ObraSocial ORDER BY Nombre;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
