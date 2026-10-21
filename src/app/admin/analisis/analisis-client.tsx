'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
    LineChart, Line
} from 'recharts';
import type { AnalisisItem, TendenciaItem } from '@/server/queries/admin';
import { RefreshCw, DollarSign, Package } from 'lucide-react';

interface Props {
    data: AnalisisItem[];
    tendencia: TendenciaItem[];
    periodo: number;
    periodos: number[];
}

export default function AnalisisClient({ data, tendencia, periodo, periodos }: Props) {
    const router = useRouter();
    const [loading, startTransition] = useTransition();
    const [metrica, setMetrica] = useState<'DINERO' | 'UNIDADES'>('DINERO');

    // El periodo vive en la URL (?meses=6); el servidor vuelve a consultar.
    const cambiarPeriodo = (m: number) => {
        startTransition(() => router.push(`/admin/analisis?meses=${m}`, { scroll: false }));
    };

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

    const formatTooltip = (value: unknown): [string, string] => {
        const n = Number(value).toLocaleString('es-MX');
        return metrica === 'DINERO' ? [`$${n}`, 'Inversión'] : [`${n} unidades`, 'Volumen'];
    };

    // Paleta VIBEFIT
    const COLORS = { A: '#5ee0b0', B: '#facc15', C: '#ff7a6b' };

    return (
        <div style={{ color: 'var(--pale-cyan)', fontFamily: 'inherit' }}>

            {/* HEADER: Controles y Filtros */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>

                {/* Selector de Tiempo */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {periodos.map(m => (
                        <button
                            key={m}
                            onClick={() => cambiarPeriodo(m)}
                            aria-pressed={periodo === m}
                            disabled={loading}
                            style={{
                                padding: '0.6rem 1.2rem',
                                background: periodo === m ? 'var(--line-strong)' : 'var(--bg-raised)',
                                color: periodo === m ? 'var(--accent)' : 'rgba(167, 232, 242, 0.55)',
                                border: '1px solid var(--line-strong)',
                                borderRadius: '6px',
                                cursor: loading ? 'wait' : 'pointer',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                        >
                            {m === 1 ? 'Último mes' : `Últimos ${m} meses`}
                        </button>
                    ))}
                    {loading && <RefreshCw className="spin" color="var(--accent)" style={{ marginLeft: '10px' }} />}
                </div>

                {/* Switch Maestro de Métrica */}
                <div style={{ display: 'flex', background: 'var(--bg-raised)', padding: '0.3rem', borderRadius: '10px', border: '1px solid var(--line-strong)' }}>
                    <button
                        onClick={() => setMetrica('DINERO')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: metrica === 'DINERO' ? 'var(--accent)' : 'transparent',
                            color: metrica === 'DINERO' ? 'var(--deep-blue)' : 'rgba(167, 232, 242, 0.55)',
                            fontWeight: 'bold', transition: 'all 0.3s'
                        }}
                    >
                        <DollarSign size={18} /> Valor ($)
                    </button>
                    <button
                        onClick={() => setMetrica('UNIDADES')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: metrica === 'UNIDADES' ? 'var(--accent)' : 'transparent',
                            color: metrica === 'UNIDADES' ? 'var(--deep-blue)' : 'rgba(167, 232, 242, 0.55)',
                            fontWeight: 'bold', transition: 'all 0.3s'
                        }}
                    >
                        <Package size={18} /> Unidades
                    </button>
                </div>
            </div>

            {/* ESTADO VACÍO */}
            {!loading && dataABC.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-raised)', borderRadius: '12px', border: '1px solid var(--line-strong)' }}>
                    <h2 style={{ color: 'rgba(167, 232, 242, 0.55)' }}>NO HAY MOVIMIENTOS NETOS EN ESTE PERIODO</h2>
                    <p style={{ color: 'var(--line-strong)' }}>Registra mercancía en el panel de inventario para ver el análisis.</p>
                </div>
            ) : (
                <>
                    {/* GRÁFICA 1: TENDENCIA SEMANAL (LÍNEAS) */}
                    <div style={{ height: '350px', background: 'var(--bg-raised)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--line-strong)' }}>
                        <h3 style={{ color: 'var(--accent)', marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '1.1rem' }}>
                            TENDENCIA DE RECEPCIÓN (FLUJO SEMANAL)
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={tendencia} margin={{ bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167, 232, 242, 0.16)" vertical={false} />
                                <XAxis dataKey="etiqueta" stroke="rgba(167, 232, 242, 0.55)" tick={{ fontSize: 12 }} dy={10} />
                                <YAxis stroke="rgba(167, 232, 242, 0.55)" tickFormatter={(val) => metrica === 'DINERO' ? `$${val / 1000}k` : val} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: '8px' }}
                                    labelStyle={{ color: 'var(--text-muted)', marginBottom: '5px' }}
                                    formatter={formatTooltip}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={metrica === 'DINERO' ? 'inversion' : 'unidades'}
                                    stroke="#01baef"
                                    strokeWidth={3}
                                    dot={{ fill: '#01baef', r: 4, strokeWidth: 0 }}
                                    activeDot={{ r: 6, stroke: '#f0fdff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* GRÁFICA 2: PARETO ABC (BARRAS) */}
                    <div style={{ height: '400px', background: 'var(--bg-raised)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--line-strong)' }}>
                        <h3 style={{ color: 'var(--accent)', marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '1.1rem' }}>
                            TOP PRODUCTOS POR {metrica === 'DINERO' ? 'INVERSIÓN ECONÓMICA' : 'VOLUMEN DE UNIDADES'}
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataABC.slice(0, 15)} margin={{ bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167, 232, 242, 0.16)" vertical={false} />
                                <XAxis dataKey="producto" stroke="rgba(167, 232, 242, 0.55)" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                                <YAxis stroke="rgba(167, 232, 242, 0.55)" tickFormatter={(val) => metrica === 'DINERO' ? `$${val / 1000}k` : val} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(240, 253, 255, 0.05)' }}
                                    contentStyle={{ background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: '8px' }}
                                    labelStyle={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '5px' }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) return `${payload[0].payload.marca.toUpperCase()} | ${label}`;
                                        return label;
                                    }}
                                    formatter={formatTooltip}
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
                    <div style={{ background: 'var(--bg-raised)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--line-strong)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--bg-raised)', borderBottom: '2px solid var(--accent)' }}>
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
                                        borderBottom: '1px solid var(--line)',
                                        background: (metrica === 'DINERO' && item.categoria === 'A') || (metrica === 'UNIDADES' && item.categoria === 'A') ? 'rgba(94, 224, 176, 0.02)' : 'transparent'
                                    }}>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ background: COLORS[item.categoria as keyof typeof COLORS], color: 'var(--deep-blue)', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', boxShadow: `0 0 10px ${COLORS[item.categoria as keyof typeof COLORS]}40` }}>
                                                {item.categoria}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>{item.marca}</span><br />
                                            {item.producto}
                                        </td>
                                        <td style={{ textAlign: 'right', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                                            ${item.precio_unitario?.toLocaleString('es-MX') || '0.00'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: metrica === 'UNIDADES' ? 'bold' : 'normal', color: metrica === 'UNIDADES' ? 'var(--pale-cyan)' : 'var(--text-muted)' }}>
                                            {item.total_unidades_recibidas.toLocaleString('es-MX')}
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: '1.2rem', fontSize: '1.1rem', fontWeight: metrica === 'DINERO' ? 'bold' : 'normal', color: metrica === 'DINERO' ? 'var(--accent)' : 'var(--text-muted)' }}>
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