import type { Metadata } from 'next';
import { agruparSuplementos, getSuplementos } from '@/server/queries/catalogo';
import CatalogHeader from '@/components/store/catalog-header';
import BrandRail from '@/components/store/brand-rail';
import SearchForm from '@/components/store/search-form';
import SupplementCard from '@/components/store/supplement-card';
import EmptyState from '@/components/store/empty-state';
import SolicitudProducto from '@/components/store/solicitud-producto';
import { first } from '@/components/store/url';
import styles from '@/components/store/catalog.module.css';

export const metadata: Metadata = {
  title: 'Suplementos',
  description: 'Proteína, creatina, pre-entrenos y aminoácidos originales con existencia real.',
};

export default async function SuplementosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = { marca: first(sp.marca), q: first(sp.q) };
  const { marcas, productos } = await getSuplementos();

  const q = params.q?.toLowerCase();
  const filtrados = productos.filter(
    (p) =>
      (!params.marca || p.marca === params.marca) &&
      (!q || p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q) || p.sabor.toLowerCase().includes(q)),
  );
  const grupos = agruparSuplementos(filtrados);

  return (
    <div className="container">
      <CatalogHeader
        title="Suplementos"
        description="Proteína, creatina, pre-entrenos y aminoácidos. Solo mostramos lo que tenemos en existencia."
        count={grupos.length}
        unit={['producto', 'productos']}
      />

      <div className={styles.toolbar}>
        <BrandRail basePath="/suplementos" marcas={marcas} params={params} />
        <SearchForm basePath="/suplementos" params={params} placeholder="Buscar producto, marca o sabor" />
      </div>

      {grupos.length === 0 ? (
        <EmptyState
          title="No encontramos ese producto"
          message="Revisa la ortografía o busca por marca."
          href="/suplementos"
          cta="Ver todos los suplementos"
        />
      ) : (
        <ul className={styles.grid}>
          {grupos.map((grupo, i) => (
            <li key={grupo.key}>
              <SupplementCard producto={grupo} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}

      <SolicitudProducto seccion="suplementos" />
    </div>
  );
}
