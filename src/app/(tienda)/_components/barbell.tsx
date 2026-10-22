'use client';

import Link from 'next/link';
import { motion, MotionConfig } from 'framer-motion';
import styles from './home.module.css';

export interface Disco {
  href: string;
  label: string;
  tone: 'vibrant' | 'soft' | 'pale' | 'dark';
  /** 0–1: proporción del disco más grande, como una carga real de mayor a menor. */
  size: number;
}

const MotionLink = motion.create(Link);

/** Barra olímpica cargada: cada disco es un departamento de la tienda. */
export default function Barbell({ discos }: { discos: Disco[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <nav className={styles.barbell} aria-label="Departamentos">
        <motion.div
          className={styles.rod}
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.25 }}
        />
        <div className={`container ${styles.load}`}>
          <span className={styles.collar} aria-hidden />
          <ul className={styles.plates}>
            {discos.map((d, i) => (
              <motion.li
                key={d.href}
                style={{ '--size': d.size } as React.CSSProperties}
                initial={{ opacity: 0, x: 90 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 210, damping: 17, delay: 0.45 + i * 0.1 }}
              >
                <MotionLink
                  href={d.href}
                  className={styles.plate}
                  data-tone={d.tone}
                  whileHover="activo"
                  whileFocus="activo"
                  whileTap={{ scale: 0.96 }}
                >
                  <motion.span
                    className={styles.slab}
                    variants={{ activo: { y: -8, rotate: -2 } }}
                    transition={{ type: 'spring', stiffness: 380, damping: 14 }}
                  >
                    <span className={styles.slabLabel}>{d.label}</span>
                  </motion.span>
                  <span className={styles.caption}>
                    <span className={styles.captionLabel}>{d.label}</span>
                  </span>
                </MotionLink>
              </motion.li>
            ))}
          </ul>
        </div>
      </nav>
    </MotionConfig>
  );
}
