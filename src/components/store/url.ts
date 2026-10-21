export type Params = Record<string, string | undefined>;

/** Construye un href conservando los filtros actuales y aplicando cambios. */
export function hrefWith(base: string, current: Params, patch: Params): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Normaliza searchParams (string | string[] | undefined) a string | undefined. */
export function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}
