import 'server-only';

/**
 * Envía un correo con la API REST de EmailJS desde el servidor.
 * Las claves nunca llegan al navegador (no usan NEXT_PUBLIC_).
 * En EmailJS: Account → Security → activar "Allow EmailJS API for non-browser applications".
 */
export function emailjsConfigurado(templateId: string | undefined): templateId is string {
  return Boolean(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PUBLIC_KEY && templateId);
}

export async function enviarEmailJS(templateId: string, params: Record<string, string>): Promise<void> {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      // Opcional pero recomendado: con la Private Key nadie más puede usar tu cuenta para enviar.
      ...(process.env.EMAILJS_PRIVATE_KEY ? { accessToken: process.env.EMAILJS_PRIVATE_KEY } : {}),
      template_params: params,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`EmailJS respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}
