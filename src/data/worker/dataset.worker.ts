// Web Worker entry: runs a dataset loader (fetch → normalize → aggregate) off the main thread and posts back
// aggregates only. Never throws unhandled: an unexpected rejection is posted as a plain error result.
import { fail } from '../sources/fetchJson.ts';
import { loaders, type DatasetRequest, type DatasetResponse } from './datasets.ts';

self.onmessage = async (event: MessageEvent<DatasetRequest>) => {
  const { dataset } = event.data;
  let response: DatasetResponse;
  try {
    response = { dataset, result: await loaders[dataset]() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    response = { dataset, result: fail('network', '', `Loader failed: ${message}`) };
  }
  self.postMessage(response);
};
