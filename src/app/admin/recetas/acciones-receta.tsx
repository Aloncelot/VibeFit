'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { borrarReceta, cambiarVisibilidadReceta } from './actions';
import styles from './recetas-admin.module.css';

/** Editar, ocultar/mostrar y borrar (con confirmación en dos pasos, sin diálogos del navegador). */
export default function AccionesReceta({ id, slug, titulo, visible }: { id: number; slug: string; titulo: string; visible: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ejecutar = (fn: () => ReturnType<typeof borrarReceta>) =>
    startTransition(async () => {
      const res = await fn();
      setError(res.success ? null : res.error);
      setConfirmando(false);
    });

  return (
    <div className={styles.rowActions}>
      {confirmando ? (
        <>
          <span>¿Borrar “{titulo}”?</span>
          <button type="button" className={`btn ${styles.danger}`} disabled={isPending} onClick={() => ejecutar(() => borrarReceta(id))}>
            Sí, borrar
          </button>
          <button type="button" className="btn btn-outline" disabled={isPending} onClick={() => setConfirmando(false)}>
            Cancelar
          </button>
        </>
      ) : (
        <>
          <Link href={`/admin/recetas/${id}`} className="btn btn-outline">
            Editar
          </Link>
          {visible && (
            <Link href={`/recetas/${slug}`} className={styles.textLink} target="_blank">
              Ver
            </Link>
          )}
          <button
            type="button"
            className="btn btn-outline"
            disabled={isPending}
            onClick={() => ejecutar(() => cambiarVisibilidadReceta(id, !visible))}
          >
            {visible ? 'Ocultar' : 'Publicar'}
          </button>
          <button type="button" className={styles.textDanger} disabled={isPending} onClick={() => setConfirmando(true)}>
            Borrar
          </button>
        </>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
