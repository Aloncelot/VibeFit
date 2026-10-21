import type { Metadata } from 'next';
import { getResenasAdmin } from '@/server/queries/admin';
import Estrellas from '@/components/resenas/estrellas';
import VisibilidadButton from './visibilidad-button';
import styles from '../admin.module.css';

export const metadata: Metadata = { title: 'Reseñas' };

const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' });

export default async function ResenasAdminPage() {
  const resenas = await getResenasAdmin();

  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1>Reseñas</h1>
          <p className={styles.lead}>
            Se publican al momento. Oculta las que sean spam u ofensivas; las reseñas negativas reales ayudan a que las positivas sean
            creíbles.
          </p>
        </div>
      </div>

      {resenas.length === 0 ? (
        <p className={styles.lead}>Todavía no hay reseñas.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Reseña</th>
                <th scope="col">Cliente</th>
                <th scope="col">Fecha</th>
                <th scope="col">En la tienda</th>
              </tr>
            </thead>
            <tbody>
              {resenas.map((r) => (
                <tr key={r.id} style={{ opacity: r.visible ? 1 : 0.55 }}>
                  <td style={{ maxWidth: 520 }}>
                    <Estrellas valor={r.calificacion} />
                    <br />
                    {r.comentario}
                  </td>
                  <td className={styles.muted}>{r.cliente}</td>
                  <td className={styles.muted}>{fecha.format(new Date(r.creada_en))}</td>
                  <td>
                    <VisibilidadButton id={r.id} visible={r.visible} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
