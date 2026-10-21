import 'server-only';
import { unstable_cache } from 'next/cache';
import { getPool } from '@/server/db';
import type {
  ColorPrenda,
  Marca,
  Prenda,
  Suplemento,
  SuplementoAgrupado,
  CategoriaPrenda,
} from '@/types/catalogo';

/** Tag que invalidan las Server Actions cuando cambia stock, precio o catálogo. */
export const CATALOGO_TAG = 'catalogo';

const CATEGORIAS_PRENDA: CategoriaPrenda[] = ['TOPS', 'BOTTOMS', 'ACCESORIOS'];

// Logos locales para marcas de ropa sin logo en la base de datos.
const LOGOS_LOCALES: Record<string, string> = {
  GYMSHARK: '/Gymshark.webp',
  YOUNGLA: '/youngla_logo.webp',
  'DARC SPORT': '/darcsport.jpg',
};

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

/* ------------------------------- Ropa -------------------------------- */

interface PrendaRow {
  producto_id: number;
  producto_nombre: string;
  marca: string;
  logo_url: string | null;
  marca_id: number;
  genero: string | null;
  categoria: CategoriaPrenda;
  precio: number;
  color: string | null;
  talla: string | null;
  stock: number;
  sku_id: number;
  imagen_url: string | null;
}

export const getRopa = unstable_cache(
  async (): Promise<{ marcas: Marca[]; productos: Prenda[] }> => {
    const pool = await getPool();
    const result = await pool.request().query<PrendaRow>(`
      SELECT p.id AS producto_id, p.nombre AS producto_nombre,
             m.id AS marca_id, m.nombre AS marca, m.logo_url,
             p.genero, p.categoria, s.precio_venta AS precio,
             s.color, s.tamano AS talla, s.stock, s.id AS sku_id,
             img.imagen_url
      FROM Productos p
      JOIN Marcas m ON p.marca_id = m.id
      JOIN SKUs s ON p.id = s.producto_id
      LEFT JOIN Imagenes_SKU img ON s.id = img.sku_id
      WHERE p.categoria IN ('TOPS', 'BOTTOMS', 'ACCESORIOS')
      ORDER BY p.id, s.color, s.id, img.orden
    `);

    const marcas = new Map<number, Marca>();
    const productos = new Map<number, Prenda & { _colores: Map<string, ColorPrenda> }>();

    for (const row of result.recordset) {
      if (!marcas.has(row.marca_id)) {
        marcas.set(row.marca_id, {
          id: row.marca_id,
          nombre: row.marca,
          logo_url: LOGOS_LOCALES[row.marca.toUpperCase()] ?? row.logo_url,
        });
      }

      let producto = productos.get(row.producto_id);
      if (!producto) {
        producto = {
          id: row.producto_id,
          nombre: row.producto_nombre,
          marca: row.marca,
          genero: (row.genero ?? 'UNISEX').toUpperCase(),
          categoria: row.categoria,
          precio: Number(row.precio),
          colores: [],
          _colores: new Map(),
        };
        productos.set(row.producto_id, producto);
      }

      const nombreColor = row.color ?? 'ÚNICO';
      let color = producto._colores.get(nombreColor);
      if (!color) {
        color = { nombre: nombreColor, tallas: [], imagenes: [] };
        producto._colores.set(nombreColor, color);
        producto.colores.push(color);
      }

      if (!color.tallas.some((t) => t.sku_id === row.sku_id)) {
        color.tallas.push({ talla: row.talla ?? 'U', stock: row.stock, sku_id: row.sku_id });
      }
      if (row.imagen_url && !color.imagenes.includes(row.imagen_url)) {
        color.imagenes.push(row.imagen_url);
      }
    }

    // Al público solo se muestran colores con al menos una talla en existencia
    // (las tallas agotadas de un color disponible se ven tachadas para pedir aviso).
    const publicos = [...productos.values()]
      .map(({ _colores, ...p }) => ({ ...p, colores: p.colores.filter((c) => c.tallas.some((t) => t.stock > 0)) }))
      .filter((p) => p.colores.length > 0);
    const marcasConStock = new Set(publicos.map((p) => p.marca));

    return {
      marcas: [...marcas.values()].filter((m) => marcasConStock.has(m.nombre)).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      productos: publicos,
    };
  },
  ['ropa-v3'],
  { tags: [CATALOGO_TAG], revalidate: 60 },
);

export function esCategoriaPrenda(value: unknown): value is CategoriaPrenda {
  return typeof value === 'string' && (CATEGORIAS_PRENDA as string[]).includes(value);
}

/* ------------------------------ Portada ------------------------------ */

export async function getConteosPortada() {
  const [suplementos, ropa] = await Promise.all([getSuplementos(), getRopa()]);
  return {
    suplementos: agruparSuplementos(suplementos.productos).length,
    ropa: ropa.productos.filter((p) => p.categoria !== 'ACCESORIOS').length,
    accesorios: ropa.productos.filter((p) => p.categoria === 'ACCESORIOS').length,
    marcasSuplementos: suplementos.marcas,
  };
}
