import EscanerClient from './EscanerClient';

export const metadata = {
    title: 'Task-Ops Scanner | VIBEFIT',
};

export default function EscanerPage() {
    return (
        <main style={{ minHeight: '100vh', background: '#050505', paddingTop: '2rem' }}>
            <EscanerClient />
        </main>
    );
}