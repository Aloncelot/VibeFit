'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { sql, withTransaction, getPool } from '@/server/db';
import { isAdmin, UNAUTHORIZED } from '@/server/auth/dal';
import { CATALOGO_TAG } from '@/server/queries/catalogo';
import { notificarRestock } from '@/server/demanda';
import { isId, isInt, isMoney, oneOf, toActionError, UserFacingError, type ActionResult } from '@/lib/validation';

const TIPOS_PRECIO = ['precio_proveedor', 'precio_venta'] as const;
type TipoPrecio = (typeof TIPOS_PRECIO)[number];

function refrescar() {
  revalidatePath('/admin/inventario');
  revalidateTag(CATALOGO_TAG, { expire: 0 });
}

export async function registrarInbound(skuId: number, cantidad: number): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!isId(skuId) || !isInt(cantidad, 1, 100_000)) {
    return { success: false, error: 'Cantidad inválida.' };
  }

  try {
    await withTransaction(async (tx) => {
      const update = await tx.request()
        .input('cantidad', sql.Int, cantidad)
        .input('skuId', sql.Int, skuId)
        .query(`UPDATE SKUs SET stock = stock + @cantidad WHERE id = @skuId`);
      if (update.rowsAffected[0] === 0) throw new UserFacingError('El SKU no existe.');

      await tx.request()
        .input('skuId', sql.Int, skuId)
        .input('cantidad', sql.Int, cantidad)
        .input('tipo', sql.NVarChar(30), 'INBOUND')
        .query(`INSERT INTO Movimientos_Inventario (sku_id, cantidad, tipo_movimiento) VALUES (@skuId, @cantidad, @tipo)`);

      // Avisa a quien pidió "avísame cuando vuelva".
      await notificarRestock(tx, skuId);
    });
    refrescar();
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo registrar la entrada de mercancía.');
  }
}

export async function corregirStockFisico(skuId: number, nuevoStock: number): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!isId(skuId) || !isInt(nuevoStock, 0, 1_000_000)) {
    return { success: false, error: 'Stock inválido.' };
  }

  try {
    await withTransaction(async (tx) => {
      // El stock anterior se lee de la base (con bloqueo), no del navegador.
      const actual = await tx.request()
        .input('skuId', sql.Int, skuId)
        .query<{ stock: number }>(`SELECT stock FROM SKUs WITH (UPDLOCK, ROWLOCK) WHERE id = @skuId`);
      if (actual.recordset.length === 0) throw new UserFacingError('El SKU no existe.');

      const diferencia = nuevoStock - actual.recordset[0].stock;
      if (diferencia === 0) return;

      await tx.request()
        .input('nuevoStock', sql.Int, nuevoStock)
        .input('skuId', sql.Int, skuId)
        .query(`UPDATE SKUs SET stock = @nuevoStock WHERE id = @skuId`);

      await tx.request()
        .input('skuId', sql.Int, skuId)
        .input('cantidad', sql.Int, diferencia)
        .input('tipo', sql.NVarChar(30), 'CORRECCION')
        .query(`INSERT INTO Movimientos_Inventario (sku_id, cantidad, tipo_movimiento) VALUES (@skuId, @cantidad, @tipo)`);

      if (nuevoStock > 0) await notificarRestock(tx, skuId);
    });
    refrescar();
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo corregir el stock.');
  }
}

export async function actualizarPrecio(skuId: number, tipo: TipoPrecio, nuevoPrecio: number): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!isId(skuId) || !oneOf(tipo, TIPOS_PRECIO) || !isMoney(nuevoPrecio)) {
    return { success: false, error: 'Precio inválido.' };
  }

  // `tipo` ya está validado contra una lista fija, así que es seguro como nombre de columna.
  const columna = tipo;

  try {
    await withTransaction(async (tx) => {
      const actual = await tx.request()
        .input('skuId', sql.Int, skuId)
        .query<{ precio: number | null }>(`SELECT ${columna} AS precio FROM SKUs WITH (UPDLOCK, ROWLOCK) WHERE id = @skuId`);
      if (actual.recordset.length === 0) throw new UserFacingError('El SKU no existe.');

      const anterior = Number(actual.recordset[0].precio ?? 0);
      if (anterior === nuevoPrecio) return;

      await tx.request()
        .input('nuevoPrecio', sql.Decimal(18, 2), nuevoPrecio)
        .input('skuId', sql.Int, skuId)
        .query(`UPDATE SKUs SET ${columna} = @nuevoPrecio WHERE id = @skuId`);

      await tx.request()
        .input('skuId', sql.Int, skuId)
        .input('tipoPrecio', sql.NVarChar(50), tipo)
        .input('precioAnterior', sql.Decimal(18, 2), anterior)
        .input('nuevoPrecio', sql.Decimal(18, 2), nuevoPrecio)
        .query(`
          INSERT INTO HistorialPrecios (sku_id, tipo_precio, precio_anterior, precio_nuevo)
          VALUES (@skuId, @tipoPrecio, @precioAnterior, @nuevoPrecio)
        `);
    });
    refrescar();
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo actualizar el precio.');
  }
}

export interface RegistroHistorial {
  id: number;
  tipo_precio: TipoPrecio;
  precio_anterior: number;
  precio_nuevo: number;
  fecha_cambio: string;
}

export async function obtenerHistorialPrecio(skuId: number): Promise<ActionResult<{ data: RegistroHistorial[] }>> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!isId(skuId)) return { success: false, error: 'SKU inválido.' };

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('skuId', sql.Int, skuId)
      .query<RegistroHistorial & { fecha_cambio: Date }>(`
        SELECT TOP 100 id, tipo_precio, precio_anterior, precio_nuevo, fecha_cambio
        FROM HistorialPrecios
        WHERE sku_id = @skuId
        ORDER BY fecha_cambio DESC
      `);
    const data = result.recordset.map((r) => ({
      ...r,
      precio_anterior: Number(r.precio_anterior),
      precio_nuevo: Number(r.precio_nuevo),
      fecha_cambio: new Date(r.fecha_cambio).toISOString(),
    }));
    return { success: true, data };
  } catch (error) {
    return toActionError(error, 'No se pudo cargar el historial.');
  }
}
