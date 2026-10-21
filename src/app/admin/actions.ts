'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { verifyAdmin } from '@/server/auth/dal';
import { CATALOGO_TAG } from '@/server/queries/catalogo';

/** Vuelve a leer stock y precios de la base de datos (útil si se editó directo en Azure). */
export async function refrescarTienda() {
  await verifyAdmin();
  revalidateTag(CATALOGO_TAG, { expire: 0 });
  redirect('/admin?tienda=actualizada');
}
