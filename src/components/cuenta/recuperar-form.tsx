'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { solicitarRecuperacion, type RecuperarState } from '@/server/actions/recuperar';
import styles from './cuenta.module.css';

export default function RecuperarForm() {
  const [state, formAction, isPending] = useActionState<RecuperarState, FormData>(solicitarRecuperacion, {});

  if (state.enviado) {
    return (
      <div className={styles.form} role="status">
        <p className={styles.ok}>
          Si hay una cuenta con <strong>{state.email}</strong>, te enviamos un enlace para crear una contraseña nueva.
          Vence en 30 minutos. Revisa también la carpeta de spam.
        </p>
        <p className={styles.switch}>
          <Link href="/entrar">Volver a entrar</Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="email">Correo de tu cuenta</label>
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={state.email} />
      </div>

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? 'Enviando…' : 'Enviarme el enlace'}
      </button>

      <p className={styles.switch}>
        ¿Ya la recordaste? <Link href="/entrar">Entra</Link>
      </p>
    </form>
  );
}
