export interface Marca {
  id: number;
  nombre: string;
  logo_url: string | null;
}

export interface Suplemento {
  id: number; // id del SKU
  nombre: string;
  marca: string;
  sabor: string;
  tamano: string;
  precio_venta: number;
  imagen_variante_url: string | null;
  stock: number;
}

export interface SuplementoAgrupado {
  key: string;
  nombre: string;
  marca: string;
  tamano: string;
  variantes: Suplemento[];
}

/** Datos de un SKU para mostrarlo en carrito y listas. */
export interface SkuResumen {
  id: number; // id del SKU
  nombre: string;
  marca: string;
  variante: string; // sabor
  tamano: string;
  precio: number;
  imagen_url: string | null;
  stock: number;
}

export interface CartItem extends SkuResumen {
  cantidad: number;
}

export type Lista = 'CARRITO' | 'GUARDADO' | 'FAVORITO';

export interface ListasCliente {
  carrito: CartItem[];
  guardados: SkuResumen[];
  favoritos: number[]; // ids de SKU
  alertas: number[]; // ids de SKU con alerta de restock pendiente
}

export interface Notificacion {
  id: number;
  mensaje: string;
  leida: boolean;
  creada_en: string;
  sku_id: number | null;
}
