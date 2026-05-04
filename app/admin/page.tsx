// app/admin/page.tsx
'use client';

import Link from 'next/link';
import { LayoutDashboard, BarChart3, ChevronRight, PlusCircle } from 'lucide-react';

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

            {/* GRUPO SUPLEMENTOS */}
            <div style={{ width: '100%', maxWidth: '1100px', marginBottom: '3rem' }}>
                <h3 style={{ color: 'white', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-mohave)', letterSpacing: '2px' }}>
                    SUPLEMENTOS
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
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
            </div>

            {/* GRUPO GYM WEAR */}
            <div style={{ width: '100%', maxWidth: '1100px' }}>
                <h3 style={{ color: 'white', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-mohave)', letterSpacing: '2px' }}>
                    GYM WEAR
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    <div onClick={() => alert('Módulo en construcción... Pronto podrás ver el listado.')} style={{
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
                        <LayoutDashboard color="white" size={40} />
                        <div>
                            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>INVENTARIO ROPA</h2>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Consulta y edición del catálogo de prendas existente.</p>
                        </div>
                        <ChevronRight style={{ position: 'absolute', right: '20px', bottom: '20px', color: '#333' }} />
                    </div>

                    <Link href="/admin/inventario/ropa/nuevo" style={{ textDecoration: 'none' }}>
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
                            <PlusCircle color="#4ade80" size={40} />
                            <div>
                                <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>ALTA DE ROPA</h2>
                                <p style={{ color: '#666', fontSize: '0.9rem' }}>Registro de nuevos drops, colores y tallas.</p>
                            </div>
                            <ChevronRight style={{ position: 'absolute', right: '20px', bottom: '20px', color: '#333' }} />
                        </div>
                    </Link>

                    <div onClick={() => alert('Módulo en construcción...')} style={{
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
                        <BarChart3 color="#ff4444" size={40} />
                        <div>
                            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>ESTADÍSTICAS ROPA</h2>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Reporte de ventas, tallas populares y retorno de drop.</p>
                        </div>
                        <ChevronRight style={{ position: 'absolute', right: '20px', bottom: '20px', color: '#333' }} />
                    </div>
                </div>
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