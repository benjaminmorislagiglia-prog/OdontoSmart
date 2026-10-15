USE [OdontoSmartDB];
GO
-- Catálogo inicial utilizado por la agenda. Conserva los IDs y nombres existentes.
IF NOT EXISTS (SELECT 1 FROM dbo.EstadoTurno WHERE Nombre = 'Pendiente')
    INSERT dbo.EstadoTurno(Nombre) VALUES ('Pendiente');
IF NOT EXISTS (SELECT 1 FROM dbo.EstadoTurno WHERE Nombre = 'Confirmado')
    INSERT dbo.EstadoTurno(Nombre) VALUES ('Confirmado');
IF NOT EXISTS (SELECT 1 FROM dbo.EstadoTurno WHERE Nombre = 'Atendido')
    INSERT dbo.EstadoTurno(Nombre) VALUES ('Atendido');
IF NOT EXISTS (SELECT 1 FROM dbo.EstadoTurno WHERE Nombre = 'Cancelado')
    INSERT dbo.EstadoTurno(Nombre) VALUES ('Cancelado');
GO
