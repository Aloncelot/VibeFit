'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { sql, withTransaction } from '@/server/db';
import { isAdmin, UNAUTHORIZED } from '@/server/auth/dal';
import { CATALOGO_TAG } from '@/server/queries/catalogo';
import { cleanText, isId, isMoney, toActionError, type ActionResult } from '@/lib/validation';

export interface NuevoSKU {
  marcaId?: number;
  nuevaMarca?: string;
  productoId?: number;
  nuevoProducto?: string;
  tamano: string;
  sabor: string;
  precioProveedor: number;
  precioVenta: number;
}

export async function crearNuevoSKU(datos: NuevoSKU): Promise<ActionResult<{ newSkuId: number }>> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const nuevaMarca = datos.nuevaMarca ? cleanText(datos.nuevaMarca, 80)?.toUpperCase() : undefined;
  const nuevoProducto = datos.nuevoProducto ? cleanText(datos.nuevoProducto, 120)?.toUpperCase() : undefined;
  const tamano = cleanText(datos.tamano, 40);
  const sabor = cleanText(datos.sabor, 80);

  const marcaOk = nuevaMarca || isId(datos.marcaId);
  const productoOk = nuevoProducto || isId(datos.productoId);
  if (!marcaOk || !productoOk || !tamano || !sabor || !isMoney(datos.precioProveedor) || !isMoney(datos.precioVenta)) {
    return { success: false, error: 'Revisa los campos: hay datos vacíos o inválidos.' };
  }

  try {
    const newSkuId = await withTransaction(async (tx) => {
      let marcaId = datos.marcaId;
      let productoId = datos.productoId;

      if (nuevaMarca) {
        const r = await tx.request()
          .input('nombre', sql.NVarChar(80), nuevaMarca)
          .query<{ id: number }>(`INSERT INTO Marcas (nombre) OUTPUT INSERTED.id VALUES (@nombre)`);
        marcaId = r.recordset[0].id;
      }

      if (nuevoProducto) {
        // Se marca como 'Suplemento' para que aparezca en la tienda.
        const r = await tx.request()
          .input('nombre', sql.NVarChar(120), nuevoProducto)
          .input('marcaId', sql.Int, marcaId)
          .query<{ id: number }>(`
            INSERT INTO Productos (nombre, marca_id, categoria)
            OUTPUT INSERTED.id VALUES (@nombre, @marcaId, 'Suplemento')
          `);
        productoId = r.recordset[0].id;
      }

      const sku = await tx.request()
        .input('productoId', sql.Int, productoId)
        .input('sabor', sql.NVarChar(80), sabor.toUpperCase())
        .input('tamano', sql.NVarChar(40), tamano.toUpperCase())
        .input('precioVenta', sql.Decimal(10, 2), datos.precioVenta)
        .input('precioProveedor', sql.Decimal(10, 2), datos.precioProveedor)
        .query<{ id: number }>(`
          INSERT INTO SKUs (producto_id, sabor, tamano, precio_venta, precio_proveedor, stock)
          OUTPUT INSERTED.id
          VALUES (@productoId, @sabor, @tamano, @precioVenta, @precioProveedor, 0)
        `);
      return sku.recordset[0].id;
    });

    revalidatePath('/admin/inventario');
    revalidateTag(CATALOGO_TAG, { expire: 0 });
    return { success: true, newSkuId };
  } catch (error) {
    return toActionError(error, 'No se pudo crear el SKU.');
  }
}
