-- Clientes de la tienda, sus listas (carrito, guardados, favoritos), solicitudes, reseñas,
-- alertas de reabastecimiento, notificaciones y eventos para planeación de demanda.
-- Se puede ejecutar varias veces: cada objeto se crea solo si no existe.
-- Ejecutar con:  npm run db:migrar

IF OBJECT_ID('dbo.Clientes', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Clientes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(80) NOT NULL,
    email NVARCHAR(254) NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    creado_en DATETIME2 NOT NULL CONSTRAINT DF_Clientes_creado DEFAULT SYSUTCDATETIME()
  );
  CREATE UNIQUE INDEX UX_Clientes_email ON dbo.Clientes(email);
END
GO

-- Una fila por cliente + SKU + lista. CARRITO = carrito guardado entre dispositivos.
IF OBJECT_ID('dbo.Clientes_Listas', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Clientes_Listas (
    cliente_id INT NOT NULL CONSTRAINT FK_Listas_Cliente REFERENCES dbo.Clientes(id) ON DELETE CASCADE,
    sku_id INT NOT NULL CONSTRAINT FK_Listas_SKU REFERENCES dbo.SKUs(id),
    lista VARCHAR(12) NOT NULL CONSTRAINT CK_Listas_lista CHECK (lista IN ('CARRITO', 'GUARDADO', 'FAVORITO')),
    cantidad INT NOT NULL CONSTRAINT DF_Listas_cantidad DEFAULT 1,
    agregado_en DATETIME2 NOT NULL CONSTRAINT DF_Listas_agregado DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Clientes_Listas PRIMARY KEY (cliente_id, sku_id, lista)
  );
  CREATE INDEX IX_Listas_sku ON dbo.Clientes_Listas(sku_id, lista);
END
GO

-- "Avísame cuando vuelva". notificada_en se llena cuando el SKU vuelve a tener stock.
IF OBJECT_ID('dbo.Alertas_Restock', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Alertas_Restock (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NOT NULL CONSTRAINT FK_Alertas_Cliente REFERENCES dbo.Clientes(id) ON DELETE CASCADE,
    sku_id INT NOT NULL CONSTRAINT FK_Alertas_SKU REFERENCES dbo.SKUs(id),
    creada_en DATETIME2 NOT NULL CONSTRAINT DF_Alertas_creada DEFAULT SYSUTCDATETIME(),
    notificada_en DATETIME2 NULL
  );
  -- Un cliente solo puede tener una alerta pendiente por SKU.
  CREATE UNIQUE INDEX UX_Alertas_pendiente ON dbo.Alertas_Restock(cliente_id, sku_id) WHERE notificada_en IS NULL;
  CREATE INDEX IX_Alertas_sku ON dbo.Alertas_Restock(sku_id) WHERE notificada_en IS NULL;
END
GO

IF OBJECT_ID('dbo.Notificaciones', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Notificaciones (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NOT NULL CONSTRAINT FK_Notif_Cliente REFERENCES dbo.Clientes(id) ON DELETE CASCADE,
    sku_id INT NULL CONSTRAINT FK_Notif_SKU REFERENCES dbo.SKUs(id),
    mensaje NVARCHAR(300) NOT NULL,
    leida BIT NOT NULL CONSTRAINT DF_Notif_leida DEFAULT 0,
    creada_en DATETIME2 NOT NULL CONSTRAINT DF_Notif_creada DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_Notif_cliente ON dbo.Notificaciones(cliente_id, leida);
END
GO

-- Historial de señales de demanda (solo se consulta desde el panel admin).
-- tipo: ALERTA_RESTOCK, FAVORITO, GUARDADO, CARRITO_SIN_STOCK, VENTA_PERDIDA
IF OBJECT_ID('dbo.Eventos_Demanda', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Eventos_Demanda (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    sku_id INT NOT NULL CONSTRAINT FK_Demanda_SKU REFERENCES dbo.SKUs(id),
    cliente_id INT NULL CONSTRAINT FK_Demanda_Cliente REFERENCES dbo.Clientes(id) ON DELETE SET NULL,
    tipo VARCHAR(20) NOT NULL,
    cantidad INT NOT NULL CONSTRAINT DF_Demanda_cantidad DEFAULT 1,
    fecha DATETIME2 NOT NULL CONSTRAINT DF_Demanda_fecha DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_Demanda_sku_fecha ON dbo.Eventos_Demanda(sku_id, fecha) INCLUDE (tipo, cantidad);
END
GO

-- Productos que los clientes piden y no encuentran en la tienda.
IF OBJECT_ID('dbo.Solicitudes_Producto', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Solicitudes_Producto (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NULL CONSTRAINT FK_Solicitud_Cliente REFERENCES dbo.Clientes(id) ON DELETE SET NULL,
    email NVARCHAR(254) NULL,
    seccion VARCHAR(20) NOT NULL,
    producto NVARCHAR(120) NOT NULL,
    marca NVARCHAR(80) NULL,
    detalle NVARCHAR(400) NULL,
    estado VARCHAR(12) NOT NULL CONSTRAINT DF_Solicitud_estado DEFAULT 'NUEVA'
      CONSTRAINT CK_Solicitud_estado CHECK (estado IN ('NUEVA', 'REVISADA', 'ATENDIDA', 'DESCARTADA')),
    creada_en DATETIME2 NOT NULL CONSTRAINT DF_Solicitud_creada DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_Solicitud_estado ON dbo.Solicitudes_Producto(estado, creada_en);
END
GO

-- Reseñas de la tienda: una por cuenta, de 1 a 5 estrellas. El admin puede ocultarlas.
IF OBJECT_ID('dbo.Resenas', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Resenas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NOT NULL CONSTRAINT FK_Resena_Cliente REFERENCES dbo.Clientes(id) ON DELETE CASCADE,
    calificacion TINYINT NOT NULL CONSTRAINT CK_Resena_calificacion CHECK (calificacion BETWEEN 1 AND 5),
    comentario NVARCHAR(600) NOT NULL,
    visible BIT NOT NULL CONSTRAINT DF_Resena_visible DEFAULT 1,
    creada_en DATETIME2 NOT NULL CONSTRAINT DF_Resena_creada DEFAULT SYSUTCDATETIME(),
    actualizada_en DATETIME2 NULL
  );
  CREATE UNIQUE INDEX UX_Resena_cliente ON dbo.Resenas(cliente_id);
END
GO
