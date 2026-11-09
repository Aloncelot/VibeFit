'use client';

import Link from 'next/link';
import { ChefHat, PackageCheck, Search, ShieldCheck } from 'lucide-react';
import { motion, MotionConfig, type Transition, type Variants } from 'framer-motion';
import styles from './home.module.css';

const resorte: Transition = { type: 'spring', stiffness: 170, damping: 20, mass: 0.9 };

const grupo: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const sube: Variants = {
  oculto: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: resorte },
};

const GARANTIAS = [
  { icon: ShieldCheck, texto: 'Productos originales' },
  { icon: PackageCheck, texto: 'Solo lo que hay en existencia' },
  { icon: ChefHat, texto: 'Recetas con los macros contados' },
];

/** Hero a pantalla completa: video de fondo, título, búsqueda por producto y marca. Respeta "reducir movimiento". */
export default function HeroMotion({ titulo, texto, marcas }: { titulo: string; texto: string; marcas: string[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <video className={styles.heroVideo} autoPlay muted loop playsInline preload="auto" poster="/hero/hero-poster.webp" aria-hidden>
        {/* En celular: corte vertical y más ligero (~1 MB en lugar de ~4 MB). El navegador usa la primera fuente que aplica. */}
        <source src="/hero/hero-movil.webm" type="video/webm" media="(max-width: 768px)" />
        <source src="/hero/hero-movil.mp4" type="video/mp4" media="(max-width: 768px)" />
        <source src="/hero/hero.webm" type="video/webm" />
        <source src="/hero/hero.mp4" type="video/mp4" />
      </video>
      <div className={styles.heroShade} aria-hidden />

      <motion.div className={`container ${styles.heroInner}`} variants={grupo} initial="oculto" animate="visible">
        <motion.p className={styles.heroBadge} variants={sube}>
          <span aria-hidden /> Tienda de suplementos en la Ciudad de México
        </motion.p>
        <motion.h1 id="hero-titulo" className={styles.title} variants={sube}>
          {titulo}
        </motion.h1>
        <motion.p className={styles.lead} variants={sube}>
          {texto}
        </motion.p>

        <motion.div className={styles.heroCtas} variants={sube}>
          <motion.span whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
            <Link href="/suplementos" className="btn btn-primary">
              Ver suplementos
            </Link>
          </motion.span>
          <motion.span whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
            <Link href="/recetas" className={`btn btn-outline ${styles.heroGhost}`}>
              Ver recetas
            </Link>
          </motion.span>
        </motion.div>

        <motion.form
          action="/suplementos"
          method="get"
          role="search"
          className={styles.heroSearch}
          variants={{ oculto: { opacity: 0, y: 40, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { ...resorte, stiffness: 130 } } }}
        >
          <label className={styles.heroField}>
            <span>Producto o sabor</span>
            <input name="q" type="search" placeholder="Ej. whey chocolate, creatina" autoComplete="off" maxLength={80} />
          </label>
          <label className={styles.heroField}>
            <span>Marca</span>
            <select name="marca" defaultValue="">
              <option value="">Todas las marcas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={`btn btn-primary ${styles.heroSubmit}`}>
            <Search size={18} aria-hidden /> Buscar
          </button>
        </motion.form>

        <motion.ul className={styles.heroTrust} variants={sube}>
          {GARANTIAS.map(({ icon: Icon, texto: t }) => (
            <li key={t}>
              <Icon size={18} aria-hidden /> {t}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </MotionConfig>
  );
}
