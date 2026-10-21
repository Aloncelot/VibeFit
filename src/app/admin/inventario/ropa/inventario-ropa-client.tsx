'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ScanLine, Undo2, CheckCircle2, Plus, X } from 'lucide-react';
import ScannerModal, { type DatosEscaneados } from '@/components/admin/scanner-modal';
import type { RopaItem } from '@/server/queries/admin';
import { registrarVentaEscaneo, deshacerVenta } from './actions';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [aviso, setAviso] = useState<string | null>(null);

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
            setAviso('No encontramos esa prenda con stock. Revisa que modelo, color y talla coincidan con el inventario.');
            return;
        }

        const res = await registrarVentaEscaneo(itemEncontrado.id);

        if (res.success) {
            setToast({
                visible: true,
                skuId: itemEncontrado.id,
                movId: res.movimientoId,
                mensaje: `✅ -1 ${itemEncontrado.modelo} (${itemEncontrado.talla}) descontado.`
            });
            setTimeout(() => setToast(null), 7000);
            setDatosConfirmacion(null);
        } else {
            setAviso(res.error);
        }
    };

    const handleDeshacer = async () => {
        if (!toast) return;
        const res = await deshacerVenta(toast.skuId, toast.movId);
        setToast(null);
        setAviso(res.success ? 'Venta revertida: el stock se restauró.' : res.error);
    };

    const inputConfirmStyle = {
        width: '100%', padding: '1rem', background: 'var(--bg)', border: '1px solid var(--line-strong)',
        color: 'var(--pale-cyan)', borderRadius: '8px', marginBottom: '1rem', fontSize: '1rem', fontWeight: 'bold'
    };

    return (
        <div style={{ background: 'var(--bg-raised)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--line-strong)', position: 'relative' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2rem', gap: '1rem' }}>
                <Link href="/admin/inventario/ropa/nuevo" className="btn btn-outline">
                    <Plus size={18} aria-hidden /> Alta de colección
                </Link>

                <button
                    onClick={() => setIsScannerOpen(true)}
                    style={{ padding: '0.8rem 1.5rem', background: 'var(--pale-cyan)', color: 'var(--deep-blue)', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(240, 253, 255, 0.2)' }}
                >
                    <ScanLine size={18} /> Registrar venta con escáner
                </button>
            </div>

            {aviso && (
                <div role="status" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.8rem 1rem', marginBottom: '1rem', borderLeft: '3px solid var(--accent)', background: 'var(--bg)' }}>
                    <span>{aviso}</span>
                    <button type="button" onClick={() => setAviso(null)} style={{ background: 'none', border: 0 }} aria-label="Cerrar aviso"><X size={18} /></button>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--line-strong)', borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1.5rem' }}>
                <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
                <input
                    type="text"
                    placeholder="Buscar modelo, marca o color" aria-label="Buscar en inventario de ropa"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--pale-cyan)', outline: 'none', fontSize: '1rem' }}
                />
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'var(--pale-cyan)', minWidth: '700px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--accent)' }}>
                            <th style={{ padding: '1rem' }}>MARCA</th>
                            <th>MODELO</th>
                            <th>COLOR</th>
                            <th>INVENTARIO POR TALLA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosAgrupados.map(grupo => (
                            <tr key={grupo.idUnico} style={{ borderBottom: '1px solid var(--line)' }}>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{grupo.marca}</td>
                                <td style={{ fontWeight: 'bold' }}>{grupo.modelo}</td>
                                <td style={{ color: 'var(--accent)' }}>{grupo.color}</td>
                                <td style={{ padding: '1rem 0' }}>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {Array.from(grupo.tallasAgrupadas.entries()).map(([talla, stockTotal]) => (
                                            <div
                                                key={talla}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                    // 3. ADIÓS A LOS "as number", AHORA ES CÓDIGO LIMPIO
                                                    background: stockTotal > 0 ? 'rgba(94, 224, 176, 0.1)' : 'rgba(255, 122, 107, 0.1)',
                                                    border: `1px solid ${stockTotal > 0 ? 'var(--ok)' : 'var(--danger)'}`,
                                                    padding: '0.3rem 0.6rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <span style={{ fontWeight: 'bold', color: 'var(--pale-cyan)' }}>{talla}</span>
                                                <span style={{ color: stockTotal > 0 ? 'var(--ok)' : 'var(--danger)', fontWeight: 'bold' }}>
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
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
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
                        style={{ position: 'fixed', inset: 0, background: 'rgba(3, 12, 19, 0.85)', backdropFilter: 'blur(5px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    >
                        <motion.div
                            initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.9 }}
                            style={{ background: 'var(--bg-raised)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--accent)', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(3, 12, 19, 0.5)' }}
                        >
                            <h2 style={{ color: 'var(--accent)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CheckCircle2 /> REVISIÓN DE DATOS
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                                Verifica que los datos coincidan con la etiqueta física.
                            </p>

                            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 'bold' }}>MODELO / ESTILO:</label>
                            <input value={datosConfirmacion.modelo} onChange={e => setDatosConfirmacion({ ...datosConfirmacion, modelo: e.target.value })} style={inputConfirmStyle} />

                            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 'bold' }}>COLOR:</label>
                            <input value={datosConfirmacion.color} onChange={e => setDatosConfirmacion({ ...datosConfirmacion, color: e.target.value })} style={inputConfirmStyle} />

                            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 'bold' }}>TALLA:</label>
                            <input value={datosConfirmacion.talla} onChange={e => setDatosConfirmacion({ ...datosConfirmacion, talla: e.target.value })} style={inputConfirmStyle} />

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={() => setDatosConfirmacion(null)} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid rgba(167, 232, 242, 0.55)', color: 'var(--pale-cyan)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>CANCELAR</button>
                                <button onClick={confirmarYDescontar} style={{ flex: 1, padding: '1rem', background: 'var(--accent)', border: 'none', color: 'var(--deep-blue)', fontWeight: 'var(--deep-blue)', borderRadius: '8px', cursor: 'pointer' }}>ACEPTAR</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-raised)', border: '1px solid var(--ok)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 9999, boxShadow: '0 10px 30px rgba(3, 12, 19, 0.5)', width: 'max-content', maxWidth: '90vw' }}
                    >
                        <span style={{ color: 'var(--ok)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={20} /> {toast.mensaje}
                        </span>
                        <button onClick={handleDeshacer} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <Undo2 size={16} /> DESHACER
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}