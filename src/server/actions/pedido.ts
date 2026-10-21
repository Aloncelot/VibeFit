'use server';

import { revalidateTag } from 'next/cache';
import { sql, withTransaction } from '@/server/db';
import { CATALOGO_TAG } from '@/server/queries/catalogo';
import { getCliente } from '@/server/auth/cliente';
import { registrarDemanda } from '@/server/demanda';
import { clientIp, isRateLimited } from '@/server/rate-limit';
import { isId, isInt, toActionError, UserFacingError, type ActionResult } from '@/lib/validation';
import { PAGOS_ACTIVOS } from '@/lib/config';

/**
 * Pedido simulado: descuenta stock sin cobrar.
 * Es una acción pública, así que valida todo lo que llega del navegador.
 * Sustituir por un flujo de pago real (Stripe / Mercado Pago) antes de producción.
 */
export async function confirmarPedidoSimulado(
  items: { id: number; cantidad: number }[],
): Promise<ActionResult<{ unidades: number }>> {
  // Bloqueo mientras no exista una pasarela de pago real: no se descuenta stock.
  if (!PAGOS_ACTIVOS) {
    return { success: false, error: 'Los pagos en línea estarán disponibles muy pronto.' };
  }

  if (isRateLimited(`pedido:${await clientIp()}`, 10, 60_000)) {
    return { success: false, error: 'Demasiados pedidos seguidos. Espera un minuto.' };
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return { success: false, error: 'Tu carrito está vacío o tiene demasiados productos.' };
  }

  // Agrupa por SKU y valida: antes una cantidad negativa aumentaba el stock.
  const porSku = new Map<number, number>();
  for (const item of items) {
    if (!isId(item?.id) || !isInt(item?.cantidad, 1, 20)) {
      return { success: false, error: 'Hay una cantidad inválida en el carrito.' };
    }
    porSku.set(item.id, (porSku.get(item.id) ?? 0) + item.cantidad);
  }

  let sinStock: { skuId: number; cantidad: number } | null = null;

  try {
    await withTransaction(async (tx) => {
      for (const [skuId, cantidad] of porSku) {
        // Verificación y descuento en una sola sentencia: evita vender stock que ya no existe.
        const update = await tx.request()
          .input('skuId', sql.Int, skuId)
          .input('cantidad', sql.Int, cantidad)
          .query(`UPDATE SKUs SET stock = stock - @cantidad WHERE id = @skuId AND stock >= @cantidad`);

        if (update.rowsAffected[0] === 0) {
          sinStock = { skuId, cantidad };
          throw new UserFacingError('Uno de los productos ya no tiene stock suficiente. Ajusta la cantidad e intenta de nuevo.');
        }

        await tx.request()
          .input('skuId', sql.Int, skuId)
          .input('cantidad', sql.Int, cantidad)
          .query(`INSERT INTO Movimientos_Inventario (sku_id, cantidad, tipo_movimiento) VALUES (@skuId, @cantidad, 'VENTA')`);
      }
    });

    revalidateTag(CATALOGO_TAG, { expire: 0 });
    return { success: true, unidades: [...porSku.values()].reduce((a, b) => a + b, 0) };
  } catch (error) {
    // Venta que no se pudo completar por falta de stock: señal para planeación de demanda.
    const perdida = sinStock as { skuId: number; cantidad: number } | null;
    if (perdida) {
      const cliente = await getCliente();
      await registrarDemanda('VENTA_PERDIDA', perdida.skuId, cliente?.id ?? null, perdida.cantidad);
    }
    return toActionError(error, 'No se pudo confirmar el pedido. Intenta de nuevo.');
  }
}
