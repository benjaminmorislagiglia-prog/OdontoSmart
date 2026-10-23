USE [OdontoSmartDB];
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF COL_LENGTH('dbo.Paciente', 'FotoUrl') IS NULL
    ALTER TABLE dbo.Paciente ADD FotoUrl varchar(200) NULL;
IF COL_LENGTH('dbo.Empleado', 'FotoUrl') IS NULL
    ALTER TABLE dbo.Empleado ADD FotoUrl varchar(200) NULL;
COMMIT TRANSACTION;
GO
