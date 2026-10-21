import Link from 'next/link';
import { SECCIONES } from '@/lib/secciones';
import { WHATSAPP_URL } from '@/lib/config';
import styles from './site-footer.module.css';

const currentYear = () => new Date().getFullYear();

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <p className={styles.logo}>VIBEFIT</p>
          <p>Suplementos originales, ropa de entrenamiento y recetas para comer con objetivo. Desde la Ciudad de México.</p>
        </div>

        <nav aria-label="Secciones del pie de página">
          <p className={styles.heading}>Tienda</p>
          <ul>
            {SECCIONES.map(({ href, label }) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
            <li>
              <Link href="/resenas">Reseñas</Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className={styles.heading}>Contacto</p>
          <ul>
            <li>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href="mailto:contacto@vibefit.com">contacto@vibefit.com</a>
            </li>
            <li>
              <a href="https://instagram.com/tu_usuario" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://tiktok.com/@tu_usuario" target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {currentYear()} VIBEFIT</span>
        <Link href="/privacidad">Aviso de privacidad</Link>
        <Link href="/privacidad#cookies">Cookies</Link>
        <a href="https://quasar-devs.vercel.app/" target="_blank" rel="noopener noreferrer">
          Desarrollado por Quasar Devs
        </a>
        <Link href="/login" className={styles.admin}>
          Administración
        </Link>
      </div>
    </footer>
  );
}
