'use server';

import { revalidatePath } from 'next/cache';
import { getPool, sql, withTransaction } from '@/server/db';
import { getCliente, SIN_SESION } from '@/server/auth/cliente';
import { getListasCliente, getSkusResumen } from '@/server/queries/cliente';
import { registrarDemanda } from '@/server/demanda';
import { clientIp, isRateLimited } from '@/server/rate-limit';
import { isId, isInt, oneOf, toActionError, UserFacingError, type ActionResult } from '@/lib/validation';
import type { ListasCliente, SkuResumen } from '@/types/catalogo';

type LineaCarrito = { id: number; cantidad: number };

const LISTAS = ['CARRITO', 'GUARDADO', 'FAVORITO'] as const;

function limpiarLineas(items: unknown): LineaCarrito[] | null {
  if (!Array.isArray(items) || items.length > 50) return null;
  const porSku = new Map<number, number>();
  for (const item of items) {
    if (!isId(item?.id) || !isInt(item?.cantidad, 1, 20)) return null;
    porSku.set(item.id, Math.min(20, Math.max(porSku.get(item.id) ?? 0, item.cantidad)));
  }
  return [...porSku].map(([id, cantidad]) => ({ id, cantidad }));
}

/** Señal de demanda: producto agotado en un carrito (máximo una vez por semana por cliente y SKU). */
async function registrarCarritoSinStock(clienteId: number, skus: SkuResumen[]) {
  const agotados = skus.filter((s) => s.stock <= 0).map((s) => s.id);
  if (agotados.length === 0) return;
  try {
    const pool = await getPool();
    await pool.request()
      .input('clienteId', sql.Int, clienteId)
      .input('ids', sql.NVarChar(sql.MAX), JSON.stringify(agotados))
      .query(`
        INSERT INTO Eventos_Demanda (sku_id, cliente_id, tipo)
        SELECT j.id, @clienteId, 'CARRITO_SIN_STOCK'
        FROM OPENJSON(@ids) WITH (id INT '$') j
        WHERE NOT EXISTS (
          SELECT 1 FROM Eventos_Demanda e
          WHERE e.sku_id = j.id AND e.cliente_id = @clienteId AND e.tipo = 'CARRITO_SIN_STOCK'
            AND e.fecha > DATEADD(day, -7, SYSUTCDATETIME())
        )
      `);
  } catch (error) {
    console.error('No se pudo registrar carrito sin stock:', error);
  }
}

/** Stock y precio actuales de los SKUs del carrito. Pública (invitados también la usan). */
export async function consultarDisponibilidad(ids: number[]): Promise<ActionResult<{ skus: SkuResumen[] }>> {
  if (!Array.isArray(ids) || ids.length > 100 || !ids.every(isId)) {
    return { success: false, error: 'Solicitud inválida.' };
  }
  if (isRateLimited(`disponibilidad:${await clientIp()}`, 60, 60_000)) {
    return { success: false, error: 'Demasiadas consultas. Espera un momento.' };
  }
  try {
    const skus = await getSkusResumen([...new Set(ids)]);
    const cliente = await getCliente();
    if (cliente) await registrarCarritoSinStock(cliente.id, skus);
    return { success: true, skus };
  } catch (error) {
    return toActionError(error, 'No se pudo revisar la existencia.');
  }
}

/** Al iniciar sesión: une el carrito del navegador con el guardado en la cuenta. */
export async function sincronizarCarrito(locales: LineaCarrito[]): Promise<ActionResult<{ listas: ListasCliente }>> {
  const cliente = await getCliente();
  if (!cliente) return SIN_SESION;
  const lineas = limpiarLineas(locales);
  if (!lineas) return { success: false, error: 'Carrito inválido.' };

  try {
    if (lineas.length > 0) {
      const pool = await getPool();
      // Si el SKU ya estaba en el carrito guardado se conserva la cantidad mayor (no se duplica).
      await pool.request()
        .input('clienteId', sql.Int, cliente.id)
        .input('items', sql.NVarChar(sql.MAX), JSON.stringify(lineas))
        .query(`
          MERGE Clientes_Listas AS t
          USING (
            SELECT j.id, j.cantidad FROM OPENJSON(@items) WITH (id INT '$.id', cantidad INT '$.cantidad') j
            JOIN SKUs s ON s.id = j.id
          ) AS src
          ON t.cliente_id = @clienteId AND t.sku_id = src.id AND t.lista = 'CARRITO'
          WHEN MATCHED THEN UPDATE SET cantidad = CASE WHEN src.cantidad > t.cantidad THEN src.cantidad ELSE t.cantidad END
          WHEN NOT MATCHED THEN INSERT (cliente_id, sku_id, lista, cantidad) VALUES (@clienteId, src.id, 'CARRITO', src.cantidad);
        `);
    }
    const listas = await getListasCliente(cliente.id);
    await registrarCarritoSinStock(cliente.id, listas.carrito);
    return { success: true, listas };
  } catch (error) {
    return toActionError(error, 'No se pudo cargar tu carrito guardado.');
  }
}

/** Guarda el carrito completo en la cuenta (se llama con cada cambio, con retraso). */
export async function guardarCarrito(items: LineaCarrito[]): Promise<ActionResult> {
  const cliente = await getCliente();
  if (!cliente) return SIN_SESION;
  const lineas = limpiarLineas(items);
  if (!lineas) return { success: false, error: 'Carrito inválido.' };

  try {
    await withTransaction(async (tx) => {
      await tx.request()
        .input('clienteId', sql.Int, cliente.id)
        .query(`DELETE FROM Clientes_Listas WHERE cliente_id = @clienteId AND lista = 'CARRITO'`);
      if (lineas.length === 0) return;
      await tx.request()
        .input('clienteId', sql.Int, cliente.id)
        .input('items', sql.NVarChar(sql.MAX), JSON.stringify(lineas))
        .query(`
          INSERT INTO Clientes_Listas (cliente_id, sku_id, lista, cantidad)
          SELECT @clienteId, j.id, 'CARRITO', j.cantidad
          FROM OPENJSON(@items) WITH (id INT '$.id', cantidad INT '$.cantidad') j
          JOIN SKUs s ON s.id = j.id
        `);
    });
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo guardar tu carrito.');
  }
}

/** Mueve un SKU entre carrito y "guardado para después". */
export async function moverALista(skuId: number, hacia: 'CARRITO' | 'GUARDADO'): Promise<ActionResult> {
  const cliente = await getCliente();
  if (!cliente) return SIN_SESION;
  if (!isId(skuId) || !oneOf(hacia, ['CARRITO', 'GUARDADO'] as const)) return { success: false, error: 'Datos inválidos.' };
  const desde = hacia === 'CARRITO' ? 'GUARDADO' : 'CARRITO';

  try {
    await withTransaction(async (tx) => {
      const existe = await tx.request().input('skuId', sql.Int, skuId).query(`SELECT 1 FROM SKUs WHERE id = @skuId`);
      if (existe.recordset.length === 0) throw new UserFacingError('Este producto ya no existe.');

      await tx.request()
        .input('clienteId', sql.Int, cliente.id)
        .input('skuId', sql.Int, skuId)
        .input('desde', sql.VarChar(12), desde)
        .input('hacia', sql.VarChar(12), hacia)
        .query(`
          DELETE FROM Clientes_Listas WHERE cliente_id = @clienteId AND sku_id = @skuId AND lista = @desde;
          IF NOT EXISTS (SELECT 1 FROM Clientes_Listas WHERE cliente_id = @clienteId AND sku_id = @skuId AND lista = @hacia)
            INSERT INTO Clientes_Listas (cliente_id, sku_id, lista, cantidad) VALUES (@clienteId, @skuId, @hacia, 1);
        `);
      if (hacia === 'GUARDADO') await registrarDemanda('GUARDADO', skuId, cliente.id, 1, tx);
    });
    revalidatePath('/cuenta');
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo mover el producto.');
  }
}

export async function quitarDeLista(skuId: number, lista: 'GUARDADO' | 'FAVORITO'): Promise<ActionResult> {
  const cliente = await getCliente();
  if (!cliente) return SIN_SESION;
  if (!isId(skuId) || !oneOf(lista, LISTAS)) return { success: false, error: 'Datos inválidos.' };
  try {
    const pool = await getPool();
    await pool.request()
      .input('clienteId', sql.Int, cliente.id)
      .input('skuId', sql.Int, skuId)
      .input('lista', sql.VarChar(12), lista)
      .query(`DELETE FROM Clientes_Listas WHERE cliente_id = @clienteId AND sku_id = @skuId AND lista = @lista`);
    revalidatePath('/cuenta');
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo quitar el producto.');
  }
}

export async function alternarFavorito(skuId: number): Promise<ActionResult<{ favorito: boolean }>> {
  const cliente = await getCliente();
  if (!cliente) return SIN_SESION;
  if (!isId(skuId)) return { success: false, error: 'Producto inválido.' };

  try {
    const favorito = await withTransaction(async (tx) => {
      const borrado = await tx.request()
        .input('clienteId', sql.Int, cliente.id)
        .input('skuId', sql.Int, skuId)
        .query(`DELETE FROM Clientes_Listas WHERE cliente_id = @clienteId AND sku_id = @skuId AND lista = 'FAVORITO'`);
      if (borrado.rowsAffected[0] > 0) return false;

      await tx.request()
        .input('clienteId', sql.Int, cliente.id)
        .input('skuId', sql.Int, skuId)
        .query(`
          INSERT INTO Clientes_Listas (cliente_id, sku_id, lista)
          SELECT @clienteId, id, 'FAVORITO' FROM SKUs WHERE id = @skuId
        `);
      await registrarDemanda('FAVORITO', skuId, cliente.id, 1, tx);
      return true;
    });
    revalidatePath('/cuenta');
    return { success: true, favorito };
  } catch (error) {
    return toActionError(error, 'No se pudo actualizar tus favoritos.');
  }
}

/** "Avísame cuando vuelva": se notifica en la cuenta cuando el SKU vuelve a tener stock. */
export async function solicitarAlertaRestock(skuId: number): Promise<ActionResult<{ yaDisponible?: boolean }>> {
  const cliente = await getCliente();
  if (!cliente) return SIN_SESION;
  if (!isId(skuId)) return { success: false, error: 'Producto inválido.' };

  try {
    const pool = await getPool();
    const stock = await pool.request()
      .input('skuId', sql.Int, skuId)
      .query<{ stock: number }>(`SELECT stock FROM SKUs WHERE id = @skuId`);
    if (stock.recordset.length === 0) return { success: false, error: 'Este producto ya no existe.' };
    if (stock.recordset[0].stock > 0) return { success: true, yaDisponible: true };

    const insert = await pool.request()
      .input('clienteId', sql.Int, cliente.id)
      .input('skuId', sql.Int, skuId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Alertas_Restock WHERE cliente_id = @clienteId AND sku_id = @skuId AND notificada_en IS NULL)
          INSERT INTO Alertas_Restock (cliente_id, sku_id) VALUES (@clienteId, @skuId);
      `);
    if (insert.rowsAffected[0] > 0) await registrarDemanda('ALERTA_RESTOCK', skuId, cliente.id);
    revalidatePath('/cuenta');
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo registrar el aviso.');
  }
}

export async function cancelarAlertaRestock(skuId: number): Promise<ActionResult> {
  const cliente = await getCliente();
  if (!cliente) return SIN_SESION;
  if (!isId(skuId)) return { success: false, error: 'Producto inválido.' };
  try {
    const pool = await getPool();
    await pool.request()
      .input('clienteId', sql.Int, cliente.id)
      .input('skuId', sql.Int, skuId)
      .query(`DELETE FROM Alertas_Restock WHERE cliente_id = @clienteId AND sku_id = @skuId AND notificada_en IS NULL`);
    revalidatePath('/cuenta');
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo cancelar el aviso.');
  }
}

export async function marcarNotificacionesLeidas(): Promise<ActionResult> {
  const cliente = await getCliente();
  if (!cliente) return SIN_SESION;
  try {
    const pool = await getPool();
    await pool.request()
      .input('clienteId', sql.Int, cliente.id)
      .query(`UPDATE Notificaciones SET leida = 1 WHERE cliente_id = @clienteId AND leida = 0`);
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudieron actualizar las notificaciones.');
  }
}
