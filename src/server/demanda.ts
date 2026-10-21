import 'server-only';
import { getPool, sql } from '@/server/db';

export type TipoDemanda = 'ALERTA_RESTOCK' | 'FAVORITO' | 'GUARDADO' | 'CARRITO_SIN_STOCK' | 'VENTA_PERDIDA';

type Requester = { request(): sql.Request };

/**
 * Registra una señal de demanda (solo se consulta en /admin/demanda).
 * Nunca rompe la acción del cliente: si falla, solo se registra en el log.
 */
export async function registrarDemanda(
  tipo: TipoDemanda,
  skuId: number,
  clienteId: number | null,
  cantidad = 1,
  conn?: Requester,
): Promise<void> {
  try {
    const requester = conn ?? (await getPool());
    await requester
      .request()
      .input('skuId', sql.Int, skuId)
      .input('clienteId', sql.Int, clienteId)
      .input('tipo', sql.VarChar(20), tipo)
      .input('cantidad', sql.Int, cantidad)
      .query(`INSERT INTO Eventos_Demanda (sku_id, cliente_id, tipo, cantidad) VALUES (@skuId, @clienteId, @tipo, @cantidad)`);
  } catch (error) {
    if (conn) throw error; // dentro de una transacción el error sí debe propagarse
    console.error('No se pudo registrar el evento de demanda:', error);
  }
}

/**
 * Si el SKU volvió a tener stock, avisa a los clientes con alerta pendiente
 * (notificación en su cuenta) y marca las alertas como notificadas.
 * Se llama dentro de la misma transacción que actualiza el stock.
 */
export async function notificarRestock(tx: Requester, skuId: number): Promise<number> {
  const result = await tx.request().input('skuId', sql.Int, skuId).query<{ notificados: number }>(`
    DECLARE @avisados TABLE (cliente_id INT);

    -- Si aún no se corre la migración de clientes, no hace nada (no bloquea el inventario).
    IF OBJECT_ID('dbo.Alertas_Restock', 'U') IS NOT NULL
    BEGIN
    UPDATE a SET notificada_en = SYSUTCDATETIME()
    OUTPUT INSERTED.cliente_id INTO @avisados
    FROM Alertas_Restock a
    JOIN SKUs s ON s.id = a.sku_id
    WHERE a.sku_id = @skuId AND a.notificada_en IS NULL AND s.stock > 0;

    INSERT INTO Notificaciones (cliente_id, sku_id, mensaje)
    SELECT v.cliente_id, @skuId,
           LEFT(N'Volvió a haber existencia de ' + p.nombre
             + ISNULL(N' (' + NULLIF(COALESCE(s.sabor, s.color), '') + ISNULL(N' / ' + NULLIF(s.tamano, ''), N'') + N')', N''), 300)
    FROM @avisados v
    JOIN SKUs s ON s.id = @skuId
    JOIN Productos p ON p.id = s.producto_id;
    END

    SELECT COUNT(*) AS notificados FROM @avisados;
  `);
  return result.recordset[0]?.notificados ?? 0;
}
