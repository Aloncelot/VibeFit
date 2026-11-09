import Link from 'next/link';
import { connection } from 'next/server';
import { getMarcasPortada } from '@/server/queries/catalogo';
import { OBJETIVOS } from '@/content/recetas';
import { getRecetas } from '@/server/queries/recetas';
import { getResenasPublicas } from '@/server/queries/resenas';
import Estrellas from '@/components/resenas/estrellas';
import ListaResenas from '@/components/resenas/lista-resenas';
import resenaStyles from '@/components/resenas/resenas.module.css';
import MacroBar from '@/components/recetas/macro-bar';
import HeroMotion from './_components/hero-motion';
import styles from './_components/home.module.css';

async function getMarcas() {
  try {
    return await getMarcasPortada();
  } catch (error) {
    // La portada se muestra aunque la base de datos no responda.
    console.error('No se pudieron leer las marcas de la portada:', error);
    return [];
  }
}


export default async function HomePage() {
  await connection(); // se renderiza por petición; los datos vienen del caché del catálogo
  const [marcas, { resumen, resenas }, recetas] = await Promise.all([getMarcas(), getResenasPublicas(3), getRecetas()]);
  const receta = recetas[0];


  return (
    <>
      <section
        className={styles.hero}
        aria-labelledby="hero-titulo"
        style={
          {
            '--poster': 'url(/hero/hero-poster.webp)',
            '--poster-movil': 'url(/hero/hero-movil-poster.webp)',
            '--poster-tablet': 'url(/hero/hero-tablet-poster.webp)',
          } as React.CSSProperties
        }
      >
        <HeroMotion
          titulo="Suplementos originales para entrenar pesado"
          texto="Proteína, creatina, pre-entrenos y aminoácidos de las marcas que ya conoces. Si aparece en la tienda, está en existencia."
          marcas={marcas.map((m) => m.nombre).sort((a, b) => a.localeCompare(b))}
        />
      </section>


      {resumen.total > 0 && (
        <section className={`container ${resenaStyles.franja}`} aria-labelledby="resenas-titulo">
          <div className={resenaStyles.franjaHead}>
            <h2 id="resenas-titulo">Lo que dicen los clientes</h2>
            <p>
              <Estrellas valor={resumen.promedio} />
              <span className="num">{resumen.promedio.toFixed(1)}</span> de {resumen.total}{' '}
              {resumen.total === 1 ? 'reseña' : 'reseñas'}
              <Link href="/resenas">Ver todas</Link>
            </p>
          </div>
          <ListaResenas resenas={resenas} />
        </section>
      )}

      {receta && (
        <section className={styles.recipe} aria-labelledby="receta-titulo">
          <div className={`container ${styles.recipeInner}`}>
            <div>
              <p className={styles.recipeKicker}>Receta más reciente para {OBJETIVOS[receta.objetivo].label.toLowerCase()}</p>
              <h2 id="receta-titulo" className={styles.recipeTitle}>
                {receta.titulo}
              </h2>
              <p className={styles.recipeSummary}>{receta.resumen}</p>
              <div className={styles.recipeLinks}>
                <Link href={`/recetas/${receta.slug}`} className={`btn ${styles.recipeCta}`}>
                  Ver la receta
                </Link>
                <Link href="/recetas" className={styles.recipeAll}>
                  Todas las recetas
                </Link>
              </div>
            </div>
            <div className={styles.recipeMacros}>
              <p>
                <span className="num">{receta.macros.proteina} g</span> de proteína en {receta.macros.kcal} kcal
              </p>
              <MacroBar macros={receta.macros} size="lg" />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
