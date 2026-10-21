'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BellRing } from 'lucide-react';
import { marcarNotificacionesLeidas } from '@/server/actions/listas';
import type { Notificacion } from '@/types/catalogo';
import styles from './cuenta.module.css';

const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Notificaciones({ items }: { items: Notificacion[] }) {
  const router = useRouter();
  const hayNuevas = items.some((n) => !n.leida);

  // Al verlas, se marcan como leídas (y el contador del encabezado se actualiza).
  useEffect(() => {
    if (!hayNuevas) return;
    const t = window.setTimeout(async () => {
      const res = await marcarNotificacionesLeidas();
      if (res.success) router.refresh();
    }, 1500);
    return () => window.clearTimeout(t);
  }, [hayNuevas, router]);

  if (items.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="notificaciones">
      <h2 id="notificaciones">Avisos</h2>
      <ul className={styles.notifs}>
        {items.map((n) => (
          <li key={n.id} data-nueva={!n.leida || undefined}>
            <BellRing size={18} aria-hidden />
            <span>{n.mensaje}</span>
            <time dateTime={n.creada_en}>{fecha.format(new Date(n.creada_en))}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
