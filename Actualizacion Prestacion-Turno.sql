USE [OdontoSmartDB];
GO

-- 1. Agregar la fecha real del tratamiento
IF COL_LENGTH('dbo.PrestacionTurno', 'FechaRealizacion') IS NULL
BEGIN
    ALTER TABLE [dbo].[PrestacionTurno]
    ADD [FechaRealizacion] DATE NULL;
END;
GO

-- 2. Agregar el precio histórico del tratamiento
IF COL_LENGTH('dbo.PrestacionTurno', 'PrecioAplicado') IS NULL
BEGIN
    ALTER TABLE [dbo].[PrestacionTurno]
    ADD [PrecioAplicado] DECIMAL(18,2) NULL;
END;
GO

-- 3. Agregar los meses de garantía históricos
IF COL_LENGTH('dbo.PrestacionTurno', 'GarantiaMesesAplicada') IS NULL
BEGIN
    ALTER TABLE [dbo].[PrestacionTurno]
    ADD [GarantiaMesesAplicada] INT NULL;
END;
GO

-- 4. Impedir precios negativos
IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_PrestacionTurno_PrecioAplicado'
      AND parent_object_id = OBJECT_ID('dbo.PrestacionTurno')
)
BEGIN
    ALTER TABLE [dbo].[PrestacionTurno]
    ADD CONSTRAINT [CK_PrestacionTurno_PrecioAplicado]
    CHECK ([PrecioAplicado] >= 0);
END;
GO

-- 5. Impedir garantías negativas
IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_PrestacionTurno_GarantiaMesesAplicada'
      AND parent_object_id = OBJECT_ID('dbo.PrestacionTurno')
)
BEGIN
    ALTER TABLE [dbo].[PrestacionTurno]
    ADD CONSTRAINT [CK_PrestacionTurno_GarantiaMesesAplicada]
    CHECK ([GarantiaMesesAplicada] >= 0);
END;
GO

-- 6. Verificar que se agregaron correctamente
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME = 'PrestacionTurno'
ORDER BY ORDINAL_POSITION;
GO