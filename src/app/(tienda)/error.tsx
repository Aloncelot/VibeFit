'use client';

import { useEffect } from 'react';
import styles from '@/components/store/catalog.module.css';

export default function TiendaError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container">
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No pudimos cargar el catálogo</p>
        <p>La conexión con el inventario falló. Intenta de nuevo en unos segundos.</p>
        <button type="button" className="btn btn-primary" onClick={reset}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
