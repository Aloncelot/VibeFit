-- Recuperación de contraseña: un enlace de un solo uso por solicitud.
-- Solo se guarda el hash SHA-256 del token; el token real viaja únicamente en el correo.
-- Se puede ejecutar varias veces. Ejecutar con:  npm run db:migrar

IF OBJECT_ID('dbo.Recuperaciones_Password', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Recuperaciones_Password (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NOT NULL
      CONSTRAINT FK_Recuperaciones_Cliente REFERENCES dbo.Clientes(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL,
    expira_en DATETIME2 NOT NULL,
    usado_en DATETIME2 NULL,
    creado_en DATETIME2 NOT NULL CONSTRAINT DF_Recuperaciones_creado DEFAULT SYSUTCDATETIME()
  );
  CREATE UNIQUE INDEX UX_Recuperaciones_token ON dbo.Recuperaciones_Password(token_hash);
  CREATE INDEX IX_Recuperaciones_cliente ON dbo.Recuperaciones_Password(cliente_id);
END
GO
