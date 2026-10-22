import type { Metadata } from 'next';
import Link from 'next/link';
import RecetaForm from '../receta-form';
import styles from '../../admin.module.css';

export const metadata: Metadata = { title: 'Nueva receta' };

export default function NuevaRecetaPage() {
  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <Link href="/admin/recetas" className={styles.muted}>
            ← Recetas
          </Link>
          <h1>Nueva receta</h1>
        </div>
      </div>
      <RecetaForm />
    </main>
  );
}
