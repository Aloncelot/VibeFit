import type { Metadata } from 'next';
import RecuperarForm from '@/components/cuenta/recuperar-form';
import styles from '@/components/cuenta/cuenta.module.css';

export const metadata: Metadata = { title: 'Recuperar contraseña', robots: { index: false } };

export default function RecuperarPage() {
  return (
    <div className={`container ${styles.authPage}`}>
      <div className={styles.authIntro}>
        <h1>¿Olvidaste tu contraseña?</h1>
        <p>Escribe el correo con el que creaste tu cuenta y te mandamos un enlace para crear una nueva.</p>
      </div>
      <RecuperarForm />
    </div>
  );
}
