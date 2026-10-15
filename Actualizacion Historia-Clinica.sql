USE [OdontoSmartDB];
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Conserva todas las historias y sus relaciones. Se puede ejecutar nuevamente.
IF COL_LENGTH('dbo.HistorialClinico', 'Anulado') IS NULL
    ALTER TABLE dbo.HistorialClinico ADD Anulado bit NOT NULL
        CONSTRAINT DF_HistorialClinico_Anulado DEFAULT (0) WITH VALUES;
IF COL_LENGTH('dbo.HistorialClinico', 'MotivoAnulacion') IS NULL
    ALTER TABLE dbo.HistorialClinico ADD MotivoAnulacion nvarchar(300) NULL;
IF COL_LENGTH('dbo.HistorialClinico', 'FechaAnulacion') IS NULL
    ALTER TABLE dbo.HistorialClinico ADD FechaAnulacion datetime2(7) NULL;

-- La fecha se almacena en UTC. Una anulación exige fecha y motivo no vacío.
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.HistorialClinico')
      AND name = 'CK_HistorialClinico_Anulacion')
    EXEC(N'ALTER TABLE dbo.HistorialClinico WITH CHECK ADD CONSTRAINT CK_HistorialClinico_Anulacion CHECK (
        (Anulado = 0 AND MotivoAnulacion IS NULL AND FechaAnulacion IS NULL)
        OR (Anulado = 1 AND MotivoAnulacion IS NOT NULL
            AND LEN(LTRIM(RTRIM(MotivoAnulacion))) > 0 AND FechaAnulacion IS NOT NULL)
    )');

COMMIT TRANSACTION;
GO
