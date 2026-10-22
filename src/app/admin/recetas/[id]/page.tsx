import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRecetaAdmin } from '@/server/queries/recetas';
import RecetaForm from '../receta-form';
import styles from '../../admin.module.css';

export const metadata: Metadata = { title: 'Editar receta' };

export default async function EditarRecetaPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const receta = await getRecetaAdmin(id);
  if (!receta) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <Link href="/admin/recetas" className={styles.muted}>
            ← Recetas
          </Link>
          <h1>Editar receta</h1>
        </div>
      </div>
      <RecetaForm receta={receta} />
    </main>
  );
}
