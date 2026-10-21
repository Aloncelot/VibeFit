import type { Metadata } from 'next';
import Link from 'next/link';
import { getDemanda, PERIODOS_DEMANDA } from '@/server/queries/admin';
import styles from '../admin.module.css';

export const metadata: Metadata = { title: 'Planeación de demanda' };

const COLUMNAS = [
  { key: 'alertas_pendientes', label: 'Avisos pendientes', ayuda: 'Clientes esperando que vuelva' },
  { key: 'ventas_perdidas', label: 'Ventas perdidas (u)', ayuda: 'Unidades que no se vendieron por falta de stock' },
  { key: 'carrito_sin_stock', label: 'Agotado en carrito', ayuda: 'Clientes que lo tenían en su carrito cuando se agotó' },
  { key: 'favoritos_actuales', label: 'Favoritos', ayuda: 'Clientes que lo tienen en favoritos' },
  { key: 'guardados_actuales', label: 'Guardados', ayuda: 'Clientes que lo guardaron para después' },
  { key: 'vendidas', label: 'Vendidas (u)', ayuda: 'Unidades vendidas en el periodo' },
] as const;

export default async function DemandaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = Number((await searchParams).dias);
  const dias = (PERIODOS_DEMANDA as readonly number[]).includes(parsed) ? parsed : 90;
  const items = await getDemanda(dias);

  const totales = {
    avisos: items.reduce((a, i) => a + i.alertas_pendientes, 0),
    perdidas: items.reduce((a, i) => a + i.ventas_perdidas, 0),
    agotadosConDemanda: items.filter((i) => i.stock <= 0).length,
    reponer: items.reduce((a, i) => a + i.reposicion_sugerida, 0),
  };

  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1>Planeación de demanda</h1>
          <p className={styles.lead}>
            Señales de lo que los clientes quieren y no encontraron: avisos de existencia, ventas que no se completaron, favoritos y
            productos guardados. Solo visible en este panel.
          </p>
        </div>
        <a href={`/admin/demanda/csv?dias=${dias}`} className="btn btn-outline">
          Descargar CSV
        </a>
      </div>

      <nav className={styles.periodos} aria-label="Periodo">
        {PERIODOS_DEMANDA.map((d) => (
          <Link key={d} href={`/admin/demanda?dias=${d}`} aria-current={d === dias ? 'true' : undefined}>
            Últimos {d} días
          </Link>
        ))}
      </nav>

      <dl className={styles.kpis}>
        <div>
          <dt>Avisos pendientes</dt>
          <dd className="num">{totales.avisos}</dd>
        </div>
        <div>
          <dt>Unidades de venta perdidas</dt>
          <dd className="num">{totales.perdidas}</dd>
        </div>
        <div>
          <dt>SKUs agotados con demanda</dt>
          <dd className="num">{totales.agotadosConDemanda}</dd>
        </div>
        <div>
          <dt>Reposición sugerida (u)</dt>
          <dd className="num">{totales.reponer}</dd>
        </div>
      </dl>

      {items.length === 0 ? (
        <p className={styles.lead}>Todavía no hay señales de demanda en este periodo.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col" className={styles.right}>
                  Stock
                </th>
                {COLUMNAS.map((c) => (
                  <th key={c.key} scope="col" className={styles.right} title={c.ayuda}>
                    {c.label}
                  </th>
                ))}
                <th scope="col" className={styles.right} title="Vendidas + avisos pendientes + ventas perdidas − stock">
                  Reponer (u)
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <span className={styles.muted}>{i.marca}</span>
                    <br />
                    <strong>{i.producto}</strong>
                    <br />
                    <span className={styles.muted}>{[i.variante, i.tamano].filter(Boolean).join(' / ')}</span>
                    <br />
                    <span className={styles.muted}>SKU {i.id}</span>
                  </td>
                  <td className={`${styles.right} num`} data-cero={i.stock <= 0 || undefined}>
                    {i.stock}
                  </td>
                  {COLUMNAS.map((c) => (
                    <td key={c.key} className={`${styles.right} num`}>
                      {i[c.key] || <span className={styles.muted}>0</span>}
                    </td>
                  ))}
                  <td className={`${styles.right} num ${styles.reponer}`}>{i.reposicion_sugerida}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
