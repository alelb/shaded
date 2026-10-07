import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TIMEOUT_MS, fetchJson } from './fetchJson.ts';

const URL = 'https://example.test/data.json';

/** A `fetch` stub that never settles on its own and rejects like the platform when its signal aborts. */
function hangingFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('The operation was aborted.', 'AbortError')),
        );
      }),
  );
}

describe('fetchJson', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns the parsed JSON on a 2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[["age","sex"],[1,"m"]]')));
    await expect(fetchJson(URL)).resolves.toEqual({
      ok: true,
      data: [
        ['age', 'sex'],
        [1, 'm'],
      ],
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([404, 503])('maps HTTP %i to an http error with the status', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status })));
    const result = await fetchJson(URL);
    expect(result).toMatchObject({ ok: false, error: { kind: 'http', status, url: URL } });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('maps a rejected fetch to a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const result = await fetchJson(URL);
    expect(result).toMatchObject({ ok: false, error: { kind: 'network', url: URL } });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('maps an invalid JSON body to a parse error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>')));
    const result = await fetchJson(URL);
    expect(result).toMatchObject({ ok: false, error: { kind: 'parse', url: URL } });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out after the default timeout', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    const pending = fetchJson(URL);
    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS - 1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({
      ok: false,
      error: { kind: 'timeout', timeoutMs: 60_000 },
    });
    expect(DEFAULT_TIMEOUT_MS).toBe(60_000);
  });

  it('honours a custom timeout', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    const pending = fetchJson(URL, { timeoutMs: 500 });
    await vi.advanceTimersByTimeAsync(500);
    await expect(pending).resolves.toMatchObject({
      ok: false,
      error: { kind: 'timeout', timeoutMs: 500 },
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('covers reading the body with the timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            new Promise<string>((_resolve, reject) =>
              init?.signal?.addEventListener('abort', () =>
                reject(new DOMException('The operation was aborted.', 'AbortError')),
              ),
            ),
        } as Response);
      }),
    );
    const pending = fetchJson(URL, { timeoutMs: 1_000 });
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toMatchObject({ ok: false, error: { kind: 'timeout' } });
  });

  it('returns aborted when the caller signal is already aborted', async () => {
    const fetchStub = hangingFetch();
    vi.stubGlobal('fetch', fetchStub);
    const controller = new AbortController();
    controller.abort();
    await expect(fetchJson(URL, { signal: controller.signal })).resolves.toMatchObject({
      ok: false,
      error: { kind: 'aborted' },
    });
    expect(fetchStub).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns aborted (not timeout) when the caller aborts during the request', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    const controller = new AbortController();
    const pending = fetchJson(URL, { signal: controller.signal });
    await vi.advanceTimersByTimeAsync(1_000);
    controller.abort();
    await expect(pending).resolves.toMatchObject({ ok: false, error: { kind: 'aborted' } });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns plain, structured-clone-safe results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x', { status: 500 })));
    const result = await fetchJson(URL);
    expect(structuredClone(result)).toEqual(result);
  });
});
