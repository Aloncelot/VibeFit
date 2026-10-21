'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { registrarInbound, corregirStockFisico, actualizarPrecio, obtenerHistorialPrecio, type RegistroHistorial } from './actions';
import type { InventarioItem } from '@/server/queries/admin';
import { PackagePlus, CheckCircle2, Search, History, X, Plus } from 'lucide-react';

export default function InventarioClient({ items }: { items: InventarioItem[] }) {
  const [inbounds, setInbounds] = useState<{ [key: number]: string }>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [successIds, setSuccessIds] = useState<Set<number>>(new Set());

  const [busqueda, setBusqueda] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  const [editandoStock, setEditandoStock] = useState<{ id: number, valor: string } | null>(null);
  const [editandoPrecio, setEditandoPrecio] = useState<{ id: number, tipo: 'precio_proveedor' | 'precio_venta', valor: string } | null>(null);
  
  const [historialModal, setHistorialModal] = useState<{
    visible: boolean;
    skuId: number | null;
    datos: RegistroHistorial[];
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
      const res = await actualizarPrecio(skuId, tipo, nuevoPrecio);
      if (!res.success) setAviso(res.error);
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
      setAviso(response.error);
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
      const res = await corregirStockFisico(skuId, nuevoStock);
      if (!res.success) setAviso(res.error);
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
      setAviso(response.error);
    }
  };

  return (
    <div style={{ background: 'var(--bg-raised)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--line-strong)' }}>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Link href="/admin/inventario/nuevo" className="btn btn-primary">
          <Plus size={18} aria-hidden /> Alta de SKU
        </Link>
      </div>

      {aviso && (
        <div role="alert" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.8rem 1rem', marginBottom: '1rem', borderLeft: '3px solid var(--danger)', background: 'rgba(255, 122, 107, 0.08)' }}>
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso(null)} style={{ background: 'none', border: 0 }} aria-label="Cerrar aviso"><X size={18} /></button>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg)',
        border: '1px solid var(--line-strong)',
        borderRadius: '8px',
        padding: '0.8rem 1rem',
        marginBottom: '1.5rem'
      }}>
        <Search size={20} color="var(--text-muted)" style={{ marginRight: '10px' }} />
        <input
          type="search"
          aria-label="Buscar en inventario"
          placeholder="Buscar por marca, producto o sabor"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--pale-cyan)',
            outline: 'none',
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* TABLA DE INVENTARIO */}
      <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '960px', textAlign: 'left', borderCollapse: 'collapse', color: 'var(--pale-cyan)' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--accent)' }}>
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
            <tr key={item.id} style={{ borderBottom: '1px solid var(--line)' }}>
              <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.marca}</td>
              <td style={{ fontWeight: 'bold' }}>{item.nombre}</td>
              <td>{item.sabor} ({item.tamano})</td>
              {/* CAMBIO AQUÍ */}
              <td
                style={{
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  cursor: editandoStock?.id === item.id ? 'text' : 'pointer',
                  color: item.stock < 5 ? 'var(--danger)' : 'var(--ok)',
                  backgroundColor: editandoStock?.id === item.id ? 'rgba(240, 253, 255, 0.1)' : 'transparent'
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
                    style={{ width: '60px', background: 'var(--deep-blue)', border: '1px solid var(--line-strong)', color: 'var(--pale-cyan)', padding: '0.2rem', textAlign: 'center', fontSize: '1.2rem' }}
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
                  backgroundColor: editandoPrecio?.id === item.id && editandoPrecio.tipo === 'precio_proveedor' ? 'rgba(240, 253, 255, 0.1)' : 'transparent'
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
                    style={{ width: '80px', background: 'var(--deep-blue)', border: '1px solid var(--line-strong)', color: 'var(--pale-cyan)', padding: '0.2rem', textAlign: 'center', fontSize: '1.1rem' }}
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
                  backgroundColor: editandoPrecio?.id === item.id && editandoPrecio.tipo === 'precio_venta' ? 'rgba(240, 253, 255, 0.1)' : 'transparent',
                  color: 'var(--accent)'
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
                    style={{ width: '80px', background: 'var(--deep-blue)', border: '1px solid var(--line-strong)', color: 'var(--pale-cyan)', padding: '0.2rem', textAlign: 'center', fontSize: '1.1rem' }}
                  />
                ) : (
                  `$${Number(item.precio_venta || 0).toFixed(2)}`
                )}
              </td>

              <td style={{ textAlign: 'center' }}>
                <button 
                  onClick={() => verHistorial(item.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--soft-cyan)' }}
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
                  style={{ width: '80px', background: 'var(--bg)', border: '1px solid var(--line-strong)', color: 'var(--pale-cyan)', padding: '0.5rem', borderRadius: '5px' }}
                />
                <button
                  onClick={() => handleGuardarInbound(item.id)}
                  disabled={loadingIds.has(item.id)}
                  style={{ background: 'var(--accent)', border: 'none', padding: '0.5rem', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {loadingIds.has(item.id) ? '...' : successIds.has(item.id) ? <CheckCircle2 size={20} color="var(--deep-blue)" /> : <PackagePlus size={20} color="var(--deep-blue)" />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* MENSAJE SI NO HAY RESULTADOS */}
      {itemsFiltrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          NO SE ENCONTRARON PRODUCTOS QUE COINCIDAN CON "{busqueda.toUpperCase()}"
        </div>
      )}

      {/* MODAL DE HISTORIAL */}
      {historialModal.visible && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(3, 12, 19, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--line-strong)',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.5rem' }}>Historial de Precios</h2>
              <button 
                onClick={() => setHistorialModal({ visible: false, skuId: null, datos: [], cargando: false })}
                style={{ background: 'transparent', border: 'none', color: 'var(--pale-cyan)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {historialModal.cargando ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Cargando historial...</div>
            ) : historialModal.datos.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No hay registros en el historial para este producto.</div>
            ) : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'var(--pale-cyan)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line-strong)' }}>
                    <th style={{ padding: '0.8rem 0' }}>Fecha</th>
                    <th>Tipo</th>
                    <th style={{ textAlign: 'right' }}>Anterior</th>
                    <th style={{ textAlign: 'right' }}>Nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {historialModal.datos.map((registro) => (
                    <tr key={registro.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '0.8rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {new Date(registro.fecha_cambio).toLocaleString()}
                      </td>
                      <td style={{ color: registro.tipo_precio === 'precio_venta' ? 'var(--accent)' : 'var(--pale-cyan)' }}>
                        {registro.tipo_precio === 'precio_venta' ? 'Venta' : 'Proveedor'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
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