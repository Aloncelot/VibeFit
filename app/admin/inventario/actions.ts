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