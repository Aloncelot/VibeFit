// app/ropa/RopaClient.tsx
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingCart, Search } from 'lucide-react';
import styles from '../suplementos/Suplementos.module.scss'; // 👈 Reutilizamos tus estilos
import { useCart } from '@/context/CartContext'; // 👈 Conectamos el carrito real

export interface MarcaRopa {
    id: number;
    nombre: string;
    logo_url: string;
}

export interface TallaRopa {
    talla: string;
    stock: number;
    sku_id: number;
}

export interface ColorRopa {
    nombre: string;
    tallas: TallaRopa[];
    imagenes: string[];
}

export interface ProductoRopa {
    id: number;
    nombre: string;
    marca: string;
    genero: string;
    categoria: string;
    precio: number;
    colores: ColorRopa[];
}

export default function RopaClient({
    initialMarcas,
    initialProducts
}: {
    initialMarcas: MarcaRopa[];
    initialProducts: ProductoRopa[];
}) {
    const [view, setView] = useState<'BRANDS' | 'CATALOG'>('BRANDS');
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');

    // Filtros de Ropa
    const [genero, setGenero] = useState<'TODOS' | 'HOMBRE' | 'MUJER'>('TODOS');
    const [categoria, setCategoria] = useState<'TODOS' | 'TOPS' | 'BOTTOMS' | 'ACCESORIOS'>('TODOS');

    // Lógica de filtrado combinada (Marca + Búsqueda + Género + Categoría)
    const productosFiltrados = useMemo(() => {
        let filtrados = initialProducts;

        if (selectedBrand) {
            filtrados = filtrados.filter(p => p.marca === selectedBrand);
        }

        if (busqueda) {
            filtrados = filtrados.filter(p =>
                p.nombre.toLowerCase().includes(busqueda.toLowerCase())
            );
        }

        if (genero !== 'TODOS') {
            filtrados = filtrados.filter(p => p.genero === genero);
        }

        if (categoria !== 'TODOS') {
            filtrados = filtrados.filter(p => p.categoria === categoria);
        }

        return filtrados;
    }, [initialProducts, selectedBrand, busqueda, genero, categoria]);

    // Animaciones
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

    return (
        <div className={styles.container}>
            <AnimatePresence mode="wait">

                {/* --- VISTA 1: MARCAS --- */}
                {view === 'BRANDS' ? (
                    <motion.div key="brands" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                        <div className={styles.globalHeader}>
                            <Link href="/" className={styles.backHomeBtn}>
                                <ChevronLeft size={20} /> REGRESAR AL INICIO
                            </Link>
                        </div>
                        <h1 className={styles.mainTitle}>PREMIUM GYM WEAR</h1>

                        {/* GRILLA CON ESTILOS DE SUPLEMENTOS (Logo invertido al hover) */}
                        <div className={styles.gridMarcas}>
                            {initialMarcas.map((marca) => (
                                <div
                                    key={marca.nombre}
                                    className={styles.marcaCard}
                                    onClick={() => { setSelectedBrand(marca.nombre); setView('CATALOG'); }}
                                >
                                    <div className={styles.logoWrapper}>
                                        <Image
                                            src={marca.logo_url}
                                            alt={marca.nombre}
                                            fill
                                            className={styles.brandLogo}
                                        />
                                    </div>
                                    <span>{marca.nombre}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (

                    /* --- VISTA 2: CATÁLOGO FILTRADO --- */
                    <motion.div key="catalog" variants={pageVariants} initial="initial" animate="animate" exit="exit">

                        {/* HEADER ESTILO SUPLEMENTOS (Con barra de búsqueda) */}
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
                                        placeholder="BUSCAR PRENDA..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BARRA DE FILTROS ESPECÍFICOS DE ROPA (GÉNERO Y CATEGORÍA) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem', background: 'rgba(17, 17, 17, 0.8)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ display: 'inline-flex', background: '#000', borderRadius: '30px', padding: '0.2rem', justifyContent: 'center', margin: '0 auto', border: '1px solid #333' }}>
                                {['TODOS', 'HOMBRE', 'MUJER'].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => setGenero(g as 'TODOS' | 'HOMBRE' | 'MUJER')}
                                        style={{ position: 'relative', padding: '0.8rem 2rem', background: 'transparent', color: genero === g ? 'black' : '#888', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', zIndex: 1, transition: 'color 0.3s' }}
                                    >
                                        {genero === g && (
                                            <motion.div
                                                layoutId="pill-genero"
                                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-gold)', borderRadius: '30px', zIndex: -1 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        {g}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'center', borderTop: '1px solid #333', paddingTop: '1.5rem', width: '100%', flexWrap: 'wrap' }}>
                                {['TODOS', 'TOPS', 'BOTTOMS', 'ACCESORIOS'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoria(cat as 'TODOS' | 'TOPS' | 'BOTTOMS' | 'ACCESORIOS')}
                                        style={{ position: 'relative', padding: '0.6rem 1.5rem', background: 'transparent', color: categoria === cat ? 'black' : '#aaa', border: categoria === cat ? '1px solid transparent' : '1px solid #444', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', zIndex: 1, transition: 'color 0.3s' }}
                                    >
                                        {categoria === cat && (
                                            <motion.div
                                                layoutId="pill-categoria"
                                                style={{ position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, background: '#fff', borderRadius: '8px', zIndex: -1 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* GRID DE PRODUCTOS */}
                        <div className={styles.productGrid}>
                            {productosFiltrados.map((prod) => (
                                <RopaCard key={prod.id} product={prod} />
                            ))}
                        </div>

                        {productosFiltrados.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#888', padding: '4rem', fontFamily: 'var(--font-mohave)', fontSize: '1.2rem', letterSpacing: '1px' }}>
                                NO SE ENCONTRARON PRENDAS EN ESTA CATEGORÍA.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* --- COMPONENTE INTERNO: TARJETA DE ROPA --- */
function RopaCard({ product }: { product: ProductoRopa }) {
    const [selectedColor, setSelectedColor] = useState(product.colores[0]);
    const [selectedTalla, setSelectedTalla] = useState(selectedColor.tallas[0]);
    const [imgIndex, setImgIndex] = useState(0);
    const { addToCart } = useCart(); // 👈 Traemos el carrito

    // Carrusel Infinito
    const nextImg = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImgIndex((prev) => (prev === selectedColor.imagenes.length - 1 ? 0 : prev + 1));
    };

    const prevImg = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImgIndex((prev) => (prev === 0 ? selectedColor.imagenes.length - 1 : prev - 1));
    };

    // Función de agregar al carrito real
    const handleAddToCart = () => {
        addToCart({
            id: selectedTalla.sku_id, // El ID único de esta combinación
            nombre: product.nombre,
            marca: product.marca,
            sabor: selectedColor.nombre, // Usamos 'sabor' para guardar el Color en el carrito universal
            tamano: selectedTalla.talla, // Usamos 'tamano' para guardar la Talla
            precio: product.precio,
            imagen_url: selectedColor.imagenes[0] || '',
            cantidad: 1,
            stock: selectedTalla.stock,
        });
    };

    return (
        <div className={styles.groupedCard}>
            {/* CARRUSEL CON EFECTO CYBER-SCANNER */}
            <div className={styles.imageBox} style={{ height: '350px' }}>

                {/* Controles del Carrusel */}
                {selectedColor.imagenes.length > 1 && (
                    <>
                        <button onClick={prevImg} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 20, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer', color: 'white', backdropFilter: 'blur(4px)' }}>
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={nextImg} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 20, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer', color: 'white', backdropFilter: 'blur(4px)' }}>
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}

                {/* Usamos Next Image como en suplementos */}
                <Image
                    src={selectedColor.imagenes[imgIndex] || '/Vibefit-logo.png'}
                    alt={product.nombre}
                    fill
                    className={styles.prodImg}
                    style={{ objectFit: 'cover', padding: '0' }} // En ropa queda mejor cover sin padding
                />

                {/* Indicador de imágenes (Puntitos) */}
                <div style={{ position: 'absolute', bottom: 15, width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 20 }}>
                    {selectedColor.imagenes.map((_: string, idx: number) => (
                        <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: imgIndex === idx ? 'var(--color-gold)' : 'rgba(255,255,255,0.4)', transition: 'background 0.3s ease' }} />
                    ))}
                </div>
            </div>

            {/* INFORMACIÓN DEL PRODUCTO */}
            <div className={styles.info}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 5px 0' }}>{product.nombre}</h3>
                </div>
                <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    COLOR: <strong style={{ color: 'white' }}>{selectedColor.nombre}</strong>
                </span>

                {/* SELECTOR DE TALLAS */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedColor.tallas.map((t: TallaRopa) => (
                        <button
                            key={t.talla}
                            onClick={() => setSelectedTalla(t)}
                            disabled={t.stock === 0}
                            style={{
                                padding: '6px 14px',
                                background: selectedTalla.talla === t.talla ? 'white' : 'transparent',
                                color: selectedTalla.talla === t.talla ? 'black' : t.stock === 0 ? '#444' : '#aaa',
                                border: selectedTalla.talla === t.talla ? '1px solid white' : '1px solid #444',
                                borderRadius: '4px',
                                cursor: t.stock === 0 ? 'not-allowed' : 'pointer',
                                textDecoration: t.stock === 0 ? 'line-through' : 'none',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {t.talla}
                        </button>
                    ))}
                </div>

                {/* PRECIO Y STOCK DINÁMICO ESTILO SUPLEMENTOS */}
                <div className={styles.priceRow}>
                    <span className={styles.price}>${product.precio.toLocaleString('es-MX')}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span className={styles.stock} style={{ color: selectedTalla.stock > 0 ? '#4ade80' : '#ff4444' }}>
                            {selectedTalla.stock > 0 ? `DISPONIBLES: ${selectedTalla.stock}` : 'AGOTADO'}
                        </span>
                        {selectedTalla.stock > 0 && selectedTalla.stock <= 3 && (
                            <span className={styles.lowStockBadge}>
                                ¡SOLO QUEDAN {selectedTalla.stock}!
                            </span>
                        )}
                    </div>
                </div>

                <button
                    className={styles.addCartBtn}
                    disabled={selectedTalla.stock === 0}
                    onClick={handleAddToCart}
                >
                    <ShoppingCart size={18} /> {selectedTalla.stock > 0 ? 'AGREGAR AL CARRITO' : 'AGOTADO'}
                </button>
            </div>
        </div>
    );
}