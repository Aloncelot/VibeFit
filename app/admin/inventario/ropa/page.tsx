// app/admin/inventario/ropa/page.tsx
import { conectarDB } from '@/lib/db';
import InventarioRopaClient from './InventarioRopaClient';

async function getInventarioRopa() {
    const pool = await conectarDB();

    // CORRECCIÓN: Leemos directamente la columna "color" real que creaste, 
    // y renombramos "tamano" a "talla" para que coincida con el Frontend
    const result = await pool.request().query(`
    SELECT 
      s.id, 
      p.nombre as modelo, 
      m.nombre as marca, 
      s.color, 
      s.tamano as talla, 
      s.stock,
      s.precio_proveedor,
      s.precio_venta
    FROM SKUs s
    JOIN Productos p ON s.producto_id = p.id
    JOIN Marcas m ON p.marca_id = m.id
    WHERE p.categoria IN ('TOPS', 'BOTTOMS', 'ACCESORIOS')
    ORDER BY m.nombre, p.nombre, s.color, s.tamano
  `);

    return result.recordset;
}

export default async function InventarioRopaPage() {
    const items = await getInventarioRopa();

    return (
        <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
            <h1 style={{ fontFamily: 'var(--font-black-ops)', color: 'var(--color-gold)', marginBottom: '2rem', letterSpacing: '2px' }}>
                MATRIZ DE SALIDAS GYM WEAR
            </h1>
            <InventarioRopaClient items={items} />
        </main>
    );
}