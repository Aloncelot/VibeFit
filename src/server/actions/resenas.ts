'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { getPool, sql } from '@/server/db';
import { getCliente } from '@/server/auth/cliente';
import { avisarAdmin } from '@/server/email';
import { clientIp, isRateLimited } from '@/server/rate-limit';
import { isInt } from '@/lib/validation';

export interface ResenaState {
  ok?: boolean;
  error?: string;
}

/** Crea o actualiza la reseña del cliente (una por cuenta). */
export async function guardarResena(_prev: ResenaState, formData: FormData): Promise<ResenaState> {
  const cliente = await getCliente();
  if (!cliente) return { error: 'Inicia sesión para dejar tu reseña.' };
  if (isRateLimited(`resena:${cliente.id}:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: 'Ya editaste tu reseña varias veces. Intenta más tarde.' };
  }

  const calificacion = Number(formData.get('calificacion'));
  const comentario = String(formData.get('comentario') ?? '').trim().replace(/\s+/g, ' ');
  if (!isInt(calificacion, 1, 5)) return { error: 'Elige de 1 a 5 estrellas.' };
  if (comentario.length < 10) return { error: 'Cuéntanos un poco más (mínimo 10 caracteres).' };
  if (comentario.length > 600) return { error: 'La reseña puede tener hasta 600 caracteres.' };

  try {
    const pool = await getPool();
    await pool.request()
      .input('clienteId', sql.Int, cliente.id)
      .input('calificacion', sql.TinyInt, calificacion)
      .input('comentario', sql.NVarChar(600), comentario)
      .query(`
        MERGE Resenas AS t
        USING (SELECT @clienteId AS cliente_id) AS src ON t.cliente_id = src.cliente_id
        WHEN MATCHED THEN UPDATE SET calificacion = @calificacion, comentario = @comentario, actualizada_en = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT (cliente_id, calificacion, comentario) VALUES (@clienteId, @calificacion, @comentario);
      `);
  } catch (error) {
    console.error('No se pudo guardar la reseña:', error);
    return { error: 'No se pudo publicar tu reseña. Intenta de nuevo.' };
  }

  after(() => avisarAdmin(`Nueva reseña (${calificacion}★) de ${cliente.nombre}`, `${comentario}\n\nModérala en /admin/resenas`));
  revalidatePath('/resenas');
  revalidatePath('/');
  return { ok: true };
}

export async function borrarMiResena(): Promise<ResenaState> {
  const cliente = await getCliente();
  if (!cliente) return { error: 'Inicia sesión.' };
  try {
    const pool = await getPool();
    await pool.request().input('clienteId', sql.Int, cliente.id).query(`DELETE FROM Resenas WHERE cliente_id = @clienteId`);
    revalidatePath('/resenas');
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    console.error('No se pudo borrar la reseña:', error);
    return { error: 'No se pudo borrar tu reseña.' };
  }
}
