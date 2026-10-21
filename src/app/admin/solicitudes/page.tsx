import type { Metadata } from 'next';
import Link from 'next/link';
import { getSolicitudes, type EstadoSolicitud } from '@/server/queries/admin';
import EstadoSelect from './estado-select';
import styles from '../admin.module.css';

export const metadata: Metadata = { title: 'Solicitudes de producto' };

const FILTROS = [
  { value: 'ABIERTAS', label: 'Por revisar' },
  { value: 'ATENDIDA', label: 'Atendidas' },
  { value: 'DESCARTADA', label: 'Descartadas' },
  { value: 'TODAS', label: 'Todas' },
] as const;

const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' });

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).estado;
  const filtro = FILTROS.find((f) => f.value === raw)?.value ?? 'ABIERTAS';
  const solicitudes = await getSolicitudes(filtro as EstadoSolicitud | 'ABIERTAS' | 'TODAS');

  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1>Solicitudes de producto</h1>
          <p className={styles.lead}>
            Lo que los clientes piden desde el formulario al final de cada catálogo. Úsalo junto con la planeación de demanda para
            decidir qué comprar.
          </p>
        </div>
      </div>

      <nav className={styles.periodos} aria-label="Filtrar">
        {FILTROS.map((f) => (
          <Link key={f.value} href={`/admin/solicitudes?estado=${f.value}`} aria-current={f.value === filtro ? 'true' : undefined}>
            {f.label}
          </Link>
        ))}
      </nav>

      {solicitudes.length === 0 ? (
        <p className={styles.lead}>No hay solicitudes en esta vista.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Sección</th>
                <th scope="col">Contacto</th>
                <th scope="col">Fecha</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.estado === 'NUEVA' && <span className={styles.nuevo}>Nueva</span>}
                    <strong>{s.producto}</strong>
                    {s.marca && (
                      <>
                        <br />
                        <span className={styles.muted}>Marca: {s.marca}</span>
                      </>
                    )}
                    {s.detalle && (
                      <>
                        <br />
                        <span className={styles.muted}>{s.detalle}</span>
                      </>
                    )}
                  </td>
                  <td>{s.seccion}</td>
                  <td className={styles.muted}>{s.contacto ?? 'Invitado'}</td>
                  <td className={styles.muted}>{fecha.format(new Date(s.creada_en))}</td>
                  <td>
                    <EstadoSelect id={s.id} estado={s.estado} />
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
