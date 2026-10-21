const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

export function formatMXN(value: number): string {
  return currency.format(value);
}

/** Envío: $185 por cada bloque de 5 artículos. */
export function shippingFor(totalItems: number): number {
  return totalItems > 0 ? Math.ceil(totalItems / 5) * 185 : 0;
}
