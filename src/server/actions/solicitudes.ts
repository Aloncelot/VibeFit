'use server';

import { after } from 'next/server';
import { getPool, sql } from '@/server/db';
import { getCliente } from '@/server/auth/cliente';
import { avisarAdmin } from '@/server/email';
import { clientIp, isRateLimited } from '@/server/rate-limit';
import { cleanText, oneOf } from '@/lib/validation';

export interface SolicitudState {
  ok?: boolean;
  error?: string;
}

const SECCIONES = ['suplementos', 'ropa', 'accesorios'] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** "¿No encuentras lo que buscas?": la solicitud llega a /admin/solicitudes. */
export async function enviarSolicitudProducto(_prev: SolicitudState, formData: FormData): Promise<SolicitudState> {
  if (isRateLimited(`solicitud:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: 'Ya recibimos varias solicitudes desde tu conexión. Intenta más tarde.' };
  }

  // Campo trampa: los bots lo llenan, las personas no lo ven.
  if (String(formData.get('sitio') ?? '') !== '') return { ok: true };

  const seccion = formData.get('seccion');
  const producto = cleanText(formData.get('producto'), 120);
  const marca = cleanText(formData.get('marca'), 80);
  const detalle = cleanText(formData.get('detalle'), 400);
  const cliente = await getCliente();
  const emailRaw = String(formData.get('email') ?? '').trim().toLowerCase();
  const email = emailRaw && EMAIL.test(emailRaw) && emailRaw.length <= 254 ? emailRaw : null;

  if (!oneOf(seccion, SECCIONES)) return { error: 'Sección inválida.' };
  if (!producto) return { error: 'Escribe qué producto buscas.' };
  if (emailRaw && !email) return { error: 'Revisa tu correo electrónico.' };

  try {
    const pool = await getPool();
    await pool.request()
      .input('clienteId', sql.Int, cliente?.id ?? null)
      .input('email', sql.NVarChar(254), email)
      .input('seccion', sql.VarChar(20), seccion)
      .input('producto', sql.NVarChar(120), producto)
      .input('marca', sql.NVarChar(80), marca)
      .input('detalle', sql.NVarChar(400), detalle)
      .query(`
        INSERT INTO Solicitudes_Producto (cliente_id, email, seccion, producto, marca, detalle)
        VALUES (@clienteId, @email, @seccion, @producto, @marca, @detalle)
      `);
  } catch (error) {
    console.error('No se pudo guardar la solicitud:', error);
    return { error: 'No se pudo enviar tu solicitud. Intenta de nuevo.' };
  }

  // El correo al admin se manda después de responder, para no hacer esperar al cliente.
  after(() =>
    avisarAdmin(
      `Nueva solicitud de producto: ${producto}`,
      [
        `Sección: ${seccion}`,
        `Producto: ${producto}`,
        marca ? `Marca: ${marca}` : null,
        detalle ? `Detalle: ${detalle}` : null,
        cliente ? `Cliente: ${cliente.nombre} (#${cliente.id})` : email ? `Correo: ${email}` : 'Invitado sin correo',
        '',
        'Revísala en /admin/solicitudes',
      ]
        .filter((l) => l !== null)
        .join('\n'),
    ),
  );

  return { ok: true };
}
