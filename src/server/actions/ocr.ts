'use server';

import createImageAnalysisClient, { isUnexpected } from '@azure-rest/ai-vision-image-analysis';
import { isAdmin, UNAUTHORIZED } from '@/server/auth/dal';
import { isRateLimited } from '@/server/rate-limit';
import type { ActionResult } from '@/lib/validation';

const DATA_URL = /^data:image\/(jpeg|png|webp);base64,/;
const MAX_BYTES = 900 * 1024; // el límite del body de Server Actions es 1 MB

/** Envía la foto de una etiqueta a Azure Vision (OCR). Solo para administradores. */
export async function analizarEtiquetaOCR(dataUrl: string): Promise<ActionResult<{ texto: string }>> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  // Evita que una sesión robada o un bucle consuma créditos de Azure.
  if (isRateLimited('ocr', 30, 60_000)) {
    return { success: false, error: 'Demasiadas lecturas seguidas. Espera un minuto.' };
  }

  if (typeof dataUrl !== 'string' || !DATA_URL.test(dataUrl)) {
    return { success: false, error: 'La imagen debe ser JPG, PNG o WebP.' };
  }

  const image = Buffer.from(dataUrl.replace(DATA_URL, ''), 'base64');
  if (image.length === 0 || image.length > MAX_BYTES) {
    return { success: false, error: 'La imagen es demasiado grande. Acércate a la etiqueta e intenta de nuevo.' };
  }

  const endpoint = process.env.AZURE_VISION_ENDPOINT;
  const key = process.env.AZURE_VISION_KEY;
  if (!endpoint || !key) {
    console.error('Faltan AZURE_VISION_ENDPOINT / AZURE_VISION_KEY.');
    return { success: false, error: 'El lector de etiquetas no está configurado.' };
  }

  try {
    const client = createImageAnalysisClient(endpoint, { key });
    const result = await client.path('/imageanalysis:analyze').post({
      body: image,
      queryParameters: { features: ['Read'] },
      contentType: 'application/octet-stream',
    });

    if (isUnexpected(result)) {
      console.error('Azure Vision respondió con error:', result.body.error?.message ?? result.status);
      return { success: false, error: 'El servicio de lectura no respondió. Intenta de nuevo.' };
    }

    const lineas = (result.body.readResult?.blocks ?? []).flatMap((block) => block.lines.map((l) => l.text));
    return { success: true, texto: lineas.join('\n') };
  } catch (error) {
    console.error('Error en OCR:', error);
    return { success: false, error: 'No se pudo leer la etiqueta. Intenta de nuevo.' };
  }
}
