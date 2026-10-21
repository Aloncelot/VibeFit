import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCliente, rutaSegura } from '@/server/auth/cliente';
import AuthForm from '@/components/cuenta/auth-form';
import styles from '@/components/cuenta/cuenta.module.css';

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const desde = rutaSegura((await searchParams).desde);
  if (await getCliente()) redirect(desde);

  return (
    <div className={`container ${styles.authPage}`}>
      <div className={styles.authIntro}>
        <h1>Entra a tu cuenta</h1>
        <p>Tu carrito se guarda en todos tus dispositivos, guardas favoritos y te avisamos cuando vuelve lo que está agotado.</p>
      </div>
      <AuthForm modo="entrar" desde={desde} />
    </div>
  );
}
