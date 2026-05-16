// app/admin/inventario/escaner/EscanerClient.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ScanLine, Type, ChevronLeft, Camera, AlertTriangle, RefreshCcw, Power } from 'lucide-react';
import Link from 'next/link';

// Relajamos las restricciones. Le pedimos la trasera, pero si falla, que agarre la que sea.
const videoConstraints = {
    facingMode: { ideal: "environment" }
};

// Tipado seguro para la ventana con audio webkit (iOS/Safari)
type WindowConAudio = Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
};

export default function EscanerClient() {
    const [modo, setModo] = useState<'BARCODE' | 'OCR'>('BARCODE');
    const [procesando, setProcesando] = useState(false);
    const [resultado, setResultado] = useState<string | null>(null);
    const [camError, setCamError] = useState<string | null>(null);

    // Estado manual para el diagnóstico y control de cámara
    const [debugText, setDebugText] = useState('Presiona el botón para analizar...');
    const [mostrarCamara, setMostrarCamara] = useState(false);

    const webcamRef = useRef<Webcam>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    // NUEVO: Refs para timers estándar (Clean Code / Evitar advertencias de Node)
    const simulatedProcessingTimerRef = useRef<number | null>(null);

    // Reproductor de sonido "Bip" nativo (Tipado estricto sin "any")
    const reproducirBip = useCallback(() => {
        try {
            const ClaseAudioContext = window.AudioContext || (window as WindowConAudio).webkitAudioContext;
            if (!ClaseAudioContext) return; // Si no hay soporte, cancelamos silenciosamente

            const audioCtx = new ClaseAudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Tono alto
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volumen suave
            oscillator.start();

            // Timer corto para detener el sonido. Al ser corto y no ligado a estado de React,
            // no suele alertar en Node, pero para ser ultra limpios usamos window.setTimeout explicitamente
            window.setTimeout(() => oscillator.stop(), 150);
        } catch (e) {
            console.log("Audio no soportado");
        }
    }, []);

    // Cleanup effect para timers estándar (Limpieza táctica al desmontar)
    useEffect(() => {
        return () => {
            // Limpiamos los temporizadores si el componente se desmonta mientras procesaba
            if (simulatedProcessingTimerRef.current) {
                window.clearTimeout(simulatedProcessingTimerRef.current);
            }
        };
    }, []);

    // Lógica del Motor de Código de Barras (Se ejecuta solo si modo === 'BARCODE' y hay permisos)
    useEffect(() => {
        if (mostrarCamara && modo === 'BARCODE') {
            const scanner = new Html5Qrcode("barcode-reader");
            html5QrCodeRef.current = scanner;

            scanner.start(
                { facingMode: "environment" },
                { fps: 15, qrbox: { width: 300, height: 150 } },
                (decodedText) => {
                    reproducirBip();
                    setResultado(decodedText);
                    scanner.pause();
                },
                () => { /* Ignoramos errores de frame */ }
            ).catch((err) => {
                setCamError("Fallo al iniciar motor de barras: " + err.message);
            });

            return () => { // Cleanup: Apagar la cámara al cambiar de modo o cerrar
                if (scanner.isScanning) scanner.stop().catch(console.error);
            };
        }
    }, [mostrarCamara, modo, reproducirBip]);

    // Chequeo manual forzado: Nos dice si Chrome nos dejó pasar o no
    const forzarDiagnostico = async () => {
        try {
            if (!window.isSecureContext) {
                setDebugText("Bloqueo: Contexto Inseguro.");
                setCamError("Chrome bloquea la cámara por seguridad."); return;
            }
            setDebugText("Solicitando permisos al sistema...");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setDebugText("¡Permiso OTORGADO! ✅ Motores listos.");
            setMostrarCamara(true); setCamError(null);
            stream.getTracks().forEach(track => track.stop());
        } catch (error: unknown) {
            let mensajeError = "Error desconocido";
            if (error instanceof Error) {
                mensajeError = error.message;
                if (error.name === 'NotAllowedError') mensajeError = "Permiso DENEGADO por el usuario.";
            }
            setDebugText(`Fallo: ${mensajeError}`); setCamError(mensajeError);
        }
    };

    // Función de captura OCR (Refactorizada para Clean Code y eliminar warnings de timers)
    const capturarOCR = useCallback(() => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setProcesando(true);
        setResultado(null);

        // CORRECCIÓN CLEAN CODE: Usamos el temporizador con cleanup táctico
        if (simulatedProcessingTimerRef.current) {
            window.clearTimeout(simulatedProcessingTimerRef.current); // Cancelamos cualquier timer previo
        }

        // Simulamos un tiempo de procesamiento usando el patrón seguro de refs
        simulatedProcessingTimerRef.current = window.setTimeout(() => {
            if (!procesando) return; // Aseguramos que seguimos procesando cuando el timer acaba
            setProcesando(false);
            reproducirBip();
            setResultado('Model #4259 | Color: Off-White | Size: L');
            simulatedProcessingTimerRef.current = null; // Limpiamos la referencia
        }, 1500);

    }, [webcamRef, reproducirBip, procesando]);

    // Reiniciar escáner después de leer un código
    const reiniciarEscaner = () => {
        setResultado(null);
        if (modo === 'BARCODE' && html5QrCodeRef.current?.getState() === 2) {
            html5QrCodeRef.current.resume();
        }
    };

    // Transiciones elásticas para el shared background del switch
    const springTransition = {
        type: "spring",
        stiffness: 400,
        damping: 35
    } as const;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', color: 'white' }}>

            {/* HEADER TÁCTICO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/admin/inventario" style={{ color: 'var(--color-gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', alignSelf: 'flex-start' }}>
                    <ChevronLeft size={20} /> VOLVER
                </Link>
                <h2 style={{ fontFamily: 'var(--font-black-ops)', margin: 0, color: '#fff', letterSpacing: '2px', fontSize: '1.8rem', textAlign: 'center', width: '100%' }}>
                    TASK-OPS SCANNER
                </h2>
            </div>

            {/* NUEVO SWITCH CON EFECTO DE SPRING (LAYOUTID) */}
            <LayoutGroup>
                <div style={{ display: 'flex', background: '#111', borderRadius: '12px', padding: '0.3rem', marginBottom: '1.5rem', border: '1px solid #333', position: 'relative' }}>

                    {/* Botón MODO 1: BARRAS */}
                    <button
                        onClick={() => { setResultado(null); setModo('BARCODE'); }}
                        style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', position: 'relative', zIndex: 2, color: modo === 'BARCODE' ? 'black' : '#888', transition: 'color 0.3s' }}
                    >
                        {modo === 'BARCODE' && (
                            <motion.div
                                layoutId="activeModeBackground"
                                transition={springTransition}
                                style={{ position: 'absolute', inset: 0, background: 'var(--color-gold)', borderRadius: '8px', zIndex: -1 }}
                            />
                        )}
                        <ScanLine size={18} /> Gymshark/Darc
                    </button>

                    {/* Botón MODO 2: OCR */}
                    <button
                        onClick={() => { setResultado(null); setModo('OCR'); }}
                        style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', position: 'relative', zIndex: 2, color: modo === 'OCR' ? 'black' : '#888', transition: 'color 0.3s' }}
                    >
                        {modo === 'OCR' && (
                            <motion.div
                                layoutId="activeModeBackground"
                                transition={springTransition}
                                style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: '8px', zIndex: -1 }}
                            />
                        )}
                        <Type size={18} /> YoungLA (OCR)
                    </button>

                </div>
            </LayoutGroup>

            {/* ESTADO DE MOTORES / DIAGNÓSTICO */}
            {!mostrarCamara && (
                <div style={{ background: '#000', border: '1px solid #555', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', color: '#00ff00', fontFamily: 'monospace', position: 'relative', zIndex: 10 }}>
                    <strong style={{ color: 'white' }}>ESTADO DE MOTORES:</strong><br />
                    <p style={{ margin: '0.5rem 0' }}>{debugText}</p>
                    <button onClick={forzarDiagnostico} style={{ width: '100%', padding: '0.8rem', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <Power size={18} color="var(--color-gold)" /> INICIAR SISTEMA ÓPTICO
                    </button>
                </div>
            )}

            {/* ERRORES DE CÁMARA */}
            {camError && (
                <div style={{ background: 'rgba(255,0,0,0.2)', border: '1px solid red', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', color: '#ff4ade', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle color="red" />
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{camError}</p>
                </div>
            )}

            {/* ÁREA DE VISIÓN DEL ESCÁNER */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#050505', borderRadius: '16px', overflow: 'hidden', border: `2px solid ${modo === 'BARCODE' ? 'var(--color-gold)' : '#fff'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: mostrarCamara ? 'block' : 'none', zIndex: 1 }}>

                {/* MOTOR 1: BARRAS en vivo */}
                <div id="barcode-reader" style={{ width: '100%', height: '100%', display: modo === 'BARCODE' ? 'block' : 'none' }}></div>

                {/* MOTOR 2: FOTO para OCR */}
                {modo === 'OCR' && (
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}

                {/* OVERLAY VISUAL */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                    <div style={{ width: '75%', height: modo === 'BARCODE' ? '30%' : '50%', border: '2px dashed rgba(255,255,255,0.3)', borderRadius: '12px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: -2, left: -2, width: '20px', height: '20px', borderTop: `4px solid ${modo === 'BARCODE' ? 'var(--color-gold)' : '#fff'}`, borderLeft: `4px solid ${modo === 'BARCODE' ? 'var(--color-gold)' : '#fff'}`, borderTopLeftRadius: '12px' }} />
                        <div style={{ position: 'absolute', top: -2, right: -2, width: '20px', height: '20px', borderTop: `4px solid ${modo === 'BARCODE' ? 'var(--color-gold)' : '#fff'}`, borderRight: `4px solid ${modo === 'BARCODE' ? 'var(--color-gold)' : '#fff'}`, borderTopRightRadius: '12px' }} />
                        <div style={{ position: 'absolute', bottom: -2, left: -2, width: '20px', height: '20px', borderBottom: `4px solid ${modo === 'BARCODE' ? 'var(--color-gold)' : '#fff'}`, borderLeft: `4px solid ${modo === 'BARCODE' ? 'var(--color-gold)' : '#fff'}`, borderBottomLeftRadius: '12px' }} />
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: '20px', height: '20px', borderBottom: `4px solid ${modo === 'BARCODE' ? 'var(--color-gold)' : '#fff'}`, borderRight: `4px solid ${modo === 'BARCODE' ? 'var(--color-gold)' : '#fff'}`, borderBottomRightRadius: '12px' }} />

                        {(procesando || (modo === 'BARCODE' && !resultado)) && (
                            <motion.div initial={{ top: '0%' }} animate={{ top: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: modo === 'BARCODE' ? 'var(--color-gold)' : '#fff', boxShadow: `0 0 10px ${modo === 'BARCODE' ? 'var(--color-gold)' : '#fff'}` }} />
                        )}
                    </div>
                </div>

                {/* Capa de Procesando */}
                <AnimatePresence>
                    {procesando && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', zIndex: 20 }}>
                            <ScanLine size={40} className="spin-animation" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ fontFamily: 'var(--font-black-ops)', letterSpacing: '2px' }}>ANALIZANDO CON IA YOUNGLA...</h3>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* RESULTADO Y ACCIONES */}
            <AnimatePresence mode="wait">
                {resultado ? (
                    <motion.div key="resultado" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ marginTop: '2rem' }}>
                        <div style={{ padding: '1.5rem', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid #4ade80', borderRadius: '12px', color: '#4ade80', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            <span style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem', fontFamily: 'sans-serif' }}>DATOS EXTRAÍDOS:</span>
                            {resultado}
                        </div>
                        <button onClick={reiniciarEscaner} style={{ width: '100%', padding: '1rem', marginTop: '1rem', background: modo === 'BARCODE' ? 'var(--color-gold)' : '#fff', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                            <RefreshCcw size={20} /> ESCANEAR SIGUIENTE
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="acciones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {modo === 'OCR' && mostrarCamara && (
                            <button onClick={capturarOCR} disabled={procesando} style={{ width: '100%', padding: '1.2rem', marginTop: '2rem', background: '#222', border: '1px solid #fff', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: procesando ? 'wait' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                <Camera /> FOTOGRAFIAR ETIQUETA YOUNGLA
                            </button>
                        )}
                        {modo === 'BARCODE' && mostrarCamara && (
                            <p style={{ textAlign: 'center', color: '#888', marginTop: '2rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                Apunta el recuadro amarillo hacia el código de barras Gymshark/Darc Sport. La lectura es automática.
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
        .spin-animation { animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        /* Estilos específicos para html5-qrcode para Clean Code UI */
        #barcode-reader img, #barcode-reader br, #barcode-reader a { display: none !important; }
        #barcode-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 16px; }
      `}</style>
        </div>
    );
}