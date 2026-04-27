// app/admin/analisis/AnalisisClient.tsx

'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
    LineChart, Line
} from 'recharts';
import { getAnalisisABC, getTendenciaInbound, AnalisisItem, TendenciaItem } from './actions';
import { RefreshCw, DollarSign, Package, ArrowLeft } from 'lucide-react';

export default function AnalisisClient({ dataInicial }: { dataInicial: AnalisisItem[] }) {
    const [periodo, setPeriodo] = useState<number>(3);
    const [data, setData] = useState<AnalisisItem[]>(dataInicial);
    const [tendencia, setTendencia] = useState<TendenciaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [metrica, setMetrica] = useState<'DINERO' | 'UNIDADES'>('DINERO');

    // Sincronización con el servidor para ambas gráficas
    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            const [newDataABC, newDataTendencia] = await Promise.all([
                getAnalisisABC(periodo),
                getTendenciaInbound(periodo)
            ]);

            if (isMounted) {
                setData(newDataABC);
                setTendencia(newDataTendencia);
                setLoading(false);
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [periodo]);

    // Motor de Clasificación ABC
    const dataABC = useMemo(() => {
        const key = metrica === 'DINERO' ? 'valor_total_inversion' : 'total_unidades_recibidas';
        const sortedData = [...data].sort((a, b) => b[key] - a[key]);
        const totalGlobal = sortedData.reduce((acc, item) => acc + item[key], 0);
        let acumulado = 0;

        return sortedData.map(item => {
            const porcentaje = totalGlobal > 0 ? (item[key] / totalGlobal) * 100 : 0;
            acumulado += porcentaje;

            let categoria = 'C';
            if (acumulado <= 80) categoria = 'A';
            else if (acumulado <= 95) categoria = 'B';

            return { ...item, porcentaje, acumulado, categoria, valorActivo: item[key] };
        });
    }, [data, metrica]);

    // Paleta VIBEFIT
    const COLORS = { A: '#4ade80', B: '#facc15', C: '#f87171' };

    return (
        <div style={{ color: 'white', fontFamily: 'inherit' }}>

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

            {/* HEADER: Controles y Filtros */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>

                {/* Selector de Tiempo */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {[1, 3, 6, 12].map(m => (
                        <button
                            key={m}
                            onClick={() => setPeriodo(m)}
                            disabled={loading}
                            style={{
                                padding: '0.6rem 1.2rem',
                                background: periodo === m ? '#333' : '#111',
                                color: periodo === m ? 'var(--color-gold)' : '#666',
                                border: '1px solid #333',
                                borderRadius: '6px',
                                cursor: loading ? 'wait' : 'pointer',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                        >
                            {m === 1 ? 'MES ACTUAL' : `ÚLTIMOS ${m} MESES`}
                        </button>
                    ))}
                    {loading && <RefreshCw className="animate-spin" color="var(--color-gold)" style={{ marginLeft: '10px' }} />}
                </div>

                {/* Switch Maestro de Métrica */}
                <div style={{ display: 'flex', background: '#111', padding: '0.3rem', borderRadius: '10px', border: '1px solid #333' }}>
                    <button
                        onClick={() => setMetrica('DINERO')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: metrica === 'DINERO' ? 'var(--color-gold)' : 'transparent',
                            color: metrica === 'DINERO' ? 'black' : '#666',
                            fontWeight: 'bold', transition: 'all 0.3s'
                        }}
                    >
                        <DollarSign size={18} /> VALOR ($)
                    </button>
                    <button
                        onClick={() => setMetrica('UNIDADES')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: metrica === 'UNIDADES' ? 'var(--color-gold)' : 'transparent',
                            color: metrica === 'UNIDADES' ? 'black' : '#666',
                            fontWeight: 'bold', transition: 'all 0.3s'
                        }}
                    >
                        <Package size={18} /> CANTIDAD (U)
                    </button>
                </div>
            </div>

            {/* ESTADO VACÍO */}
            {!loading && dataABC.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#111', borderRadius: '12px', border: '1px solid #333' }}>
                    <h2 style={{ color: '#666' }}>NO HAY MOVIMIENTOS NETOS EN ESTE PERIODO</h2>
                    <p style={{ color: '#444' }}>Registra mercancía en el panel de inventario para ver el análisis.</p>
                </div>
            ) : (
                <>
                    {/* GRÁFICA 1: TENDENCIA SEMANAL (LÍNEAS) */}
                    <div style={{ height: '350px', background: '#111', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #333' }}>
                        <h3 style={{ color: 'var(--color-gold)', marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '1.1rem' }}>
                            TENDENCIA DE RECEPCIÓN (FLUJO SEMANAL)
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={tendencia} margin={{ bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="etiqueta" stroke="#555" tick={{ fontSize: 12 }} dy={10} />
                                <YAxis stroke="#555" tickFormatter={(val) => metrica === 'DINERO' ? `$${val / 1000}k` : val} />
                                <Tooltip
                                    contentStyle={{ background: '#000', border: '1px solid var(--color-gold)', borderRadius: '8px' }}
                                    labelStyle={{ color: '#888', marginBottom: '5px' }}
                                    formatter={(value: number) => [
                                        metrica === 'DINERO' ? `$${value.toLocaleString('es-MX')}` : `${value.toLocaleString('es-MX')} Unidades`,
                                        metrica === 'DINERO' ? 'Inversión' : 'Volumen'
                                    ]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={metrica === 'DINERO' ? 'inversion' : 'unidades'}
                                    stroke="var(--color-gold)"
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--color-gold)', r: 4, strokeWidth: 0 }}
                                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* GRÁFICA 2: PARETO ABC (BARRAS) */}
                    <div style={{ height: '400px', background: '#111', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #333' }}>
                        <h3 style={{ color: 'var(--color-gold)', marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '1.1rem' }}>
                            TOP PRODUCTOS POR {metrica === 'DINERO' ? 'INVERSIÓN ECONÓMICA' : 'VOLUMEN DE UNIDADES'}
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataABC.slice(0, 15)} margin={{ bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="producto" stroke="#555" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                                <YAxis stroke="#555" tickFormatter={(val) => metrica === 'DINERO' ? `$${val / 1000}k` : val} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: '#000', border: '1px solid var(--color-gold)', borderRadius: '8px' }}
                                    labelStyle={{ color: 'var(--color-gold)', fontWeight: 'bold', marginBottom: '5px' }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) return `${payload[0].payload.marca.toUpperCase()} | ${label}`;
                                        return label;
                                    }}
                                    formatter={(value: number) => [
                                        metrica === 'DINERO' ? `$${value.toLocaleString('es-MX')}` : `${value.toLocaleString('es-MX')} Unidades`,
                                        metrica === 'DINERO' ? 'Inversión' : 'Volumen'
                                    ]}
                                />
                                <Bar dataKey="valorActivo" radius={[4, 4, 0, 0]}>
                                    {dataABC.slice(0, 15).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.categoria as keyof typeof COLORS]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* TABLA DE DETALLES ABC */}
                    <div style={{ background: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#1a1a1a', borderBottom: '2px solid var(--color-gold)' }}>
                                <tr>
                                    <th style={{ padding: '1.2rem' }}>CAT</th>
                                    <th>MARCA | PRODUCTO</th>
                                    <th style={{ textAlign: 'right' }}>P. UNITARIO</th>
                                    <th style={{ textAlign: 'right' }}>UNIDADES</th>
                                    <th style={{ textAlign: 'right', paddingRight: '1.2rem' }}>INVERSIÓN TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataABC.map((item) => (
                                    <tr key={item.id} style={{
                                        borderBottom: '1px solid #222',
                                        background: (metrica === 'DINERO' && item.categoria === 'A') || (metrica === 'UNIDADES' && item.categoria === 'A') ? 'rgba(74, 222, 128, 0.02)' : 'transparent'
                                    }}>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ background: COLORS[item.categoria as keyof typeof COLORS], color: 'black', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', boxShadow: `0 0 10px ${COLORS[item.categoria as keyof typeof COLORS]}40` }}>
                                                {item.categoria}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: '#888', fontSize: '0.85rem', fontWeight: 'bold' }}>{item.marca}</span><br />
                                            {item.producto}
                                        </td>
                                        <td style={{ textAlign: 'right', fontSize: '1.1rem', color: '#888' }}>
                                            ${item.precio_unitario?.toLocaleString('es-MX') || '0.00'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: metrica === 'UNIDADES' ? 'bold' : 'normal', color: metrica === 'UNIDADES' ? 'white' : '#888' }}>
                                            {item.total_unidades_recibidas.toLocaleString('es-MX')}
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: '1.2rem', fontSize: '1.1rem', fontWeight: metrica === 'DINERO' ? 'bold' : 'normal', color: metrica === 'DINERO' ? 'var(--color-gold)' : '#888' }}>
                                            ${item.valor_total_inversion.toLocaleString('es-MX')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}