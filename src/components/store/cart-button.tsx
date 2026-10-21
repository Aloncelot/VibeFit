'use client';

import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import styles from './site-header.module.css';

export default function CartButton() {
  const { totalItems, open } = useCart();

  return (
    <button type="button" className={styles.cartButton} onClick={open} aria-label={`Abrir carrito, ${totalItems} artículos`}>
      <ShoppingBag size={20} strokeWidth={2.25} aria-hidden />
      <span className={styles.cartLabel}>Carrito</span>
      <span className={`num ${styles.count}`} data-empty={totalItems === 0 || undefined}>
        {totalItems}
      </span>
    </button>
  );
}
