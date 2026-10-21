'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { cerrarSesionCliente } from '@/server/actions/cliente-auth';
import styles from './site-header.module.css';

export default function UserMenu({ nombre, noLeidas }: { nombre: string | null; noLeidas: number }) {
  const pathname = usePathname();
  const { olvidarCliente } = useCart();

  if (!nombre) {
    const desde = pathname.startsWith('/entrar') || pathname.startsWith('/registro') ? '/' : pathname;
    return (
      <Link href={`/entrar?desde=${encodeURIComponent(desde)}`} className={styles.userLink}>
        <UserRound size={20} strokeWidth={2.25} aria-hidden />
        <span className={styles.cartLabel}>Entrar</span>
      </Link>
    );
  }

  const primerNombre = nombre.split(' ')[0];

  return (
    <div className={styles.user}>
      <Link
        href="/cuenta"
        className={styles.userLink}
        aria-label={noLeidas > 0 ? `Mi cuenta, ${noLeidas} avisos nuevos` : 'Mi cuenta'}
      >
        <UserRound size={20} strokeWidth={2.25} aria-hidden />
        <span className={styles.userName}>Hola, {primerNombre}</span>
        {noLeidas > 0 && <span className={`num ${styles.dot}`}>{noLeidas}</span>}
      </Link>
      <form action={cerrarSesionCliente} onSubmit={olvidarCliente}>
        <button type="submit" className={styles.logout}>
          Salir
        </button>
      </form>
    </div>
  );
}
