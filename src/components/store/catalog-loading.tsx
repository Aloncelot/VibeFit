import styles from '@/components/store/catalog.module.css';

export default function CatalogLoading() {
  return (
    <div className="container" aria-busy="true" aria-label="Cargando catálogo">
      <div className={styles.header}>
        <div className={styles.skeleton} style={{ height: 64, width: 'min(520px, 80%)' }} />
        <div className={styles.skeleton} style={{ height: 20, width: 'min(420px, 60%)', marginTop: 16 }} />
      </div>
      <ul className={styles.grid} style={{ marginTop: 32 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className={styles.skeleton} style={{ aspectRatio: '3 / 4.4' }} />
        ))}
      </ul>
    </div>
  );
}
