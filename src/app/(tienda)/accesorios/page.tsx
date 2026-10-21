import type { Metadata } from 'next';
import ApparelCatalog from '@/components/store/apparel-catalog';
import { first } from '@/components/store/url';

export const metadata: Metadata = {
  title: 'Accesorios de gym',
  description: 'Shakers, straps, cinturones y accesorios para entrenar.',
};

export default async function AccesoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = { marca: first(sp.marca), q: first(sp.q) };
  return <ApparelCatalog basePath="/accesorios" params={params} />;
}
