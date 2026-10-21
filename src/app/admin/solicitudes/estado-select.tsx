'use client';

import { useTransition } from 'react';
import { cambiarEstadoSolicitud } from './actions';
import type { EstadoSolicitud } from '@/server/queries/admin';

const ETIQUETAS: Record<EstadoSolicitud, string> = {
  NUEVA: 'Nueva',
  REVISADA: 'Revisada',
  ATENDIDA: 'Atendida (ya la tenemos)',
  DESCARTADA: 'Descartada',
};

export default function EstadoSelect({ id, estado }: { id: number; estado: EstadoSolicitud }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      aria-label="Estado de la solicitud"
      defaultValue={estado}
      disabled={isPending}
      onChange={(e) => {
        const nuevo = e.target.value as EstadoSolicitud;
        startTransition(async () => {
          const res = await cambiarEstadoSolicitud(id, nuevo);
          if (!res.success) e.target.value = estado;
        });
      }}
      style={{ height: 40, padding: '0 0.6rem', background: 'var(--bg)', border: '1px solid var(--line-strong)', borderRadius: 4 }}
    >
      {(Object.keys(ETIQUETAS) as EstadoSolicitud[]).map((k) => (
        <option key={k} value={k}>
          {ETIQUETAS[k]}
        </option>
      ))}
    </select>
  );
}
