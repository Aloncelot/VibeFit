import type { Metadata } from 'next';
import { getCliente } from '@/server/auth/cliente';
import { getMiResena, getResenasPublicas } from '@/server/queries/resenas';
import Estrellas from '@/components/resenas/estrellas';
import ListaResenas from '@/components/resenas/lista-resenas';
import ResenaForm from '@/components/resenas/resena-form';
import styles from '@/components/resenas/resenas.module.css';

export const metadata: Metadata = {
  title: 'Reseñas',
  description: 'Lo que dicen los clientes de VIBEFIT sobre la atención, los envíos y los productos.',
};

export default async function ResenasPage() {
  const cliente = await getCliente();
  const [{ resumen, resenas }, mia] = await Promise.all([
    getResenasPublicas(60),
    cliente ? getMiResena(cliente.id) : Promise.resolve(null),
  ]);

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.top}>
        <div>
          <h1>Reseñas</h1>
          {resumen.total > 0 ? (
            <div className={styles.resumen}>
              <div className={styles.promedio}>
                <span className="num">{resumen.promedio.toFixed(1)}</span>
                <div>
                  <Estrellas valor={resumen.promedio} size={24} />
                  <p>
                    {resumen.total} {resumen.total === 1 ? 'reseña' : 'reseñas'} de clientes con cuenta
                  </p>
                </div>
              </div>
              <ul className={styles.barras} aria-label="Distribución de calificaciones">
                {[5, 4, 3, 2, 1].map((n) => {
                  const cantidad = resumen.distribucion[n - 1];
                  return (
                    <li key={n}>
                      <span>
                        {n} {n === 1 ? 'estrella' : 'estrellas'}
                      </span>
                      <span className={styles.barra}>
                        <span style={{ width: `${(cantidad / resumen.total) * 100}%` }} />
                      </span>
                      <span className="num">{cantidad}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className={styles.vacio}>Todavía no hay reseñas. La tuya puede ser la primera.</p>
          )}
        </div>
        <ResenaForm conSesion={Boolean(cliente)} mia={mia} />
      </div>

      {resenas.length > 0 && <ListaResenas resenas={resenas} />}
    </div>
  );
}
