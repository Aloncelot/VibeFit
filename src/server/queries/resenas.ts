import 'server-only';
import { getPool, sql } from '@/server/db';

export interface Resena {
  id: number;
  autor: string; // "Alonso C."
  calificacion: number;
  comentario: string;
  creada_en: string;
}

export interface ResumenResenas {
  total: number;
  promedio: number;
  distribucion: [number, number, number, number, number]; // índice 0 = 1 estrella
}

const AUTOR = `
  LEFT(c.nombre, CHARINDEX(' ', c.nombre + ' ') - 1)
  + CASE WHEN CHARINDEX(' ', c.nombre) > 0
         THEN ' ' + SUBSTRING(c.nombre, CHARINDEX(' ', c.nombre) + 1, 1) + '.'
         ELSE '' END`;

const VACIO: ResumenResenas = { total: 0, promedio: 0, distribucion: [0, 0, 0, 0, 0] };

/** Reseñas visibles (más recientes primero) y su resumen. Si la tabla no existe aún, devuelve vacío. */
export async function getResenasPublicas(limite = 30): Promise<{ resumen: ResumenResenas; resenas: Resena[] }> {
  try {
    const pool = await getPool();
    const [lista, dist] = await Promise.all([
      pool.request().input('limite', sql.Int, limite).query<Resena & { creada_en: Date }>(`
        SELECT TOP (@limite) r.id, ${AUTOR} AS autor, r.calificacion, r.comentario, r.creada_en
        FROM Resenas r JOIN Clientes c ON c.id = r.cliente_id
        WHERE r.visible = 1
        ORDER BY r.creada_en DESC
      `),
      pool.request().query<{ calificacion: number; total: number }>(`
        SELECT calificacion, COUNT(*) AS total FROM Resenas WHERE visible = 1 GROUP BY calificacion
      `),
    ]);

    const distribucion: ResumenResenas['distribucion'] = [0, 0, 0, 0, 0];
    for (const d of dist.recordset) distribucion[d.calificacion - 1] = d.total;
    const total = distribucion.reduce((a, b) => a + b, 0);
    const suma = distribucion.reduce((a, n, i) => a + n * (i + 1), 0);

    return {
      resumen: { total, promedio: total ? Math.round((suma / total) * 10) / 10 : 0, distribucion },
      resenas: lista.recordset.map((r) => ({ ...r, creada_en: new Date(r.creada_en).toISOString() })),
    };
  } catch (error) {
    console.error('No se pudieron leer las reseñas:', error);
    return { resumen: VACIO, resenas: [] };
  }
}

export async function getMiResena(clienteId: number): Promise<{ calificacion: number; comentario: string } | null> {
  try {
    const pool = await getPool();
    const r = await pool.request()
      .input('clienteId', sql.Int, clienteId)
      .query<{ calificacion: number; comentario: string }>(`SELECT calificacion, comentario FROM Resenas WHERE cliente_id = @clienteId`);
    return r.recordset[0] ?? null;
  } catch {
    return null;
  }
}
