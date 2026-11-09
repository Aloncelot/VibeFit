import 'server-only';
import { unstable_cache } from 'next/cache';
import { getPool } from '@/server/db';
import type { Marca, Suplemento, SuplementoAgrupado } from '@/types/catalogo';

/** Tag que invalidan las Server Actions cuando cambia stock, precio o catálogo. */
export const CATALOGO_TAG = 'catalogo';


/* ---------------------------- Suplementos ---------------------------- */

export const getSuplementos = unstable_cache(
  async (): Promise<{ marcas: Marca[]; productos: Suplemento[] }> => {
    const pool = await getPool();
    // Una sola ida a la base de datos; las marcas se derivan de los productos.
    const result = await pool.request().query<Suplemento & { marca_id: number; logo_url: string | null }>(`
      SELECT s.id, p.nombre, m.id AS marca_id, m.nombre AS marca, m.logo_url,
             s.sabor, s.tamano, s.precio_venta, s.imagen_variante_url, s.stock
      FROM SKUs s
      JOIN Productos p ON s.producto_id = p.id
      JOIN Marcas m ON p.marca_id = m.id
      WHERE s.stock > 0 AND p.categoria = 'Suplemento'
      ORDER BY p.nombre, s.sabor
    `);

    const marcas = new Map<number, Marca>();
    const productos: Suplemento[] = result.recordset.map((row) => {
      if (!marcas.has(row.marca_id)) {
        marcas.set(row.marca_id, { id: row.marca_id, nombre: row.marca, logo_url: row.logo_url });
      }
      return {
        id: row.id,
        nombre: row.nombre,
        marca: row.marca,
        sabor: row.sabor ?? '',
        tamano: row.tamano ?? '',
        precio_venta: Number(row.precio_venta),
        imagen_variante_url: row.imagen_variante_url,
        stock: row.stock,
      };
    });

    return {
      marcas: [...marcas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      productos,
    };
  },
  ['suplementos-v3'],
  { tags: [CATALOGO_TAG], revalidate: 60 },
);

/** Agrupa SKUs por producto + tamaño; cada sabor es una variante. */
export function agruparSuplementos(productos: Suplemento[]): SuplementoAgrupado[] {
  const grupos = new Map<string, SuplementoAgrupado>();
  for (const p of productos) {
    const key = `${p.marca}|${p.nombre}|${p.tamano}`;
    let grupo = grupos.get(key);
    if (!grupo) {
      grupo = { key, nombre: p.nombre, marca: p.marca, tamano: p.tamano, variantes: [] };
      grupos.set(key, grupo);
    }
    grupo.variantes.push(p);
  }
  return [...grupos.values()];
}

/* ------------------------------ Portada ------------------------------ */

/** Marcas para la barra de la portada: las que tienen más productos en existencia van primero. */
export async function getMarcasPortada(): Promise<(Marca & { productos: number })[]> {
  const { marcas, productos } = await getSuplementos();
  const porMarca = new Map<string, number>();
  for (const g of agruparSuplementos(productos)) porMarca.set(g.marca, (porMarca.get(g.marca) ?? 0) + 1);
  return marcas
    .map((m) => ({ ...m, productos: porMarca.get(m.nombre) ?? 0 }))
    .sort((a, b) => b.productos - a.productos || a.nombre.localeCompare(b.nombre));
}
