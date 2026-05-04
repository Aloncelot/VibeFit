// app/cart/actions.ts
'use server';

import { conectarDB } from '@/lib/db';
import sql from 'mssql';
import { revalidatePath } from 'next/cache';

export async function procesarCompraMock(carrito: { id: number, cantidad: number }[]) {
    const pool = await conectarDB();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        for (const item of carrito) {
            // Verificación de concurrencia: Revisamos que el stock siga disponible
            const stockCheck = await transaction.request()
                .input('skuId', sql.Int, item.id)
                .query(`SELECT stock FROM SKUs WHERE id = @skuId`);

            if (stockCheck.recordset.length === 0 || stockCheck.recordset[0].stock < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto ID: ${item.id}`);
            }

            // Restar al stock
            await transaction.request()
                .input('cantidad', sql.Int, item.cantidad)
                .input('skuId', sql.Int, item.id)
                .query(`
          UPDATE SKUs 
          SET stock = stock - @cantidad 
          WHERE id = @skuId
        `);

            // Huella de auditoría: Registramos la salida como VENTA
            await transaction.request()
                .input('skuId', sql.Int, item.id)
                .input('cantidad', sql.Int, item.cantidad)
                .input('tipo', sql.NVarChar, 'VENTA')
                .query(`
          INSERT INTO Movimientos_Inventario (sku_id, cantidad, tipo_movimiento) 
          VALUES (@skuId, @cantidad, @tipo)
        `);
        }

        await transaction.commit();

        // Refrescamos las páginas clave para que los clientes y tú vean el nuevo stock
        revalidatePath('/suplementos');
        revalidatePath('/admin/inventario');

        return { success: true };

    } catch (error: unknown) {
        await transaction.rollback();
        if (error instanceof Error) {
            console.error("Error en compra mock:", error);
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Error desconocido durante la transacción.' };
    }
}