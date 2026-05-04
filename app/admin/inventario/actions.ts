'use server';

import { conectarDB } from '@/lib/db';
import sql from 'mssql';
import { revalidatePath } from 'next/cache';

export async function registrarInbound(skuId: number, cantidadInbound: number) {
  const pool = await conectarDB();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    // 1. Ajuste Relativo: Sumamos al stock existente
    await transaction.request()
      .input('cantidad', sql.Int, cantidadInbound)
      .input('skuId', sql.Int, skuId)
      .query(`
        UPDATE SKUs 
        SET stock = stock + @cantidad 
        WHERE id = @skuId
      `);
    
    // 2. Huella de Auditoría: Grabamos el movimiento exacto
    await transaction.request()
      .input('skuId', sql.Int, skuId)
      .input('cantidad', sql.Int, cantidadInbound)
      .input('tipo', sql.NVarChar, 'INBOUND')
      .query(`
        INSERT INTO Movimientos_Inventario (sku_id, cantidad, tipo_movimiento) 
        VALUES (@skuId, @cantidad, @tipo)
      `);
        
    await transaction.commit();
    
    // Refresca la tabla en pantalla instantáneamente sin recargar la página
    revalidatePath('/admin/inventario'); 
    return { success: true };

  } catch (error: any) {
    await transaction.rollback(); // Si algo falla, se deshace todo para no corromper datos
    console.error("Error en transacción de inventario:", error);
    return { success: false, error: error.message };
  }
}

export async function corregirStockFisico(skuId: number, nuevoStockTotal: number, stockAnterior: number) {
  const pool = await conectarDB();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    // 1. Calculamos la diferencia matemática (si tenías 28 y pones 3, la diferencia es -25)
    const diferencia = nuevoStockTotal - stockAnterior;

    // 2. Ajuste Absoluto: Forzamos el stock al número real que ingresaste
    await transaction.request()
      .input('nuevoStock', sql.Int, nuevoStockTotal)
      .input('skuId', sql.Int, skuId)
      .query(`
        UPDATE SKUs 
        SET stock = @nuevoStock 
        WHERE id = @skuId
      `);
    
    // 3. Huella de Auditoría: Registramos el ajuste
    await transaction.request()
      .input('skuId', sql.Int, skuId)
      .input('cantidad', sql.Int, diferencia)
      .input('tipo', sql.NVarChar, 'CORRECCION')
      .query(`
        INSERT INTO Movimientos_Inventario (sku_id, cantidad, tipo_movimiento) 
        VALUES (@skuId, @cantidad, @tipo)
      `);
        
    await transaction.commit();
    revalidatePath('/admin/inventario'); 
    return { success: true };

  } catch (error: any) {
    await transaction.rollback();
    console.error("Error en corrección de inventario:", error);
    return { success: false, error: error.message };
  }
}

export async function actualizarPrecio(
  skuId: number,
  tipoPrecio: 'precio_proveedor' | 'precio_venta',
  nuevoPrecio: number,
  precioAnterior: number
) {
  const pool = await conectarDB();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    // 1. Actualizar el precio en la tabla SKUs
    // Aseguramos que el nombre de la columna sea válido para evitar inyección SQL
    const columna = tipoPrecio === 'precio_proveedor' ? 'precio_proveedor' : 'precio_venta';
    
    await transaction.request()
      .input('nuevoPrecio', sql.Decimal(18, 2), nuevoPrecio)
      .input('skuId', sql.Int, skuId)
      .query(`
        UPDATE SKUs 
        SET ${columna} = @nuevoPrecio 
        WHERE id = @skuId
      `);
    
    // 2. Registrar en el historial de precios
    await transaction.request()
      .input('skuId', sql.Int, skuId)
      .input('tipoPrecio', sql.NVarChar(50), tipoPrecio)
      .input('precioAnterior', sql.Decimal(18, 2), precioAnterior)
      .input('nuevoPrecio', sql.Decimal(18, 2), nuevoPrecio)
      .query(`
        INSERT INTO HistorialPrecios (sku_id, tipo_precio, precio_anterior, precio_nuevo) 
        VALUES (@skuId, @tipoPrecio, @precioAnterior, @nuevoPrecio)
      `);
        
    await transaction.commit();
    revalidatePath('/admin/inventario'); 
    return { success: true };

  } catch (error: any) {
    await transaction.rollback();
    console.error("Error en actualización de precio:", error);
    return { success: false, error: error.message };
  }
}

export async function obtenerHistorialPrecio(skuId: number) {
  try {
    const pool = await conectarDB();
    const result = await pool.request()
      .input('skuId', sql.Int, skuId)
      .query(`
        SELECT 
          id, 
          tipo_precio, 
          precio_anterior, 
          precio_nuevo, 
          fecha_cambio 
        FROM HistorialPrecios 
        WHERE sku_id = @skuId 
        ORDER BY fecha_cambio DESC
      `);
      
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error("Error obteniendo historial de precios:", error);
    return { success: false, error: error.message };
  }
}