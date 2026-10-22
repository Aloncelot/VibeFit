'use client';

import Image from 'next/image';
import { motion, MotionConfig, type Transition, type Variants } from 'framer-motion';
import styles from './home.module.css';

const resorte: Transition = { type: 'spring', stiffness: 170, damping: 20, mass: 0.9 };

const grupo: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const sube: Variants = {
  oculto: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: resorte },
};

/** Texto del hero + foto de proteínas, con entrada en resorte. Respeta "reducir movimiento". */
export default function HeroMotion({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={`container ${styles.heroGrid}`}>
        <motion.div variants={grupo} initial="oculto" animate="visible">
          <motion.h1 id="hero-titulo" className={styles.title} variants={sube}>
            {titulo}
          </motion.h1>
          <motion.p className={styles.lead} variants={sube}>
            {texto}
          </motion.p>
        </motion.div>

        <motion.div
          className={styles.heroArt}
          initial={{ opacity: 0, scale: 0.86, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...resorte, stiffness: 120, damping: 16, delay: 0.15 }}
          whileHover={{ scale: 1.025, transition: { type: 'spring', stiffness: 260, damping: 18 } }}
        >
          <Image
            src="/hero/proteinas.webp"
            alt="Botes de proteína whey: Raw Itholate, Whey Phorm, Gold Standard, Ghost y Evogen Isoject"
            width={1900}
            height={830}
            priority
            sizes="(max-width: 960px) 92vw, 50vw"
            className={styles.heroImg}
          />
        </motion.div>
      </div>
    </MotionConfig>
  );
}
