// Hooks: the UI's only gateway to data. Components consume `useDataset()` and never call `fetch`.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SourceErrorKind } from '../data/sources/fetchJson.ts';
import type { DatasetData, DatasetId, DatasetResponse } from '../data/worker/datasets.ts';
import DatasetWorker from '../data/worker/dataset.worker.ts?worker';

export type DatasetStatus = 'loading' | 'success' | 'error';

/** Plain object (structured-clone safe). `message` is technical detail for logs, never shown to users. */
export interface DatasetError {
  kind: SourceErrorKind | 'worker';
  message: string;
}

export interface UseDatasetResult<T> {
  status: DatasetStatus;
  data: T | null;
  error: DatasetError | null;
  retry: () => void;
}

export interface UseDatasetOptions {
  /** Injected in tests. Defaults to the Vite `?worker` build of `dataset.worker.ts`. */
  createWorker?: () => Worker;
}

type Outcome<T> = { ok: true; data: T } | { ok: false; error: DatasetError };

/** The settled outcome of one request, tagged so a stale one is never shown for a newer request. */
interface Settled<T> {
  id: DatasetId;
  attempt: number;
  outcome: Outcome<T>;
}

const defaultCreateWorker = () => new DatasetWorker();

/**
 * Loads a dataset in a fresh worker on mount. The worker is terminated once its result arrives and on unmount;
 * `retry()` starts a new one. Messages from a terminated worker are ignored.
 */
export function useDataset<K extends DatasetId>(
  id: K,
  options: UseDatasetOptions = {},
): UseDatasetResult<DatasetData[K]> {
  // The factory is read once, so an inline function does not restart the worker on every render.
  const createWorkerRef = useRef(options.createWorker ?? defaultCreateWorker);
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<DatasetData[K]> | null>(null);

  useEffect(() => {
    let active = true;
    const worker = createWorkerRef.current();
    const settle = (outcome: Outcome<DatasetData[K]>) => {
      if (!active) return;
      active = false;
      worker.terminate();
      setSettled({ id, attempt, outcome });
    };

    worker.addEventListener('message', (event: MessageEvent<DatasetResponse<K>>) => {
      if (event.data.dataset !== id) return;
      const { result } = event.data;
      settle(
        result.ok
          ? result
          : { ok: false, error: { kind: result.error.kind, message: result.error.message } },
      );
    });
    worker.addEventListener('error', (event: ErrorEvent) => {
      event.preventDefault();
      settle({ ok: false, error: { kind: 'worker', message: event.message || 'Worker error' } });
    });
    worker.addEventListener('messageerror', () => {
      settle({ ok: false, error: { kind: 'worker', message: 'Worker message could not be read' } });
    });
    worker.postMessage({ dataset: id });

    return () => {
      active = false;
      worker.terminate();
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const current = settled !== null && settled.id === id && settled.attempt === attempt;
  if (!current) return { status: 'loading', data: null, error: null, retry };
  const { outcome } = settled;
  return outcome.ok
    ? { status: 'success', data: outcome.data, error: null, retry }
    : { status: 'error', data: null, error: outcome.error, retry };
}
