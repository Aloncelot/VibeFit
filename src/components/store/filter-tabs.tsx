import Link from 'next/link';
import { hrefWith, type Params } from './url';
import styles from './catalog.module.css';

interface Props {
  label: string;
  param: string;
  options: { value: string | undefined; label: string }[];
  basePath: string;
  params: Params;
}

export default function FilterTabs({ label, param, options, basePath, params }: Props) {
  return (
    <div className={styles.filterGroup}>
      <span className={styles.filterLabel}>{label}</span>
      <ul className={styles.tabs}>
        {options.map((opt) => (
          <li key={opt.label}>
            <Link
              href={hrefWith(basePath, params, { [param]: opt.value })}
              aria-current={params[param] === opt.value ? 'true' : undefined}
              scroll={false}
            >
              {opt.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
