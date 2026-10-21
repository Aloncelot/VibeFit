'use client';

import Link from 'next/link';
import { useActionState, useState, useTransition } from 'react';
import { borrarMiResena, guardarResena, type ResenaState } from '@/server/actions/resenas';
import styles from './resenas.module.css';

const ETIQUETAS = ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];

interface Props {
  conSesion: boolean;
  mia: { calificacion: number; comentario: string } | null;
}

export default function ResenaForm({ conSesion, mia }: Props) {
  const [state, action, isPending] = useActionState<ResenaState, FormData>(guardarResena, {});
  const [valor, setValor] = useState(mia?.calificacion ?? 0);
  const [borrando, startBorrar] = useTransition();
  const [borrada, setBorrada] = useState(false);

  if (!conSesion) {
    return (
      <div className={styles.formBox}>
        <h2>¿Ya compraste con nosotros?</h2>
        <p>
          <Link href="/entrar?desde=/resenas">Entra a tu cuenta</Link> para dejar tu reseña. Pedimos cuenta para evitar reseñas falsas.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className={styles.formBox}>
      <h2>{mia && !borrada ? 'Tu reseña' : 'Deja tu reseña'}</h2>

      <fieldset className={styles.picker}>
        <legend>Calificación</legend>
        <div className={styles.pickerStars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} data-activa={n <= valor || undefined} title={ETIQUETAS[n - 1]}>
              <input
                type="radio"
                name="calificacion"
                value={n}
                checked={valor === n}
                onChange={() => setValor(n)}
                required
                className="visually-hidden"
              />
              <span aria-hidden>★</span>
              <span className="visually-hidden">
                {n} {n === 1 ? 'estrella' : 'estrellas'}, {ETIQUETAS[n - 1]}
              </span>
            </label>
          ))}
        </div>
        <span className={styles.pickerLabel}>{valor ? ETIQUETAS[valor - 1] : 'Elige de 1 a 5'}</span>
      </fieldset>

      <label htmlFor="comentario" className={styles.label}>
        Tu experiencia con la tienda
      </label>
      <textarea
        id="comentario"
        name="comentario"
        rows={4}
        minLength={10}
        maxLength={600}
        required
        defaultValue={borrada ? '' : mia?.comentario}
        placeholder="Atención, tiempos de envío, estado en que llegó tu pedido…"
      />

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && !isPending && (
        <p className={styles.ok} role="status">
          Gracias, tu reseña ya está publicada.
        </p>
      )}

      <div className={styles.formActions}>
        <button type="submit" className="btn btn-primary" disabled={isPending || valor === 0}>
          {isPending ? 'Publicando…' : mia && !borrada ? 'Actualizar reseña' : 'Publicar reseña'}
        </button>
        {mia && !borrada && (
          <button
            type="button"
            className={styles.link}
            disabled={borrando}
            onClick={() =>
              startBorrar(async () => {
                const res = await borrarMiResena();
                if (res.ok) {
                  setBorrada(true);
                  setValor(0);
                }
              })
            }
          >
            Borrar mi reseña
          </button>
        )}
      </div>
    </form>
  );
}
