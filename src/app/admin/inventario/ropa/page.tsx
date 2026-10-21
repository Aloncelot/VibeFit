import type { Metadata } from 'next';
import { getInventarioRopa } from '@/server/queries/admin';
import InventarioRopaClient from './inventario-ropa-client';
import styles from '../../admin.module.css';

export const metadata: Metadata = { title: 'Inventario de ropa' };

export default async function InventarioRopaPage() {
  const items = await getInventarioRopa();

  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <h1>Inventario de ropa</h1>
      </div>
      <InventarioRopaClient items={items} />
    </main>
  );
}
