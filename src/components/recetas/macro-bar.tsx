import type { Receta } from '@/content/recetas';
import styles from './recetas.module.css';

/** Barra proporcional a las calorías que aporta cada macro (P×4, C×4, G×9). */
export default function MacroBar({ macros, size = 'md' }: { macros: Receta['macros']; size?: 'md' | 'lg' }) {
  const kcalP = macros.proteina * 4;
  const kcalC = macros.carbohidratos * 4;
  const kcalG = macros.grasa * 9;
  const total = kcalP + kcalC + kcalG;
  const pct = (v: number) => `${((v / total) * 100).toFixed(1)}%`;

  const items = [
    { key: 'p', label: 'Proteína', gramos: macros.proteina, width: pct(kcalP), className: styles.segP },
    { key: 'c', label: 'Carbohidratos', gramos: macros.carbohidratos, width: pct(kcalC), className: styles.segC },
    { key: 'g', label: 'Grasa', gramos: macros.grasa, width: pct(kcalG), className: styles.segG },
  ];

  return (
    <div className={size === 'lg' ? styles.macrosLg : styles.macros}>
      <div
        className={styles.bar}
        role="img"
        aria-label={`Reparto de calorías: proteína ${pct(kcalP)}, carbohidratos ${pct(kcalC)}, grasa ${pct(kcalG)}`}
      >
        {items.map((it) => (
          <span key={it.key} className={it.className} style={{ width: it.width }} />
        ))}
      </div>
      <dl className={styles.legend}>
        {items.map((it) => (
          <div key={it.key}>
            <dt>
              <span className={`${styles.swatch} ${it.className}`} aria-hidden />
              {it.label}
            </dt>
            <dd className="num">{it.gramos} g</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
