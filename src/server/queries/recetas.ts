import 'server-only';
import { unstable_cache } from 'next/cache';
import { getPool, sql } from '@/server/db';
import type { Ingrediente, Objetivo, Receta, RecetaAdmin } from '@/content/recetas';

export const RECETAS_TAG = 'recetas';

interface Fila {
  id: number;
  slug: string;
  titulo: string;
  objetivo: Objetivo;
  resumen: string;
  publicada: Date;
  tiempo_min: number;
  porciones: number;
  kcal: number;
  proteina: number;
  carbohidratos: number;
  grasa: number;
  ingredientes: string;
  pasos: string;
  consejo: string | null;
  imagen_url: string | null;
  visible: boolean;
}

const COLUMNAS = `id, slug, titulo, objetivo, resumen, publicada, tiempo_min, porciones, kcal, proteina,
  carbohidratos, grasa, ingredientes, pasos, consejo, imagen_url, visible`;

function parseLista<T>(json: string): T[] {
  try {
    const valor: unknown = JSON.parse(json);
    return Array.isArray(valor) ? (valor as T[]) : [];
  } catch {
    return [];
  }
}

function aReceta(f: Fila): RecetaAdmin {
  return {
    id: f.id,
    slug: f.slug,
    titulo: f.titulo,
    objetivo: f.objetivo,
    resumen: f.resumen,
    publicada: new Date(f.publicada).toISOString().slice(0, 10),
    tiempoMin: f.tiempo_min,
    porciones: f.porciones,
    macros: { kcal: f.kcal, proteina: f.proteina, carbohidratos: f.carbohidratos, grasa: f.grasa },
    ingredientes: parseLista<Ingrediente>(f.ingredientes),
    pasos: parseLista<string>(f.pasos),
    consejo: f.consejo ?? undefined,
    imagen: f.imagen_url ?? undefined,
    visible: f.visible,
  };
}

/**
 * Recetas publicadas (visibles), la más reciente primero.
 * Se guardan en caché hasta que el admin crea, edita u oculta una receta.
 * Si la tabla aún no existe (falta `npm run db:migrar`), devuelve una lista vacía.
 */
export const getRecetas = unstable_cache(
  async (): Promise<Receta[]> => {
    try {
      const pool = await getPool();
      const r = await pool.request().query<Fila>(`
        SELECT ${COLUMNAS} FROM Recetas WHERE visible = 1 ORDER BY publicada DESC, id DESC
      `);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return r.recordset.map(aReceta).map(({ visible, ...receta }) => receta);
    } catch (error) {
      console.error('No se pudieron leer las recetas:', error);
      return [];
    }
  },
  ['recetas-publicadas-v1'],
  { tags: [RECETAS_TAG], revalidate: 3600 },
);

export async function getReceta(slug: string): Promise<Receta | undefined> {
  return (await getRecetas()).find((r) => r.slug === slug);
}

/** Todas las recetas, incluidas las ocultas. Solo para el panel. */
export async function getRecetasAdmin(): Promise<RecetaAdmin[]> {
  const pool = await getPool();
  const r = await pool.request().query<Fila>(`SELECT ${COLUMNAS} FROM Recetas ORDER BY publicada DESC, id DESC`);
  return r.recordset.map(aReceta);
}

export async function getRecetaAdmin(id: number): Promise<RecetaAdmin | null> {
  const pool = await getPool();
  const r = await pool.request().input('id', sql.Int, id).query<Fila>(`SELECT ${COLUMNAS} FROM Recetas WHERE id = @id`);
  const fila = r.recordset[0];
  return fila ? aReceta(fila) : null;
}
