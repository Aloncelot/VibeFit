// app/admin/inventario/ropa/actions.ts
'use server';

import { conectarDB } from '@/lib/db';
import sql from 'mssql';
import { revalidatePath } from 'next/cache';

export async function registrarVentaEscaneo(skuId: number) {
    const pool = await conectarDB();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Restamos 1 al stock
        await transaction.request()
            .input('skuId', sql.Int, skuId)
            .query(`UPDATE SKUs SET stock = stock - 1 WHERE id = @skuId AND stock > 0`);

        // 2. Registramos el movimiento para auditoría
        const result = await transaction.request()
            .input('skuId', sql.Int, skuId)
            .input('cantidad', sql.Int, -1)
            .input('tipo', sql.NVarChar, 'VENTA_SCANNER')
            .query(`
                INSERT INTO Movimientos_Inventario (sku_id, cantidad, tipo_movimiento) 
                OUTPUT INSERTED.id
                VALUES (@skuId, @cantidad, @tipo)
            `);

        await transaction.commit();
        revalidatePath('/admin/inventario/ropa');

        return { success: true, movimientoId: result.recordset[0].id };
    } catch (error: unknown) {
        await transaction.rollback();
        const msg = error instanceof Error ? error.message : "Error desconocido";
        return { success: false, error: msg };
    }
}

export async function deshacerVenta(skuId: number, movimientoId: number) {
    const pool = await conectarDB();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Regresamos el stock
        await transaction.request()
            .input('skuId', sql.Int, skuId)
            .query(`UPDATE SKUs SET stock = stock + 1 WHERE id = @skuId`);

        // 2. Marcamos el movimiento como revertido
        await transaction.request()
            .input('movId', sql.Int, movimientoId)
            .query(`UPDATE Movimientos_Inventario SET tipo_movimiento = 'VENTA_REVERTIDA' WHERE id = @movId`);

        await transaction.commit();
        revalidatePath('/admin/inventario/ropa');

        return { success: true };
    } catch (error: unknown) {
        await transaction.rollback();
        return { success: false };
    }
}