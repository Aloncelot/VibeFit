import Image from 'next/image';
import { shouldSkipOptimization } from '@/lib/images';
import styles from './product-image.module.css';

interface Props {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  fit?: 'contain' | 'cover';
  priority?: boolean;
}

/** Imagen de producto sobre panel claro; muestra un marcador si no hay foto. */
export default function ProductImage({ src, alt, sizes, fit = 'contain', priority = false }: Props) {
  if (!src) {
    return (
      <div className={styles.placeholder} role="img" aria-label={`${alt}: sin foto`}>
        <span>VF</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={shouldSkipOptimization(src)}
      className={fit === 'cover' ? styles.cover : styles.contain}
    />
  );
}
