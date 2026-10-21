import Link from 'next/link';
import { getCliente } from '@/server/auth/cliente';
import { contarNoLeidas } from '@/server/queries/cliente';
import NavLinks from './nav-links';
import CartButton from './cart-button';
import UserMenu from './user-menu';
import styles from './site-header.module.css';

export default async function SiteHeader() {
  const cliente = await getCliente();
  const noLeidas = cliente ? await contarNoLeidas(cliente.id) : 0;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo} aria-label="VIBEFIT, inicio">
          VIBEFIT
        </Link>
        <NavLinks />
        <div className={styles.actions}>
          <UserMenu nombre={cliente?.nombre ?? null} noLeidas={noLeidas} />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
