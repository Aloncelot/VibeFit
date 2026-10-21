'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BellRing } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { quitarDeLista } from '@/server/actions/listas';
import { formatMXN } from '@/lib/format';
import type { SkuResumen } from '@/types/catalogo';
import ProductImage from '@/components/store/product-image';
import styles from './cuenta.module.css';

type Tipo = 'GUARDADO' | 'FAVORITO' | 'AVISO';

interface Props {
  id: string;
  titulo: string;
  vacio: string;
  tipo: Tipo;
  items: SkuResumen[];
}

export default function ListaProductos({ id, titulo, vacio, tipo, items }: Props) {
  const router = useRouter();
  const { moverAlCarrito, addItem, pedirAviso, cancelarAviso, alertas } = useCart();
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const ejecutar = (fn: () => Promise<string | null>, exito?: string) =>
    startTransition(async () => {
      const error = await fn();
      setMensaje(error ?? exito ?? null);
      if (!error) router.refresh();
    });

  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id}>
        {titulo} <span className="num">{items.length}</span>
      </h2>

      {mensaje && (
        <p className={styles.status} role="status">
          {mensaje}
        </p>
      )}

      {items.length === 0 ? (
        <p className={styles.empty}>{vacio}</p>
      ) : (
        <ul className={styles.items} aria-busy={isPending || undefined}>
          {items.map((sku) => {
            const agotado = sku.stock <= 0;
            return (
              <li key={sku.id} className={styles.item} data-agotado={agotado || undefined}>
                <div className={styles.thumb}>
                  <ProductImage src={sku.imagen_url} alt={sku.nombre} sizes="96px" />
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.brand}>{sku.marca}</p>
                  <p className={styles.name}>{sku.nombre}</p>
                  <p className={styles.variant}>{[sku.variante, sku.tamano].filter(Boolean).join(' / ')}</p>
                  <p className={styles.priceLine}>
                    <span className="num">{formatMXN(sku.precio)}</span>
                    {agotado ? <span className={styles.out}>Ya no disponible</span> : <span className={styles.in}>En existencia</span>}
                  </p>
                </div>

                <div className={styles.itemActions}>
                  {!agotado &&
                    (tipo === 'GUARDADO' ? (
                      <button type="button" className="btn btn-primary" onClick={() => ejecutar(() => moverAlCarrito(sku), 'Lo movimos a tu carrito.')}>
                        Mover al carrito
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          addItem({ ...sku, cantidad: 1 });
                          setMensaje('Agregado a tu carrito.');
                        }}
                      >
                        Agregar al carrito
                      </button>
                    ))}

                  {agotado &&
                    (alertas.has(sku.id) || tipo === 'AVISO' ? (
                      <button type="button" className={styles.link} onClick={() => ejecutar(() => cancelarAviso(sku.id), 'Aviso cancelado.')}>
                        Cancelar aviso
                      </button>
                    ) : (
                      <button type="button" className="btn btn-outline" onClick={() => ejecutar(() => pedirAviso(sku.id), 'Te avisaremos cuando vuelva.')}>
                        <BellRing size={16} aria-hidden /> Avisarme cuando vuelva
                      </button>
                    ))}

                  {tipo !== 'AVISO' && (
                    <button
                      type="button"
                      className={styles.link}
                      onClick={() =>
                        ejecutar(async () => {
                          const res = await quitarDeLista(sku.id, tipo);
                          return res.success ? null : res.error;
                        })
                      }
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
