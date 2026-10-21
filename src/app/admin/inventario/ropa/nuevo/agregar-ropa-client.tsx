'use client';

import { useState } from 'react';
import { PlusCircle, Save, Trash2, Image as ImageIcon, ScanLine } from 'lucide-react';
import { crearColeccionRopa, type DataNuevaRopa } from './actions';
import ScannerModal, { type DatosEscaneados } from '@/components/admin/scanner-modal';

const TALLAS_ESTANDAR = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

let contador = 0;
const nuevoId = (prefijo: string) => `${prefijo}-${Date.now()}-${contador++}`;

const varianteVacia = () => ({
    idTemporal: nuevoId('var'),
    color: '',
    imagenes: [{ id: nuevoId('img'), url: '' }],
    tallas: TALLAS_ESTANDAR.map(t => ({ talla: t, stock: 0, activa: false })),
});

type Variante = ReturnType<typeof varianteVacia>;

export default function AgregarRopaClient({ marcasBD }: { marcasBD: { id: number; nombre: string }[] }) {
    // Datos Base
    const [marcaId, setMarcaId] = useState('');
    const [nuevaMarca, setNuevaMarca] = useState('');
    const [nombreProducto, setNombreProducto] = useState('');
    const [genero, setGenero] = useState('HOMBRE');
    const [categoria, setCategoria] = useState('TOPS');
    const [precioProveedor, setPrecioProveedor] = useState('');
    const [precioVenta, setPrecioVenta] = useState('');

    // Estructura Compleja: Variantes
    const [variantes, setVariantes] = useState<Variante[]>(() => [varianteVacia()]);

    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

    // Actualización inmutable de una variante (antes se mutaba el estado directamente).
    const editarVariante = (index: number, fn: (v: Variante) => Variante) =>
        setVariantes(prev => prev.map((v, i) => (i === index ? fn(v) : v)));
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const handleDatosEscaneados = (datos: DatosEscaneados) => {
        if (datos.tipo === 'OCR') {
            if (datos.modelo) setNombreProducto(datos.modelo);

            const youngla = marcasBD.find(m => m.nombre.toUpperCase().includes('YOUNGLA'));
            if (youngla) {
                setMarcaId(youngla.id.toString());
            } else {
                setMarcaId('NEW');
                setNuevaMarca('YOUNGLA');
            }

            editarVariante(0, v => ({
                ...v,
                color: datos.color || v.color,
                tallas: v.tallas.map(t => (t.talla === datos.talla ? { ...t, activa: true, stock: Math.max(t.stock, 1) } : t)),
            }));
        }
    };

    const addVariante = () => setVariantes(prev => [...prev, varianteVacia()]);

    const removeVariante = (index: number) => setVariantes(prev => prev.filter((_, i) => i !== index));

    const updateVarianteColor = (index: number, color: string) => editarVariante(index, v => ({ ...v, color }));

    const addImagenToVariante = (varIndex: number) =>
        editarVariante(varIndex, v => ({ ...v, imagenes: [...v.imagenes, { id: nuevoId('img'), url: '' }] }));

    const updateImagenUrl = (varIndex: number, imgIndex: number, url: string) =>
        editarVariante(varIndex, v => ({ ...v, imagenes: v.imagenes.map((img, i) => (i === imgIndex ? { ...img, url } : img)) }));

    const toggleTalla = (varIndex: number, tallaIndex: number) =>
        editarVariante(varIndex, v => ({
            ...v,
            tallas: v.tallas.map((t, i) => (i === tallaIndex ? { ...t, activa: !t.activa, stock: t.activa ? 0 : t.stock } : t)),
        }));

    const updateStock = (varIndex: number, tallaIndex: number, stock: number) =>
        editarVariante(varIndex, v => ({
            ...v,
            tallas: v.tallas.map((t, i) => (i === tallaIndex ? { ...t, stock: Math.max(0, stock) } : t)),
        }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const variantesLimpias = variantes.map(v => ({
            color: v.color.toUpperCase(),
            imagenes: v.imagenes.map(img => img.url).filter(url => url.trim() !== ''),
            tallas: v.tallas.filter(t => t.activa).map(t => ({ talla: t.talla, stock: t.stock }))
        })).filter(v => v.color !== '' && v.tallas.length > 0);

        if (variantesLimpias.length === 0) {
            setMensaje({ ok: false, texto: 'Agrega al menos un color con una talla activa.' });
            setLoading(false);
            return;
        }

        const payload: DataNuevaRopa = {
            marcaId: marcaId !== 'NEW' ? parseInt(marcaId) : undefined,
            nuevaMarca: marcaId === 'NEW' ? nuevaMarca : undefined,
            nombreProducto: nombreProducto.toUpperCase(),
            genero,
            categoria,
            precioProveedor: parseFloat(precioProveedor),
            precioVenta: parseFloat(precioVenta),
            variantes: variantesLimpias
        };

        const res = await crearColeccionRopa(payload);

        if (res.success) {
            setMensaje({ ok: true, texto: `Colección registrada: se crearon ${res.totalSkus} SKUs.` });
            setNombreProducto(''); setPrecioProveedor(''); setPrecioVenta('');
            setVariantes([varianteVacia()]);
        } else {
            setMensaje({ ok: false, texto: res.error });
        }
        setLoading(false);
    };

    const inputStyle = { width: '100%', padding: '0.8rem', background: 'var(--bg)', border: '1px solid var(--line-strong)', color: 'var(--pale-cyan)', borderRadius: '8px', marginTop: '0.5rem', fontFamily: 'inherit' };

    return (
        <>
            <form onSubmit={handleSubmit} style={{ background: 'var(--bg-raised)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--line-strong)', width: '100%', maxWidth: '900px' }}>

                <h2 style={{ color: 'var(--accent)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <PlusCircle /> ALTA DE COLECCIÓN
                </h2>

                <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    style={{ width: '100%', padding: '1rem', background: 'var(--accent)', color: 'var(--deep-blue)', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(1, 186, 239, 0.3)' }}
                >
                    <ScanLine size={18} /> AUTOCOMPLETAR CON IA
                </button>

                {/* BLOQUE 1: INFO GENERAL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(240, 253, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <div style={{ width: '100%' }}>
                        <label style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>MARCA</label>
                        <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)} style={inputStyle} required>
                            <option value="">-- SELECCIONAR --</option>
                            {marcasBD.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            <option value="NEW" style={{ color: 'var(--accent)' }}>+ NUEVA MARCA</option>
                        </select>
                        {marcaId === 'NEW' && <input type="text" placeholder="NOMBRE DE MARCA..." value={nuevaMarca} onChange={(e) => setNuevaMarca(e.target.value.toUpperCase())} style={{ ...inputStyle, borderColor: 'var(--accent)' }} required />}
                    </div>

                    <div style={{ width: '100%' }}>
                        <label style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>MODELO (EJ: WOLVES TEE)</label>
                        <input type="text" value={nombreProducto} onChange={(e) => setNombreProducto(e.target.value.toUpperCase())} style={inputStyle} required />
                    </div>

                    <div style={{ width: '100%' }}>
                        <label style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>GÉNERO</label>
                        <select value={genero} onChange={(e) => setGenero(e.target.value)} style={inputStyle}>
                            <option value="HOMBRE">HOMBRE</option>
                            <option value="MUJER">MUJER</option>
                            <option value="UNISEX">UNISEX</option>
                        </select>
                    </div>

                    <div style={{ width: '100%' }}>
                        <label style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>CATEGORÍA</label>
                        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={inputStyle}>
                            <option value="TOPS">TOPS</option>
                            <option value="BOTTOMS">BOTTOMS</option>
                            <option value="ACCESORIOS">ACCESORIOS</option>
                        </select>
                    </div>

                    <div style={{ width: '100%', display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>COSTO PROV. ($)</label>
                            <input type="number" step="0.01" value={precioProveedor} onChange={(e) => setPrecioProveedor(e.target.value)} style={inputStyle} required />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>PRECIO VENTA ($)</label>
                            <input type="number" step="0.01" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} style={inputStyle} required />
                        </div>
                    </div>
                </div>

                {/* BLOQUE 2: VARIANTES DE COLOR */}
                <h3 style={{ color: 'var(--pale-cyan)', marginBottom: '1rem', borderBottom: '1px solid var(--line-strong)', paddingBottom: '0.5rem' }}>VARIANTES Y TALLAS</h3>

                {variantes.map((variante, vIdx) => (
                    <div key={variante.idTemporal} style={{ background: 'var(--bg-raised)', border: '1px solid var(--line-strong)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', position: 'relative' }}>

                        {variantes.length > 1 && (
                            <button type="button" onClick={() => removeVariante(vIdx)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                <Trash2 size={20} />
                            </button>
                        )}

                        <div style={{ marginBottom: '1.5rem', width: '100%' }}>
                            <label style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>COLOR (EJ: WASHED BLACK)</label>
                            <input type="text" value={variante.color} onChange={(e) => updateVarianteColor(vIdx, e.target.value)} style={inputStyle} required />
                        </div>



                        {/* TALLAS GRID RESPONSIVE */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>STOCK POR TALLA</label>

                            {/* CSS Grid para asegurar que no se desborde en móvil */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                                {variante.tallas.map((t, tIdx) => (
                                    <div key={`talla-${t.talla}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: t.activa ? 'rgba(1, 186, 239, 0.1)' : 'transparent', border: t.activa ? '1px solid var(--accent)' : '1px solid var(--line-strong)', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: t.activa ? 'var(--pale-cyan)' : 'rgba(167, 232, 242, 0.55)', fontWeight: 'bold', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                                            <input type="checkbox" checked={t.activa} onChange={() => toggleTalla(vIdx, tIdx)} style={{ cursor: 'pointer' }} />
                                            {t.talla}
                                        </label>
                                        {t.activa && (
                                            <input type="number" min="0" value={t.stock} onChange={(e) => updateStock(vIdx, tIdx, parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '0.2rem', background: 'var(--deep-blue)', border: '1px solid rgba(167, 232, 242, 0.55)', color: 'var(--pale-cyan)', textAlign: 'center', borderRadius: '4px', fontSize: '0.9rem' }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* IMÁGENES */}
                        <div>
                            <label style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>URLS DE IMÁGENES</label>
                            {variante.imagenes.map((img, iIdx) => (
                                <div key={img.id} style={{ display: 'flex', gap: '10px', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <ImageIcon color="rgba(167, 232, 242, 0.55)" size={20} />
                                    <input type="url" placeholder="https://..." value={img.url} onChange={(e) => updateImagenUrl(vIdx, iIdx, e.target.value)} style={{ ...inputStyle, marginTop: 0 }} />
                                </div>
                            ))}
                            <button type="button" onClick={() => addImagenToVariante(vIdx)} style={{ width: '100%', background: 'transparent', border: '1px dashed rgba(167, 232, 242, 0.55)', color: 'var(--text-muted)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                                + AGREGAR OTRA IMAGEN
                            </button>
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addVariante} style={{ width: '100%', background: 'transparent', border: '2px dashed var(--accent)', color: 'var(--accent)', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <PlusCircle size={18} /> AGREGAR OTRO COLOR
                </button>

                {mensaje && (
                    <p role="status" style={{ marginBottom: '1rem', padding: '0.8rem 1rem', borderLeft: `3px solid ${mensaje.ok ? 'var(--ok)' : 'var(--danger)'}`, background: 'var(--bg)' }}>
                        {mensaje.texto}
                    </p>
                )}

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '1.2rem', background: 'var(--accent)', color: 'var(--deep-blue)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.2rem', cursor: loading ? 'wait' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', transition: 'all 0.3s' }}>
                    {loading ? 'PROCESANDO CATÁLOGO...' : <><Save /> REGISTRAR COLECCIÓN COMPLETA</>}
                </button>

            </form>

            {/* MODAL INVISIBLE HASTA QUE SE INVOCA */}
            <ScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onDetected={handleDatosEscaneados}
            />
        </>
    );
}