import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySessionToken } from './token';

/** Lee y valida la cookie de sesión una sola vez por render. */
export const isAdmin = cache(async (): Promise<boolean> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
});

/** Para páginas y consultas de admin: redirige a /login si no hay sesión. */
export async function verifyAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/login');
}

export const UNAUTHORIZED = {
  success: false as const,
  error: 'Tu sesión expiró. Vuelve a iniciar sesión.',
};
