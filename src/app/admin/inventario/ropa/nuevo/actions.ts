'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { sql, withTransaction } from '@/server/db';
import { isAdmin, UNAUTHORIZED } from '@/server/auth/dal';
import { CATALOGO_TAG } from '@/server/queries/catalogo';
import { cleanText, isHttpsUrl, isId, isInt, isMoney, oneOf, toActionError, type ActionResult } from '@/lib/validation';

const GENEROS = ['HOMBRE', 'MUJER', 'UNISEX'] as const;
const CATEGORIAS = ['TOPS', 'BOTTOMS', 'ACCESORIOS'] as const;

export interface DataNuevaRopa {
  marcaId?: number;
  nuevaMarca?: string;
  nombreProducto: string;
  genero: string;
  categoria: string;
  precioProveedor: number;
  precioVenta: number;
  variantes: {
    color: string;
    imagenes: string[];
    tallas: { talla: string; stock: number }[];
  }[];
}

type VarianteLimpia = { color: string; imagenes: string[]; tallas: { talla: string; stock: number }[] };

function limpiarVariantes(variantes: unknown): VarianteLimpia[] | null {
  if (!Array.isArray(variantes) || variantes.length === 0 || variantes.length > 20) return null;
  const limpias: VarianteLimpia[] = [];

  for (const v of variantes) {
    const color = cleanText(v?.color, 60)?.toUpperCase();
    if (!color || !Array.isArray(v.tallas) || !Array.isArray(v.imagenes) || v.imagenes.length > 10) return null;

    const tallas = [];
    for (const t of v.tallas) {
      const talla = cleanText(t?.talla, 10)?.toUpperCase();
      if (!talla || !isInt(t.stock, 0, 10_000)) return null;
      tallas.push({ talla, stock: t.stock });
    }
    if (tallas.length === 0 || tallas.length > 12) return null;

    const imagenes = v.imagenes.filter((url: unknown) => typeof url === 'string' && url.trim() !== '');
    if (!imagenes.every(isHttpsUrl)) return null;

    limpias.push({ color, tallas, imagenes });
  }
  return limpias;
}

export async function crearColeccionRopa(datos: DataNuevaRopa): Promise<ActionResult<{ totalSkus: number }>> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const nuevaMarca = datos.nuevaMarca ? cleanText(datos.nuevaMarca, 80)?.toUpperCase() : undefined;
  const nombre = cleanText(datos.nombreProducto, 120)?.toUpperCase();
  const variantes = limpiarVariantes(datos.variantes);

  if (
    !(nuevaMarca || isId(datos.marcaId)) ||
    !nombre ||
    !oneOf(datos.genero, GENEROS) ||
    !oneOf(datos.categoria, CATEGORIAS) ||
    !isMoney(datos.precioProveedor) ||
    !isMoney(datos.precioVenta) ||
    !variantes
  ) {
    return {
      success: false,
      error: 'Revisa los campos. Las imágenes deben ser enlaces https y cada color necesita al menos una talla.',
    };
  }

  try {
    const totalSkus = await withTransaction(async (tx) => {
      let marcaId = datos.marcaId;
      if (nuevaMarca) {
        const r = await tx.request()
          .input('nombre', sql.NVarChar(80), nuevaMarca)
          .query<{ id: number }>(`INSERT INTO Marcas (nombre) OUTPUT INSERTED.id VALUES (@nombre)`);
        marcaId = r.recordset[0].id;
      }

      const prod = await tx.request()
        .input('nombre', sql.NVarChar(120), nombre)
        .input('marcaId', sql.Int, marcaId)
        .input('categoria', sql.NVarChar(20), datos.categoria)
        .input('genero', sql.NVarChar(10), datos.genero)
        .query<{ id: number }>(`
          INSERT INTO Productos (nombre, marca_id, categoria, genero)
          OUTPUT INSERTED.id VALUES (@nombre, @marcaId, @categoria, @genero)
        `);
      const productoId = prod.recordset[0].id;

      let creados = 0;
      for (const variante of variantes) {
        for (const talla of variante.tallas) {
          const sku = await tx.request()
            .input('productoId', sql.Int, productoId)
            .input('color', sql.NVarChar(60), variante.color)
            .input('tamano', sql.NVarChar(10), talla.talla)
            .input('precioVenta', sql.Decimal(10, 2), datos.precioVenta)
            .input('precioProveedor', sql.Decimal(10, 2), datos.precioProveedor)
            .input('stock', sql.Int, talla.stock)
            .query<{ id: number }>(`
              INSERT INTO SKUs (producto_id, color, tamano, precio_venta, precio_proveedor, stock)
              OUTPUT INSERTED.id
              VALUES (@productoId, @color, @tamano, @precioVenta, @precioProveedor, @stock)
            `);
          const skuId = sku.recordset[0].id;
          creados++;

          // Una sola ida por SKU para el movimiento inicial y todas sus imágenes.
          const req = tx.request().input('skuId', sql.Int, skuId);
          const statements: string[] = [];
          if (talla.stock > 0) {
            req.input('stock', sql.Int, talla.stock);
            statements.push(
              `INSERT INTO Movimientos_Inventario (sku_id, cantidad, tipo_movimiento) VALUES (@skuId, @stock, 'INBOUND');`,
            );
          }
          variante.imagenes.forEach((url, i) => {
            req.input(`url${i}`, sql.NVarChar(2000), url);
            statements.push(`INSERT INTO Imagenes_SKU (sku_id, imagen_url, orden) VALUES (@skuId, @url${i}, ${i});`);
          });
          if (statements.length > 0) await req.query(statements.join('\n'));
        }
      }
      return creados;
    });

    revalidatePath('/admin/inventario/ropa');
    revalidateTag(CATALOGO_TAG, { expire: 0 });
    return { success: true, totalSkus };
  } catch (error) {
    return toActionError(error, 'No se pudo registrar la colección.');
  }
}
