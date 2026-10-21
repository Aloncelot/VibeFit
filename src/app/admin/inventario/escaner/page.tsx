import type { Metadata } from 'next';
import EscanerClient from './escaner-client';

export const metadata: Metadata = { title: 'Escáner' };

export default function EscanerPage() {
  return (
    <main style={{ paddingTop: '2rem' }}>
      <EscanerClient />
    </main>
  );
}
