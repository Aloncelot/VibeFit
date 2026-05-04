import { conectarDB } from '@/lib/db';
import InventarioClient from './InventarioClient';

async function getInventario() {
  const pool = await conectarDB();
  // Traemos los productos ordenados por marca para que el conteo sea fácil
  const result = await pool.request().query(`
    SELECT 
      s.id, 
      p.nombre, 
      m.nombre as marca, 
      s.sabor, 
      s.tamano, 
      s.stock,
      s.precio_proveedor,
      s.precio_venta
    FROM SKUs s
    JOIN Productos p ON s.producto_id = p.id
    JOIN Marcas m ON p.marca_id = m.id
    ORDER BY m.nombre, p.nombre, s.sabor
  `);
  return result.recordset;
}

export default async function InventarioPage() {
  const items = await getInventario();

  return (
    <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-black-ops)', color: 'var(--color-gold)', marginBottom: '2rem' }}>
        CENTRO DE DISTRIBUCIÓN - VIBEFIT
      </h1>
      <InventarioClient items={items} />
    </main>
  );
}