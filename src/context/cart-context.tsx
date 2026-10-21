'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { CartItem, SkuResumen } from '@/types/catalogo';
import type { ClienteSesion } from '@/server/auth/token';
import { shippingFor } from '@/lib/format';
import {
  alternarFavorito,
  cancelarAlertaRestock,
  consultarDisponibilidad,
  guardarCarrito,
  moverALista,
  sincronizarCarrito,
  solicitarAlertaRestock,
} from '@/server/actions/listas';

const STORAGE_KEY = 'vibefit-carrito-v1';

type Action =
  | { type: 'add'; item: CartItem }
  | { type: 'setQty'; id: number; cantidad: number }
  | { type: 'remove'; id: number }
  | { type: 'clear' }
  | { type: 'replace'; items: CartItem[] }
  | { type: 'refresh'; ids: number[]; skus: SkuResumen[] };

function reducer(items: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case 'add': {
      if (action.item.stock <= 0) return items;
      // El mismo SKU suma cantidad en lugar de duplicar la línea.
      const existing = items.find((i) => i.id === action.item.id);
      if (!existing) return [...items, { ...action.item, cantidad: Math.min(action.item.cantidad, action.item.stock) }];
      return items.map((i) =>
        i.id === action.item.id
          ? { ...i, stock: action.item.stock, cantidad: Math.min(i.cantidad + action.item.cantidad, action.item.stock) }
          : i,
      );
    }
    case 'setQty':
      return items.map((i) => (i.id === action.id ? { ...i, cantidad: Math.max(1, Math.min(action.cantidad, i.stock, 20)) } : i));
    case 'remove':
      return items.filter((i) => i.id !== action.id);
    case 'clear':
      return [];
    case 'replace':
      return action.items;
    case 'refresh': {
      // Actualiza precio y stock reales de los SKUs consultados; uno que ya no existe queda como agotado.
      const porId = new Map(action.skus.map((s) => [s.id, s]));
      return items.map((i) => {
        if (!action.ids.includes(i.id)) return i;
        const fresh = porId.get(i.id);
        return fresh ? { ...i, ...fresh, cantidad: i.cantidad } : { ...i, stock: 0 };
      });
    }
  }
}

/** Cantidad que realmente se puede comprar de una línea. */
export const cantidadDisponible = (item: CartItem) => Math.min(item.cantidad, item.stock);

interface CartContextValue {
  cliente: ClienteSesion | null;
  items: CartItem[];
  disponibles: CartItem[];
  totalItems: number;
  subtotal: number;
  shipping: number;
  isOpen: boolean;
  favoritos: Set<number>;
  alertas: Set<number>;
  guardados: SkuResumen[];
  open: () => void;
  close: () => void;
  addItem: (item: CartItem) => void;
  setQuantity: (id: number, cantidad: number) => void;
  removeItem: (id: number) => void;
  clear: () => void;
  /** Al cerrar sesión: vacía carrito y listas de este navegador. */
  olvidarCliente: () => void;
  refrescarDisponibilidad: () => Promise<void>;
  toggleFavorito: (skuId: number) => Promise<string | null>;
  guardarParaDespues: (item: SkuResumen) => Promise<string | null>;
  moverAlCarrito: (sku: SkuResumen) => Promise<string | null>;
  pedirAviso: (skuId: number) => Promise<string | null>;
  cancelarAviso: (skuId: number) => Promise<string | null>;
  irAEntrar: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, cliente }: { children: ReactNode; cliente: ClienteSesion | null }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [isOpen, setIsOpen] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<number>>(() => new Set());
  const [alertas, setAlertas] = useState<Set<number>>(() => new Set());
  const [guardados, setGuardados] = useState<SkuResumen[]>([]);
  // Id del cliente cuyo carrito ya se sincronizó (evita guardar antes de cargar el de la cuenta).
  const [sincronizadoPara, setSincronizadoPara] = useState<number | null>(null);
  const hydrated = useRef(false);
  const itemsRef = useRef(items);
  const clienteId = cliente?.id ?? null;
  const sincronizado = clienteId !== null && sincronizadoPara === clienteId;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // 1) El carrito del navegador sobrevive recargas.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: 'replace', items: JSON.parse(saved) as CartItem[] });
    } catch {
      // almacenamiento no disponible: el carrito funciona en memoria
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignorar
    }
  }, [items]);

  // 2) Al entrar a la cuenta se une el carrito de este navegador con el guardado en la cuenta.
  useEffect(() => {
    if (clienteId === null) return;
    let cancelado = false;

    // Espera un tick para que el carrito local ya esté cargado desde localStorage.
    const t = window.setTimeout(async () => {
      const locales = itemsRef.current.map((i) => ({ id: i.id, cantidad: Math.min(i.cantidad, 20) }));
      const res = await sincronizarCarrito(locales);
      if (cancelado || !res.success) return;
      dispatch({ type: 'replace', items: res.listas.carrito });
      setFavoritos(new Set(res.listas.favoritos));
      setAlertas(new Set(res.listas.alertas));
      setGuardados(res.listas.guardados);
      setSincronizadoPara(clienteId);
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(t);
    };
  }, [clienteId]);

  // 3) Con sesión, cada cambio del carrito se guarda en la cuenta (con retraso para agrupar clics).
  useEffect(() => {
    if (!clienteId || !sincronizado) return;
    const t = window.setTimeout(() => {
      void guardarCarrito(items.map((i) => ({ id: i.id, cantidad: Math.min(i.cantidad, 20) })));
    }, 800);
    return () => window.clearTimeout(t);
  }, [items, clienteId, sincronizado]);

  const irAEntrar = useCallback(() => {
    setIsOpen(false);
    router.push(`/entrar?desde=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  const refrescarDisponibilidad = useCallback(async () => {
    const ids = itemsRef.current.map((i) => i.id);
    if (ids.length === 0) return;
    const res = await consultarDisponibilidad(ids);
    if (res.success) dispatch({ type: 'refresh', ids, skus: res.skus });
  }, []);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: 'add', item });
    setIsOpen(true);
    // El catálogo puede tener hasta un minuto de antigüedad: se confirma el stock real al agregar.
    void consultarDisponibilidad([item.id]).then((res) => {
      if (res.success) dispatch({ type: 'refresh', ids: [item.id], skus: res.skus });
    });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const disponibles = items.filter((i) => i.stock > 0);
    const totalItems = disponibles.reduce((acc, i) => acc + cantidadDisponible(i), 0);

    // Las acciones de cuenta devuelven un mensaje de error o null si todo salió bien.
    const conSesion = async (fn: () => Promise<string | null>) => {
      if (!clienteId) {
        irAEntrar();
        return null;
      }
      return fn();
    };

    return {
      cliente,
      items,
      disponibles,
      totalItems,
      subtotal: disponibles.reduce((acc, i) => acc + i.precio * cantidadDisponible(i), 0),
      shipping: shippingFor(totalItems),
      isOpen,
      favoritos,
      alertas,
      guardados,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      addItem,
      setQuantity: (id, cantidad) => dispatch({ type: 'setQty', id, cantidad }),
      removeItem: (id) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'clear' }),
      olvidarCliente: () => {
        dispatch({ type: 'clear' });
        setFavoritos(new Set());
        setAlertas(new Set());
        setGuardados([]);
        setSincronizadoPara(null);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignorar
        }
      },
      refrescarDisponibilidad,
      irAEntrar,
      toggleFavorito: (skuId) =>
        conSesion(async () => {
          const res = await alternarFavorito(skuId);
          if (!res.success) return res.error;
          setFavoritos((prev) => {
            const next = new Set(prev);
            if (res.favorito) next.add(skuId);
            else next.delete(skuId);
            return next;
          });
          return null;
        }),
      guardarParaDespues: (item) =>
        conSesion(async () => {
          const res = await moverALista(item.id, 'GUARDADO');
          if (!res.success) return res.error;
          dispatch({ type: 'remove', id: item.id });
          setGuardados((prev) => [item, ...prev.filter((g) => g.id !== item.id)]);
          return null;
        }),
      moverAlCarrito: (sku) =>
        conSesion(async () => {
          if (sku.stock <= 0) return 'Este producto está agotado.';
          const res = await moverALista(sku.id, 'CARRITO');
          if (!res.success) return res.error;
          setGuardados((prev) => prev.filter((g) => g.id !== sku.id));
          dispatch({ type: 'add', item: { ...sku, cantidad: 1 } });
          return null;
        }),
      pedirAviso: (skuId) =>
        conSesion(async () => {
          const res = await solicitarAlertaRestock(skuId);
          if (!res.success) return res.error;
          if (res.yaDisponible) {
            await refrescarDisponibilidad();
            return 'Ya hay existencia de este producto.';
          }
          setAlertas((prev) => new Set(prev).add(skuId));
          return null;
        }),
      cancelarAviso: (skuId) =>
        conSesion(async () => {
          const res = await cancelarAlertaRestock(skuId);
          if (!res.success) return res.error;
          setAlertas((prev) => {
            const next = new Set(prev);
            next.delete(skuId);
            return next;
          });
          return null;
        }),
    };
  }, [items, isOpen, favoritos, alertas, guardados, cliente, clienteId, addItem, irAEntrar, refrescarDisponibilidad]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>.');
  return ctx;
}
