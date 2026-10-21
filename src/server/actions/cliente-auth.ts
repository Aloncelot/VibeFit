'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPool, sql } from '@/server/db';
import { CLIENTE_COOKIE, CLIENTE_MAX_AGE, createClienteToken, readClienteToken } from '@/server/auth/token';
import { DUMMY_HASH, hashPassword, verifyPassword } from '@/server/auth/password';
import { rutaSegura } from '@/server/auth/cliente';
import { clientIp, isRateLimited } from '@/server/rate-limit';
import { cleanText } from '@/lib/validation';

export interface AuthState {
  error?: string;
  email?: string;
  nombre?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function abrirSesion(cliente: { id: number; nombre: string }) {
  (await cookies()).set(CLIENTE_COOKIE, createClienteToken(cliente), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CLIENTE_MAX_AGE,
    path: '/',
  });
}

function configurado(): boolean {
  return (process.env.SESSION_SECRET?.length ?? 0) >= 32;
}

export async function registrarCliente(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const nombre = cleanText(formData.get('nombre'), 80);
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const volver = { email, nombre: nombre ?? '' };

  if (!configurado()) return { ...volver, error: 'Las cuentas no están disponibles en este momento.' };
  if (isRateLimited(`registro:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { ...volver, error: 'Demasiados registros desde esta conexión. Intenta más tarde.' };
  }
  if (!nombre) return { ...volver, error: 'Escribe tu nombre.' };
  if (!EMAIL.test(email) || email.length > 254) return { ...volver, error: 'Revisa tu correo electrónico.' };
  if (password.length < 8 || password.length > 128) {
    return { ...volver, error: 'La contraseña debe tener entre 8 y 128 caracteres.' };
  }

  let cliente: { id: number; nombre: string };
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('nombre', sql.NVarChar(80), nombre)
      .input('email', sql.NVarChar(254), email)
      .input('hash', sql.VarChar(200), await hashPassword(password))
      .query<{ id: number }>(`
        IF EXISTS (SELECT 1 FROM Clientes WHERE email = @email) SELECT CAST(NULL AS INT) AS id
        ELSE INSERT INTO Clientes (nombre, email, password_hash) OUTPUT INSERTED.id VALUES (@nombre, @email, @hash)
      `);
    const id = result.recordset[0]?.id;
    if (!id) return { ...volver, error: 'Ya existe una cuenta con ese correo. Inicia sesión.' };
    cliente = { id, nombre };
  } catch (error) {
    console.error('Error al registrar cliente:', error);
    return { ...volver, error: 'No se pudo crear la cuenta. Intenta de nuevo.' };
  }

  await abrirSesion(cliente);
  redirect(rutaSegura(formData.get('desde')));
}

export async function iniciarSesionCliente(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!configurado()) return { email, error: 'Las cuentas no están disponibles en este momento.' };
  if (isRateLimited(`login-cliente:${await clientIp()}`, 10, 15 * 60 * 1000)) {
    return { email, error: 'Demasiados intentos. Espera 15 minutos.' };
  }

  let cliente: { id: number; nombre: string } | null = null;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(254), email)
      .query<{ id: number; nombre: string; password_hash: string }>(
        `SELECT id, nombre, password_hash FROM Clientes WHERE email = @email`,
      );
    const row = result.recordset[0];
    // Se verifica siempre un hash para no revelar si el correo existe por el tiempo de respuesta.
    const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
    if (row && ok) cliente = { id: row.id, nombre: row.nombre };
  } catch (error) {
    console.error('Error al iniciar sesión de cliente:', error);
    return { email, error: 'No se pudo iniciar sesión. Intenta de nuevo.' };
  }

  if (!cliente) return { email, error: 'Correo o contraseña incorrectos.' };

  await abrirSesion(cliente);
  redirect(rutaSegura(formData.get('desde')));
}

export async function cerrarSesionCliente() {
  (await cookies()).delete(CLIENTE_COOKIE);
  redirect('/');
}

/** Derecho de cancelación: borra la cuenta y sus datos (listas, avisos, notificaciones, reseña). */
export async function eliminarCuenta(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const token = (await cookies()).get(CLIENTE_COOKIE)?.value;
  const cliente = readClienteToken(token);
  if (!cliente) return { error: 'Tu sesión expiró. Vuelve a entrar.' };
  if (String(formData.get('confirmacion') ?? '').trim().toUpperCase() !== 'ELIMINAR') {
    return { error: 'Escribe ELIMINAR para confirmar.' };
  }

  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, cliente.id).query(`
      IF OBJECT_ID('dbo.Solicitudes_Producto', 'U') IS NOT NULL
        UPDATE Solicitudes_Producto SET email = NULL WHERE cliente_id = @id;
      DELETE FROM Clientes WHERE id = @id;
    `);
  } catch (error) {
    console.error('No se pudo eliminar la cuenta:', error);
    return { error: 'No se pudo eliminar tu cuenta. Escríbenos y lo hacemos por ti.' };
  }

  (await cookies()).delete(CLIENTE_COOKIE);
  redirect('/?cuenta=eliminada');
}
