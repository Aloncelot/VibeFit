import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container" style={{ minHeight: '70dvh', display: 'grid', alignContent: 'center', gap: '1rem' }}>
      <h1>Página no encontrada</h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: '48ch' }}>La dirección no existe o el producto ya no está en el catálogo.</p>
      <p>
        <Link href="/" className="btn btn-primary">
          Ir a la tienda
        </Link>
      </p>
    </main>
  );
}
