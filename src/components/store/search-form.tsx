import Link from 'next/link';
import { Search } from 'lucide-react';
import { hrefWith, type Params } from './url';
import styles from './catalog.module.css';

interface Props {
  basePath: string;
  params: Params;
  placeholder: string;
}

/** Búsqueda con GET: funciona sin JavaScript y la URL se puede compartir. */
export default function SearchForm({ basePath, params, placeholder }: Props) {
  return (
    <form action={basePath} method="get" role="search" className={styles.search}>
      {Object.entries(params).map(([key, value]) =>
        key !== 'q' && value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}
      <label htmlFor="buscar" className="visually-hidden">
        Buscar
      </label>
      <Search size={18} aria-hidden className={styles.searchIcon} />
      <input id="buscar" name="q" type="search" defaultValue={params.q} placeholder={placeholder} autoComplete="off" />
      <button type="submit" className="btn btn-outline">
        Buscar
      </button>
      {params.q && (
        <Link href={hrefWith(basePath, params, { q: undefined })} className={styles.clear}>
          Limpiar
        </Link>
      )}
    </form>
  );
}
