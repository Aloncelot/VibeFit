import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from './login-form';
import styles from './login.module.css';

export const metadata: Metadata = {
  title: 'Acceso de administrador',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { desde } = await searchParams;

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <Link href="/" className={styles.logo}>
          VIBEFIT
        </Link>
        <h1 className={styles.title}>Panel de administración</h1>
        <p className={styles.help}>Inventario, precios y escáner de etiquetas.</p>
        <LoginForm desde={typeof desde === 'string' ? desde : undefined} />
      </div>
    </main>
  );
}
