'use client';

import { useId, useState } from 'react';
import type { SuplementoAgrupado } from '@/types/catalogo';
import { useCart } from '@/context/cart-context';
import { formatMXN } from '@/lib/format';
import ProductImage from './product-image';
import FavoriteButton from './favorite-button';
import styles from './catalog.module.css';

export default function SupplementCard({ producto, priority }: { producto: SuplementoAgrupado; priority?: boolean }) {
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState(producto.variantes[0].id);
  const selectId = useId();
  const variante = producto.variantes.find((v) => v.id === variantId) ?? producto.variantes[0];

  const agregar = () =>
    addItem({
      id: variante.id,
      nombre: producto.nombre,
      marca: producto.marca,
      variante: variante.sabor,
      tamano: producto.tamano,
      precio: variante.precio_venta,
      imagen_url: variante.imagen_variante_url,
      cantidad: 1,
      stock: variante.stock,
    });

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <ProductImage
          src={variante.imagen_variante_url}
          alt={`${producto.nombre} ${variante.sabor}`}
          sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw"
          priority={priority}
        />
        <span className={styles.sizeTag}>{producto.tamano}</span>
        <FavoriteButton skuId={variante.id} nombre={`${producto.nombre} ${variante.sabor}`} />
      </div>

      <div className={styles.body}>
        <p className={styles.brand}>{producto.marca}</p>
        <h3 className={styles.name}>{producto.nombre}</h3>

        {producto.variantes.length > 1 ? (
          <div className={styles.field}>
            <label htmlFor={selectId}>Sabor</label>
            <select id={selectId} value={variante.id} onChange={(e) => setVariantId(Number(e.target.value))}>
              {producto.variantes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.sabor}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className={styles.single}>Sabor: {variante.sabor}</p>
        )}

        <div className={styles.priceRow}>
          <span className={`num ${styles.price}`}>{formatMXN(variante.precio_venta)}</span>
          <span className={styles.stock} data-low={variante.stock <= 3 || undefined}>
            {variante.stock <= 3 ? `Quedan ${variante.stock}` : 'En existencia'}
          </span>
        </div>

        <button type="button" className={`btn btn-primary ${styles.add}`} onClick={agregar}>
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}
