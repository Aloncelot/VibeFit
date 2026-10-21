import styles from './resenas.module.css';

/** Muestra una calificación de 0 a 5 con estrellas (acepta medias, p. ej. 4.5). */
export default function Estrellas({ valor, size = 18 }: { valor: number; size?: number }) {
  return (
    <span className={styles.estrellas} role="img" aria-label={`${valor} de 5 estrellas`} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const relleno = Math.max(0, Math.min(1, valor - (n - 1)));
        return (
          <span key={n} className={styles.estrella} aria-hidden>
            <span className={styles.estrellaFondo}>★</span>
            <span className={styles.estrellaRelleno} style={{ width: `${relleno * 100}%` }}>
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
}
