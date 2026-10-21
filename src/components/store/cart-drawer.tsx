'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Minus, Plus, X, Loader2, BellRing, Lock } from 'lucide-react';
import { cantidadDisponible, useCart } from '@/context/cart-context';
import { confirmarPedidoSimulado } from '@/server/actions/pedido';
import { formatMXN } from '@/lib/format';
import { PAGOS_ACTIVOS, WHATSAPP_URL } from '@/lib/config';
import type { CartItem } from '@/types/catalogo';
import ProductImage from './product-image';
import styles from './cart-drawer.module.css';

type Estado = { tipo: 'idle' } | { tipo: 'error'; mensaje: string } | { tipo: 'ok'; unidades: number };

export default function CartDrawer() {
  const cart = useCart();
  const { items, disponibles, isOpen, close, removeItem, totalItems, subtotal, shipping, cliente, guardados } = cart;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: 'idle' });
  const [aviso, setAviso] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const desde = encodeURIComponent(pathname);
  const agotados = items.filter((i) => i.stock <= 0);

  // Sincroniza el estado del carrito con el <dialog> nativo (foco atrapado y Esc incluidos).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // Al abrir, revisa stock y precio reales: lo guardado hace días puede ya no estar disponible.
  const { refrescarDisponibilidad } = cart;
  useEffect(() => {
    if (isOpen) void refrescarDisponibilidad();
  }, [isOpen, refrescarDisponibilidad]);

  const handleClose = () => {
    close();
    setAviso(null);
    if (estado.tipo !== 'idle') setEstado({ tipo: 'idle' });
  };

  const ejecutar = (fn: () => Promise<string | null>) => {
    startTransition(async () => {
      setAviso(await fn());
    });
  };

  const confirmar = () => {
    startTransition(async () => {
      const res = await confirmarPedidoSimulado(disponibles.map((i) => ({ id: i.id, cantidad: cantidadDisponible(i) })));
      if (res.success) {
        setEstado({ tipo: 'ok', unidades: res.unidades });
        // Solo salen las líneas compradas; las agotadas se quedan para seguirlas.
        disponibles.forEach((i) => removeItem(i.id));
      } else {
        setEstado({ tipo: 'error', mensaje: res.error });
        await refrescarDisponibilidad();
      }
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.drawer}
      aria-labelledby="carrito-titulo"
      onClose={handleClose}
      onClick={(e) => {
        // Clic en el fondo oscuro cierra el carrito.
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 id="carrito-titulo">Tu carrito</h2>
          <button type="button" className={styles.iconButton} onClick={handleClose} aria-label="Cerrar carrito">
            <X size={22} aria-hidden />
          </button>
        </header>

        {estado.tipo === 'ok' ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Pedido confirmado</p>
            <p>
              Apartamos {estado.unidades} {estado.unidades === 1 ? 'artículo' : 'artículos'} del inventario. Este es un pedido de
              prueba: no se hizo ningún cobro.
            </p>
            <button type="button" className="btn btn-outline" onClick={handleClose}>
              Seguir comprando
            </button>
          </div>
        ) : (
          <div className={styles.scroll}>
            {items.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>Tu carrito está vacío</p>
                <p>Agrega suplementos, ropa o accesorios desde el catálogo.</p>
                <button type="button" className="btn btn-outline" onClick={handleClose}>
                  Ver catálogo
                </button>
              </div>
            ) : (
              <ul className={styles.lines}>
                {disponibles.map((item) => (
                  <LineaDisponible key={item.id} item={item} onAccion={ejecutar} />
                ))}
                {agotados.map((item) => (
                  <LineaAgotada key={item.id} item={item} onAccion={ejecutar} />
                ))}
              </ul>
            )}

            {aviso && (
              <p className={styles.error} role="status">
                {aviso}
              </p>
            )}

            {guardados.length > 0 && (
              <section className={styles.saved} aria-labelledby="guardados-titulo">
                <h3 id="guardados-titulo">Guardado para después ({guardados.length})</h3>
                <ul>
                  {guardados.slice(0, 4).map((g) => (
                    <li key={g.id}>
                      <span>
                        {g.nombre} <small>{[g.variante, g.tamano].filter(Boolean).join(' / ')}</small>
                      </span>
                      {g.stock > 0 ? (
                        <button type="button" onClick={() => ejecutar(() => cart.moverAlCarrito(g))} disabled={isPending}>
                          Mover al carrito
                        </button>
                      ) : (
                        <span className={styles.out}>Agotado</span>
                      )}
                    </li>
                  ))}
                </ul>
                {guardados.length > 4 && (
                  <Link href="/cuenta" onClick={handleClose} className={styles.textLink}>
                    Ver todo en tu cuenta
                  </Link>
                )}
              </section>
            )}
          </div>
        )}

        {estado.tipo !== 'ok' && disponibles.length > 0 && (
          <footer className={styles.foot}>
            <dl className={styles.totals}>
              <div>
                <dt>Subtotal ({totalItems})</dt>
                <dd className="num">{formatMXN(subtotal)}</dd>
              </div>
              <div>
                <dt>Envío</dt>
                <dd className="num">{formatMXN(shipping)}</dd>
              </div>
              <div className={styles.grand}>
                <dt>Total</dt>
                <dd className="num">{formatMXN(subtotal + shipping)}</dd>
              </div>
            </dl>
            <p className={styles.note}>
              Envío de $185 por cada 5 artículos.{agotados.length > 0 && ' Los productos agotados no se cobran.'}
            </p>

            {estado.tipo === 'error' && (
              <p className={styles.error} role="alert">
                {estado.mensaje}
              </p>
            )}

            {!cliente && (
              <p className={styles.account}>
                <Link href={`/entrar?desde=${desde}`} onClick={handleClose}>
                  Entra
                </Link>{' '}
                o{' '}
                <Link href={`/registro?desde=${desde}`} onClick={handleClose}>
                  crea tu cuenta
                </Link>{' '}
                para guardar tu carrito y recibir avisos de existencia.
              </p>
            )}

            {PAGOS_ACTIVOS ? (
              <button type="button" className={`btn btn-primary ${styles.checkout}`} onClick={confirmar} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 size={18} className="spin" aria-hidden /> Procesando…
                  </>
                ) : cliente ? (
                  'Confirmar pedido'
                ) : (
                  'Comprar como invitado'
                )}
              </button>
            ) : (
              <div className={styles.locked} role="note" aria-labelledby="pagos-pronto">
                <p id="pagos-pronto" className={styles.lockedTitle}>
                  <Lock size={18} aria-hidden /> Pagos en línea: próximamente
                </p>
                <p>
                  Estamos preparando el pago seguro con tarjeta y efectivo. Tu carrito se queda guardado; si quieres apartar tu
                  pedido ahora, escríbenos.
                </p>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`btn btn-outline ${styles.checkout}`}>
                  Apartar por WhatsApp
                </a>
                <button type="button" className={`btn ${styles.checkout} ${styles.lockedBtn}`} disabled aria-disabled="true">
                  <Lock size={16} aria-hidden /> Pagar: próximamente
                </button>
              </div>
            )}
          </footer>
        )}
      </div>
    </dialog>
  );
}

type OnAccion = (fn: () => Promise<string | null>) => void;

function Detalle({ item }: { item: CartItem }) {
  return (
    <>
      <p className={styles.brand}>{item.marca}</p>
      <p className={styles.name}>{item.nombre}</p>
      <p className={styles.variant}>{[item.variante, item.tamano].filter(Boolean).join(' / ')}</p>
    </>
  );
}

function LineaDisponible({ item, onAccion }: { item: CartItem; onAccion: OnAccion }) {
  const { setQuantity, removeItem, guardarParaDespues } = useCart();
  const cantidad = cantidadDisponible(item);

  return (
    <li className={styles.line}>
      <div className={styles.thumb}>
        <ProductImage src={item.imagen_url} alt={item.nombre} sizes="80px" />
      </div>
      <div className={styles.info}>
        <Detalle item={item} />
        <div className={styles.lineFoot}>
          <div className={styles.stepper} role="group" aria-label={`Cantidad de ${item.nombre}`}>
            <button
              type="button"
              onClick={() => (cantidad === 1 ? removeItem(item.id) : setQuantity(item.id, cantidad - 1))}
              aria-label={cantidad === 1 ? 'Quitar del carrito' : 'Restar uno'}
            >
              <Minus size={16} aria-hidden />
            </button>
            <span className="num" aria-live="polite">
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(item.id, cantidad + 1)}
              disabled={cantidad >= item.stock || cantidad >= 20}
              aria-label="Sumar uno"
            >
              <Plus size={16} aria-hidden />
            </button>
          </div>
          <span className={`num ${styles.linePrice}`}>{formatMXN(item.precio * cantidad)}</span>
        </div>
        {item.cantidad > item.stock ? (
          <p className={styles.note}>Solo quedan {item.stock}; ajustamos la cantidad.</p>
        ) : (
          cantidad >= item.stock && <p className={styles.note}>Es todo el stock disponible.</p>
        )}
        <div className={styles.lineActions}>
          <button type="button" onClick={() => onAccion(() => guardarParaDespues(item))}>
            Guardar para después
          </button>
          <button type="button" onClick={() => removeItem(item.id)}>
            Quitar
          </button>
        </div>
      </div>
    </li>
  );
}

function LineaAgotada({ item, onAccion }: { item: CartItem; onAccion: OnAccion }) {
  const { removeItem, guardarParaDespues, pedirAviso, cancelarAviso, alertas } = useCart();
  const avisoActivo = alertas.has(item.id);

  return (
    <li className={`${styles.line} ${styles.lineOut}`}>
      <div className={styles.thumb}>
        <ProductImage src={item.imagen_url} alt={item.nombre} sizes="80px" />
      </div>
      <div className={styles.info}>
        <p className={styles.outBadge}>Ya no disponible</p>
        <Detalle item={item} />
        {avisoActivo ? (
          <p className={styles.alertOn}>
            <BellRing size={16} aria-hidden /> Te avisaremos cuando vuelva.{' '}
            <button type="button" onClick={() => onAccion(() => cancelarAviso(item.id))}>
              Cancelar aviso
            </button>
          </p>
        ) : (
          <button type="button" className={`btn btn-outline ${styles.notify}`} onClick={() => onAccion(() => pedirAviso(item.id))}>
            <BellRing size={16} aria-hidden /> Avisarme cuando vuelva
          </button>
        )}
        <div className={styles.lineActions}>
          <button type="button" onClick={() => onAccion(() => guardarParaDespues(item))}>
            Guardar para después
          </button>
          <button type="button" onClick={() => removeItem(item.id)}>
            Quitar
          </button>
        </div>
      </div>
    </li>
  );
}
