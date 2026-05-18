// app/admin/inventario/ropa/InventarioRopaClient.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, ScanLine, Undo2, CheckCircle2 } from 'lucide-react';
import ScannerModal, { DatosEscaneados } from '@/app/components/ScannerModal';
import { registrarVentaEscaneo, deshacerVenta } from './actions';
import { motion, AnimatePresence } from 'framer-motion';

export interface RopaItem {
    id: number;
    modelo: string;
    marca: string;
    color: string;
    talla: string;
    stock: number;
    precio_venta: number;
}

// 1. NUEVA INTERFAZ PARA ELIMINAR EL 'any'
interface GrupoProducto {
    idUnico: string;
    marca: string;
    modelo: string;
    color: string;
    tallasAgrupadas: Map<string, number>;
}

export default function InventarioRopaClient({ items }: { items: RopaItem[] }) {
    const [busqueda, setBusqueda] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [datosConfirmacion, setDatosConfirmacion] = useState<{ modelo: string; color: string; talla: string; textoCrudo?: string; } | null>(null);
    const [toast, setToast] = useState<{ visible: boolean; skuId: number; movId: number; mensaje: string } | null>(null);

    const productosAgrupados = useMemo(() => {
        // 2. APLICAMOS LA INTERFAZ AL MAPA
        const mapa = new Map<string, GrupoProducto>();

        items.forEach(item => {
            const marca = (item.marca || '').toUpperCase().trim();
            const modelo = (item.modelo || '').toUpperCase().trim();
            const color = (item.color || '').toUpperCase().trim();

            const llaveGrupo = `${marca}-${modelo}-${color}`;

            if (!mapa.has(llaveGrupo)) {
                mapa.set(llaveGrupo, {
                    idUnico: llaveGrupo,
                    marca,
                    modelo,
                    color,
                    tallasAgrupadas: new Map<string, number>()
                });
            }

            // Al usar get(), le decimos a TS que el resultado nunca es undefined con "!" porque acabamos de crearlo
            const grupo = mapa.get(llaveGrupo)!;
            const tallaUpper = (item.talla || '').toUpperCase().trim();

            const stockActual = grupo.tallasAgrupadas.get(tallaUpper) || 0;
            grupo.tallasAgrupadas.set(tallaUpper, stockActual + item.stock);
        });

        let resultado = Array.from(mapa.values());

        if (busqueda) {
            const q = busqueda.toUpperCase();
            resultado = resultado.filter(grupo =>
                grupo.modelo.includes(q) ||
                grupo.marca.includes(q) ||
                grupo.color.includes(q)
            );
        }

        return resultado;
    }, [items, busqueda]);

    const handleEscaneoSalida = (datos: DatosEscaneados) => {
        if (datos.tipo === 'OCR') {
            setDatosConfirmacion({
                modelo: datos.modelo || '',
                color: datos.color || '',
                talla: datos.talla || '',
                textoCrudo: datos.textoCrudo
            });
        }
    };

    const confirmarYDescontar = async () => {
        if (!datosConfirmacion) return;
        const { modelo, color, talla } = datosConfirmacion;

        const itemEncontrado = items.find(i =>
            (i.modelo || '').trim().toUpperCase() === (modelo || '').trim().toUpperCase() &&
            (i.color || '').trim().toUpperCase() === (color || '').trim().toUpperCase() &&
            (i.talla || '').trim().toUpperCase() === (talla || '').trim().toUpperCase() &&
            i.stock > 0
        );

        if (!itemEncontrado) {
            alert("❌ PRENDA NO ENCONTRADA O SIN STOCK.\nRevisa que los datos coincidan o que haya inventario disponible.");
            return;
        }

        const res = await registrarVentaEscaneo(itemEncontrado.id);

        if (res.success && res.movimientoId) {
            setToast({
                visible: true,
                skuId: itemEncontrado.id,
                movId: res.movimientoId,
                mensaje: `✅ -1 ${itemEncontrado.modelo} (${itemEncontrado.talla}) descontado.`
            });
            setTimeout(() => setToast(null), 7000);
            setDatosConfirmacion(null);
        } else {
            alert("Error al descontar stock: " + res.error);
        }
    };

    const handleDeshacer = async () => {
        if (!toast) return;
        const res = await deshacerVenta(toast.skuId, toast.movId);
        if (res.success) {
            setToast(null);
            alert("⏪ Acción revertida: Stock restaurado.");
        }
    };

    const inputConfirmStyle = {
        width: '100%', padding: '1rem', background: '#000', border: '1px solid #333',
        color: 'white', borderRadius: '8px', marginBottom: '1rem', fontSize: '1rem', fontWeight: 'bold'
    };

    return (
        <div style={{ background: '#111', borderRadius: '12px', padding: '1.5rem', border: '1px solid #333', position: 'relative' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2rem', gap: '1rem' }}>
                <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#00e5ff', textDecoration: 'none', fontWeight: 'bold' }}>
                    <ArrowLeft size={18} /> REGRESAR AL PANEL
                </Link>

                <button
                    onClick={() => setIsScannerOpen(true)}
                    style={{ padding: '0.8rem 1.5rem', background: '#fff', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2)' }}
                >
                    <ScanLine size={18} /> MODO SALIDA (ESCANEAR VENTA)
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', background: '#000', border: '1px solid #444', borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1.5rem' }}>
                <Search size={20} color="#888" style={{ marginRight: '10px' }} />
                <input
                    type="text"
                    placeholder="BUSCAR PRENDA..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '1rem' }}
                />
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'white', minWidth: '700px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-gold)' }}>
                            <th style={{ padding: '1rem' }}>MARCA</th>
                            <th>MODELO</th>
                            <th>COLOR</th>
                            <th>INVENTARIO POR TALLA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosAgrupados.map(grupo => (
                            <tr key={grupo.idUnico} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '1rem', color: '#888' }}>{grupo.marca}</td>
                                <td style={{ fontWeight: 'bold' }}>{grupo.modelo}</td>
                                <td style={{ color: 'var(--color-gold)' }}>{grupo.color}</td>
                                <td style={{ padding: '1rem 0' }}>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {Array.from(grupo.tallasAgrupadas.entries()).map(([talla, stockTotal]) => (
                                            <div
                                                key={talla}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                    // 3. ADIÓS A LOS "as number", AHORA ES CÓDIGO LIMPIO
                                                    background: stockTotal > 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                                                    border: `1px solid ${stockTotal > 0 ? '#4ade80' : '#ff4444'}`,
                                                    padding: '0.3rem 0.6rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <span style={{ fontWeight: 'bold', color: 'white' }}>{talla}</span>
                                                <span style={{ color: stockTotal > 0 ? '#4ade80' : '#ff4444', fontWeight: 'bold' }}>
                                                    {stockTotal}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {productosAgrupados.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                        NO SE ENCONTRARON PRODUCTOS.
                    </div>
                )}
            </div>

            <ScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onDetected={handleEscaneoSalida}
            />

            {/* PANTALLA DE CONFIRMACIÓN */}
            <AnimatePresence>
                {datosConfirmacion && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    >
                        <motion.div
                            initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.9 }}
                            style={{ background: '#111', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-gold)', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                        >
                            <h2 style={{ color: 'var(--color-gold)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CheckCircle2 /> REVISIÓN DE DATOS
                            </h2>
                            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                                Verifica que los datos coincidan con la etiqueta física.
                            </p>

                            <label style={{ display: 'block', color: '#888', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 'bold' }}>MODELO / ESTILO:</label>
                            <input value={datosConfirmacion.modelo} onChange={e => setDatosConfirmacion({ ...datosConfirmacion, modelo: e.target.value })} style={inputConfirmStyle} />

                            <label style={{ display: 'block', color: '#888', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 'bold' }}>COLOR:</label>
                            <input value={datosConfirmacion.color} onChange={e => setDatosConfirmacion({ ...datosConfirmacion, color: e.target.value })} style={inputConfirmStyle} />

                            <label style={{ display: 'block', color: '#888', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 'bold' }}>TALLA:</label>
                            <input value={datosConfirmacion.talla} onChange={e => setDatosConfirmacion({ ...datosConfirmacion, talla: e.target.value })} style={inputConfirmStyle} />

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={() => setDatosConfirmacion(null)} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>CANCELAR</button>
                                <button onClick={confirmarYDescontar} style={{ flex: 1, padding: '1rem', background: 'var(--color-gold)', border: 'none', color: 'black', fontWeight: 'black', borderRadius: '8px', cursor: 'pointer' }}>ACEPTAR</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', border: '1px solid #4ade80', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 9999, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: 'max-content', maxWidth: '90vw' }}
                    >
                        <span style={{ color: '#4ade80', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={20} /> {toast.mensaje}
                        </span>
                        <button onClick={handleDeshacer} style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <Undo2 size={16} /> DESHACER
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}