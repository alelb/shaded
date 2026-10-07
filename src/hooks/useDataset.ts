// Hooks: the UI's only gateway to data. Components consume `useDataset()` and never call `fetch`.
// TODO(Phase 5): implement `useDataset()` on top of the dataset worker.

export type DatasetStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseDatasetResult<T> {
  status: DatasetStatus;
  data: T | null;
  error: Error | null;
  retry: () => void;
}
