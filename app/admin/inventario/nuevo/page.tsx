// app/admin/inventario/nuevo/page.tsx
import { conectarDB } from '@/lib/db';
import AgregarSKUClient from './AgregarSKUClient';

async function getFormData() {
    const pool = await conectarDB();

    // 1. Traemos todas las marcas
    const marcas = await pool.request().query(`
    SELECT id, nombre FROM Marcas ORDER BY nombre ASC
  `);

    // 2. Traemos todos los productos con su relación de marca
    const productos = await pool.request().query(`
    SELECT id, nombre, marca_id FROM Productos ORDER BY nombre ASC
  `);

    // 3. Traemos los tamaños únicos que ya existen para sugerirlos
    const tamanos = await pool.request().query(`
    SELECT DISTINCT tamano FROM SKUs WHERE tamano IS NOT NULL ORDER BY tamano ASC
  `);

    return {
        marcas: marcas.recordset,
        productos: productos.recordset,
        tamanos: tamanos.recordset.map((t: { tamano: string }) => t.tamano)
    };
}

export default async function NuevoSKUPage() {
    const { marcas, productos, tamanos } = await getFormData();

    return (
        <main style={{
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div style={{ width: '100%', marginBottom: '2rem' }}>
                <h1 style={{
                    fontFamily: 'var(--font-black-ops)',
                    color: 'var(--color-gold)',
                    fontSize: '2.5rem',
                    textAlign: 'center',
                    letterSpacing: '2px'
                }}>
                    SISTEMA DE CATALOGACIÓN - VIBEFIT
                </h1>
                <p style={{ color: '#666', textAlign: 'center', marginTop: '0.5rem' }}>
                    CONFIGURACIÓN DE NUEVAS UNIDADES DE MANTENIMIENTO DE EXISTENCIAS (SKU)
                </p>
            </div>

            <AgregarSKUClient
                marcasBD={marcas}
                productosBD={productos}
                tamanosBD={tamanos}
            />
        </main>
    );
}