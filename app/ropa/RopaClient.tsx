// app/ropa/RopaClient.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import styles from '../suplementos/Suplementos.module.scss'; // Reutilizamos tus estilos base


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

    // Filtros de Ropa
    const [genero, setGenero] = useState<'TODOS' | 'HOMBRE' | 'MUJER'>('TODOS');
    const [categoria, setCategoria] = useState<'TODOS' | 'TOPS' | 'BOTTOMS' | 'ACCESORIOS'>('TODOS');

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
                        <h1 className={styles.mainTitle}>GYM WEAR</h1>
                        <div className={styles.gridMarcas}>
                            {initialMarcas.map((marca) => (
                                <div
                                    key={marca.nombre}
                                    className={styles.marcaCard}
                                    onClick={() => { setSelectedBrand(marca.nombre); setView('CATALOG'); }}
                                    style={{ background: '#111' }} // Fondo oscuro para que resalten los logos blancos
                                >
                                    <div className={styles.logoWrapper}>
                                        <img src={marca.logo_url} alt={marca.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(1)' }} />
                                    </div>
                                    <span>{marca.nombre}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (

                    /* --- VISTA 2: CATÁLOGO FILTRADO --- */
                    <motion.div key="catalog" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                        <div className={styles.catalogHeader}>
                            <button className={styles.backBtn} onClick={() => setView('BRANDS')}>
                                <ChevronLeft size={20} /> CAMBIAR MARCA
                            </button>
                            <h2 className={styles.brandTitle}>{selectedBrand}</h2>
                        </div>

                        {/* BARRA DE FILTROS (GÉNERO Y CATEGORÍA) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem', background: '#111', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>

                            {/* Filtro de Género */}
                            <div style={{ display: 'inline-flex', background: '#222', borderRadius: '30px', padding: '0.2rem', justifyContent: 'center', margin: '0 auto' }}>
                                {['TODOS', 'HOMBRE', 'MUJER'].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => setGenero(g as 'TODOS' | 'HOMBRE' | 'MUJER')}
                                        style={{ position: 'relative', padding: '0.8rem 2rem', background: 'transparent', color: genero === g ? 'black' : 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', zIndex: 1, transition: 'color 0.3s' }}
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

                            {/* Filtro de Categoría */}
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

                        {/* GRID DE ROPA */}
                        <div className={styles.productGrid}>
                            {initialProducts.filter(p => (genero === 'TODOS' || p.genero === genero) && (categoria === 'TODOS' || p.categoria === categoria)).map((prod) => (
                                <RopaCard key={prod.id} product={prod} />
                            ))}
                        </div>

                        {initialProducts.filter(p => (genero === 'TODOS' || p.genero === genero) && (categoria === 'TODOS' || p.categoria === categoria)).length === 0 && (
                            <div style={{ textAlign: 'center', color: '#888', padding: '4rem' }}>NO HAY PRODUCTOS EN ESTA CATEGORÍA ACTUALMENTE.</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* --- COMPONENTE INTERNO: TARJETA DE ROPA CON CARRUSEL INFINITO --- */
function RopaCard({ product }: { product: ProductoRopa }) {
    const [selectedColor, setSelectedColor] = useState(product.colores[0]);
    const [selectedTalla, setSelectedTalla] = useState(selectedColor.tallas[0]);
    const [imgIndex, setImgIndex] = useState(0);

    // Lógica del Carrusel Infinito
    const nextImg = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImgIndex((prev) => (prev === selectedColor.imagenes.length - 1 ? 0 : prev + 1));
    };

    const prevImg = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImgIndex((prev) => (prev === 0 ? selectedColor.imagenes.length - 1 : prev - 1));
    };

    return (
        <div className={styles.groupedCard}>
            {/* CARRUSEL DE IMÁGENES */}
            <div style={{ position: 'relative', width: '100%', height: '350px', background: '#1a1a1a', overflow: 'hidden' }}>

                {/* Controles del Carrusel (Solo se muestran si hay más de 1 imagen) */}
                {selectedColor.imagenes.length > 1 && (
                    <>
                        <button onClick={prevImg} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer', color: 'white' }}>
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={nextImg} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer', color: 'white' }}>
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}

                <img
                    src={selectedColor.imagenes[imgIndex]}
                    alt={product.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} // 'cover' funciona mejor para ropa
                />

                {/* Indicador de imágenes (Puntitos) */}
                <div style={{ position: 'absolute', bottom: 10, width: '100%', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                    {selectedColor.imagenes.map((_: string, idx: number) => (
                        <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: imgIndex === idx ? 'var(--color-gold)' : 'rgba(255,255,255,0.3)' }} />
                    ))}
                </div>
            </div>

            {/* INFORMACIÓN DEL PRODUCTO */}
            <div className={styles.info}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>{product.nombre}</h3>
                </div>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>{selectedColor.nombre}</span>

                {/* SELECTOR DE TALLAS TIPO PASTILLA */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                    {selectedColor.tallas.map((t: TallaRopa) => (
                        <button
                            key={t.talla}
                            onClick={() => setSelectedTalla(t)}
                            disabled={t.stock === 0}
                            style={{
                                padding: '5px 12px',
                                background: selectedTalla.talla === t.talla ? 'white' : 'transparent',
                                color: selectedTalla.talla === t.talla ? 'black' : t.stock === 0 ? '#444' : '#aaa',
                                border: selectedTalla.talla === t.talla ? '1px solid white' : '1px solid #444',
                                borderRadius: '4px',
                                cursor: t.stock === 0 ? 'not-allowed' : 'pointer',
                                textDecoration: t.stock === 0 ? 'line-through' : 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            {t.talla}
                        </button>
                    ))}
                </div>

                <div className={styles.priceRow}>
                    <span className={styles.price}>${product.precio.toLocaleString('es-MX')}</span>
                    <span className={styles.stock} style={{ color: selectedTalla.stock > 0 ? '#4ade80' : '#ff4444' }}>
                        {selectedTalla.stock > 0 ? `${selectedTalla.stock} DISPONIBLES` : 'AGOTADO'}
                    </span>
                </div>

                <button
                    className={styles.addCartBtn}
                    disabled={selectedTalla.stock === 0}
                    onClick={() => alert(`Añadido: ${product.nombre} - ${selectedColor.nombre} - ${selectedTalla.talla}`)}
                >
                    <ShoppingCart size={18} /> AGREGAR AL CARRITO
                </button>
            </div>
        </div>
    );
}