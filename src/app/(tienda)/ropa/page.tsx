import type { Metadata } from 'next';
import ApparelCatalog from '@/components/store/apparel-catalog';
import { first } from '@/components/store/url';

export const metadata: Metadata = {
  title: 'Ropa de gym',
  description: 'Gymshark, YoungLA y Darc Sport originales: playeras, tops, shorts y joggers.',
};

export default async function RopaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = { marca: first(sp.marca), q: first(sp.q), genero: first(sp.genero), tipo: first(sp.tipo) };
  return <ApparelCatalog basePath="/ropa" params={params} />;
}
