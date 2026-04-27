'use client';
import { useRouter } from 'next/navigation';
import LandingSplit from './LandingSplit';

export default function Home() {
  const router = useRouter();

  // TypeScript nos protege: solo aceptamos estas dos opciones
  const manejarSeleccion = (departamento: 'suplementos' | 'ropa') => {
    if (departamento === 'suplementos') {
      router.push('/suplementos');
    } else if (departamento === 'ropa') {
      router.push('/ropa');
    }
  };

  return (
    <main>

      <LandingSplit onSelect={manejarSeleccion} />
    </main>
  );
}