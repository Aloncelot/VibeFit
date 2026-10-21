import Link from 'next/link';
import { BarChart3, BellRing, Boxes, MessageSquareText, PackagePlus, Shirt, ScanLine, Star, Tags } from 'lucide-react';
import { refrescarTienda } from './actions';
import styles from './admin.module.css';

const GRUPOS = [
  {
    titulo: 'Suplementos',
    items: [
      { href: '/admin/inventario', icon: Boxes, titulo: 'Inventario', texto: 'Stock, entradas de mercancía y precios por SKU.' },
      { href: '/admin/inventario/nuevo', icon: Tags, titulo: 'Alta de SKU', texto: 'Registra un producto, sabor o presentación nueva.' },
      { href: '/admin/analisis', icon: BarChart3, titulo: 'Análisis ABC', texto: 'Inversión por producto y tendencia de entradas.' },
    ],
  },
  {
    titulo: 'Ropa y accesorios',
    items: [
      { href: '/admin/inventario/ropa', icon: Shirt, titulo: 'Inventario de ropa', texto: 'Stock por modelo, color y talla. Ventas con escáner.' },
      { href: '/admin/inventario/ropa/nuevo', icon: PackagePlus, titulo: 'Alta de colección', texto: 'Registra un drop con colores, tallas y fotos.' },
      { href: '/admin/inventario/escaner', icon: ScanLine, titulo: 'Escáner', texto: 'Lee códigos de barras y etiquetas YoungLA.' },
    ],
  },
  {
    titulo: 'Clientes',
    items: [
      {
        href: '/admin/demanda',
        icon: BellRing,
        titulo: 'Planeación de demanda',
        texto: 'Avisos de existencia, ventas perdidas, favoritos y reposición sugerida por SKU.',
      },
      {
        href: '/admin/solicitudes',
        icon: MessageSquareText,
        titulo: 'Solicitudes de producto',
        texto: 'Productos que los clientes piden y no encuentran en la tienda.',
      },
      { href: '/admin/resenas', icon: Star, titulo: 'Reseñas', texto: 'Modera las reseñas que aparecen en la tienda.' },
    ],
  },
];

export default async function AdminHubPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actualizada = (await searchParams).tienda === 'actualizada';

  return (
    <main className={styles.hub}>
      <div className={styles.pageHead}>
        <h1>Panel de control</h1>
        <form action={refrescarTienda}>
          <button type="submit" className="btn btn-outline" title="La tienda guarda el catálogo hasta 1 minuto. Úsalo si editaste la base de datos directamente.">
            Actualizar tienda ahora
          </button>
        </form>
      </div>
      {actualizada && (
        <p role="status" className={styles.lead}>
          Listo: la tienda ya muestra el stock y los precios actuales.
        </p>
      )}
      {GRUPOS.map((grupo) => (
        <section key={grupo.titulo} className={styles.group}>
          <h2>{grupo.titulo}</h2>
          <ul className={styles.cards}>
            {grupo.items.map(({ href, icon: Icon, titulo, texto }) => (
              <li key={href}>
                <Link href={href} className={styles.card}>
                  <Icon size={32} color="var(--accent)" aria-hidden />
                  <div>
                    <h3>{titulo}</h3>
                    <p>{texto}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
