// Dataset registry shared by the worker and `useDataset()`. A new dataset adds an id, its data type, and a loader.
import type { SourceResult } from '../sources/fetchJson.ts';
import { loadGazaDemographics, type GazaDemographicsData } from './gazaDemographics.ts';

export interface DatasetData {
  'gaza-demographics': GazaDemographicsData;
}

export type DatasetId = keyof DatasetData;

export const loaders: { [K in DatasetId]: () => Promise<SourceResult<DatasetData[K]>> } = {
  'gaza-demographics': () => loadGazaDemographics(),
};

/** Main thread → worker. */
export interface DatasetRequest {
  dataset: DatasetId;
}

/** Worker → main thread. Plain data only (structured-clone safe). */
export interface DatasetResponse<K extends DatasetId = DatasetId> {
  dataset: K;
  result: SourceResult<DatasetData[K]>;
}
