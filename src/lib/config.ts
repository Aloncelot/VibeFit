/**
 * Pagos en línea. Mientras sea false, el carrito muestra "Próximamente" y el
 * servidor rechaza cualquier pedido aunque alguien intente llamarlo directo.
 * Para activarlos (cuando haya pasarela de pago): NEXT_PUBLIC_PAGOS_ACTIVOS=true
 */
export const PAGOS_ACTIVOS = process.env.NEXT_PUBLIC_PAGOS_ACTIVOS === 'true';

export const WHATSAPP_URL = 'https://wa.me/525581728799';
