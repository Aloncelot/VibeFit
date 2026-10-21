'use server';

import { revalidatePath } from 'next/cache';
import { getPool, sql } from '@/server/db';
import { isAdmin, UNAUTHORIZED } from '@/server/auth/dal';
import { isId, toActionError, type ActionResult } from '@/lib/validation';

/** Oculta o vuelve a mostrar una reseña en la tienda (no la borra). */
export async function cambiarVisibilidadResena(id: number, visible: boolean): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!isId(id) || typeof visible !== 'boolean') return { success: false, error: 'Datos inválidos.' };
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).input('visible', sql.Bit, visible)
      .query(`UPDATE Resenas SET visible = @visible WHERE id = @id`);
    revalidatePath('/admin/resenas');
    revalidatePath('/resenas');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo actualizar la reseña.');
  }
}
