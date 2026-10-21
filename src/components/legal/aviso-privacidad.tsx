'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import styles from './aviso-privacidad.module.css';

const KEY = 'vibefit-aviso-privacidad-v1';
const EVENTO = 'vibefit-aviso-privacidad';
let aceptadoEnMemoria = false; // por si el navegador bloquea localStorage

function aceptado(): boolean {
  if (aceptadoEnMemoria) return true;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function suscribir(callback: () => void) {
  window.addEventListener(EVENTO, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENTO, callback);
    window.removeEventListener('storage', callback);
  };
}

function aceptar() {
  aceptadoEnMemoria = true;
  try {
    window.localStorage.setItem(KEY, '1');
  } catch {
    // sin almacenamiento: se oculta solo durante esta visita
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Aviso al entrar a la tienda: se cierra con "Aceptar" o con la X y no vuelve a salir en este navegador. */
export default function AvisoPrivacidad() {
  // En el servidor se asume aceptado para no mostrar el aviso a medias antes de hidratar.
  const visto = useSyncExternalStore(suscribir, aceptado, () => true);
  if (visto) return null;

  return (
    <section className={styles.aviso} role="region" aria-labelledby="aviso-privacidad-titulo">
      <button type="button" className={styles.close} onClick={aceptar} aria-label="Cerrar aviso de privacidad">
        <X size={20} aria-hidden />
      </button>
      <p id="aviso-privacidad-titulo" className={styles.title}>
        Antes de continuar, lee nuestro Aviso de privacidad
      </p>
      <p className={styles.text}>
        Explica qué datos pedimos, para qué los usamos y tus derechos sobre ellos. No vendemos ni compartimos tu información y
        solo usamos cookies esenciales para tu sesión y tu carrito.
      </p>
      <div className={styles.actions}>
        <button type="button" className="btn btn-primary" onClick={aceptar}>
          Aceptar
        </button>
        <Link href="/privacidad" className={styles.link}>
          Leer el Aviso de privacidad
        </Link>
      </div>
    </section>
  );
}
