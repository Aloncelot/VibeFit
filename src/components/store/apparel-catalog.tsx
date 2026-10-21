import { getRopa } from '@/server/queries/catalogo';
import type { CategoriaPrenda } from '@/types/catalogo';
import CatalogHeader from './catalog-header';
import BrandRail from './brand-rail';
import SearchForm from './search-form';
import FilterTabs from './filter-tabs';
import ApparelCard from './apparel-card';
import EmptyState from './empty-state';
import SolicitudProducto from './solicitud-producto';
import type { Params } from './url';
import styles from './catalog.module.css';

interface Props {
  basePath: '/ropa' | '/accesorios';
  params: Params;
}

const GENEROS = [
  { value: undefined, label: 'Todo' },
  { value: 'HOMBRE', label: 'Hombre' },
  { value: 'MUJER', label: 'Mujer' },
];

const TIPOS = [
  { value: undefined, label: 'Todo' },
  { value: 'TOPS', label: 'Playeras y tops' },
  { value: 'BOTTOMS', label: 'Shorts y joggers' },
];

export default async function ApparelCatalog({ basePath, params }: Props) {
  const esAccesorios = basePath === '/accesorios';
  const { marcas, productos } = await getRopa();

  const categorias: CategoriaPrenda[] = esAccesorios
    ? ['ACCESORIOS']
    : params.tipo === 'TOPS' || params.tipo === 'BOTTOMS'
      ? [params.tipo]
      : ['TOPS', 'BOTTOMS'];

  const enSeccion = productos.filter((p) => categorias.includes(p.categoria));
  const q = params.q?.toLowerCase();

  const visibles = enSeccion.filter(
    (p) =>
      (!params.marca || p.marca === params.marca) &&
      // UNISEX aparece tanto en Hombre como en Mujer.
      (!params.genero || p.genero === params.genero || p.genero === 'UNISEX') &&
      (!q || p.nombre.toLowerCase().includes(q) || p.colores.some((c) => c.nombre.toLowerCase().includes(q))),
  );

  const marcasEnSeccion = marcas.filter((m) => enSeccion.some((p) => p.marca === m.nombre));

  return (
    <div className="container">
      <CatalogHeader
        title={esAccesorios ? 'Accesorios' : 'Ropa de gym'}
        description={
          esAccesorios
            ? 'Shakers, straps, cinturones y lo que va en tu mochila de entrenamiento.'
            : 'Playeras, tops, shorts y joggers de Gymshark, YoungLA y Darc Sport. Originales, con tallas reales en inventario.'
        }
        count={visibles.length}
        unit={esAccesorios ? ['accesorio', 'accesorios'] : ['prenda', 'prendas']}
      />

      <div className={styles.toolbar}>
        {marcasEnSeccion.length > 1 && <BrandRail basePath={basePath} marcas={marcasEnSeccion} params={params} />}
        <div className={styles.filters}>
          <SearchForm basePath={basePath} params={params} placeholder={esAccesorios ? 'Buscar accesorio' : 'Buscar prenda o color'} />
          {!esAccesorios && (
            <>
              <FilterTabs label="Para" param="genero" options={GENEROS} basePath={basePath} params={params} />
              <FilterTabs label="Tipo" param="tipo" options={TIPOS} basePath={basePath} params={params} />
            </>
          )}
        </div>
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          title="No hay resultados con estos filtros"
          message="Prueba con otra marca o quita la búsqueda."
          href={basePath}
          cta="Ver todo"
        />
      ) : (
        <ul className={styles.grid}>
          {visibles.map((prenda, i) => (
            <li key={prenda.id}>
              <ApparelCard prenda={prenda} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}

      <SolicitudProducto seccion={esAccesorios ? 'accesorios' : 'ropa'} />
    </div>
  );
}
