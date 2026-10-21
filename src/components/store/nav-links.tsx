'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SECCIONES } from '@/lib/secciones';
import styles from './site-header.module.css';

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones" className={styles.nav}>
      <ul>
        {SECCIONES.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link href={href} className={styles.navLink} aria-current={active ? 'page' : undefined}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
