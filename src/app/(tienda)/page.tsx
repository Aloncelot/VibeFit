import Link from 'next/link';
import { connection } from 'next/server';
import { getConteosPortada } from '@/server/queries/catalogo';
import { RECETAS, OBJETIVOS } from '@/content/recetas';
import { getResenasPublicas } from '@/server/queries/resenas';
import Estrellas from '@/components/resenas/estrellas';
import ListaResenas from '@/components/resenas/lista-resenas';
import resenaStyles from '@/components/resenas/resenas.module.css';
import BrandRail from '@/components/store/brand-rail';
import MacroBar from '@/components/recetas/macro-bar';
import Barbell, { type Disco } from './_components/barbell';
import styles from './_components/home.module.css';

async function getConteos() {
  try {
    return await getConteosPortada();
  } catch (error) {
    // La portada se muestra aunque la base de datos no responda.
    console.error('No se pudieron leer los conteos de la portada:', error);
    return null;
  }
}

export default async function HomePage() {
  await connection(); // se renderiza por petición; los datos vienen del caché del catálogo
  const [conteos, { resumen, resenas }] = await Promise.all([getConteos(), getResenasPublicas(3)]);
  const receta = RECETAS[0];

  const discos: Disco[] = [
    { href: '/suplementos', label: 'Suplementos', count: conteos?.suplementos, unit: 'productos', tone: 'vibrant', size: 1 },
    { href: '/ropa', label: 'Ropa', count: conteos?.ropa, unit: 'prendas', tone: 'soft', size: 0.84 },
    { href: '/accesorios', label: 'Accesorios', count: conteos?.accesorios, unit: 'accesorios', tone: 'pale', size: 0.7 },
    { href: '/recetas', label: 'Recetas', count: RECETAS.length, unit: 'recetas', tone: 'dark', size: 0.56 },
  ];

  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-titulo">
        <div className="container">
          <h1 id="hero-titulo" className={styles.title}>
            Equipo y nutrición para entrenar pesado
          </h1>
          <p className={styles.lead}>
            Suplementos originales, ropa de Gymshark, YoungLA y Darc Sport, accesorios para el gym y recetas con los macros
            contados. Si aparece en la tienda, está en existencia.
          </p>
        </div>
        <Barbell discos={discos} />
      </section>

      {conteos && conteos.marcasSuplementos.length > 0 && (
        <section className={`container ${styles.brands}`} aria-labelledby="marcas-titulo">
          <h2 id="marcas-titulo" className={styles.sectionTitle}>
            Marcas de suplementos
          </h2>
          <BrandRail basePath="/suplementos" marcas={conteos.marcasSuplementos} params={{}} />
        </section>
      )}

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
