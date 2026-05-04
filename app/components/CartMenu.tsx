// app/cart/CartMenu.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, Plus, Minus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import styles from './CartMenu.module.scss';
import { procesarCompraMock } from '@/app/cart/actions';

export interface CartItemType {
  id: number;
  nombre: string;
  marca: string;
  sabor: string;
  tamano: string;
  precio: number;
  imagen_url: string;
  cantidad: number;
  stock: number;
}

export default function CartMenu() {
  const { cartItems, isCartOpen, toggleCart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    type: 'alert' | 'confirm';
    message: string;
    onConfirm?: () => void;
  }>({ visible: false, type: 'alert', message: '' });

  // 1. Contamos el total de unidades físicas en el carrito
  const totalItems = cartItems.reduce(
    (acc: number, item: CartItemType) => acc + (item.cantidad || 1),
    0
  );

  // 2. Calculamos el subtotal de los productos
  const subtotalAmount = cartItems.reduce(
    (acc: number, item: CartItemType) => acc + item.precio * (item.cantidad || 1),
    0
  );

  // 3. Calculamos el envío: $185 por cada bloque de 5 artículos
  const shippingCost = totalItems > 0 ? Math.ceil(totalItems / 5) * 185 : 0;

  // 4. Gran Total
  const totalAmount = subtotalAmount + shippingCost;

  const handleCheckout = async () => {
    setIsProcessing(true);

    // Mapeamos el carrito al formato que espera la función de acción
    const carritoParaAccion = cartItems.map((item: CartItemType) => ({
      id: item.id,
      cantidad: item.cantidad
    }));

    const resultado = await procesarCompraMock(carritoParaAccion);

    if (resultado.success) {
      // 1. Limpiamos el carrito de la UI
      clearCart();

      // 2. Mostramos mensaje de éxito
      setDialog({
        visible: true,
        type: 'alert',
        message: "¡Compra exitosa! El inventario se ha actualizado."
      });
    } else {
      // 3. Mostramos error (ej: "Stock insuficiente")
      setDialog({
        visible: true,
        type: 'alert',
        message: resultado.error || "Error desconocido al procesar la compra."
      });
    }
    setIsProcessing(false);
  };

  const handleIncrease = (index: number, item: CartItemType) => {
    if (item.cantidad >= item.stock) {
      setDialog({
        visible: true,
        type: 'alert',
        message: `Solo hay ${item.stock} unidades disponibles, no es posible agregar más.`
      });
      return;
    }
    updateQuantity(index, item.cantidad + 1);
  };

  const handleDecrease = (index: number, item: CartItemType) => {
    if (item.cantidad === 1) {
      setDialog({
        visible: true,
        type: 'confirm',
        message: "¿Deseas eliminar este artículo del carrito?",
        onConfirm: () => removeFromCart(index)
      });
    } else {
      updateQuantity(index, item.cantidad - 1);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
          />
          <motion.div
            className={styles.cartDrawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          >
            <div className={styles.header}>
              <h2>CARRITO DE COMPRAS</h2>
              <button className={styles.closeBtn} onClick={toggleCart}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.cartBody}>
              {cartItems.length === 0 ? (
                <div className={styles.emptyCart}>
                  <ShoppingBag size={48} className={styles.emptyIcon} />
                  <p>TU CARRITO ESTÁ VACÍO</p>
                </div>
              ) : (
                <div className={styles.itemsList}>
                  {cartItems.map((item: CartItemType, index: number) => (
                    <div key={`${item.id}-${index}`} className={styles.cartItem}>
                      <div className={styles.itemImage}>
                        {item.imagen_url ? (
                          <Image src={item.imagen_url} alt={item.nombre} fill style={{ objectFit: 'contain' }} />
                        ) : (
                          <div className={styles.noImage}>Sin img</div>
                        )}
                      </div>
                      <div className={styles.itemInfo}>
                        <h4>{item.nombre}</h4>
                        <span className={styles.itemDetails}>
                          {item.marca} | {item.sabor} | {item.tamano}
                        </span>
                        <div className={styles.priceRow}>
                          <span className={styles.price}>
                            ${Number(item.precio).toLocaleString('es-MX')}
                          </span>
                          <div className={styles.qtyControls}>
                            <button onClick={() => handleDecrease(index, item)}>
                              <Minus size={14} />
                            </button>
                            <span>{item.cantidad || 1}</span>
                            <button onClick={() => handleIncrease(index, item)}>
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeFromCart(index)}
                        title="Eliminar"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className={styles.cartFooter}>

                {/* NUEVO DESGLOSE */}
                <div className={styles.summaryRow}>
                  <span>SUBTOTAL ({totalItems} artículos):</span>
                  <span>${subtotalAmount.toLocaleString('es-MX')}</span>
                </div>

                <div className={styles.summaryRow}>
                  <span>ENVÍO ESTÁNDAR:</span>
                  <span>${shippingCost.toLocaleString('es-MX')}</span>
                </div>

                {/* GRAN TOTAL */}
                <div className={styles.totalRow}>
                  <span>TOTAL:</span>
                  <span>${totalAmount.toLocaleString('es-MX')}</span>
                </div>

                <button
                  className={styles.checkoutBtn}
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  style={{ opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? 'wait' : 'pointer' }}
                >
                  {isProcessing ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <Loader2 className={styles.spinner} size={20} /> PROCESANDO...
                    </span>
                  ) : (
                    'PROCEDER AL PAGO (SIMULAR)'
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* CUSTOM DIALOG */}
          <AnimatePresence>
            {dialog.visible && (
              <div className={styles.dialogOverlay}>
                <motion.div
                  className={styles.dialogBox}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <p>{dialog.message}</p>
                  <div className={styles.dialogActions}>
                    {dialog.type === 'confirm' && (
                      <button
                        className={styles.cancelBtn}
                        onClick={() => setDialog({ ...dialog, visible: false })}
                      >
                        CANCELAR
                      </button>
                    )}
                    <button
                      className={styles.confirmBtn}
                      onClick={() => {
                        if (dialog.onConfirm) dialog.onConfirm();
                        setDialog({ ...dialog, visible: false });
                      }}
                    >
                      ACEPTAR
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}