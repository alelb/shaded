import type { ReactNode } from 'react';
import type { DatasetStatus } from '../hooks/useDataset.ts';
import styles from './StateBoundary.module.css';

export interface StateBoundaryProps {
  status: DatasetStatus;
  /** Only read on success: shows the empty message instead of `children`. */
  isEmpty: boolean;
  onRetry: () => void;
  /** Sized like the final content, so swapping it causes no layout shift. */
  skeleton: ReactNode;
  children: ReactNode;
}

// Shared loading / error / empty / success states for a data view. Technical error details are never shown.
export function StateBoundary({
  status,
  isEmpty,
  onRetry,
  skeleton,
  children,
}: StateBoundaryProps) {
  if (status === 'loading') {
    return (
      <div aria-busy="true">
        <span className="visually-hidden">Loading data…</span>
        {skeleton}
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className={styles.message}>
        <p role="alert">We couldn&apos;t load the data. Check your connection and try again.</p>
        <button type="button" className={styles.retry} onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className={styles.message}>
        <p>No records are available in this dataset right now.</p>
      </div>
    );
  }
  return <>{children}</>;
}
