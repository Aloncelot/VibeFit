-- Este script debe ser ejecutado en la base de datos SQL (TestimoniosDB1) desde Azure Portal o SSMS.

CREATE TABLE HistorialPrecios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sku_id INT NOT NULL,
    tipo_precio NVARCHAR(50) NOT NULL, -- 'precio_proveedor' o 'precio_venta'
    precio_anterior DECIMAL(18,2) NOT NULL,
    precio_nuevo DECIMAL(18,2) NOT NULL,
    fecha_cambio DATETIME DEFAULT GETDATE(),
    -- Clave foránea para asegurar que el sku exista
    CONSTRAINT FK_HistorialPrecios_SKUs FOREIGN KEY (sku_id) REFERENCES SKUs(id)
);
