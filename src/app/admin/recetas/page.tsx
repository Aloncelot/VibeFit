import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getRecetasAdmin } from '@/server/queries/recetas';
import { OBJETIVOS, formatFecha, type RecetaAdmin } from '@/content/recetas';
import AccionesReceta from './acciones-receta';
import styles from '../admin.module.css';

export const metadata: Metadata = { title: 'Recetas' };

const AVISOS: Record<string, string> = {
  nueva: 'Receta publicada. Ya aparece en la tienda.',
  editada: 'Cambios guardados. La tienda ya muestra la versión nueva.',
};

export default async function RecetasAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { guardada } = await searchParams;
  const aviso = typeof guardada === 'string' ? AVISOS[guardada] : undefined;

  let recetas: RecetaAdmin[] | null = null;
  try {
    recetas = await getRecetasAdmin();
  } catch (error) {
    console.error('No se pudieron leer las recetas del panel:', error);
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1>Recetas</h1>
          <p className={styles.lead}>
            Lo que publiques aquí aparece en /recetas y la más reciente sale en la página de inicio. Ocultar la quita de la tienda sin
            borrarla.
          </p>
        </div>
        <Link href="/admin/recetas/nueva" className="btn btn-primary">
          <Plus size={18} aria-hidden /> Nueva receta
        </Link>
      </div>

      {aviso && (
        <p role="status" className={styles.ok}>
          {aviso}
        </p>
      )}

      {recetas === null ? (
        <p className={styles.lead} role="alert">
          No se pudo leer la tabla de recetas. Si es la primera vez, corre <code>npm run db:migrar</code> para crearla en Azure.
        </p>
      ) : recetas.length === 0 ? (
        <p className={styles.lead}>Todavía no hay recetas. Crea la primera con “Nueva receta”.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Receta</th>
                <th scope="col">Objetivo</th>
                <th scope="col">Publicada</th>
                <th scope="col" className={styles.right}>
                  Kcal
                </th>
                <th scope="col" className={styles.right}>
                  Proteína
                </th>
                <th scope="col">En la tienda</th>
                <th scope="col">
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {recetas.map((r) => (
                <tr key={r.id} className={r.visible ? undefined : styles.oculta}>
                  <td style={{ maxWidth: 420 }}>
                    <strong>{r.titulo}</strong>
                    <br />
                    <span className={styles.muted}>/recetas/{r.slug}</span>
                  </td>
                  <td>{OBJETIVOS[r.objetivo].label}</td>
                  <td className={styles.muted}>{formatFecha(r.publicada)}</td>
                  <td className={`num ${styles.right}`}>{r.macros.kcal}</td>
                  <td className={`num ${styles.right}`}>{r.macros.proteina} g</td>
                  <td>{r.visible ? 'Publicada' : 'Oculta'}</td>
                  <td>
                    <AccionesReceta id={r.id} slug={r.slug} titulo={r.titulo} visible={r.visible} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
