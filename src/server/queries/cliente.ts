import 'server-only';
import { getPool, sql } from '@/server/db';
import type { CartItem, ListasCliente, Notificacion, SkuResumen } from '@/types/catalogo';

/** SELECT común de SKU; `extra` agrega columnas y `from` define el origen (siempre con alias s). */
const selectSku = (from = 'SKUs s', extra = '') => `
  SELECT s.id, p.nombre, m.nombre AS marca,
         COALESCE(NULLIF(s.sabor, ''), NULLIF(s.color, ''), '') AS variante,
         ISNULL(s.tamano, '') AS tamano,
         s.precio_venta AS precio, s.stock,
         COALESCE(s.imagen_variante_url,
           (SELECT TOP 1 i.imagen_url FROM Imagenes_SKU i WHERE i.sku_id = s.id ORDER BY i.orden)) AS imagen_url${extra}
  FROM ${from}
  JOIN Productos p ON s.producto_id = p.id
  JOIN Marcas m ON p.marca_id = m.id`;

function normalizar<T extends SkuResumen>(row: T): T {
  return { ...row, precio: Number(row.precio), stock: Math.max(0, Number(row.stock)) };
}

/** Datos públicos (precio, stock, foto) de una lista de SKUs. */
export async function getSkusResumen(ids: number[]): Promise<SkuResumen[]> {
  if (ids.length === 0) return [];
  const pool = await getPool();
  const result = await pool.request()
    .input('ids', sql.NVarChar(sql.MAX), JSON.stringify(ids))
    .query<SkuResumen>(`${selectSku()} WHERE s.id IN (SELECT id FROM OPENJSON(@ids) WITH (id INT '$'))`);
  return result.recordset.map(normalizar);
}

export async function getListasCliente(clienteId: number): Promise<ListasCliente> {
  const pool = await getPool();
  const [listas, alertas] = await Promise.all([
    pool.request().input('clienteId', sql.Int, clienteId).query<SkuResumen & { lista: string; cantidad: number }>(`
      ${selectSku('Clientes_Listas l JOIN SKUs s ON s.id = l.sku_id', ', l.lista, l.cantidad')}
      WHERE l.cliente_id = @clienteId
      ORDER BY l.agregado_en DESC
    `),
    pool.request().input('clienteId', sql.Int, clienteId).query<{ sku_id: number }>(
      `SELECT sku_id FROM Alertas_Restock WHERE cliente_id = @clienteId AND notificada_en IS NULL`,
    ),
  ]);

  const carrito: CartItem[] = [];
  const guardados: SkuResumen[] = [];
  const favoritos: number[] = [];
  for (const row of listas.recordset) {
    const { lista, cantidad, ...sku } = normalizar(row);
    if (lista === 'CARRITO') carrito.push({ ...sku, cantidad });
    else if (lista === 'GUARDADO') guardados.push(sku);
    else if (lista === 'FAVORITO') favoritos.push(sku.id);
  }

  return { carrito, guardados, favoritos, alertas: alertas.recordset.map((a) => a.sku_id) };
}

export async function getFavoritosDetalle(clienteId: number): Promise<SkuResumen[]> {
  const pool = await getPool();
  const result = await pool.request().input('clienteId', sql.Int, clienteId).query<SkuResumen>(`
    ${selectSku('Clientes_Listas l JOIN SKUs s ON s.id = l.sku_id')}
    WHERE l.cliente_id = @clienteId AND l.lista = 'FAVORITO'
    ORDER BY l.agregado_en DESC
  `);
  return result.recordset.map(normalizar);
}

export async function getNotificaciones(clienteId: number): Promise<Notificacion[]> {
  const pool = await getPool();
  const result = await pool.request().input('clienteId', sql.Int, clienteId).query<Notificacion & { creada_en: Date }>(`
    SELECT TOP 30 id, mensaje, leida, creada_en, sku_id
    FROM Notificaciones WHERE cliente_id = @clienteId
    ORDER BY creada_en DESC
  `);
  return result.recordset.map((n) => ({ ...n, leida: Boolean(n.leida), creada_en: new Date(n.creada_en).toISOString() }));
}

export async function contarNoLeidas(clienteId: number): Promise<number> {
  try {
    const pool = await getPool();
    const result = await pool.request().input('clienteId', sql.Int, clienteId).query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM Notificaciones WHERE cliente_id = @clienteId AND leida = 0`,
    );
    return result.recordset[0]?.total ?? 0;
  } catch (error) {
    // El encabezado se muestra aunque la base de datos no responda.
    console.error('No se pudieron contar notificaciones:', error);
    return 0;
  }
}
