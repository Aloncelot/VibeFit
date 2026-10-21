// Validadores pequeños para entradas de Server Actions.
// Todo lo que llega del cliente se trata como no confiable.

export function isInt(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

export function isId(value: unknown): value is number {
  return isInt(value, 1, 2_147_483_647);
}

export function isMoney(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000;
}

/** Texto recortado con longitud acotada; devuelve null si no es válido. */
export function cleanText(value: unknown, maxLength = 120): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  if (text.length === 0 || text.length > maxLength) return null;
  return text;
}

export function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2000) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function oneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}

export type ActionResult<T = object> = ({ success: true } & T) | { success: false; error: string };

/** Error de negocio cuyo mensaje sí se puede mostrar al usuario. */
export class UserFacingError extends Error {}

export function toActionError(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof UserFacingError) return { success: false, error: error.message };
  console.error(fallback, error);
  return { success: false, error: fallback };
}
