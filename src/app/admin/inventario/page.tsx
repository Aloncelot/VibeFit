import type { Metadata } from 'next';
import { getInventarioSuplementos } from '@/server/queries/admin';
import InventarioClient from './inventario-client';
import styles from '../admin.module.css';

export const metadata: Metadata = { title: 'Inventario de suplementos' };

export default async function InventarioPage() {
  const items = await getInventarioSuplementos();

  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <h1>Inventario de suplementos</h1>
      </div>
      <InventarioClient items={items} />
    </main>
  );
}
