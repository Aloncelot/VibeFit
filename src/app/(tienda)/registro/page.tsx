import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCliente, rutaSegura } from '@/server/auth/cliente';
import AuthForm from '@/components/cuenta/auth-form';
import styles from '@/components/cuenta/cuenta.module.css';

export const metadata: Metadata = { title: 'Crear cuenta', robots: { index: false } };

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const desde = rutaSegura((await searchParams).desde);
  if (await getCliente()) redirect(desde);

  return (
    <div className={`container ${styles.authPage}`}>
      <div className={styles.authIntro}>
        <h1>Crea tu cuenta</h1>
        <p>Es gratis. No necesitas cuenta para comprar, pero con ella guardas tu carrito y tus favoritos.</p>
      </div>
      <AuthForm modo="registro" desde={desde} />
    </div>
  );
}
