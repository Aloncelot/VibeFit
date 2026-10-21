import type { Metadata } from 'next';
import { getAnalisis, PERIODOS_ANALISIS } from '@/server/queries/admin';
import AnalisisClient from './analisis-client';
import styles from '../admin.module.css';

export const metadata: Metadata = { title: 'Análisis ABC' };

export default async function AnalisisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { meses: raw } = await searchParams;
  const parsed = Number(raw);
  const meses = (PERIODOS_ANALISIS as readonly number[]).includes(parsed) ? parsed : 3;

  // Ambas consultas en paralelo y en el servidor (antes eran Server Actions públicas y se pedían dos veces).
  const { abc, tendencia } = await getAnalisis(meses);

  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <h1>Análisis de inversión</h1>
      </div>
      <AnalisisClient data={abc} tendencia={tendencia} periodo={meses} periodos={[...PERIODOS_ANALISIS]} />
    </main>
  );
}
