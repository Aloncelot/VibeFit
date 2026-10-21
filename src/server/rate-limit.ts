import 'server-only';
import { headers } from 'next/headers';

/**
 * Limitador en memoria por IP (ventana fija).
 * Funciona por instancia del servidor; en un despliegue con varias
 * instancias conviene moverlo a Redis/Upstash.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
}

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
