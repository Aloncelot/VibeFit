// app/LandingSplit.tsx

'use client';
import { motion } from 'framer-motion';
import styles from './LandingSplit.module.scss';

// 1. Definimos la "Interface" (El contrato de datos)
interface LandingSplitProps {
  onSelect: (departamento: 'suplementos' | 'ropa') => void;
}

// 2. Aplicamos la Interface a los props del componente
export default function LandingSplit({ onSelect }: LandingSplitProps) {
  return (
    <div className={styles.splitWrapper}>
      {/* Lado Izquierdo: Suplementos */}
      <motion.div 
        className={`${styles.section} ${styles.left}`}
        whileHover={{ width: '60%' }}
        onClick={() => onSelect('suplementos')}
      >
        <div className={styles.overlay} />
        <div className={styles.content}>
          <motion.h2 initial={{ y: 20 }} animate={{ y: 0 }}>SUPLEMENTACIÓN</motion.h2>
          <p>Combustible de élite para tus músculos</p>
        </div>
      </motion.div>

      {/* Lado Derecho: Ropa */}
      <motion.div 
        className={`${styles.section} ${styles.right}`}
        whileHover={{ width: '60%' }}
        onClick={() => onSelect('ropa')}
      >
        <div className={styles.overlay} />
        <div className={styles.content}>
          <motion.h2 initial={{ y: 20 }} animate={{ y: 0 }}>GYM WEAR</motion.h2>
          <p>Armadura para el campo de batalla</p>
        </div>
      </motion.div>
    </div>
  );
}