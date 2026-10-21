'use client';

import { useActionState } from 'react';
import { iniciarSesion, type LoginState } from './actions';
import styles from './login.module.css';

export default function LoginForm({ desde }: { desde?: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(iniciarSesion, {});

  return (
    <form action={formAction} className={styles.form}>
      {desde && <input type="hidden" name="desde" value={desde} />}
      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? 'login-error' : undefined}
      />
      {state.error && (
        <p id="login-error" className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? 'Verificando…' : 'Entrar'}
      </button>
    </form>
  );
}
