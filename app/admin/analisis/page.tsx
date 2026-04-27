// app/admin/analisis/AnalisisPage.tsx

import { getAnalisisABC } from './actions';
import AnalisisClient from './AnalisisClient';

export default async function AnalisisPage() {
    // Cargamos 3 meses por defecto en el primer renderizado
    const dataInicial = await getAnalisisABC(3);

    return (
        <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontFamily: 'var(--font-black-ops)', color: 'var(--color-gold)', marginBottom: '2rem' }}>
                DASHBOARD DE INVERSIÓN (ANÁLISIS ABC)
            </h1>
            <AnalisisClient dataInicial={dataInicial} />
        </main>
    );
}