import 'server-only';
import { getPool, sql } from '@/server/db';
import { verifyAdmin } from '@/server/auth/dal';

// Cada consulta de admin valida la sesión: no depende solo del proxy ni del layout.

export interface InventarioItem {
  id: number;
  nombre: string;
  marca: string;
  sabor: string;
  tamano: string;
  stock: number;
  precio_proveedor: number;
  precio_venta: number;
}

export async function getInventarioSuplementos(): Promise<InventarioItem[]> {
  await verifyAdmin();
  const pool = await getPool();
  const result = await pool.request().query<InventarioItem>(`
    SELECT s.id, p.nombre, m.nombre AS marca, ISNULL(s.sabor, '') AS sabor, ISNULL(s.tamano, '') AS tamano,
           s.stock, s.precio_proveedor, s.precio_venta
    FROM SKUs s
    JOIN Productos p ON s.producto_id = p.id
    JOIN Marcas m ON p.marca_id = m.id
    WHERE p.categoria = 'Suplemento' OR p.categoria IS NULL
    ORDER BY m.nombre, p.nombre, s.sabor
  `);
  return result.recordset;
}

export interface RopaItem {
  id: number;
  modelo: string;
  marca: string;
  color: string;
  talla: string;
  stock: number;
  precio_proveedor: number;
  precio_venta: number;
}

export async function getInventarioRopa(): Promise<RopaItem[]> {
  await verifyAdmin();
  const pool = await getPool();
  const result = await pool.request().query<RopaItem>(`
    SELECT s.id, p.nombre AS modelo, m.nombre AS marca, ISNULL(s.color, '') AS color,
           ISNULL(s.tamano, '') AS talla, s.stock, s.precio_proveedor, s.precio_venta
    FROM SKUs s
    JOIN Productos p ON s.producto_id = p.id
    JOIN Marcas m ON p.marca_id = m.id
    WHERE p.categoria IN ('TOPS', 'BOTTOMS', 'ACCESORIOS')
    ORDER BY m.nombre, p.nombre, s.color, s.tamano
  `);
  return result.recordset;
}

export async function getFormularioSKU() {
  await verifyAdmin();
  const pool = await getPool();
  const [marcas, productos, tamanos] = await Promise.all([
    pool.request().query<{ id: number; nombre: string }>(`SELECT id, nombre FROM Marcas ORDER BY nombre`),
    pool.request().query<{ id: number; nombre: string; marca_id: number }>(
      `SELECT id, nombre, marca_id FROM Productos WHERE categoria = 'Suplemento' OR categoria IS NULL ORDER BY nombre`,
    ),
    pool.request().query<{ tamano: string }>(
      `SELECT DISTINCT tamano FROM SKUs WHERE tamano IS NOT NULL ORDER BY tamano`,
    ),
  ]);
  return {
    marcas: marcas.recordset,
    productos: productos.recordset,
    tamanos: tamanos.recordset.map((t) => t.tamano),
  };
}

export async function getMarcasRopa() {
  await verifyAdmin();
  const pool = await getPool();
  const result = await pool.request().query<{ id: number; nombre: string }>(`
    SELECT id, nombre FROM Marcas
    WHERE id NOT IN (SELECT DISTINCT marca_id FROM Productos WHERE categoria = 'Suplemento' AND marca_id IS NOT NULL)
    ORDER BY nombre
  `);
  return result.recordset;
}

/* ----------------------------- Análisis ----------------------------- */

export interface AnalisisItem {
  id: number;
  producto: string;
  marca: string;
  total_unidades_recibidas: number;
  valor_total_inversion: number;
  precio_unitario: number;
}

export interface TendenciaItem {
  etiqueta: string;
  unidades: number;
  inversion: number;
}

export const PERIODOS_ANALISIS = [1, 3, 6, 12] as const;

export async function getAnalisis(meses: number) {
  await verifyAdmin();
  const pool = await getPool();

  const [abc, tendencia] = await Promise.all([
    pool.request().input('meses', sql.Int, meses).query<AnalisisItem>(`
      SELECT s.id,
             p.nombre + ' (' + ISNULL(s.sabor, '-') + ')' AS producto,
             m.nombre AS marca,
             SUM(mi.cantidad) AS total_unidades_recibidas,
             SUM(mi.cantidad * ISNULL(s.precio_proveedor, 0)) AS valor_total_inversion,
             MAX(ISNULL(s.precio_proveedor, 0)) AS precio_unitario
      FROM Movimientos_Inventario mi
      JOIN SKUs s ON mi.sku_id = s.id
      JOIN Productos p ON s.producto_id = p.id
      JOIN Marcas m ON p.marca_id = m.id
      WHERE mi.tipo_movimiento IN ('INBOUND', 'CORRECCION')
        AND mi.fecha >= DATEADD(month, -@meses, GETDATE())
      GROUP BY s.id, p.nombre, s.sabor, m.nombre
      HAVING SUM(mi.cantidad) > 0
      ORDER BY valor_total_inversion DESC
    `),
    pool.request().input('meses', sql.Int, meses).query<TendenciaItem>(`
      SELECT 'SEM ' + CAST(DATEPART(isowk, mi.fecha) AS NVARCHAR) AS etiqueta,
             SUM(mi.cantidad) AS unidades,
             SUM(mi.cantidad * ISNULL(s.precio_proveedor, 0)) AS inversion
      FROM Movimientos_Inventario mi
      JOIN SKUs s ON mi.sku_id = s.id
      WHERE mi.tipo_movimiento IN ('INBOUND', 'CORRECCION')
        AND mi.fecha >= DATEADD(month, -@meses, GETDATE())
      GROUP BY DATEPART(year, mi.fecha), DATEPART(isowk, mi.fecha)
      ORDER BY DATEPART(year, mi.fecha), DATEPART(isowk, mi.fecha)
    `),
  ]);

  const toNumber = <T extends object>(rows: T[], keys: (keyof T)[]) =>
    rows.map((r) => {
      const copy = { ...r };
      for (const k of keys) (copy[k] as unknown) = Number(r[k]);
      return copy;
    });

  return {
    abc: toNumber(abc.recordset, ['total_unidades_recibidas', 'valor_total_inversion', 'precio_unitario']),
    tendencia: toNumber(tendencia.recordset, ['unidades', 'inversion']),
  };
}

/* ---------------------- Planeación de demanda ---------------------- */

export interface DemandaItem {
  id: number;
  producto: string;
  marca: string;
  variante: string;
  tamano: string;
  categoria: string;
  stock: number;
  alertas_pendientes: number;
  alertas_periodo: number;
  favoritos_actuales: number;
  guardados_actuales: number;
  carrito_sin_stock: number;
  ventas_perdidas: number;
  vendidas: number;
  reposicion_sugerida: number;
}

export const PERIODOS_DEMANDA = [30, 90, 180] as const;

/**
 * Señales de demanda por SKU en el periodo.
 * Reposición sugerida = vendidas + alertas pendientes + ventas perdidas − stock actual (mínimo 0).
 */
export async function getDemanda(dias: number): Promise<DemandaItem[]> {
  await verifyAdmin();
  const pool = await getPool();
  const result = await pool.request().input('dias', sql.Int, dias).query<DemandaItem>(`
    WITH eventos AS (
      SELECT sku_id,
             SUM(CASE WHEN tipo = 'ALERTA_RESTOCK' THEN cantidad ELSE 0 END) AS alertas_periodo,
             SUM(CASE WHEN tipo = 'CARRITO_SIN_STOCK' THEN cantidad ELSE 0 END) AS carrito_sin_stock,
             SUM(CASE WHEN tipo = 'VENTA_PERDIDA' THEN cantidad ELSE 0 END) AS ventas_perdidas
      FROM Eventos_Demanda
      WHERE fecha >= DATEADD(day, -@dias, SYSUTCDATETIME())
      GROUP BY sku_id
    ),
    pendientes AS (
      SELECT sku_id, COUNT(*) AS alertas_pendientes FROM Alertas_Restock WHERE notificada_en IS NULL GROUP BY sku_id
    ),
    listas AS (
      SELECT sku_id,
             SUM(CASE WHEN lista = 'FAVORITO' THEN 1 ELSE 0 END) AS favoritos_actuales,
             SUM(CASE WHEN lista = 'GUARDADO' THEN 1 ELSE 0 END) AS guardados_actuales
      FROM Clientes_Listas GROUP BY sku_id
    ),
    ventas AS (
      SELECT sku_id, SUM(ABS(cantidad)) AS vendidas
      FROM Movimientos_Inventario
      WHERE tipo_movimiento IN ('VENTA', 'VENTA_SCANNER') AND fecha >= DATEADD(day, -@dias, GETDATE())
      GROUP BY sku_id
    )
    SELECT s.id, p.nombre AS producto, m.nombre AS marca,
           COALESCE(NULLIF(s.sabor, ''), NULLIF(s.color, ''), '') AS variante,
           ISNULL(s.tamano, '') AS tamano, ISNULL(p.categoria, '') AS categoria, s.stock,
           ISNULL(pe.alertas_pendientes, 0) AS alertas_pendientes,
           ISNULL(e.alertas_periodo, 0) AS alertas_periodo,
           ISNULL(l.favoritos_actuales, 0) AS favoritos_actuales,
           ISNULL(l.guardados_actuales, 0) AS guardados_actuales,
           ISNULL(e.carrito_sin_stock, 0) AS carrito_sin_stock,
           ISNULL(e.ventas_perdidas, 0) AS ventas_perdidas,
           ISNULL(v.vendidas, 0) AS vendidas,
           CASE WHEN ISNULL(v.vendidas, 0) + ISNULL(pe.alertas_pendientes, 0) + ISNULL(e.ventas_perdidas, 0) - s.stock > 0
                THEN ISNULL(v.vendidas, 0) + ISNULL(pe.alertas_pendientes, 0) + ISNULL(e.ventas_perdidas, 0) - s.stock
                ELSE 0 END AS reposicion_sugerida
    FROM SKUs s
    JOIN Productos p ON s.producto_id = p.id
    JOIN Marcas m ON p.marca_id = m.id
    LEFT JOIN eventos e ON e.sku_id = s.id
    LEFT JOIN pendientes pe ON pe.sku_id = s.id
    LEFT JOIN listas l ON l.sku_id = s.id
    LEFT JOIN ventas v ON v.sku_id = s.id
    WHERE e.sku_id IS NOT NULL OR pe.sku_id IS NOT NULL OR l.sku_id IS NOT NULL
    ORDER BY reposicion_sugerida DESC, alertas_pendientes DESC, ventas_perdidas DESC, favoritos_actuales DESC
  `);
  return result.recordset;
}

/* ---------------------- Solicitudes de producto ---------------------- */

export type EstadoSolicitud = 'NUEVA' | 'REVISADA' | 'ATENDIDA' | 'DESCARTADA';

export interface Solicitud {
  id: number;
  seccion: string;
  producto: string;
  marca: string | null;
  detalle: string | null;
  estado: EstadoSolicitud;
  creada_en: string;
  contacto: string | null;
}

export async function getSolicitudes(estado: EstadoSolicitud | 'ABIERTAS' | 'TODAS'): Promise<Solicitud[]> {
  await verifyAdmin();
  const pool = await getPool();
  const filtro =
    estado === 'TODAS' ? '' : estado === 'ABIERTAS' ? "WHERE s.estado IN ('NUEVA', 'REVISADA')" : 'WHERE s.estado = @estado';
  const result = await pool.request()
    .input('estado', sql.VarChar(12), estado)
    .query<Solicitud & { creada_en: Date }>(`
      SELECT TOP 300 s.id, s.seccion, s.producto, s.marca, s.detalle, s.estado, s.creada_en,
             COALESCE(c.nombre + ' <' + c.email + '>', s.email) AS contacto
      FROM Solicitudes_Producto s
      LEFT JOIN Clientes c ON c.id = s.cliente_id
      ${filtro}
      ORDER BY CASE s.estado WHEN 'NUEVA' THEN 0 WHEN 'REVISADA' THEN 1 ELSE 2 END, s.creada_en DESC
    `);
  return result.recordset.map((r) => ({ ...r, creada_en: new Date(r.creada_en).toISOString() }));
}

/** Avisos del panel: solicitudes nuevas (0 si aún no existe la tabla). */
export async function contarSolicitudesNuevas(): Promise<number> {
  try {
    const pool = await getPool();
    const result = await pool.request().query<{ total: number }>(`
      IF OBJECT_ID('dbo.Solicitudes_Producto', 'U') IS NULL SELECT 0 AS total
      ELSE SELECT COUNT(*) AS total FROM Solicitudes_Producto WHERE estado = 'NUEVA'
    `);
    return result.recordset[0]?.total ?? 0;
  } catch {
    return 0;
  }
}

/* ----------------------------- Reseñas ----------------------------- */

export interface ResenaAdmin {
  id: number;
  cliente: string;
  calificacion: number;
  comentario: string;
  visible: boolean;
  creada_en: string;
}

export async function getResenasAdmin(): Promise<ResenaAdmin[]> {
  await verifyAdmin();
  const pool = await getPool();
  const result = await pool.request().query<ResenaAdmin & { creada_en: Date }>(`
    SELECT TOP 300 r.id, c.nombre + ' <' + c.email + '>' AS cliente, r.calificacion, r.comentario, r.visible,
           COALESCE(r.actualizada_en, r.creada_en) AS creada_en
    FROM Resenas r JOIN Clientes c ON c.id = r.cliente_id
    ORDER BY COALESCE(r.actualizada_en, r.creada_en) DESC
  `);
  return result.recordset.map((r) => ({ ...r, visible: Boolean(r.visible), creada_en: new Date(r.creada_en).toISOString() }));
}
