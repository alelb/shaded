import { useId, type ReactNode } from 'react';
import { formatCount } from './format.ts';
import styles from './KpiCard.module.css';

export interface KpiCardProps {
  label: string;
  value: number;
  description?: ReactNode;
  footer?: ReactNode;
}

// One headline figure. The figure is named by its label, so screen readers announce the label with the value.
export function KpiCard({ label, value, description, footer }: KpiCardProps) {
  const labelId = useId();
  return (
    <figure className={styles.card} aria-labelledby={labelId}>
      <figcaption id={labelId} className={styles.label}>
        {label}
      </figcaption>
      <p className={styles.value}>{formatCount(value)}</p>
      {description !== undefined && <div className={styles.description}>{description}</div>}
      {footer !== undefined && <div className={styles.footer}>{footer}</div>}
    </figure>
  );
}

/** Placeholder with the card's container and min-height: swapping it for the card causes no layout shift. */
export function KpiCardSkeleton() {
  return (
    <div className={`${styles.card} ${styles.skeleton}`} aria-hidden="true">
      <span className={`${styles.bar} ${styles.barLabel}`} />
      <span className={`${styles.bar} ${styles.barValue}`} />
      <span className={styles.bar} />
      <span className={`${styles.bar} ${styles.barShort}`} />
    </div>
  );
}
