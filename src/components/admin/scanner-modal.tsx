'use client';

import { useState, useRef, useCallback, useEffect, useEffectEvent } from 'react';
import Webcam from 'react-webcam';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ScanLine, Type, Camera, Power, X } from 'lucide-react';
import { analizarEtiquetaOCR } from '@/server/actions/ocr';

const videoConstraints = { facingMode: { ideal: "environment" } };
type WindowConAudio = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext; };

export interface DatosEscaneados {
    tipo: 'OCR' | 'BARCODE';
    textoCrudo: string;
    modelo?: string;
    color?: string;
    talla?: string;
}

interface ScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDetected: (datos: DatosEscaneados) => void;
}

const procesarTextoYoungLA = (textoCrudo: string): Omit<DatosEscaneados, 'tipo' | 'textoCrudo'> => {
    const regexModel = /(?:model|style|item)[\s:]*#?([A-Za-z0-9\-]+)/i;
    const regexColor = /color[\s:]*([A-Za-z\s]+?)(?=\n|size|talla|$)/i;
    const regexSize = /(?:size|talla)[\s:]*([A-Za-z0-9]+)/i;

    const matchModel = textoCrudo.match(regexModel);
    const matchColor = textoCrudo.match(regexColor);
    const matchSize = textoCrudo.match(regexSize);

    return {
        modelo: matchModel ? matchModel[1].trim().toUpperCase() : '',
        color: matchColor ? matchColor[1].trim().toUpperCase() : '',
        talla: matchSize ? matchSize[1].trim().toUpperCase() : ''
    };
};

export default function ScannerModal({ isOpen, onClose, onDetected }: ScannerModalProps) {
    const [modo, setModo] = useState<'BARCODE' | 'OCR'>('BARCODE');
    const [procesando, setProcesando] = useState(false);
    const [camError, setCamError] = useState<string | null>(null);
    const [mostrarCamara, setMostrarCamara] = useState(false);

    const webcamRef = useRef<Webcam>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    const reproducirBip = useCallback(() => {
        try {
            const ClaseAudioContext = window.AudioContext || (window as WindowConAudio).webkitAudioContext;
            if (!ClaseAudioContext) return;
            const audioCtx = new ClaseAudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.onended = () => { void audioCtx.close(); }; // evita acumular AudioContexts (Chrome limita cuántos puede haber)
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch { /* sin audio */ }
    }, []);

    // Evento estable: el escáner no se reinicia cada vez que el padre se vuelve a renderizar.
    const onCodigo = useEffectEvent((decodedText: string) => {
        reproducirBip();
        onDetected({ tipo: 'BARCODE', textoCrudo: decodedText });
        onClose();
    });

    useEffect(() => {
        if (isOpen && mostrarCamara && modo === 'BARCODE') {
            const scanner = new Html5Qrcode("modal-barcode-reader");
            html5QrCodeRef.current = scanner;

            scanner.start(
                { facingMode: "environment" },
                { fps: 15, qrbox: { width: 300, height: 150 } },
                (decodedText) => {
                    scanner.pause();
                    onCodigo(decodedText);
                },
                () => { }
            ).catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : "Error desconocido";
                setCamError("No se pudo iniciar el lector de códigos: " + msg);
            });

            return () => { if (scanner.isScanning) scanner.stop().catch(console.error); };
        }
    }, [isOpen, mostrarCamara, modo]);

    const forzarDiagnostico = async () => {
        try {
            if (!window.isSecureContext) throw new Error("Contexto Inseguro.");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setMostrarCamara(true); setCamError(null);
            stream.getTracks().forEach(track => track.stop());
        } catch (error: unknown) {
            // CORRECCIÓN: Manejo estricto del catch
            const msg = error instanceof Error ? error.message : "Permiso DENEGADO.";
            setCamError(msg);
        }
    };

    const capturarOCR = useCallback(async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setProcesando(true); setCamError(null);

        try {
            const respuestaAzure = await analizarEtiquetaOCR(imageSrc);
            if (!respuestaAzure.success) throw new Error(respuestaAzure.error);

            reproducirBip();

            const textoDetectado = respuestaAzure.texto;
            const datosExtraidos = procesarTextoYoungLA(textoDetectado);

            onDetected({
                tipo: 'OCR',
                textoCrudo: textoDetectado,
                ...datosExtraidos
            });
            onClose();

        } catch (err: unknown) {
            // CORRECCIÓN: Manejo estricto del catch
            const msg = err instanceof Error ? err.message : "Fallo en la lectura OCR.";
            setCamError(msg);
        } finally {
            setProcesando(false);
        }
    }, [webcamRef, reproducirBip, onDetected, onClose]);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="scanner-modal-overlay-root"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(3, 12, 19, 0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    >
                        <div style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-raised)', borderRadius: '16px', border: '1px solid var(--line-strong)', display: 'flex', flexDirection: 'column' }}>

                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--line-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-raised)', zIndex: 10 }}>
                                <h3 style={{ margin: 0, color: 'var(--pale-cyan)', fontFamily: 'var(--font-display)' }}>ESCÁNER IA</h3>
                                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--pale-cyan)', cursor: 'pointer' }}><X /></button>
                            </div>

                            <div style={{ padding: '1rem' }}>
                                <LayoutGroup>
                                    <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '8px', padding: '0.3rem', marginBottom: '1rem' }}>
                                        <button onClick={() => setModo('BARCODE')} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: modo === 'BARCODE' ? 'var(--deep-blue)' : 'var(--text-muted)', position: 'relative', zIndex: 2 }}>
                                            {modo === 'BARCODE' && <motion.div layoutId="modalModeBg" style={{ position: 'absolute', inset: 0, background: 'var(--accent)', borderRadius: '6px', zIndex: -1 }} />}
                                            <ScanLine size={16} /> Barras
                                        </button>
                                        <button onClick={() => setModo('OCR')} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: modo === 'OCR' ? 'var(--deep-blue)' : 'var(--text-muted)', position: 'relative', zIndex: 2 }}>
                                            {modo === 'OCR' && <motion.div layoutId="modalModeBg" style={{ position: 'absolute', inset: 0, background: 'var(--pale-cyan)', borderRadius: '6px', zIndex: -1 }} />}
                                            <Type size={16} /> YoungLA (OCR)
                                        </button>
                                    </div>
                                </LayoutGroup>

                                {!mostrarCamara ? (
                                    <button onClick={forzarDiagnostico} style={{ width: '100%', padding: '1rem', background: 'var(--line-strong)', color: 'var(--pale-cyan)', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                        <Power color="var(--accent)" /> ENCENDER CÁMARA
                                    </button>
                                ) : (
                                    <div style={{ position: 'relative', width: '100%', height: '50vh', minHeight: '300px', maxHeight: '400px', background: 'var(--bg)', borderRadius: '8px', overflow: 'hidden' }}>

                                        <div id="modal-barcode-reader" style={{ width: '100%', height: '100%', display: modo === 'BARCODE' ? 'block' : 'none' }}></div>
                                        {modo === 'OCR' && <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}

                                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <div style={{ width: '75%', height: modo === 'BARCODE' ? '30%' : '50%', border: '2px dashed rgba(240, 253, 255, 0.4)', borderRadius: '12px' }} />
                                        </div>

                                        <AnimatePresence>
                                            {procesando && (
                                                <motion.div key="procesando-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(3, 12, 19, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pale-cyan)', fontWeight: 'bold', letterSpacing: '2px', zIndex: 20 }}>
                                                    ANALIZANDO...
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {modo === 'OCR' && mostrarCamara && (
                                    <button onClick={capturarOCR} disabled={procesando} style={{ width: '100%', padding: '1.2rem', marginTop: '1rem', background: 'var(--pale-cyan)', color: 'var(--deep-blue)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: procesando ? 'wait' : 'pointer' }}>
                                        <Camera size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> FOTOGRAFIAR
                                    </button>
                                )}

                                {camError && <p style={{ color: 'var(--danger)', textAlign: 'center', marginTop: '1rem', fontWeight: 'bold' }}>{camError}</p>}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
        #modal-barcode-reader img, #modal-barcode-reader br, #modal-barcode-reader a { display: none !important; } 
        #modal-barcode-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
      `}</style>
        </>
    );
}