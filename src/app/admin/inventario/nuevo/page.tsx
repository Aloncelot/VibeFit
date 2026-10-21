import type { Metadata } from 'next';
import { getFormularioSKU } from '@/server/queries/admin';
import AgregarSKUClient from './agregar-sku-client';
import styles from '../../admin.module.css';

export const metadata: Metadata = { title: 'Alta de SKU' };

export default async function NuevoSKUPage() {
  const { marcas, productos, tamanos } = await getFormularioSKU();

  return (
    <main className={styles.page} style={{ maxWidth: 760 }}>
      <div className={styles.pageHead}>
        <h1>Alta de SKU</h1>
      </div>
      <AgregarSKUClient marcasBD={marcas} productosBD={productos} tamanosBD={tamanos} />
    </main>
  );
}
