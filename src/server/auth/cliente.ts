import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CLIENTE_COOKIE, readClienteToken, type ClienteSesion } from './token';

/** Cliente con sesión iniciada (o null). Se lee una sola vez por render. */
export const getCliente = cache(async (): Promise<ClienteSesion | null> => {
  return readClienteToken((await cookies()).get(CLIENTE_COOKIE)?.value);
});

/** Para páginas de la cuenta: manda a /entrar si no hay sesión. */
export async function requireCliente(desde: string): Promise<ClienteSesion> {
  const cliente = await getCliente();
  if (!cliente) redirect(`/entrar?desde=${encodeURIComponent(desde)}`);
  return cliente;
}

export const SIN_SESION = {
  success: false as const,
  error: 'Inicia sesión para usar esta función.',
};

/** Solo rutas internas: evita redirecciones abiertas a otros sitios. */
export function rutaSegura(value: unknown, fallback = '/'): string {
  return typeof value === 'string' && /^\/(?!\/)[\w\-/?=&%.]*$/.test(value) && !value.startsWith('/admin')
    ? value
    : fallback;
}
