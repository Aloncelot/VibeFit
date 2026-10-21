// Recetas publicadas en /recetas.
// Para publicar una nueva, agrega un objeto al arreglo (la más reciente arriba).
// Los macros son por porción y estimados con tablas de composición de alimentos.

export type Objetivo = 'definicion' | 'volumen';

export interface Receta {
  slug: string;
  titulo: string;
  objetivo: Objetivo;
  resumen: string;
  publicada: string; // AAAA-MM-DD
  tiempoMin: number;
  porciones: number;
  macros: { kcal: number; proteina: number; carbohidratos: number; grasa: number };
  ingredientes: { cantidad: string; ingrediente: string }[];
  pasos: string[];
  consejo?: string;
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

export const RECETAS: Receta[] = [
  {
    slug: 'hotcakes-avena-whey',
    titulo: 'Hotcakes de avena y whey',
    objetivo: 'volumen',
    resumen: 'Desayuno de volumen que se hace en una licuadora: avena, plátano, huevo y una medida de proteína.',
    publicada: '2026-10-14',
    tiempoMin: 15,
    porciones: 1,
    macros: { kcal: 740, proteina: 52, carbohidratos: 79, grasa: 24 },
    ingredientes: [
      { cantidad: '60 g', ingrediente: 'avena en hojuelas' },
      { cantidad: '1 medida (30 g)', ingrediente: 'proteína whey sabor vainilla' },
      { cantidad: '2', ingrediente: 'huevos enteros' },
      { cantidad: '1', ingrediente: 'plátano mediano maduro' },
      { cantidad: '100 ml', ingrediente: 'leche descremada' },
      { cantidad: '15 g', ingrediente: 'crema de cacahuate natural, para servir' },
      { cantidad: '1 pizca', ingrediente: 'canela y polvo para hornear' },
    ],
    pasos: [
      'Licúa la avena, la proteína, los huevos, el plátano, la leche, la canela y el polvo para hornear hasta tener una mezcla espesa.',
      'Deja reposar la mezcla 3 minutos para que la avena se hidrate.',
      'Calienta un sartén antiadherente a fuego medio-bajo y vierte un cucharón por hotcake.',
      'Voltea cuando salgan burbujas en la superficie, a los 2 minutos aprox., y cocina 1 minuto más.',
      'Sirve con la crema de cacahuate encima.',
    ],
    consejo: 'El fuego bajo importa: la proteína whey se quema rápido y deja los hotcakes secos.',
  },
  {
    slug: 'ceviche-de-atun-con-pepino',
    titulo: 'Ceviche de atún con pepino',
    objetivo: 'definicion',
    resumen: 'Comida fresca de más de 55 g de proteína y menos de 500 kcal, lista en 10 minutos y sin estufa.',
    publicada: '2026-10-07',
    tiempoMin: 10,
    porciones: 1,
    macros: { kcal: 457, proteina: 57, carbohidratos: 37, grasa: 9 },
    ingredientes: [
      { cantidad: '2 latas (200 g drenado)', ingrediente: 'atún en agua' },
      { cantidad: '1', ingrediente: 'pepino mediano en cubos' },
      { cantidad: '1', ingrediente: 'jitomate en cubos' },
      { cantidad: '¼', ingrediente: 'cebolla morada picada fina' },
      { cantidad: '3', ingrediente: 'limones, el jugo' },
      { cantidad: '1', ingrediente: 'chile serrano picado, al gusto' },
      { cantidad: '30 g', ingrediente: 'aguacate' },
      { cantidad: '2', ingrediente: 'tostadas horneadas' },
      { cantidad: 'al gusto', ingrediente: 'cilantro, sal y salsa picante' },
    ],
    pasos: [
      'Escurre muy bien el atún y desmenúzalo en un tazón.',
      'Agrega pepino, jitomate, cebolla, chile y cilantro.',
      'Exprime los limones, sazona con sal y mezcla. Deja reposar 5 minutos en el refrigerador.',
      'Sirve sobre las tostadas con el aguacate en láminas.',
    ],
    consejo: 'Si cuentas sodio en la semana de competencia, cambia el atún de lata por 200 g de atún fresco.',
  },
  {
    slug: 'licuado-de-masa-casero',
    titulo: 'Licuado de masa casero',
    objetivo: 'volumen',
    resumen: 'Más de 700 kcal en un vaso para cuando no te alcanza el apetito para llegar a tus calorías.',
    publicada: '2026-09-30',
    tiempoMin: 5,
    porciones: 1,
    macros: { kcal: 733, proteina: 46, carbohidratos: 81, grasa: 25 },
    ingredientes: [
      { cantidad: '1 medida (30 g)', ingrediente: 'proteína whey sabor chocolate' },
      { cantidad: '300 ml', ingrediente: 'leche entera' },
      { cantidad: '50 g', ingrediente: 'avena en hojuelas' },
      { cantidad: '1', ingrediente: 'plátano mediano' },
      { cantidad: '20 g', ingrediente: 'crema de cacahuate natural' },
      { cantidad: '4', ingrediente: 'cubos de hielo' },
    ],
    pasos: [
      'Licúa primero la avena con la leche durante 30 segundos para que no quede arenosa.',
      'Agrega el resto de los ingredientes y licúa 30 segundos más.',
    ],
    consejo: 'Tómalo entre comidas, no en lugar de una: el objetivo es sumar calorías.',
  },
  {
    slug: 'bowl-de-claras-pavo-y-espinaca',
    titulo: 'Bowl de claras, pavo y espinaca',
    objetivo: 'definicion',
    resumen: 'Desayuno salado de 355 kcal con 47 g de proteína y dos tortillas, para no sentir que estás a dieta.',
    publicada: '2026-09-23',
    tiempoMin: 12,
    porciones: 1,
    macros: { kcal: 355, proteina: 47, carbohidratos: 35, grasa: 3 },
    ingredientes: [
      { cantidad: '250 ml', ingrediente: 'claras de huevo' },
      { cantidad: '60 g', ingrediente: 'pechuga de pavo en cubos' },
      { cantidad: '1 taza', ingrediente: 'espinaca baby' },
      { cantidad: '80 g', ingrediente: 'champiñones rebanados' },
      { cantidad: '2', ingrediente: 'tortillas de maíz' },
      { cantidad: '3 cdas', ingrediente: 'salsa verde' },
      { cantidad: 'al gusto', ingrediente: 'aceite en aerosol, sal y pimienta' },
    ],
    pasos: [
      'Rocía un sartén con aceite en aerosol y saltea los champiñones 3 minutos a fuego alto.',
      'Agrega el pavo y la espinaca y cocina hasta que la espinaca se marchite.',
      'Vierte las claras, baja el fuego y mueve suavemente hasta que cuajen.',
      'Sirve en un bowl con la salsa verde y calienta las tortillas al comal.',
    ],
  },
  {
    slug: 'pollo-al-chipotle-con-arroz-y-frijoles',
    titulo: 'Pollo al chipotle con arroz y frijoles',
    objetivo: 'volumen',
    resumen: 'La comida de batch cooking de siempre, con 54 g de proteína y carbohidratos para entrenar pierna.',
    publicada: '2026-09-16',
    tiempoMin: 30,
    porciones: 1,
    macros: { kcal: 675, proteina: 54, carbohidratos: 81, grasa: 15 },
    ingredientes: [
      { cantidad: '180 g', ingrediente: 'pechuga de pollo cruda' },
      { cantidad: '1 cda', ingrediente: 'chipotle adobado, licuado' },
      { cantidad: '1 cdta', ingrediente: 'aceite de oliva' },
      { cantidad: '1 taza (200 g)', ingrediente: 'arroz blanco cocido' },
      { cantidad: '½ taza', ingrediente: 'frijoles negros de la olla, escurridos' },
      { cantidad: '40 g', ingrediente: 'aguacate' },
      { cantidad: 'al gusto', ingrediente: 'ajo en polvo, sal y limón' },
    ],
    pasos: [
      'Corta el pollo en tiras y marínalo con el chipotle, el ajo y la sal por al menos 10 minutos.',
      'Calienta el aceite en un sartén a fuego medio-alto y dora el pollo 6 a 8 minutos, hasta que esté bien cocido.',
      'Calienta el arroz y los frijoles.',
      'Arma el plato con arroz, frijoles, pollo y aguacate. Termina con limón.',
    ],
    consejo: 'Para preparar la semana, multiplica por cinco y guarda en recipientes de vidrio hasta 4 días.',
  },
];

export function getReceta(slug: string): Receta | undefined {
  return RECETAS.find((r) => r.slug === slug);
}

export function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}
