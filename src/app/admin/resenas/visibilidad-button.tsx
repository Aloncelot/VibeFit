'use client';

import { useTransition } from 'react';
import { cambiarVisibilidadResena } from './actions';

export default function VisibilidadButton({ id, visible }: { id: number; visible: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-outline"
      disabled={isPending}
      onClick={() => startTransition(async () => void (await cambiarVisibilidadResena(id, !visible)))}
    >
      {visible ? 'Ocultar' : 'Mostrar'}
    </button>
  );
}
