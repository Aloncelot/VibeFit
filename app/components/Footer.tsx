// app/components/Footer.tsx

'use client';
import Link from 'next/link';
import FooterBackground from './FooterBackground';
import { Dumbbell, Package, Home, Mail, MessageCircle } from 'lucide-react';

const InstagramIcon = ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

const TikTokIcon = ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export default function Footer() {
    return (
        <footer style={{ position: 'relative', background: '#050505', color: 'white', overflow: 'hidden', borderTop: '1px solid #222', marginTop: 'auto' }}>
            <FooterBackground />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem 1rem 2rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3rem' }}>

                    {/* COLUMNA 1: MARCA */}
                    <div>
                        <h3 style={{ fontFamily: 'var(--font-black-ops)', color: 'var(--color-gold)', fontSize: '1.8rem', letterSpacing: '2px', marginBottom: '1rem' }}>VIBEFIT</h3>
                        <p style={{ color: '#888', lineHeight: '1.6' }}>Tu máxima capacidad, desbloqueada. Suplementos premium y equipo de alto rendimiento.</p>
                    </div>

                    {/* COLUMNA 2: NAVEGACIÓN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.5rem' }}>NAVEGACIÓN</h4>
                        <Link href="/" style={{ color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = '#888'}>
                            <Home size={18} /> Inicio
                        </Link>
                        <Link href="/suplementos" style={{ color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = '#888'}>
                            <Package size={18} /> Suplementos
                        </Link>
                        <Link href="/gymwear" style={{ color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = '#888'}>
                            <Dumbbell size={18} /> Gym Wear
                        </Link>
                    </div>

                    {/* COLUMNA 3: CONTACTO Y REDES */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.5rem' }}>SOPORTE Y COMUNIDAD</h4>

                        {/* Redes */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                            <a href="https://instagram.com/tu_usuario" target="_blank" rel="noopener noreferrer" style={{ color: '#888', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = '#E1306C'} onMouseOut={(e) => e.currentTarget.style.color = '#888'}>
                                <InstagramIcon size={24} />
                            </a>
                            <a href="https://tiktok.com/@tu_usuario" target="_blank" rel="noopener noreferrer" style={{ color: '#888', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = '#00f2fe'} onMouseOut={(e) => e.currentTarget.style.color = '#888'}>
                                <TikTokIcon size={24} />
                            </a>
                        </div>

                        {/* Contacto Directo */}
                        <a href="mailto:contacto@vibefit.com" style={{ color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = '#888'}>
                            <Mail size={18} /> contacto@vibefit.com
                        </a>
                        <a href="https://wa.me/525500000000" target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = '#25D366'} onMouseOut={(e) => e.currentTarget.style.color = '#888'}>
                            <MessageCircle size={18} /> Chat de WhatsApp
                        </a>
                    </div>

                </div>

                {/* BARRA INFERIOR: Copyright y Accesos Ocultos */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', fontSize: '0.8rem', color: '#444', flexWrap: 'wrap', gap: '1rem' }}>
                    <span>© {new Date().getFullYear()} VIBEFIT. Todos los derechos reservados.</span>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <a href="https://quasar-devs.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = '#00e5ff'} onMouseOut={(e) => e.currentTarget.style.color = '#444'}>
                            Powered by Quasar Devs
                        </a>
                        <Link href="/login" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-gold)'} onMouseOut={(e) => e.currentTarget.style.color = '#444'}>
                            System Admin
                        </Link>
                    </div>
                </div>

            </div>
        </footer>
    );
}