import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyAdmin } from '@/server/auth/dal';
import { contarSolicitudesNuevas } from '@/server/queries/admin';
import { cerrarSesion } from '@/app/login/actions';
import styles from './admin.module.css';

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s | Panel VIBEFIT' },
  robots: { index: false, follow: false },
};

const LINKS = [
  { href: '/admin/inventario', label: 'Suplementos' },
  { href: '/admin/inventario/ropa', label: 'Ropa' },
  { href: '/admin/analisis', label: 'Análisis' },
  { href: '/admin/demanda', label: 'Demanda' },
  { href: '/admin/solicitudes', label: 'Solicitudes' },
  { href: '/admin/resenas', label: 'Reseñas' },
  { href: '/admin/recetas', label: 'Recetas' },
  { href: '/admin/inventario/escaner', label: 'Escáner' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verifyAdmin();
  const nuevas = await contarSolicitudesNuevas();

  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <Link href="/admin" className={styles.logo}>
          VIBEFIT <span>Panel</span>
        </Link>
        <nav aria-label="Panel">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>
                  {l.label}
                  {l.href === '/admin/solicitudes' && nuevas > 0 && (
                    <span className={styles.badge} aria-label={`${nuevas} nuevas`}>
                      {nuevas}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.barActions}>
          <Link href="/" className={styles.storeLink}>
            Ver tienda
          </Link>
          <form action={cerrarSesion}>
            <button type="submit" className="btn btn-outline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
