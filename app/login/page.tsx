// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginBackground from './LoginBackground';
import { ShieldAlert, Terminal } from 'lucide-react';
import { validarAcceso } from './actions';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInitializing(true);

        const res = await validarAcceso(password);

        if (res.success) {
            router.push('/admin'); // Redirigimos al nuevo Hub
        } else {
            setError(true);
            setPassword('');
            setIsInitializing(false);
        }
    };
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* FONDO THREE.JS */}
            <LoginBackground />

            {/* FORMULARIO TIPO CONSOLA */}
            <form
                onSubmit={handleLogin}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    background: 'rgba(10, 10, 10, 0.85)',
                    backdropFilter: 'blur(10px)',
                    padding: '3rem',
                    borderRadius: '2px', // Bordes rectos para look industrial
                    border: error ? '1px solid #ff4444' : '1px solid var(--color-gold)',
                    width: '100%',
                    maxWidth: '420px',
                    boxShadow: error ? '0 0 30px rgba(255, 68, 68, 0.2)' : '0 0 40px rgba(212, 175, 55, 0.1)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <Terminal color="var(--color-gold)" size={40} style={{ marginBottom: '1rem' }} />
                    <h2 style={{
                        fontFamily: 'var(--font-black-ops)',
                        color: 'var(--color-gold)',
                        fontSize: '1.8rem',
                        letterSpacing: '4px',
                        margin: 0
                    }}>
                        VIBEFIT_OS
                    </h2>
                    <p style={{ color: '#666', fontSize: '0.7rem', marginTop: '5px', letterSpacing: '2px' }}>
                        SECURE ACCESS GATEWAY V.2.0
                    </p>
                </div>

                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <input
                        type="password"
                        placeholder="OVERRIDE CODE"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(false); }}
                        disabled={isInitializing}
                        style={{
                            width: '100%',
                            padding: '1.2rem',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid #333',
                            color: 'white',
                            borderRadius: '4px',
                            textAlign: 'center',
                            letterSpacing: '6px',
                            fontSize: '1.2rem',
                            outline: 'none',
                            fontFamily: 'monospace'
                        }}
                        autoFocus
                    />
                </div>

                <button
                    type="submit"
                    disabled={isInitializing}
                    style={{
                        width: '100%',
                        padding: '1.2rem',
                        background: isInitializing ? '#222' : 'var(--color-gold)',
                        color: 'black',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: '900',
                        cursor: isInitializing ? 'wait' : 'pointer',
                        fontSize: '1rem',
                        letterSpacing: '2px',
                        transition: 'all 0.3s'
                    }}
                >
                    {isInitializing ? 'INITIALIZING...' : 'BYPASS FIREWALL'}
                </button>

                {error && (
                    <div style={{
                        marginTop: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: '#ff4444',
                        fontSize: '0.8rem',
                        animation: 'shake 0.5s linear'
                    }}>
                        <ShieldAlert size={16} />
                        <span style={{ letterSpacing: '1px' }}>INVALID CREDENTIALS - ACCESS DENIED</span>
                    </div>
                )}
            </form>

            {/* Estilos CSS adicionales para la animación de error */}
            <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
        </div>
    );
}