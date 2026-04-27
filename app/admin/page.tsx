'use client';

import Link from 'next/link';
import { LayoutDashboard, BarChart3, ChevronRight } from 'lucide-react';

export default function AdminHubPage() {
    return (
        <main style={{
            minHeight: '100vh',
            background: '#050505',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <h1 style={{
                fontFamily: 'var(--font-black-ops)',
                color: 'var(--color-gold)',
                fontSize: '2.5rem',
                letterSpacing: '4px',
                marginBottom: '3rem',
                textAlign: 'center'
            }}>
                CONTROL PANEL_
            </h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                width: '100%',
                maxWidth: '800px'
            }}>

                {/* OPCIÓN: INVENTARIO */}
                <Link href="/admin/inventario" style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: '#111',
                        border: '1px solid #333',
                        padding: '2rem',
                        borderRadius: '12px',
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }} className="hub-card">
                        <LayoutDashboard color="var(--color-gold)" size={40} />
                        <div>
                            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>INVENTARIO</h2>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Gestión de stock, carga de inbounds y catálogo de SKUs.</p>
                        </div>
                        <ChevronRight style={{ position: 'absolute', right: '20px', bottom: '20px', color: '#333' }} />
                    </div>
                </Link>

                {/* OPCIÓN: ESTADÍSTICAS */}
                <Link href="/admin/analisis" style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: '#111',
                        border: '1px solid #333',
                        padding: '2rem',
                        borderRadius: '12px',
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }} className="hub-card">
                        <BarChart3 color="#00e5ff" size={40} />
                        <div>
                            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>ESTADÍSTICAS</h2>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Análisis ABC, tendencias de inversión y rentabilidad.</p>
                        </div>
                        <ChevronRight style={{ position: 'absolute', right: '20px', bottom: '20px', color: '#333' }} />
                    </div>
                </Link>

            </div>

            <style jsx>{`
        .hub-card:hover {
          border-color: var(--color-gold);
          transform: translateY(-5px);
          background: #161616;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
      `}</style>
        </main>
    );
}