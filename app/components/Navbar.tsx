// app/components/Navbar.tsx

'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import styles from './Navbar.module.scss';

// 1. Variante para el contenedor principal (El Navbar que baja)
const navVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1], // Un easeOutExpo manual súper suave
      staggerChildren: 0.15,   // Aquí está la magia: retrasa cada hijo 150ms
      delayChildren: 0.4       // Espera 400ms a que baje el navbar para soltar los links
    } 
  }
};

// 2. Variante para los elementos individuales (Los links y logos que caen)
const itemVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { duration: 0.5, ease: 'easeOut' } 
  }
};

export default function Navbar() {
  return (
    <motion.nav 
      className={styles.navbar}
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.navContainer}>
        {/* Lado Izquierdo: Enlaces */}
        <div className={styles.navLinks}>
          <motion.div variants={itemVariants}>
            <Link href="/suplementos" className={styles.link}>
              Suplementos
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/ropa" className={styles.link}>
              Gym Wear
            </Link>
          </motion.div>
        </div>

        {/* Centro: Logo VIBEFIT */}
        <motion.div className={styles.logoContainer} variants={itemVariants}>
          <Link href="/" className={styles.textLogo}>
            <span className={styles.vibe}>VIBE</span>
            <span className={styles.fit}>FIT</span>
          </Link>
        </motion.div>

        {/* Lado Derecho: Carrito */}
        <motion.div className={styles.navActions} variants={itemVariants}>
          <button className={styles.cartBtn}>
            <ShoppingCart size={24} />
            <span className={styles.badge}>0</span>
          </button>
        </motion.div>
      </div>
    </motion.nav>
  );
}

