import type { Metadata } from 'next';
import { tokenVigente } from '@/server/auth/recuperacion';
import RestablecerForm, { EnlaceVencido } from '@/components/cuenta/restablecer-form';
import styles from '@/components/cuenta/cuenta.module.css';

// no-referrer: el token del enlace no se filtra a otros sitios.
export const metadata: Metadata = { title: 'Nueva contraseña', robots: { index: false }, referrer: 'no-referrer' };

export default async function RestablecerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const valor = (await searchParams).token;
  const token = typeof valor === 'string' ? valor : '';
  const vigente = await tokenVigente(token);

  return (
    <div className={`container ${styles.authPage}`}>
      <div className={styles.authIntro}>
        <h1>Crea tu contraseña nueva</h1>
        <p>Al guardarla podrás entrar con ella desde cualquier dispositivo.</p>
      </div>
      {vigente ? <RestablecerForm token={token} /> : <EnlaceVencido />}
    </div>
  );
}
