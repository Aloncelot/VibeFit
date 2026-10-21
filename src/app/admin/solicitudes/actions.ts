'use server';

import { revalidatePath } from 'next/cache';
import { getPool, sql } from '@/server/db';
import { isAdmin, UNAUTHORIZED } from '@/server/auth/dal';
import { isId, oneOf, toActionError, type ActionResult } from '@/lib/validation';

const ESTADOS = ['NUEVA', 'REVISADA', 'ATENDIDA', 'DESCARTADA'] as const;

export async function cambiarEstadoSolicitud(id: number, estado: (typeof ESTADOS)[number]): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!isId(id) || !oneOf(estado, ESTADOS)) return { success: false, error: 'Datos inválidos.' };
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('estado', sql.VarChar(12), estado)
      .query(`UPDATE Solicitudes_Producto SET estado = @estado WHERE id = @id`);
    revalidatePath('/admin', 'layout');
    return { success: true };
  } catch (error) {
    return toActionError(error, 'No se pudo actualizar la solicitud.');
  }
}
