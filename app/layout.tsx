// app/layout.tsx
import { Mohave, Black_Ops_One } from 'next/font/google';
import './globals.scss';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Configuramos Mohave para el logo
const mohave = Mohave({
  subsets: ['latin'],
  weight: ['400', '700'], // Normal y Negrita
  variable: '--font-mohave',
});

// Configuramos Black Ops One para los títulos grandes
const blackOpsOne = Black_Ops_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-black-ops',
});

export const metadata = {
  title: 'VIBEFIT Store | Premium Gear & Nutrition',
  description: 'Equipamiento y suplementación de élite.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Inyectamos las variables de las fuentes en el body
    <html lang="es" className={`${mohave.variable} ${blackOpsOne.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ flex: 1, paddingTop: '80px' }}>
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}