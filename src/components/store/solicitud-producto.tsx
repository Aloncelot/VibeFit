'use client';

import { useActionState, useId } from 'react';
import { enviarSolicitudProducto, type SolicitudState } from '@/server/actions/solicitudes';
import { useCart } from '@/context/cart-context';
import styles from './solicitud.module.css';

const COPIA: Record<string, { titulo: string; ejemplo: string }> = {
  suplementos: { titulo: '¿No encuentras un suplemento?', ejemplo: 'Ej. Creatina Creapure 500 g' },
  ropa: { titulo: '¿Buscas una prenda que no ves aquí?', ejemplo: 'Ej. Jogger YoungLA 219 talla M' },
  accesorios: { titulo: '¿Te falta algún accesorio?', ejemplo: 'Ej. Cinturón de palanca 10 mm' },
};

/** Formulario al final del catálogo: el cliente pide un producto y le llega al admin. */
export default function SolicitudProducto({ seccion }: { seccion: 'suplementos' | 'ropa' | 'accesorios' }) {
  const [state, action, isPending] = useActionState<SolicitudState, FormData>(enviarSolicitudProducto, {});
  const { cliente } = useCart();
  const id = useId();
  const copia = COPIA[seccion];

  return (
    <section className={styles.box} aria-labelledby={`${id}-titulo`}>
      <div className={styles.intro}>
        <h2 id={`${id}-titulo`}>{copia.titulo}</h2>
        <p>Dinos qué buscas. Revisamos cada solicitud para decidir qué traer a la tienda.</p>
      </div>

      {state.ok ? (
        <p className={styles.ok} role="status">
          Recibimos tu solicitud. Gracias, la revisaremos para el próximo pedido a proveedores.
        </p>
      ) : (
        <form action={action} className={styles.form}>
          <input type="hidden" name="seccion" value={seccion} />
          <div className={styles.trap} aria-hidden>
            <label>
              No llenar <input name="sitio" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div className={styles.field}>
            <label htmlFor={`${id}-producto`}>Producto</label>
            <input id={`${id}-producto`} name="producto" required maxLength={120} placeholder={copia.ejemplo} />
          </div>
          <div className={styles.field}>
            <label htmlFor={`${id}-marca`}>Marca (opcional)</label>
            <input id={`${id}-marca`} name="marca" maxLength={80} />
          </div>
          <div className={`${styles.field} ${styles.wide}`}>
            <label htmlFor={`${id}-detalle`}>Detalles (opcional)</label>
            <input id={`${id}-detalle`} name="detalle" maxLength={400} placeholder="Sabor, talla, color o presentación" />
          </div>
          {!cliente && (
            <div className={`${styles.field} ${styles.wide}`}>
              <label htmlFor={`${id}-email`}>Tu correo (opcional, para avisarte)</label>
              <input id={`${id}-email`} name="email" type="email" maxLength={254} autoComplete="email" />
            </div>
          )}

          {state.error && (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      )}
    </section>
  );
}
