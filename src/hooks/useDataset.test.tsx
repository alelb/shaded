import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import type { GazaDemographicsData } from '../data/worker/gazaDemographics.ts';
import type { DatasetResponse } from '../data/worker/datasets.ts';
import { useDataset } from './useDataset.ts';

const DATA: GazaDemographicsData = {
  demographics: { total: 3, bySex: [], byAgeBracket: [] },
  summary: null,
};

class FakeWorker extends EventTarget {
  posted: unknown[] = [];
  terminated = false;

  postMessage(message: unknown) {
    this.posted.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  reply(response: DatasetResponse) {
    this.dispatchEvent(new MessageEvent('message', { data: response }));
  }
}

function setup(options: { strict?: boolean } = {}) {
  const workers: FakeWorker[] = [];
  const createWorker = () => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker as unknown as Worker;
  };
  const hook = renderHook(() => useDataset('gaza-demographics', { createWorker }), {
    wrapper: options.strict ? StrictMode : undefined,
  });
  const latest = () => {
    const worker = workers.at(-1);
    if (!worker) throw new Error('no worker created');
    return worker;
  };
  return { ...hook, workers, latest };
}

const success: DatasetResponse = { dataset: 'gaza-demographics', result: { ok: true, data: DATA } };

describe('useDataset', () => {
  it('starts loading, posts the request, then succeeds and terminates the worker', () => {
    const { result, latest } = setup();
    expect(result.current).toMatchObject({ status: 'loading', data: null, error: null });
    expect(latest().posted).toEqual([{ dataset: 'gaza-demographics' }]);

    act(() => latest().reply(success));
    expect(result.current).toMatchObject({ status: 'success', data: DATA, error: null });
    expect(latest().terminated).toBe(true);
  });

  it('maps a source error to its kind and message', () => {
    const { result, latest } = setup();
    act(() =>
      latest().reply({
        dataset: 'gaza-demographics',
        result: { ok: false, error: { kind: 'http', status: 503, url: 'u', message: 'HTTP 503' } },
      }),
    );
    expect(result.current.status).toBe('error');
    expect(result.current.error).toEqual({ kind: 'http', message: 'HTTP 503' });
  });

  it('maps a worker error event to kind "worker"', () => {
    const { result, latest } = setup();
    act(() => {
      latest().dispatchEvent(new ErrorEvent('error', { message: 'boom' }));
    });
    expect(result.current.error).toEqual({ kind: 'worker', message: 'boom' });
    expect(latest().terminated).toBe(true);
  });

  it('maps a messageerror event to kind "worker"', () => {
    const { result, latest } = setup();
    act(() => {
      latest().dispatchEvent(new MessageEvent('messageerror'));
    });
    expect(result.current.error?.kind).toBe('worker');
  });

  it('retry() starts a new worker and returns to loading', () => {
    const { result, workers, latest } = setup();
    act(() => latest().dispatchEvent(new ErrorEvent('error', { message: 'boom' })));
    expect(result.current.status).toBe('error');

    act(() => result.current.retry());
    expect(workers).toHaveLength(2);
    expect(result.current.status).toBe('loading');
    expect(latest().posted).toEqual([{ dataset: 'gaza-demographics' }]);

    act(() => latest().reply(success));
    expect(result.current.status).toBe('success');
  });

  it('retry() while loading terminates the running worker', () => {
    const { result, workers } = setup();
    act(() => result.current.retry());
    expect(workers[0]?.terminated).toBe(true);
    expect(workers[1]?.terminated).toBe(false);
  });

  it('terminates the worker on unmount', () => {
    const { unmount, latest } = setup();
    unmount();
    expect(latest().terminated).toBe(true);
  });

  it('ignores a stale message after retry', () => {
    const { result, workers } = setup();
    act(() => result.current.retry());
    act(() => workers[0]?.reply(success));
    expect(result.current.status).toBe('loading');
  });

  it('ignores a message for another dataset', () => {
    const { result, latest } = setup();
    act(() => latest().reply({ ...success, dataset: 'other' as DatasetResponse['dataset'] }));
    expect(result.current.status).toBe('loading');
  });

  it('works under StrictMode: only the surviving worker settles the result', () => {
    const { result, workers, latest } = setup({ strict: true });
    expect(workers).toHaveLength(2);
    expect(workers[0]?.terminated).toBe(true);

    act(() => workers[0]?.reply(success));
    expect(result.current.status).toBe('loading');

    act(() => latest().reply(success));
    expect(result.current).toMatchObject({ status: 'success', data: DATA });
  });
});
