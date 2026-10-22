// Tipos y utilidades de las recetas publicadas en /recetas.
// Las recetas viven en Azure SQL (tabla Recetas) y se administran en /admin/recetas.
// Los macros son por porción.

export type Objetivo = 'definicion' | 'volumen';

export const OBJETIVO_VALORES = ['definicion', 'volumen'] as const satisfies readonly Objetivo[];

export interface Macros {
  kcal: number;
  proteina: number;
  carbohidratos: number;
  grasa: number;
}

export interface Ingrediente {
  cantidad: string;
  ingrediente: string;
}

export interface Receta {
  id: number;
  slug: string;
  titulo: string;
  objetivo: Objetivo;
  resumen: string;
  publicada: string; // AAAA-MM-DD
  tiempoMin: number;
  porciones: number;
  macros: Macros;
  ingredientes: Ingrediente[];
  pasos: string[];
  consejo?: string;
  imagen?: string;
}

/** Receta tal como la ve el panel de admin (incluye las ocultas). */
export interface RecetaAdmin extends Receta {
  visible: boolean;
}

export const OBJETIVOS: Record<Objetivo, { label: string; descripcion: string }> = {
  definicion: {
    label: 'Definición',
    descripcion: 'Mucha proteína y pocas calorías para mantener músculo en déficit.',
  },
  volumen: {
    label: 'Volumen',
    descripcion: 'Proteína alta y carbohidratos suficientes para entrenar pesado y crecer.',
  },
};

/** Calorías que suman los macros (P×4, C×4, G×9). Sirve para revisar el dato capturado. */
export function kcalDeMacros(m: Omit<Macros, 'kcal'>): number {
  return Math.round(m.proteina * 4 + m.carbohidratos * 4 + m.grasa * 9);
}

/** "Pollo al chipotle con arroz" → "pollo-al-chipotle-con-arroz" */
export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/g, '');
}

export function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}
