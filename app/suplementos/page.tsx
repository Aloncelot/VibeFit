// app/suplementos/page.tsx

import { conectarDB } from '@/lib/db';
import SuplementosClient from './SuplementosClient';

// 1. Tipado estricto para evitar errores en Antigravity
export interface MarcaSuplemento {
  id: number;
  nombre: string;
  logo_url: string;
}

export interface ProductoSuplemento {
  id: number;
  nombre: string;
  marca: string;
  sabor: string;
  tamano: string;
  precio_venta: number;
  imagen_variante_url: string;
  stock: number;
}

// 2. Le decimos a Next.js que refresque el caché de esta página cada 60 segundos 
// para asegurar que los filtros de "Sin Stock" se apliquen casi en tiempo real.
export const revalidate = 60;

async function getSuplementosData() {
  const pool = await conectarDB();

  // A) Traemos solo las MARCAS que tienen al menos un SKU con stock > 0
  const resultMarcas = await pool.request().query(`
    SELECT DISTINCT m.id, m.nombre, m.logo_url 
    FROM Marcas m
    JOIN Productos p ON m.id = p.marca_id
    JOIN SKUs s ON p.id = s.producto_id
    WHERE s.stock > 0
    ORDER BY m.nombre ASC
  `);

  // B) Traemos solo los SKUs que tienen stock > 0
  const resultProductos = await pool.request().query(`
    SELECT 
      s.id, 
      p.nombre, 
      m.nombre as marca, 
      s.sabor, 
      s.tamano, 
      s.precio_venta, 
      s.imagen_variante_url,
      s.stock
    FROM SKUs s
    JOIN Productos p ON s.producto_id = p.id
    JOIN Marcas m ON p.marca_id = m.id
    WHERE s.stock > 0
    ORDER BY p.nombre, s.sabor
  `);

  return {
    marcas: resultMarcas.recordset as MarcaSuplemento[],
    productos: resultProductos.recordset as ProductoSuplemento[]
  };
}

export default async function SuplementosPage() {
  const { marcas, productos } = await getSuplementosData();

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <SuplementosClient initialProducts={productos} marcasData={marcas} />
    </main>
  );
}