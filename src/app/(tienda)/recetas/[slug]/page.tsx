import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RECETAS, OBJETIVOS, formatFecha, getReceta } from '@/content/recetas';
import MacroBar from '@/components/recetas/macro-bar';
import styles from '@/components/recetas/recetas.module.css';

type Props = { params: Promise<{ slug: string }> };

// Las recetas se generan como páginas estáticas en el build.
export const dynamicParams = false;

export function generateStaticParams() {
  return RECETAS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const receta = getReceta((await params).slug);
  if (!receta) return {};
  return {
    title: receta.titulo,
    description: `${receta.resumen} ${receta.macros.proteina} g de proteína por porción.`,
  };
}

export default async function RecetaPage({ params }: Props) {
  const receta = getReceta((await params).slug);
  if (!receta) notFound();

  const usaWhey = receta.ingredientes.some((i) => /whey/i.test(i.ingrediente));

  return (
    <article className={styles.page}>
      <div className="container">
        <Link href="/recetas" className={styles.back}>
          Todas las recetas
        </Link>

        <header className={styles.detailHead}>
          <div>
            <span className={styles.goal} data-objetivo={receta.objetivo}>
              {OBJETIVOS[receta.objetivo].label}
            </span>
            <h1>{receta.titulo}</h1>
            <p>{receta.resumen}</p>
            <p className={styles.meta}>
              <span>{receta.tiempoMin} min</span>
              <span>
                {receta.porciones} {receta.porciones === 1 ? 'porción' : 'porciones'}
              </span>
              <time dateTime={receta.publicada}>Publicada el {formatFecha(receta.publicada)}</time>
            </p>
          </div>

          <aside className={styles.panel} aria-label="Macros por porción">
            <div className={styles.panelKcal}>
              <span className="num">{receta.macros.kcal}</span>
              <span>kcal por porción</span>
            </div>
            <MacroBar macros={receta.macros} size="lg" />
          </aside>
        </header>

        <div className={styles.columns}>
          <section aria-labelledby="ingredientes">
            <h2 id="ingredientes">Ingredientes</h2>
            <ul className={styles.ingredients}>
              {receta.ingredientes.map((i) => (
                <li key={i.ingrediente}>
                  <strong>{i.cantidad}</strong>
                  <span>{i.ingrediente}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="preparacion">
            <h2 id="preparacion">Preparación</h2>
            <ol className={styles.steps}>
              {receta.pasos.map((paso) => (
                <li key={paso}>{paso}</li>
              ))}
            </ol>
            {receta.consejo && (
              <p className={styles.tip}>
                <strong>Consejo</strong>
                {receta.consejo}
              </p>
            )}
          </section>
        </div>

        {usaWhey && (
          <div className={styles.shop}>
            <p>Esta receta lleva proteína whey. Tenemos varias marcas y sabores en existencia.</p>
            <Link href="/suplementos?q=whey" className="btn">
              Ver proteína whey
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
