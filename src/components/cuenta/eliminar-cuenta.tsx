'use client';

import { useActionState, useState } from 'react';
import { eliminarCuenta, type AuthState } from '@/server/actions/cliente-auth';
import { useCart } from '@/context/cart-context';
import styles from './cuenta.module.css';

export default function EliminarCuenta() {
  const [abierto, setAbierto] = useState(false);
  const [state, action, isPending] = useActionState<AuthState, FormData>(eliminarCuenta, {});
  const { olvidarCliente } = useCart();

  return (
    <section className={styles.section} aria-labelledby="eliminar">
      <h2 id="eliminar">Eliminar mi cuenta</h2>
      <p className={styles.empty}>
        Borra tu cuenta, tu carrito guardado, favoritos, avisos y tu reseña. No se puede deshacer.
      </p>
      {!abierto ? (
        <button type="button" className={`btn btn-outline ${styles.danger}`} onClick={() => setAbierto(true)}>
          Eliminar mi cuenta
        </button>
      ) : (
        <form
          action={action}
          onSubmit={(e) => {
            const valor = new FormData(e.currentTarget).get('confirmacion');
            if (String(valor ?? '').trim().toUpperCase() === 'ELIMINAR') olvidarCliente();
          }}
          className={styles.deleteForm}
        >
          <label htmlFor="confirmacion">
            Escribe <strong>ELIMINAR</strong> para confirmar
          </label>
          <input id="confirmacion" name="confirmacion" autoComplete="off" required />
          {state.error && (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          )}
          <div>
            <button type="submit" className={`btn btn-primary ${styles.dangerSolid}`} disabled={isPending}>
              {isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
            </button>
            <button type="button" className={styles.link} onClick={() => setAbierto(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
