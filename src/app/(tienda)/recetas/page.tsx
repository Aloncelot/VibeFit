import type { Metadata } from 'next';
import Link from 'next/link';
import { OBJETIVOS, formatFecha, type Objetivo } from '@/content/recetas';
import { getRecetas } from '@/server/queries/recetas';
import MacroBar from '@/components/recetas/macro-bar';
import styles from '@/components/recetas/recetas.module.css';

export const metadata: Metadata = {
  title: 'Recetas fit',
  description: 'Recetas altas en proteína para definir o ganar masa muscular, con macros por porción.',
};

const FILTROS: { value?: Objetivo; label: string }[] = [
  { label: 'Todas' },
  { value: 'definicion', label: OBJETIVOS.definicion.label },
  { value: 'volumen', label: OBJETIVOS.volumen.label },
];

export default async function RecetasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { objetivo: raw } = await searchParams;
  const objetivo = raw === 'definicion' || raw === 'volumen' ? raw : undefined;
  const todas = await getRecetas();
  const recetas = objetivo ? todas.filter((r) => r.objetivo === objetivo) : todas;

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.intro}>
          <h1>Recetas</h1>
          <div>
            <p>
              {objetivo
                ? OBJETIVOS[objetivo].descripcion
                : 'Comida real con los macros contados por porción. Unas para definir, otras para ganar masa muscular.'}
            </p>
            <ul className={styles.tabs} aria-label="Filtrar por objetivo">
              {FILTROS.map((f) => (
                <li key={f.label}>
                  <Link
                    href={f.value ? `/recetas?objetivo=${f.value}` : '/recetas'}
                    aria-current={objetivo === f.value ? 'true' : undefined}
                    scroll={false}
                  >
                    {f.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </header>

        {recetas.length === 0 && <p className={styles.rowSummary}>Muy pronto publicaremos nuevas recetas.</p>}

        <ul className={styles.list}>
          {recetas.map((receta) => (
            <li key={receta.slug} className={styles.row}>
              <div>
                <time dateTime={receta.publicada} className={styles.date}>
                  {formatFecha(receta.publicada)}
                </time>
                <br />
                <span className={styles.goal} data-objetivo={receta.objetivo}>
                  {OBJETIVOS[receta.objetivo].label}
                </span>
              </div>
              <div>
                <h2 className={styles.rowTitle}>
                  <Link href={`/recetas/${receta.slug}`}>{receta.titulo}</Link>
                </h2>
                <p className={styles.rowSummary}>{receta.resumen}</p>
              </div>
              <div>
                <p className={styles.kcal}>
                  <span className="num">{receta.macros.kcal}</span> kcal por porción
                </p>
                <MacroBar macros={receta.macros} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
