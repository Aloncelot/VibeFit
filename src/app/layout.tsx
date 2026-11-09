import type { Metadata, Viewport } from 'next';
import { Archivo, Barlow } from 'next/font/google';
import './globals.css';

// Archivo con eje de ancho: los titulares se usan extendidos (125%) para dar peso y estabilidad.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

// Barlow: sans industrial tipo DIN, como la señalética de un gimnasio.
const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'VIBEFIT | Suplementos originales y recetas fit',
    template: '%s | VIBEFIT',
  },
  description:
    'Proteína, creatina, pre-entrenos y aminoácidos originales con existencia real, y recetas altas en proteína.',
};

export const viewport: Viewport = {
  themeColor: '#061826',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${archivo.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
