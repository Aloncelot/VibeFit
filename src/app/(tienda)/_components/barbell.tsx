import Link from 'next/link';
import styles from './home.module.css';

export interface Disco {
  href: string;
  label: string;
  count?: number;
  unit: string;
  tone: 'vibrant' | 'soft' | 'pale' | 'dark';
  /** 0–1: proporción del disco más grande, como una carga real de mayor a menor. */
  size: number;
}

/**
 * Barra olímpica cargada: cada disco es un departamento de la tienda.
 * El número estampado es la cantidad de productos disponibles.
 */
export default function Barbell({ discos }: { discos: Disco[] }) {
  return (
    <nav className={styles.barbell} aria-label="Departamentos">
      <div className={styles.rod} aria-hidden />
      <div className={`container ${styles.load}`}>
        <span className={styles.collar} aria-hidden />
        <ul className={styles.plates}>
          {discos.map((d, i) => (
            <li key={d.href} style={{ '--size': d.size, '--i': i } as React.CSSProperties}>
              <Link
                href={d.href}
                className={styles.plate}
                data-tone={d.tone}
                aria-label={d.count != null ? `${d.label}: ${d.count} ${d.unit}` : d.label}
              >
                <span className={styles.slab}>
                  <span className={`num ${styles.stamp}`}>{d.count ?? '—'}</span>
                  <span className={styles.slabLabel}>{d.label}</span>
                </span>
                <span className={styles.caption}>
                  <span className={styles.captionLabel}>{d.label}</span>
                  {d.count != null && (
                    <span className={styles.captionCount}>
                      {d.count} {d.unit}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
