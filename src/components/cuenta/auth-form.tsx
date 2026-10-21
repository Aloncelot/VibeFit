'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { iniciarSesionCliente, registrarCliente, type AuthState } from '@/server/actions/cliente-auth';
import styles from './cuenta.module.css';

export default function AuthForm({ modo, desde }: { modo: 'entrar' | 'registro'; desde: string }) {
  const action = modo === 'entrar' ? iniciarSesionCliente : registrarCliente;
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(action, {});
  const qs = `?desde=${encodeURIComponent(desde)}`;

  return (
    <form action={formAction} className={styles.form} noValidate={false}>
      <input type="hidden" name="desde" value={desde} />

      {modo === 'registro' && (
        <div className={styles.field}>
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" name="nombre" autoComplete="given-name" required maxLength={80} defaultValue={state.nombre} />
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={state.email} />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
          required
          minLength={modo === 'registro' ? 8 : undefined}
          maxLength={128}
          aria-describedby={modo === 'registro' ? 'password-ayuda' : undefined}
        />
        {modo === 'registro' && (
          <p id="password-ayuda" className={styles.help}>
            Mínimo 8 caracteres.
          </p>
        )}
      </div>

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      {modo === 'registro' && (
        <p className={styles.legalNote}>
          Al crear tu cuenta aceptas nuestro <Link href="/privacidad">Aviso de privacidad</Link>. No vendemos ni compartimos tus datos.
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
      </button>

      <p className={styles.switch}>
        {modo === 'entrar' ? (
          <>
            ¿No tienes cuenta? <Link href={`/registro${qs}`}>Crea una</Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta? <Link href={`/entrar${qs}`}>Entra</Link>
          </>
        )}
      </p>
      <p className={styles.switch}>
        <Link href={desde}>Seguir comprando como invitado</Link>
      </p>
    </form>
  );
}
