import 'server-only';

/**
 * Envío de correo con Resend (https://resend.com) usando su API HTTP, sin dependencias.
 * Si faltan RESEND_API_KEY / EMAIL_FROM, no envía nada: los avisos siguen apareciendo en el panel.
 */
export async function enviarCorreo(para: string, asunto: string, texto: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from || !para) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [para], subject: asunto, text: texto }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error('Resend respondió', res.status, await res.text());
    return res.ok;
  } catch (error) {
    console.error('No se pudo enviar el correo:', error);
    return false;
  }
}

/** Correo al administrador (ADMIN_EMAIL). Nunca usa direcciones que vengan del navegador. */
export function avisarAdmin(asunto: string, texto: string) {
  const admin = process.env.ADMIN_EMAIL;
  return admin ? enviarCorreo(admin, asunto, texto) : Promise.resolve(false);
}
