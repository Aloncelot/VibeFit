"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Función para agregar al carrito
  const addToCart = (product) => {
    setCartItems((prev) => [...prev, product]);
    setIsCartOpen(true); // Abre el carrito automáticamente al agregar
  };

  // Función para eliminar del carrito por ID o índice
  const removeFromCart = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // Función para actualizar cantidad
  const updateQuantity = (index, newQuantity) => {
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], cantidad: newQuantity };
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);