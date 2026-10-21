'use server';

import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from '@/server/auth/token';
import { clientIp, isRateLimited, resetRateLimit } from '@/server/rate-limit';

export interface LoginState {
  error?: string;
}

const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;

function passwordMatches(input: string, expected: string): boolean {
  // Se comparan hashes de longitud fija para no filtrar la longitud ni usar ===.
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

function safeRedirectPath(value: FormDataEntryValue | null): string {
  // Solo se permite volver a rutas internas del panel (evita open redirect).
  return typeof value === 'string' && /^\/admin(\/[\w\-/]*)?$/.test(value) ? value : '/admin';
}

export async function iniciarSesion(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || (process.env.SESSION_SECRET?.length ?? 0) < 32) {
    console.error('Faltan ADMIN_PASSWORD o SESSION_SECRET (mínimo 32 caracteres) en el entorno.');
    return { error: 'El acceso de administrador no está configurado.' };
  }

  const key = `login:${await clientIp()}`;
  if (isRateLimited(key, MAX_INTENTOS, VENTANA_MS)) {
    return { error: 'Demasiados intentos. Espera 15 minutos y vuelve a intentarlo.' };
  }

  const password = formData.get('password');
  if (typeof password !== 'string' || !passwordMatches(password, expected)) {
    // Pequeña pausa para frenar ataques de fuerza bruta.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { error: 'Contraseña incorrecta.' };
  }

  resetRateLimit(key);
  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  redirect(safeRedirectPath(formData.get('desde')));
}

export async function cerrarSesion() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
