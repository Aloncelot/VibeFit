'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { registrarInbound, corregirStockFisico, actualizarPrecio, obtenerHistorialPrecio } from './actions';
import { PackagePlus, CheckCircle2, Search, ArrowLeft, History, X } from 'lucide-react';

export interface InventarioItem {
  id: number;
  nombre: string;
  marca: string;
  sabor: string;
  tamano: string;
  stock: number;
  precio_proveedor: number;
  precio_venta: number;
}

export default function InventarioClient({ items }: { items: InventarioItem[] }) {
  const [inbounds, setInbounds] = useState<{ [key: number]: string }>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [successIds, setSuccessIds] = useState<Set<number>>(new Set());

  // Nuevo estado para la barra de búsqueda
  const [busqueda, setBusqueda] = useState('');

  const [editandoStock, setEditandoStock] = useState<{ id: number, valor: string } | null>(null);
  const [editandoPrecio, setEditandoPrecio] = useState<{ id: number, tipo: 'precio_proveedor' | 'precio_venta', valor: string } | null>(null);
  
  const [historialModal, setHistorialModal] = useState<{
    visible: boolean;
    skuId: number | null;
    datos: any[];
    cargando: boolean;
  }>({ visible: false, skuId: null, datos: [], cargando: false });

  const handleCorreccionPrecio = async (skuId: number, tipo: 'precio_proveedor' | 'precio_venta', precioAnterior: number) => {
    if (!editandoPrecio) return;
    
    const nuevoPrecio = parseFloat(editandoPrecio.valor);
    if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
      setEditandoPrecio(null);
      return;
    }

    if (nuevoPrecio !== precioAnterior) {
      setLoadingIds(prev => new Set(prev).add(skuId));
      await actualizarPrecio(skuId, tipo, nuevoPrecio, precioAnterior);
      setLoadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(skuId);
        return newSet;
      });
    }
    setEditandoPrecio(null);
  };

  const verHistorial = async (skuId: number) => {
    setHistorialModal({ visible: true, skuId, datos: [], cargando: true });
    const response = await obtenerHistorialPrecio(skuId);
    if (response.success) {
      setHistorialModal(prev => ({ ...prev, datos: response.data, cargando: false }));
    } else {
      setHistorialModal(prev => ({ ...prev, cargando: false }));
      alert("Error al cargar historial");
    }
  };

  const handleCorreccion = async (skuId: number, stockAnterior: number) => {
    if (!editandoStock) return;

    const nuevoStock = parseInt(editandoStock.valor);
    if (isNaN(nuevoStock) || nuevoStock < 0) {
      setEditandoStock(null);
      return;
    }

    if (nuevoStock !== stockAnterior) {
      setLoadingIds(prev => new Set(prev).add(skuId));
      await corregirStockFisico(skuId, nuevoStock, stockAnterior);
      setLoadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(skuId);
        return newSet;
      });
    }
    setEditandoStock(null); // Cerramos el modo edición
  };

  // Lógica de filtrado en tiempo real
  const itemsFiltrados = useMemo(() => {
    if (!busqueda) return items;
    const busquedaLower = busqueda.toLowerCase();

    return items.filter(item =>
      item.nombre.toLowerCase().includes(busquedaLower) ||
      item.marca.toLowerCase().includes(busquedaLower) ||
      item.sabor.toLowerCase().includes(busquedaLower)
    );
  }, [items, busqueda]);

  const handleGuardarInbound = async (skuId: number) => {
    const cantidadStr = inbounds[skuId];
    const cantidad = parseInt(cantidadStr);

    if (isNaN(cantidad) || cantidad <= 0) return;

    setLoadingIds(prev => new Set(prev).add(skuId));

    const response = await registrarInbound(skuId, cantidad);

    setLoadingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(skuId);
      return newSet;
    });

    if (response.success) {
      setInbounds(prev => ({ ...prev, [skuId]: '' }));
      setSuccessIds(prev => new Set(prev).add(skuId));
      setTimeout(() => {
        setSuccessIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(skuId);
          return newSet;
        });
      }, 3000);
    } else {
      alert("Error al registrar inbound");
    }
  };

  return (
    <div style={{ background: '#111', borderRadius: '12px', padding: '1.5rem', border: '1px solid #333' }}>

      {/* BOTÓN DE REGRESO */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/admin" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#00e5ff',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          transition: 'opacity 0.2s'
        }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
          <ArrowLeft size={18} /> REGRESAR AL PANEL DE CONTROL
        </Link>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#000',
        border: '1px solid #444',
        borderRadius: '8px',
        padding: '0.8rem 1rem',
        marginBottom: '1.5rem'
      }}>
        <Search size={20} color="#888" style={{ marginRight: '10px' }} />
        <input
          type="text"
          placeholder="BUSCAR POR MARCA, PRODUCTO O SABOR..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'white',
            outline: 'none',
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* TABLA DE INVENTARIO */}
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'white' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-gold)' }}>
            <th style={{ padding: '1rem' }}>MARCA</th>
            <th>PRODUCTO</th>
            <th>SABOR / TAMAÑO</th>
            <th style={{ textAlign: 'center' }}>STOCK ACTUAL</th>
            <th style={{ textAlign: 'center' }}>PRECIO PROV.</th>
            <th style={{ textAlign: 'center' }}>PRECIO VENTA</th>
            <th style={{ textAlign: 'center' }}>HISTORIAL</th>
            <th style={{ textAlign: 'right' }}>+ AGREGAR INBOUND</th>
          </tr>
        </thead>
        <tbody>
          {itemsFiltrados.map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '1rem', color: '#888' }}>{item.marca}</td>
              <td style={{ fontWeight: 'bold' }}>{item.nombre}</td>
              <td>{item.sabor} ({item.tamano})</td>
              {/* CAMBIO AQUÍ */}
              <td
                style={{
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  cursor: editandoStock?.id === item.id ? 'text' : 'pointer',
                  color: item.stock < 5 ? '#ff4444' : '#4ade80',
                  backgroundColor: editandoStock?.id === item.id ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
                onClick={() => {
                  // Entrar en modo edición si no está ya editando
                  setEditandoStock({ id: item.id, valor: String(item.stock) });
                }}
                onBlur={() => {
                  // Si salimos del input y hay algo escrito, confirmamos
                  if (editandoStock?.id === item.id) {
                    handleCorreccion(item.id, item.stock);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCorreccion(item.id, item.stock);
                  }
                  if (e.key === 'Escape') {
                    setEditandoStock(null);
                  }
                }}
              >
                {editandoStock?.id === item.id ? (
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    value={editandoStock.valor}
                    onChange={(e) => setEditandoStock({ id: item.id, valor: e.target.value })}
                    style={{ width: '60px', background: 'black', border: '1px solid #444', color: 'white', padding: '0.2rem', textAlign: 'center', fontSize: '1.2rem' }}
                  />
                ) : (
                  item.stock
                )}
              </td>
              
              {/* PRECIO PROVEEDOR */}
              <td
                style={{
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  cursor: editandoPrecio?.id === item.id && editandoPrecio.tipo === 'precio_proveedor' ? 'text' : 'pointer',
                  backgroundColor: editandoPrecio?.id === item.id && editandoPrecio.tipo === 'precio_proveedor' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
                onClick={() => setEditandoPrecio({ id: item.id, tipo: 'precio_proveedor', valor: String(item.precio_proveedor) })}
                onBlur={() => {
                  if (editandoPrecio?.id === item.id && editandoPrecio.tipo === 'precio_proveedor') {
                    handleCorreccionPrecio(item.id, 'precio_proveedor', item.precio_proveedor);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCorreccionPrecio(item.id, 'precio_proveedor', item.precio_proveedor);
                  if (e.key === 'Escape') setEditandoPrecio(null);
                }}
              >
                {editandoPrecio?.id === item.id && editandoPrecio.tipo === 'precio_proveedor' ? (
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    min="0"
                    value={editandoPrecio.valor}
                    onChange={(e) => setEditandoPrecio({ id: item.id, tipo: 'precio_proveedor', valor: e.target.value })}
                    style={{ width: '80px', background: 'black', border: '1px solid #444', color: 'white', padding: '0.2rem', textAlign: 'center', fontSize: '1.1rem' }}
                  />
                ) : (
                  `$${Number(item.precio_proveedor || 0).toFixed(2)}`
                )}
              </td>

              {/* PRECIO VENTA */}
              <td
                style={{
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  cursor: editandoPrecio?.id === item.id && editandoPrecio.tipo === 'precio_venta' ? 'text' : 'pointer',
                  backgroundColor: editandoPrecio?.id === item.id && editandoPrecio.tipo === 'precio_venta' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: 'var(--color-gold)'
                }}
                onClick={() => setEditandoPrecio({ id: item.id, tipo: 'precio_venta', valor: String(item.precio_venta) })}
                onBlur={() => {
                  if (editandoPrecio?.id === item.id && editandoPrecio.tipo === 'precio_venta') {
                    handleCorreccionPrecio(item.id, 'precio_venta', item.precio_venta);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCorreccionPrecio(item.id, 'precio_venta', item.precio_venta);
                  if (e.key === 'Escape') setEditandoPrecio(null);
                }}
              >
                {editandoPrecio?.id === item.id && editandoPrecio.tipo === 'precio_venta' ? (
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    min="0"
                    value={editandoPrecio.valor}
                    onChange={(e) => setEditandoPrecio({ id: item.id, tipo: 'precio_venta', valor: e.target.value })}
                    style={{ width: '80px', background: 'black', border: '1px solid #444', color: 'white', padding: '0.2rem', textAlign: 'center', fontSize: '1.1rem' }}
                  />
                ) : (
                  `$${Number(item.precio_venta || 0).toFixed(2)}`
                )}
              </td>

              <td style={{ textAlign: 'center' }}>
                <button 
                  onClick={() => verHistorial(item.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#00e5ff' }}
                  title="Ver Historial de Precios"
                >
                  <History size={20} />
                </button>
              </td>

              <td style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '1rem' }}>
                <input
                  type="number"
                  min="1"
                  placeholder="Cant."
                  value={inbounds[item.id] || ''}
                  onChange={(e) => setInbounds({ ...inbounds, [item.id]: e.target.value })}
                  onBlur={() => setEditandoStock(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGuardarInbound(item.id);
                    if (e.key === 'Escape') setEditandoStock(null);
                  }}
                  style={{ width: '80px', background: '#000', border: '1px solid #444', color: 'white', padding: '0.5rem', borderRadius: '5px' }}
                />
                <button
                  onClick={() => handleGuardarInbound(item.id)}
                  disabled={loadingIds.has(item.id)}
                  style={{ background: 'var(--color-gold)', border: 'none', padding: '0.5rem', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {loadingIds.has(item.id) ? '...' : successIds.has(item.id) ? <CheckCircle2 size={20} color="black" /> : <PackagePlus size={20} color="black" />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MENSAJE SI NO HAY RESULTADOS */}
      {itemsFiltrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          NO SE ENCONTRARON PRODUCTOS QUE COINCIDAN CON "{busqueda.toUpperCase()}"
        </div>
      )}

      {/* MODAL DE HISTORIAL */}
      {historialModal.visible && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#111',
            border: '1px solid #444',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--color-gold)', margin: 0, fontSize: '1.5rem' }}>Historial de Precios</h2>
              <button 
                onClick={() => setHistorialModal({ visible: false, skuId: null, datos: [], cargando: false })}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {historialModal.cargando ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>Cargando historial...</div>
            ) : historialModal.datos.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>No hay registros en el historial para este producto.</div>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'white' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #444' }}>
                    <th style={{ padding: '0.8rem 0' }}>Fecha</th>
                    <th>Tipo</th>
                    <th style={{ textAlign: 'right' }}>Anterior</th>
                    <th style={{ textAlign: 'right' }}>Nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {historialModal.datos.map((registro: any) => (
                    <tr key={registro.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '0.8rem 0', color: '#aaa', fontSize: '0.9rem' }}>
                        {new Date(registro.fecha_cambio).toLocaleString()}
                      </td>
                      <td style={{ color: registro.tipo_precio === 'precio_venta' ? 'var(--color-gold)' : '#fff' }}>
                        {registro.tipo_precio === 'precio_venta' ? 'Venta' : 'Proveedor'}
                      </td>
                      <td style={{ textAlign: 'right', color: '#888', textDecoration: 'line-through' }}>
                        ${Number(registro.precio_anterior).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ${Number(registro.precio_nuevo).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}