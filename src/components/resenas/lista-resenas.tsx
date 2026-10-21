import type { Resena } from '@/server/queries/resenas';
import Estrellas from './estrellas';
import styles from './resenas.module.css';

const fecha = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });

export default function ListaResenas({ resenas }: { resenas: Resena[] }) {
  return (
    <ul className={styles.lista}>
      {resenas.map((r) => (
        <li key={r.id} className={styles.card}>
          <Estrellas valor={r.calificacion} />
          <blockquote>{r.comentario}</blockquote>
          <footer>
            <strong>{r.autor}</strong>
            <time dateTime={r.creada_en}>{fecha.format(new Date(r.creada_en))}</time>
          </footer>
        </li>
      ))}
    </ul>
  );
}
