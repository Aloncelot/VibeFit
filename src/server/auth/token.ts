// Sin 'server-only' a propósito: este módulo también lo usa src/proxy.ts.
import { createHmac, timingSafeEqual } from 'node:crypto';

/* ----------------------------- Admin ----------------------------- */

export const SESSION_COOKIE = 'vibefit_admin';
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas

/* ---------------------------- Clientes ---------------------------- */

export const CLIENTE_COOKIE = 'vibefit_cliente';
export const CLIENTE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export interface ClienteSesion {
  id: number;
  nombre: string;
}

type Payload =
  | { sub: 'admin'; exp: number }
  | { sub: 'cliente'; exp: number; id: number; nombre: string };

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET no está definido o es menor a 32 caracteres.');
  }
  return secret;
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

function createToken(payload: Payload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data)}`;
}

/** Devuelve el contenido solo si la firma es válida y el token no ha expirado. */
function readToken(token: string | undefined): Payload | null {
  if (!token) return null;
  const [data, signature] = token.split('.');
  if (!data || !signature) return null;

  let expected: Buffer;
  try {
    expected = Buffer.from(sign(data));
  } catch (error) {
    console.error(error);
    return null; // sin SESSION_SECRET nadie entra, pero la app no se cae
  }
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as Payload;
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

const now = () => Math.floor(Date.now() / 1000);

export function createSessionToken(): string {
  return createToken({ sub: 'admin', exp: now() + SESSION_MAX_AGE });
}

export function verifySessionToken(token: string | undefined): boolean {
  return readToken(token)?.sub === 'admin';
}

export function createClienteToken(cliente: ClienteSesion): string {
  return createToken({ sub: 'cliente', exp: now() + CLIENTE_MAX_AGE, id: cliente.id, nombre: cliente.nombre });
}

/** Una sesión de admin nunca es válida como cliente (y al revés): se distingue por `sub`. */
export function readClienteToken(token: string | undefined): ClienteSesion | null {
  const payload = readToken(token);
  if (payload?.sub !== 'cliente' || !Number.isInteger(payload.id)) return null;
  return { id: payload.id, nombre: payload.nombre };
}
