import styles from './catalog.module.css';

interface Props {
  title: string;
  description: string;
  count: number;
  unit: [singular: string, plural: string];
}

export default function CatalogHeader({ title, description, count, unit }: Props) {
  return (
    <header className={styles.header}>
      <h1>{title}</h1>
      <div className={styles.headerMeta}>
        <p>{description}</p>
        <p className={styles.count}>
          <span className="num">{count}</span> {count === 1 ? unit[0] : unit[1]}
        </p>
      </div>
    </header>
  );
}
