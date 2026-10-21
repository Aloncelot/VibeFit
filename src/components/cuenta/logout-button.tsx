'use client';

import { useCart } from '@/context/cart-context';

/** Va dentro de un <form action={cerrarSesionCliente}>: limpia el carrito de este navegador al salir. */
export default function LogoutButton() {
  const { olvidarCliente } = useCart();
  return (
    <button type="submit" className="btn btn-outline" onClick={olvidarCliente}>
      Cerrar sesión
    </button>
  );
}
