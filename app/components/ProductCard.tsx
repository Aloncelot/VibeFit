'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import styles from './ProductCard.module.scss';

interface ProductCardProps {
  id: number;
  nombre: string;
  marca: string;
  sabor: string;
  tamano: string;
  precio: number;
  imagenUrl: string;
}

export default function ProductCard({ nombre, marca, sabor, tamano, precio, imagenUrl }: ProductCardProps) {
  return (
    <motion.div 
      className={styles.card}
      whileHover={{ y: -10, boxShadow: '0px 10px 30px rgba(212, 175, 55, 0.15)' }}
      transition={{ duration: 0.3 }}
    >
      {/* Contenedor de la Imagen */}
      <div className={styles.imageContainer}>
        {imagenUrl ? (
          <Image 
            src={imagenUrl} 
            alt={nombre} 
            fill 
            className={styles.image} 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className={styles.placeholder}>Sin Imagen</div>
        )}
      </div>

      {/* Información del Producto */}
      <div className={styles.info}>
        <span className={styles.brand}>{marca}</span>
        <h3 className={styles.name}>{nombre}</h3>
        
        <div className={styles.details}>
          <span className={styles.variant}>{sabor}</span>
          <span className={styles.size}>{tamano}</span>
        </div>

        <div className={styles.footer}>
          {/* Formateamos el precio a moneda */}
          <span className={styles.price}>
            ${precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
          <button className={styles.addBtn} title="Agregar al carrito">
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}