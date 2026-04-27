// app/admin/analisis/actions.ts
'use server';

import { conectarDB } from '@/lib/db';
import sql from 'mssql';
import { revalidatePath } from 'next/cache';

export interface AnalisisItem {
    id: number;
    producto: string;
    marca: string;
    total_unidades_recibidas: number;
    valor_total_inversion: number;
    precio_unitario: number;
}

export interface TendenciaItem {
    etiqueta: string; // Ej: "Semana 42"
    unidades: number;
    inversion: number;
}


export async function getAnalisisABC(meses: number): Promise<AnalisisItem[]> {
    const pool = await conectarDB();
    const result = await pool.request()
        .input('meses', sql.Int, meses)
        .query(`
      SELECT 
        s.id, 
        p.nombre + ' (' + s.sabor + ')' as producto,
        m.nombre as marca,
        SUM(mi.cantidad) as total_unidades_recibidas,
        SUM(mi.cantidad * ISNULL(s.precio_proveedor, 0)) as valor_total_inversion,
        MAX(ISNULL(s.precio_proveedor, 0)) as precio_unitario
      FROM Movimientos_Inventario mi
      JOIN SKUs s ON mi.sku_id = s.id
      JOIN Productos p ON s.producto_id = p.id
      JOIN Marcas m ON p.marca_id = m.id
      WHERE mi.tipo_movimiento IN ('INBOUND', 'CORRECCION')
        AND mi.fecha >= DATEADD(month, -@meses, GETDATE())
      GROUP BY s.id, p.nombre, s.sabor, m.nombre
      HAVING SUM(mi.cantidad) > 0 
      ORDER BY valor_total_inversion DESC
    `);

    return result.recordset;
}

export async function getTendenciaInbound(meses: number): Promise<TendenciaItem[]> {
    const pool = await conectarDB();
    const result = await pool.request()
        .input('meses', sql.Int, meses)
        .query(`
      SELECT 
        'SEM ' + CAST(DATEPART(isowk, mi.fecha) AS NVARCHAR) as etiqueta,
        SUM(mi.cantidad) as unidades,
        SUM(mi.cantidad * ISNULL(s.precio_proveedor, 0)) as inversion,
        DATEPART(year, mi.fecha) as anio,
        DATEPART(isowk, mi.fecha) as semana
      FROM Movimientos_Inventario mi
      JOIN SKUs s ON mi.sku_id = s.id
      WHERE mi.tipo_movimiento IN ('INBOUND', 'CORRECCION')
        AND mi.fecha >= DATEADD(month, -@meses, GETDATE())
      GROUP BY DATEPART(year, mi.fecha), DATEPART(isowk, mi.fecha)
      ORDER BY anio, semana
    `);

    return result.recordset;
}

export async function crearNuevoSKU(datos: {
    marcaId?: number;
    nuevaMarca?: string;
    productoId?: number;
    nuevoProducto?: string;
    tamano: string;
    sabor: string;
    precioProveedor: number;
    precioVenta: number;
}) {
    const pool = await conectarDB();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        let currentMarcaId = datos.marcaId;
        let currentProductoId = datos.productoId;

        // 1. ¿Es una marca nueva?
        if (datos.nuevaMarca) {
            const resultMarca = await transaction.request()
                .input('nombre', sql.NVarChar, datos.nuevaMarca)
                .query(`INSERT INTO Marcas (nombre) OUTPUT INSERTED.id VALUES (@nombre)`);
            currentMarcaId = resultMarca.recordset[0].id;
        }

        // 2. ¿Es un producto nuevo?
        if (datos.nuevoProducto) {
            const resultProd = await transaction.request()
                .input('nombre', sql.NVarChar, datos.nuevoProducto)
                .input('marca_id', sql.Int, currentMarcaId)
                .query(`INSERT INTO Productos (nombre, marca_id) OUTPUT INSERTED.id VALUES (@nombre, @marca_id)`);
            currentProductoId = resultProd.recordset[0].id;
        }

        // 3. Crear el SKU final (El ID generado aquí ES tu nuevo SKU)
        const resultSku = await transaction.request()
            .input('productoId', sql.Int, currentProductoId)
            .input('sabor', sql.NVarChar, datos.sabor)
            .input('tamano', sql.NVarChar, datos.tamano)
            .input('precioVenta', sql.Decimal(10, 2), datos.precioVenta)
            .input('precioProveedor', sql.Decimal(10, 2), datos.precioProveedor)
            .query(`
        INSERT INTO SKUs (producto_id, sabor, tamano, precio_venta, precio_proveedor, stock) 
        OUTPUT INSERTED.id 
        VALUES (@productoId, @sabor, @tamano, @precioVenta, @precioProveedor, 0)
      `);

        await transaction.commit();
        revalidatePath('/admin/inventario');

        return { success: true, newSkuId: resultSku.recordset[0].id };
    } catch (error: unknown) {
        if (error instanceof Error) {
            await transaction.rollback();
            console.error("Error al crear SKU:", error);
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Error desconocido' };
    }
}