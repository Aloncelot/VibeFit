'use client';

import { useState, useTransition } from 'react';
import { BellRing, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Prenda } from '@/types/catalogo';
import { useCart } from '@/context/cart-context';
import { formatMXN } from '@/lib/format';
import ProductImage from './product-image';
import FavoriteButton from './favorite-button';
import styles from './catalog.module.css';

export default function ApparelCard({ prenda, priority }: { prenda: Prenda; priority?: boolean }) {
  const { addItem, alertas, pedirAviso } = useCart();
  const [isPending, startTransition] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);
  const [colorIndex, setColorIndex] = useState(0);
  const color = prenda.colores[colorIndex];
  const primeraDisponible = (c = color) => c.tallas.find((t) => t.stock > 0) ?? c.tallas[0];
  const [skuId, setSkuId] = useState(primeraDisponible().sku_id);
  const [imgIndex, setImgIndex] = useState(0);

  const talla = color.tallas.find((t) => t.sku_id === skuId) ?? primeraDisponible();
  const imagenes = color.imagenes;
  const agotado = talla.stock <= 0;

  // Al cambiar de color se reinician talla e imagen (antes no había selector de color).
  const elegirColor = (index: number) => {
    setColorIndex(index);
    setSkuId(primeraDisponible(prenda.colores[index]).sku_id);
    setImgIndex(0);
    setAviso(null);
  };

  const avisoActivo = alertas.has(talla.sku_id);
  const pedirAvisoTalla = () =>
    startTransition(async () => {
      setAviso(await pedirAviso(talla.sku_id));
    });

  const mover = (delta: number) => setImgIndex((i) => (i + delta + imagenes.length) % imagenes.length);

  const agregar = () =>
    addItem({
      id: talla.sku_id,
      nombre: prenda.nombre,
      marca: prenda.marca,
      variante: color.nombre,
      tamano: talla.talla,
      precio: prenda.precio,
      imagen_url: imagenes[0] ?? null,
      cantidad: 1,
      stock: talla.stock,
    });

  return (
    <article className={styles.card}>
      <div className={`${styles.media} ${styles.mediaTall}`}>
        <ProductImage
          src={imagenes[imgIndex]}
          alt={`${prenda.nombre} color ${color.nombre}`}
          sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw"
          fit="cover"
          priority={priority}
        />
        <FavoriteButton skuId={talla.sku_id} nombre={`${prenda.nombre} ${color.nombre} ${talla.talla}`} />
        {imagenes.length > 1 && (
          <>
            <button type="button" className={`${styles.navBtn} ${styles.prev}`} onClick={() => mover(-1)} aria-label="Foto anterior">
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button type="button" className={`${styles.navBtn} ${styles.next}`} onClick={() => mover(1)} aria-label="Foto siguiente">
              <ChevronRight size={20} aria-hidden />
            </button>
            <span className={`num ${styles.photoCount}`}>
              {imgIndex + 1}/{imagenes.length}
            </span>
          </>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.brand}>{prenda.marca}</p>
        <h3 className={styles.name}>{prenda.nombre}</h3>

        {prenda.colores.length > 1 ? (
          <fieldset className={styles.options}>
            <legend>Color: {color.nombre}</legend>
            <div>
              {prenda.colores.map((c, i) => (
                <button key={c.nombre} type="button" aria-pressed={i === colorIndex} onClick={() => elegirColor(i)}>
                  {c.nombre}
                </button>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className={styles.single}>Color: {color.nombre}</p>
        )}

        <fieldset className={styles.options}>
          <legend>Talla</legend>
          <div>
            {color.tallas.map((t) => (
              <button
                key={t.sku_id}
                type="button"
                className={styles.sizeBtn}
                aria-pressed={t.sku_id === talla.sku_id}
                data-agotada={t.stock <= 0 || undefined}
                onClick={() => {
                  setSkuId(t.sku_id);
                  setAviso(null);
                }}
                aria-label={t.stock <= 0 ? `${t.talla}, agotada` : t.talla}
              >
                {t.talla}
              </button>
            ))}
          </div>
        </fieldset>

        <div className={styles.priceRow}>
          <span className={`num ${styles.price}`}>{formatMXN(prenda.precio)}</span>
          <span className={styles.stock} data-low={(!agotado && talla.stock <= 3) || undefined} data-out={agotado || undefined}>
            {agotado ? 'Agotada' : talla.stock <= 3 ? `Quedan ${talla.stock}` : 'En existencia'}
          </span>
        </div>

        {!agotado ? (
          <button type="button" className={`btn btn-primary ${styles.add}`} onClick={agregar}>
            Agregar al carrito
          </button>
        ) : avisoActivo ? (
          <p className={styles.alertOn}>
            <BellRing size={16} aria-hidden /> Te avisaremos cuando vuelva la talla {talla.talla}.
          </p>
        ) : (
          <button type="button" className={`btn btn-outline ${styles.add}`} onClick={pedirAvisoTalla} disabled={isPending}>
            <BellRing size={16} aria-hidden /> Avisarme cuando vuelva
          </button>
        )}
        {aviso && <p className={styles.single}>{aviso}</p>}
      </div>
    </article>
  );
}
