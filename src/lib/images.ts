// Mantener sincronizado con images.remotePatterns en next.config.ts.
const OPTIMIZED_IMAGE_HOSTS = new Set(['res.cloudinary.com', 'cdn.shopify.com']);

/**
 * Las imágenes de hosts no permitidos se sirven sin optimizar en lugar de
 * romper la página (next/image lanza error con hosts no configurados).
 */
export function shouldSkipOptimization(src: string): boolean {
  if (src.startsWith('/')) return false;
  try {
    return !OPTIMIZED_IMAGE_HOSTS.has(new URL(src).hostname);
  } catch {
    return true;
  }
}
