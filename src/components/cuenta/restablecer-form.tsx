'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { restablecerPassword, type RestablecerState } from '@/server/actions/recuperar';
import styles from './cuenta.module.css';

export default function RestablecerForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState<RestablecerState, FormData>(restablecerPassword, {});

  if (state.vencido) return <EnlaceVencido />;

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="token" value={token} />

      <div className={styles.field}>
        <label htmlFor="password">Contraseña nueva</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          aria-describedby="password-ayuda"
        />
        <p id="password-ayuda" className={styles.help}>
          Mínimo 8 caracteres.
        </p>
      </div>

      <div className={styles.field}>
        <label htmlFor="confirmar">Repite la contraseña</label>
        <input id="confirmar" name="confirmar" type="password" autoComplete="new-password" required minLength={8} maxLength={128} />
      </div>

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  );
}

export function EnlaceVencido() {
  return (
    <div className={styles.form}>
      <p className={styles.error} role="alert">
        Este enlace ya se usó o venció. Pide uno nuevo; cada enlace dura 30 minutos.
      </p>
      <Link href="/recuperar" className="btn btn-primary">
        Pedir otro enlace
      </Link>
    </div>
  );
}
