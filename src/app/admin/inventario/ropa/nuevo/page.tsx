import type { Metadata } from 'next';
import { getMarcasRopa } from '@/server/queries/admin';
import AgregarRopaClient from './agregar-ropa-client';
import styles from '../../../admin.module.css';

export const metadata: Metadata = { title: 'Alta de colección' };

export default async function NuevaRopaPage() {
  const marcas = await getMarcasRopa();

  return (
    <main className={styles.page} style={{ maxWidth: 960 }}>
      <div className={styles.pageHead}>
        <h1>Alta de colección</h1>
      </div>
      <AgregarRopaClient marcasBD={marcas} />
    </main>
  );
}
