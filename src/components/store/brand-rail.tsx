import Image from 'next/image';
import Link from 'next/link';
import type { Marca } from '@/types/catalogo';
import { shouldSkipOptimization } from '@/lib/images';
import { hrefWith, type Params } from './url';
import styles from './catalog.module.css';

interface Props {
  basePath: string;
  marcas: Marca[];
  params: Params;
}

export default function BrandRail({ basePath, marcas, params }: Props) {
  const current = params.marca;

  return (
    <nav aria-label="Filtrar por marca" className={styles.brandRail}>
      <ul>
        <li>
          <Link
            href={hrefWith(basePath, params, { marca: undefined })}
            className={styles.brandChip}
            aria-current={!current ? 'true' : undefined}
          >
            Todas las marcas
          </Link>
        </li>
        {marcas.map((marca) => (
          <li key={marca.id}>
            <Link
              href={hrefWith(basePath, params, { marca: marca.nombre })}
              className={styles.brandChip}
              aria-current={current === marca.nombre ? 'true' : undefined}
            >
              {marca.logo_url && (
                <span className={styles.brandLogo}>
                  <Image
                    src={marca.logo_url}
                    alt=""
                    fill
                    sizes="32px"
                    unoptimized={shouldSkipOptimization(marca.logo_url)}
                  />
                </span>
              )}
              {marca.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
