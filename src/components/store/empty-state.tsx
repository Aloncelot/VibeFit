import Link from 'next/link';
import styles from './catalog.module.css';

export default function EmptyState({ title, message, href, cta }: { title: string; message: string; href: string; cta: string }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      <p>{message}</p>
      <Link href={href} className="btn btn-outline">
        {cta}
      </Link>
    </div>
  );
}
