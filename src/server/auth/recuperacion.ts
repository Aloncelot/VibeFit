import 'server-only';
import { createHash } from 'node:crypto';
import { getPool, sql } from '@/server/db';

/** Token de 32 bytes en base64url (43 caracteres). */
export const TOKEN_VALIDO = /^[\w-]{43}$/;

/** Solo se guarda este hash en la base; el token real viaja únicamente en el correo. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** ¿El enlace sigue vigente? Lo usa la página /restablecer antes de mostrar el formulario. */
export async function tokenVigente(token: string): Promise<boolean> {
  if (!TOKEN_VALIDO.test(token)) return false;
  try {
    const pool = await getPool();
    const r = await pool.request()
      .input('hash', sql.VarChar(64), hashToken(token))
      .query(`SELECT 1 AS ok FROM Recuperaciones_Password
              WHERE token_hash = @hash AND usado_en IS NULL AND expira_en > SYSUTCDATETIME()`);
    return r.recordset.length > 0;
  } catch (error) {
    console.error('No se pudo revisar el enlace de recuperación:', error);
    return false;
  }
}

