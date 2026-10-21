'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import styles from './catalog.module.css';

/** Corazón para guardar un SKU en favoritos (pide iniciar sesión si no hay cuenta). */
export default function FavoriteButton({ skuId, nombre }: { skuId: number; nombre: string }) {
  const { favoritos, toggleFavorito } = useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const activo = favoritos.has(skuId);

  return (
    <button
      type="button"
      className={styles.favorite}
      aria-pressed={activo}
      aria-label={activo ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}
      title={error ?? (activo ? 'En tus favoritos' : 'Guardar en favoritos')}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          setError(await toggleFavorito(skuId));
        })
      }
    >
      <Heart size={20} strokeWidth={2.25} fill={activo ? 'currentColor' : 'none'} aria-hidden />
    </button>
  );
}
