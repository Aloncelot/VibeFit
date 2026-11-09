'use server';

import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { getPool, sql, withTransaction } from '@/server/db';
import { hashPassword } from '@/server/auth/password';
import { hashToken, TOKEN_VALIDO } from '@/server/auth/recuperacion';
import { emailjsConfigurado, enviarEmailJS } from '@/server/email/emailjs';
import { clientIp, isRateLimited } from '@/server/rate-limit';

export interface RecuperarState {
  error?: string;
  enviado?: boolean;
  email?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MINUTOS = 30;

/** URL pública del sitio para armar el enlace. Nunca se toma del encabezado Host (evita enlaces falsos). */
function sitio(): string {
  const url =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

/**
 * Paso 1: el cliente escribe su correo. Si existe una cuenta, le mandamos un enlace de un solo uso.
 * La respuesta es la misma exista o no la cuenta, para no revelar qué correos están registrados.
 */
export async function solicitarRecuperacion(_prev: RecuperarState, formData: FormData): Promise<RecuperarState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const templateId = process.env.EMAILJS_TEMPLATE_RECUPERAR_ID;

  if (!EMAIL.test(email) || email.length > 254) return { email, error: 'Revisa tu correo electrónico.' };
  if (!emailjsConfigurado(templateId)) {
    console.error('Recuperación de contraseña: faltan variables EMAILJS_* en el entorno.');
    return { email, error: 'La recuperación de contraseña no está disponible por ahora. Escríbenos por WhatsApp.' };
  }
  const ip = await clientIp();
  if (isRateLimited(`recuperar:${ip}`, 5, 60 * 60 * 1000) || isRateLimited(`recuperar:${email}`, 3, 60 * 60 * 1000)) {
    return { email, error: 'Ya pediste varios enlaces. Revisa tu correo (y spam) o intenta en una hora.' };
  }

  try {
    const pool = await getPool();
    const r = await pool.request()
      .input('email', sql.NVarChar(254), email)
      .query<{ id: number; nombre: string }>(`SELECT id, nombre FROM Clientes WHERE email = @email`);
    const cliente = r.recordset[0];

    if (cliente) {
      const token = randomBytes(32).toString('base64url');
      // Un enlace nuevo invalida los anteriores que sigan pendientes.
      await pool.request()
        .input('clienteId', sql.Int, cliente.id)
        .input('hash', sql.VarChar(64), hashToken(token))
        .input('minutos', sql.Int, MINUTOS)
        .query(`
          UPDATE Recuperaciones_Password SET usado_en = SYSUTCDATETIME()
            WHERE cliente_id = @clienteId AND usado_en IS NULL;
          INSERT INTO Recuperaciones_Password (cliente_id, token_hash, expira_en)
            VALUES (@clienteId, @hash, DATEADD(MINUTE, @minutos, SYSUTCDATETIME()));
        `);

      await enviarEmailJS(templateId, {
        to_email: email,
        to_name: cliente.nombre,
        link: `${sitio()}/restablecer?token=${token}`,
        minutos: String(MINUTOS),
      });
    }
  } catch (error) {
    console.error('No se pudo enviar el enlace de recuperación:', error);
    return { email, error: 'No pudimos enviar el correo. Intenta de nuevo en unos minutos.' };
  }

  return { enviado: true, email };
}

export interface RestablecerState {
  error?: string;
  vencido?: boolean;
}

/** Paso 2: el cliente abre el enlace y elige una contraseña nueva. El enlace se gasta al usarlo. */
export async function restablecerPassword(_prev: RestablecerState, formData: FormData): Promise<RestablecerState> {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmar = String(formData.get('confirmar') ?? '');

  if (isRateLimited(`restablecer:${await clientIp()}`, 10, 15 * 60 * 1000)) {
    return { error: 'Demasiados intentos. Espera 15 minutos.' };
  }
  if (!TOKEN_VALIDO.test(token)) return { vencido: true };
  if (password.length < 8 || password.length > 128) return { error: 'La contraseña debe tener entre 8 y 128 caracteres.' };
  if (password !== confirmar) return { error: 'Las contraseñas no coinciden.' };

  let cambiada = false;
  try {
    const hash = await hashPassword(password);
    cambiada = await withTransaction(async (tx) => {
      // Marcar como usado y validar en una sola sentencia: el mismo enlace no sirve dos veces.
      const r = await tx.request()
        .input('token', sql.VarChar(64), hashToken(token))
        .query<{ cliente_id: number }>(`
          UPDATE Recuperaciones_Password SET usado_en = SYSUTCDATETIME()
          OUTPUT INSERTED.cliente_id
          WHERE token_hash = @token AND usado_en IS NULL AND expira_en > SYSUTCDATETIME()
        `);
      const clienteId = r.recordset[0]?.cliente_id;
      if (!clienteId) return false;
      await tx.request()
        .input('id', sql.Int, clienteId)
        .input('hash', sql.VarChar(200), hash)
        .query(`UPDATE Clientes SET password_hash = @hash WHERE id = @id`);
      return true;
    });
  } catch (error) {
    console.error('No se pudo restablecer la contraseña:', error);
    return { error: 'No se pudo cambiar la contraseña. Intenta de nuevo.' };
  }

  if (!cambiada) return { vencido: true };
  redirect('/entrar?restablecida=1');
}
