'use client';

import { useState } from 'react';
import { crearNuevoSKU } from './actions';
import { PlusCircle, Save } from 'lucide-react';

interface Marca {
    id: number;
    nombre: string;
}

interface Producto {
    id: number;
    nombre: string;
    marca_id: number;
}

export default function AgregarSKUClient({
    marcasBD,
    productosBD,
    tamanosBD
}: {
    marcasBD: Marca[];
    productosBD: Producto[];
    tamanosBD: string[];
}) {
    // Estados para selecciones
    const [marcaId, setMarcaId] = useState('');
    const [productoId, setProductoId] = useState('');
    const [tamano, setTamano] = useState('');

    // Estados para inputs de texto (Nuevos registros)
    const [nuevaMarca, setNuevaMarca] = useState('');
    const [nuevoProducto, setNuevoProducto] = useState('');
    const [nuevoTamano, setNuevoTamano] = useState('');
    const [sabor, setSabor] = useState('');

    // Estados financieros
    const [precioVenta, setPrecioVenta] = useState('');
    const [precioProveedor, setPrecioProveedor] = useState('');

    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

    // Filtrar productos dependiendo de la marca seleccionada
    const productosFiltrados = productosBD.filter((p: Producto) => p.marca_id.toString() === marcaId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            marcaId: marcaId !== 'NEW' ? parseInt(marcaId) : undefined,
            nuevaMarca: marcaId === 'NEW' ? nuevaMarca : undefined,
            productoId: productoId !== 'NEW' ? parseInt(productoId) : undefined,
            nuevoProducto: productoId === 'NEW' ? nuevoProducto : undefined,
            tamano: tamano === 'NEW' ? nuevoTamano : tamano,
            sabor: sabor,
            precioVenta: parseFloat(precioVenta),
            precioProveedor: parseFloat(precioProveedor),
        };

        const res = await crearNuevoSKU(payload);

        if (res.success) {
            setMensaje({ ok: true, texto: `SKU #${res.newSkuId} creado con stock 0. Registra la entrada de mercancía en Inventario.` });
            setSabor(''); setPrecioVenta(''); setPrecioProveedor('');
        } else {
            setMensaje({ ok: false, texto: res.error });
        }
        setLoading(false);
    };

    // Estilo base para inputs
    const inputStyle = { width: '100%', padding: '0.8rem', background: 'var(--bg)', border: '1px solid var(--line-strong)', color: 'var(--pale-cyan)', borderRadius: '8px', marginTop: '0.5rem', fontFamily: 'inherit' };

    return (
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-raised)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--line-strong)', maxWidth: '600px' }}>
            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PlusCircle /> ALTA DE NUEVO SKU
            </h2>

            {/* 1. MARCA */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>MARCA</label>
                <select value={marcaId} onChange={(e) => { setMarcaId(e.target.value); setProductoId(''); }} style={inputStyle} required>
                    <option value="">-- SELECCIONA UNA MARCA --</option>
                    {marcasBD.map((m: Marca) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    <option value="NEW" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>+ AGREGAR NUEVA MARCA</option>
                </select>
                {marcaId === 'NEW' && (
                    <input type="text" placeholder="NOMBRE DE LA NUEVA MARCA..." value={nuevaMarca}
                        onChange={(e) => setNuevaMarca(e.target.value.toUpperCase())} style={{ ...inputStyle, borderColor: 'var(--accent)' }} required />
                )}
            </div>

            {/* 2. PRODUCTO / ITEM */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>PRODUCTO / ITEM</label>
                <select value={productoId} onChange={(e) => setProductoId(e.target.value)} style={inputStyle} required disabled={!marcaId}>
                    <option value="">-- SELECCIONA EL PRODUCTO --</option>
                    {productosFiltrados.map((p: Producto) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    <option value="NEW" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>+ AGREGAR NUEVO PRODUCTO</option>
                </select>
                {productoId === 'NEW' && (
                    <input type="text" placeholder="EJ: WHEY PROTEIN ISOLATE..." value={nuevoProducto}
                        onChange={(e) => setNuevoProducto(e.target.value.toUpperCase())} style={{ ...inputStyle, borderColor: 'var(--accent)' }} required />
                )}
            </div>

            {/* 3. TAMAÑO */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>TAMAÑO / PRESENTACIÓN</label>
                <select value={tamano} onChange={(e) => setTamano(e.target.value)} style={inputStyle} required>
                    <option value="">-- SELECCIONA EL TAMAÑO --</option>
                    {tamanosBD.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    <option value="NEW" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>+ AGREGAR NUEVO TAMAÑO</option>
                </select>
                {tamano === 'NEW' && (
                    <input type="text" placeholder="EJ: 5 LB, 60 SV..." value={nuevoTamano}
                        onChange={(e) => setNuevoTamano(e.target.value.toUpperCase())} style={{ ...inputStyle, borderColor: 'var(--accent)' }} required />
                )}
            </div>

            {/* 4. SABOR */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>SABOR (VARIANTE)</label>
                <input type="text" placeholder="EJ: CHOCOLATE PEANUT BUTTER..." value={sabor}
                    onChange={(e) => setSabor(e.target.value.toUpperCase())} style={inputStyle} required />
            </div>

            {/* 5. FINANZAS */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>COSTO PROVEEDOR ($)</label>
                    <input type="number" step="0.01" min="0" value={precioProveedor} onChange={(e) => setPrecioProveedor(e.target.value)} style={inputStyle} required />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>PRECIO VENTA ($)</label>
                    <input type="number" step="0.01" min="0" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} style={inputStyle} required />
                </div>
            </div>

            {mensaje && (
                <p role="status" style={{ marginBottom: '1rem', padding: '0.8rem 1rem', borderLeft: `3px solid ${mensaje.ok ? 'var(--ok)' : 'var(--danger)'}`, background: 'var(--bg)' }}>
                    {mensaje.texto}
                </p>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: 'var(--accent)', color: 'var(--deep-blue)', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: loading ? 'wait' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                {loading ? 'CREANDO SKU...' : <><Save /> GENERAR SKU EN BASE DE DATOS</>}
            </button>
        </form>
    );
}