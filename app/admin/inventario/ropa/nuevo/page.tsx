// app/admin/inventario/ropa/nuevo/page.tsx

import { conectarDB } from '@/lib/db';
import AgregarRopaClient from './AgregarRopaClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

async function getMarcas() {
    const pool = await conectarDB();
    const result = await pool.request().query(`
    SELECT id, nombre FROM Marcas 
    WHERE id NOT IN (
        SELECT DISTINCT marca_id FROM Productos WHERE categoria = 'Suplemento'
    )
    ORDER BY nombre ASC
  `);
    return result.recordset;
}

export default async function NuevaRopaPage() {
    const marcas = await getMarcas();

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
                    STREETWEAR & APPAREL - VIBEFIT
                </h1>
                <p style={{ color: '#666', textAlign: 'center', marginTop: '0.5rem' }}>
                    GESTIÓN AVANZADA DE DROPS, COLORES Y TALLAS
                </p>
            </div>

            <div style={{ width: '100%', maxWidth: '900px', marginBottom: '1rem', display: 'flex', justifyContent: 'flex-start' }}>
                <Link href="/admin" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#aaa',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    transition: 'color 0.3s'
                }}>
                    <ChevronLeft size={20} /> REGRESAR AL PANEL
                </Link>
            </div>

            <AgregarRopaClient marcasBD={marcas} />
        </main>
    );
}