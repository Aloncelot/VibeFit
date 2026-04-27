// app/suplementos/SuplementosClient.tsx
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ShoppingCart, Search } from 'lucide-react';
import styles from './Suplementos.module.scss';

// 1. Tipado estricto para evitar errores en Antigravity
export interface MarcaSuplemento {
  id: number;
  nombre: string;
  logo_url: string;
}

export interface ProductoSuplemento {
  id: number;
  nombre: string;
  marca: string;
  sabor: string;
  tamano: string;
  precio_venta: number;
  imagen_variante_url: string;
  stock: number;
}

export interface GroupedProduct {
  nombre: string;
  tamano: string;
  marca: string;
  precio: number;
  variantes: ProductoSuplemento[];
}

export default function SuplementosClient({
  initialProducts,
  marcasData
}: {
  initialProducts: ProductoSuplemento[];
  marcasData: MarcaSuplemento[];
}) {
  const [view, setView] = useState<'BRANDS' | 'CATALOG'>('BRANDS');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // 1. Lógica de Agrupamiento (Nombre + Tamaño)
  // Filtramos por marca seleccionada y por búsqueda en tiempo real
  const groupedProducts = useMemo(() => {
    let filtrados = initialProducts;

    if (selectedBrand) {
      filtrados = filtrados.filter((p: ProductoSuplemento) => p.marca === selectedBrand);
    }

    if (busqueda) {
      filtrados = filtrados.filter((p: ProductoSuplemento) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.marca.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    const groups: Record<string, { nombre: string; tamano: string; marca: string; precio: number; variantes: ProductoSuplemento[] }> = {};
    filtrados.forEach((p: ProductoSuplemento) => {
      const key = `${p.nombre}-${p.tamano}`;
      if (!groups[key]) {
        groups[key] = {
          nombre: p.nombre.toUpperCase(),
          tamano: p.tamano.toUpperCase(),
          marca: p.marca.toUpperCase(),
          precio: p.precio_venta,
          variantes: []
        };
      }
      groups[key].variantes.push(p);
    });

    return Object.values(groups);
  }, [selectedBrand, initialProducts, busqueda]);

  // Animaciones para las transiciones de vista
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {view === 'BRANDS' ? (
          /* --- VISTA: SELECCIÓN DE MARCAS --- */
          <motion.div
            key="brands"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={styles.brandsWrapper}
          >
            <h1 className={styles.mainTitle}>SELECCIONA UNA MARCA</h1>
            <div className={styles.gridMarcas}>
              {marcasData.map((marca: MarcaSuplemento) => (
                <div
                  key={marca.nombre}
                  className={styles.marcaCard}
                  onClick={() => {
                    setSelectedBrand(marca.nombre);
                    setView('CATALOG');
                  }}
                >
                  <div className={styles.logoWrapper}>
                    <Image
                      src={marca.logo_url}
                      alt={marca.nombre}
                      fill
                      className={styles.brandLogo}
                    />
                  </div>
                  <span>{marca.nombre.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* --- VISTA: CATÁLOGO DE PRODUCTOS --- */
          <motion.div
            key="catalog"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className={styles.catalogHeader}>
              <button className={styles.backBtn} onClick={() => { setView('BRANDS'); setBusqueda(''); }}>
                <ChevronLeft size={20} /> REGRESAR A MARCAS
              </button>

              <div className={styles.headerInfo}>
                <h2 className={styles.brandTitle}>{selectedBrand?.toUpperCase()}</h2>
                <div className={styles.searchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="BUSCAR EN ESTA MARCA..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.productGrid}>
              {groupedProducts.map((group: GroupedProduct) => (
                <GroupedProductCard key={`${group.nombre}-${group.tamano}`} product={group} />
              ))}
            </div>

            {groupedProducts.length === 0 && (
              <div className={styles.noResults}>
                NO SE ENCONTRARON PRODUCTOS QUE COINCIDAN CON TU BÚSQUEDA.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --- COMPONENTE INTERNO: TARJETA CON CARGA DINÁMICA --- */
function GroupedProductCard({ product }: { product: GroupedProduct }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variantes[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={styles.groupedCard}>
      <div className={styles.imageBox}>
        {/* Loader Cyber-Scanner de Alto Contraste */}
        {!isLoaded && (
          <div className={styles.loaderContainer}>
            <div className={styles.scanline}></div>
            <span className={styles.loaderText}>CARGANDO...</span>
          </div>
        )}

        <Image
          src={selectedVariant.imagen_variante_url}
          alt={product.nombre}
          fill
          className={`${styles.prodImg} ${isLoaded ? styles.imgVisible : styles.imgHidden}`}
          onLoad={() => setIsLoaded(true)}
        />
      </div>

      <div className={styles.info}>
        <div className={styles.titleArea}>
          <h3>{product.nombre}</h3>
          <span className={styles.sizeTag}>{product.tamano}</span>
        </div>

        <div className={styles.flavorSelect}>
          <label>SABOR SELECCIONADO:</label>
          <select
            value={selectedVariant.id}
            onChange={(e) => {
              setIsLoaded(false); // Reinicia el scanner para la nueva imagen
              const variant = product.variantes.find((v: { id: number }) => v.id === parseInt(e.target.value));
              if (variant) {
                setSelectedVariant(variant);
              }
            }}
          >
            {product.variantes.map((v: { id: number, sabor: string }) => (
              <option key={v.id} value={v.id}>{v.sabor.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* UN SOLO PRICEROW DINÁMICO */}
        <div className={styles.priceRow}>
          <span className={styles.price}>${product.precio.toLocaleString('es-MX')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span className={styles.stock}>DISPONIBLES: {selectedVariant.stock}</span>
            {selectedVariant.stock <= 3 && (
              <span className={styles.lowStockBadge}>
                ¡SOLO QUEDAN {selectedVariant.stock}!
              </span>
            )}
          </div>
        </div>

        <button className={styles.addCartBtn}>
          <ShoppingCart size={18} /> AGREGAR AL CARRITO
        </button>
      </div>
    </div>
  );
}