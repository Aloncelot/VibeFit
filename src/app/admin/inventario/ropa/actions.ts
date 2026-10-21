'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { sql, withTransaction } from '@/server/db';
import { isAdmin, UNAUTHORIZED } from '@/server/auth/dal';
import { CATALOGO_TAG } from '@/server/queries/catalogo';
import { notificarRestock } from '@/server/demanda';
import { isId, toActionError, UserFacingError, type ActionResult } from '@/lib/validation';

function refrescar() {
  revalidatePath('/admin/inventario/ropa');
  revalidateTag(CATALOGO_TAG, { expire: 0 });
}

export async function registrarVentaEscaneo(skuId: number): Promise<ActionResult<{ movimientoId: number }>> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!isId(skuId)) return { success: false, error: 'SKU inválido.' };

  try {
    const movimientoId = await withTransaction(async (tx) => {
      const update = await tx.request()
        .input('skuId', sql.Int, skuId)
        .query(`UPDATE SKUs SET stock = stock - 1 WHERE id = @skuId AND stock > 0`);
      // Antes se registraba la venta aunque no hubiera stock.
      if (update.rowsAffected[0] === 0) throw new UserFacingError('Esta prenda ya no tiene stock.');

      const mov = await tx.request()
        .input('skuId', sql.Int, skuId)
        .query<{ id: number }>(`
          INSERT INTO Movimientos_Inventario (sku_id, cantidad, tipo_movimiento)
          OUTPUT INSERTED.id VALUES (@skuId, -1, 'VENTA_SCANNER')
        `);
      return mov.recordset[0].id;
    });
    refrescar();
    return { success: true, movimientoId };
  } catch (error) {
    return toActionError(error, 'No se pudo descontar el stock.');
  }
}

export async function deshacerVenta(skuId: number, movimientoId: number): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!isId(skuId) || !isId(movimientoId)) return { success: false, error: 'Datos inválidos.' };

  try {
    await withTransaction(async (tx) => {
      // Solo se revierte una venta de escáner que pertenezca a ese SKU, y una sola vez.
      const mov = await tx.request()
        .input('movId', sql.Int, movimientoId)
        .input('skuId', sql.Int, skuId)
        .query(`
          UPDATE Movimientos_Inventario SET tipo_movimiento = 'VENTA_REVERTIDA'
          WHERE id = @movId AND sku_id = @skuId AND tipo_movimiento = 'VENTA_SCANNER'
        `);
      if (mov.rowsAffected[0] === 0) throw new UserFacingError('Esta venta ya fue revertida.');

      await tx.request()
        .input('skuId', sql.Int, skuId)
        .query(`UPDATE SKUs SET stock = stock + 1 WHERE id = @skuId`);

      await notificarRestock(tx, skuId);
    });
    refrescar();
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo revertir la venta.');
  }
}
