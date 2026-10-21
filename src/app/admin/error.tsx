'use client';

import { useEffect } from 'react';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: '3rem var(--gutter)', display: 'grid', gap: '1rem', justifyItems: 'start' }}>
      <h1 style={{ fontSize: 'var(--step-3)' }}>No se pudo cargar esta sección</h1>
      <p style={{ color: 'var(--text-muted)' }}>Falló la conexión con la base de datos. Revisa tu conexión e intenta de nuevo.</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}
