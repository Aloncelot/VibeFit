import { NextResponse } from 'next/server';
import { getDemanda, PERIODOS_DEMANDA } from '@/server/queries/admin';

/** Exporta la tabla de demanda (getDemanda valida la sesión de admin). */
export async function GET(request: Request) {
  const parsed = Number(new URL(request.url).searchParams.get('dias'));
  const dias = (PERIODOS_DEMANDA as readonly number[]).includes(parsed) ? parsed : 90;
  const items = await getDemanda(dias);

  const columnas = [
    'id', 'marca', 'producto', 'variante', 'tamano', 'categoria', 'stock', 'alertas_pendientes', 'alertas_periodo',
    'ventas_perdidas', 'carrito_sin_stock', 'favoritos_actuales', 'guardados_actuales', 'vendidas', 'reposicion_sugerida',
  ] as const;
  // Evita que Excel interprete celdas como fórmulas (inyección CSV).
  const celda = (v: unknown) => {
    const s = String(v ?? '');
    const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${seguro.replace(/"/g, '""')}"`;
  };
  const csv = [columnas.join(','), ...items.map((i) => columnas.map((c) => celda(i[c])).join(','))].join('\r\n');

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="demanda-${dias}-dias.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
