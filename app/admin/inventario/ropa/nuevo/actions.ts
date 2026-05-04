// app\admin\inventario\ropa\nuevo\actions.ts
'use server';

import { conectarDB } from '@/lib/db';
import sql from 'mssql';
import { revalidatePath } from 'next/cache';

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

export async function crearColeccionRopa(datos: DataNuevaRopa) {
    const pool = await conectarDB();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        let currentMarcaId = datos.marcaId;

        // 1. Crear Marca si es nueva
        if (datos.nuevaMarca) {
            const resultMarca = await transaction.request()
                .input('nombre', sql.NVarChar, datos.nuevaMarca)
                .query(`INSERT INTO Marcas (nombre) OUTPUT INSERTED.id VALUES (@nombre)`);
            currentMarcaId = resultMarca.recordset[0].id;
        }

        // 2. Crear el Producto (Ropa)
        const resultProd = await transaction.request()
            .input('nombre', sql.NVarChar, datos.nombreProducto)
            .input('marca_id', sql.Int, currentMarcaId)
            .input('categoria', sql.NVarChar, datos.categoria)
            .input('genero', sql.NVarChar, datos.genero)
            .query(`
        INSERT INTO Productos (nombre, marca_id, categoria, genero) 
        OUTPUT INSERTED.id 
        VALUES (@nombre, @marca_id, @categoria, @genero)
      `);

        const productoId = resultProd.recordset[0].id;
        let skusCreados = 0;

        // 3. Iterar sobre las Variantes (Colores)
        for (const variante of datos.variantes) {

            // Iterar sobre las Tallas de ese Color
            for (const talla of variante.tallas) {
                if (talla.stock < 0) continue; // Ignoramos si por error hay stock negativo

                // A. Crear el SKU (Combinación Producto + Color + Talla)
                const resultSku = await transaction.request()
                    .input('productoId', sql.Int, productoId)
                    .input('color', sql.NVarChar, variante.color)
                    .input('tamano', sql.NVarChar, talla.talla) // Usamos 'tamano' para la talla
                    .input('precioVenta', sql.Decimal(10, 2), datos.precioVenta)
                    .input('precioProveedor', sql.Decimal(10, 2), datos.precioProveedor)
                    .input('stock', sql.Int, talla.stock)
                    .query(`
            INSERT INTO SKUs (producto_id, color, tamano, precio_venta, precio_proveedor, stock) 
            OUTPUT INSERTED.id 
            VALUES (@productoId, @color, @tamano, @precioVenta, @precioProveedor, @stock)
          `);

                const skuId = resultSku.recordset[0].id;
                skusCreados++;

                // B. Registrar Movimiento Inicial de Inventario (para que salga en las Estadísticas)
                if (talla.stock > 0) {
                    await transaction.request()
                        .input('skuId', sql.Int, skuId)
                        .input('cantidad', sql.Int, talla.stock)
                        .input('tipo', sql.NVarChar, 'INBOUND')
                        .query(`
              INSERT INTO Movimientos_Inventario (sku_id, cantidad, tipo_movimiento) 
              VALUES (@skuId, @cantidad, @tipo)
            `);
                }

                // C. Guardar la Galería de Imágenes para este SKU
                for (let i = 0; i < variante.imagenes.length; i++) {
                    const url = variante.imagenes[i];
                    if (!url.trim()) continue; // Evitar URLs vacías

                    await transaction.request()
                        .input('skuId', sql.Int, skuId)
                        .input('url', sql.NVarChar(sql.MAX), url)
                        .input('orden', sql.Int, i)
                        .query(`
              INSERT INTO Imagenes_SKU (sku_id, imagen_url, orden) 
              VALUES (@skuId, @url, @orden)
            `);
                }
            }
        }

        await transaction.commit();
        revalidatePath('/admin/inventario');
        revalidatePath('/ropa');

        return { success: true, totalSkus: skusCreados };
    } catch (error: unknown) {
        await transaction.rollback();
        if (error instanceof Error) {
            console.error("Error al crear Colección de Ropa:", error);
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Error desconocido en la BD' };
    }
}