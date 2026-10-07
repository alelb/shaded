import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from './__fixtures__/killed-in-gaza.sample.json';
import {
  fetchKilledInGaza,
  isKilledInGazaPayload,
  KILLED_IN_GAZA_URL,
  toDemographicRows,
  type KilledInGazaPayload,
} from './killedInGaza.ts';

const sample = fixture as unknown;

function payload(value: unknown): KilledInGazaPayload {
  if (!isKilledInGazaPayload(value)) throw new Error('test payload is not valid');
  return value;
}

function stubFetchJson(body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
}

describe('toDemographicRows', () => {
  it('parses the fixture into { age, sex } rows', () => {
    const rows = toDemographicRows(payload(sample));
    expect(rows).toHaveLength((sample as unknown[]).length - 1);
    expect(rows).toEqual([
      { age: 0, sex: 'f' },
      { age: 0, sex: 'm' },
      { age: 7, sex: 'm' },
      { age: 15, sex: 'f' },
      { age: 34, sex: 'm' },
      { age: 42, sex: 'f' },
      { age: 71, sex: 'f' },
      { age: 98, sex: 'm' },
    ]);
  });

  it('looks columns up by name: reordered header and extra column', () => {
    const rows = toDemographicRows(
      payload([
        ['sex', 'extra', 'en_name', 'age'],
        ['m', true, 'Name 1', 30],
        ['f', null, 'Name 2', 4],
      ]),
    );
    expect(rows).toEqual([
      { age: 30, sex: 'm' },
      { age: 4, sex: 'f' },
    ]);
  });

  it('keeps short rows with undefined values', () => {
    const rows = toDemographicRows(payload([['id', 'age', 'sex'], ['a', 12], []]));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ age: 12, sex: undefined });
    expect(rows[1]).toEqual({ age: undefined, sex: undefined });
  });

  it('returns [] for a header-only payload', () => {
    expect(toDemographicRows(payload([['age', 'sex']]))).toEqual([]);
  });

  it('returns rows with exactly the keys age and sex', () => {
    for (const row of toDemographicRows(payload(sample))) {
      expect(Object.keys(row).sort()).toEqual(['age', 'sex']);
    }
  });
});

describe('isKilledInGazaPayload', () => {
  it('accepts the fixture', () => {
    expect(isKilledInGazaPayload(sample)).toBe(true);
  });

  it.each([
    ['a non-array', { header: ['age', 'sex'] }],
    ['an empty array', []],
    ['a header without age', [['id', 'sex']]],
    ['a header without sex', [['id', 'age']]],
    ['a non-string header', [['age', 'sex', 3]]],
    ['a non-array header', ['age,sex']],
    ['a non-array data row', [['age', 'sex'], [1, 'm'], { age: 2, sex: 'f' }]],
  ])('rejects %s', (_label, value) => {
    expect(isKilledInGazaPayload(value)).toBe(false);
  });
});

describe('fetchKilledInGaza', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the v3 endpoint and returns demographic rows', async () => {
    stubFetchJson(sample);
    const result = await fetchKilledInGaza();
    expect(fetch).toHaveBeenCalledWith(KILLED_IN_GAZA_URL, expect.anything());
    expect(result.ok && result.data).toHaveLength(8);
  });

  it.each([
    ['a non-array', { rows: [] }, 'not an array'],
    ['an empty array', [], 'empty'],
    ['a header without age', [['id', 'sex']], '"age"'],
    ['a header without sex', [['id', 'age']], '"sex"'],
    ['a non-string header', [[1, 'age', 'sex']], 'strings'],
    ['a non-array data row', [['age', 'sex'], [1, 'm'], 'x'], 'Row 2'],
  ])('maps %s to a shape error', async (_label, body, message) => {
    stubFetchJson(body);
    const result = await fetchKilledInGaza();
    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'shape', url: KILLED_IN_GAZA_URL, message: expect.stringContaining(message) },
    });
  });

  it('passes http errors through', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(fetchKilledInGaza()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'http', status: 503 },
    });
  });

  it('passes network errors through', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchKilledInGaza()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'network' },
    });
  });

  it('passes parse errors through', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json')));
    await expect(fetchKilledInGaza()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'parse' },
    });
  });

  it('passes timeout and aborted errors through', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (_url: string, init?: RequestInit) =>
            new Promise<Response>((_resolve, reject) =>
              init?.signal?.addEventListener('abort', () =>
                reject(new DOMException('The operation was aborted.', 'AbortError')),
              ),
            ),
        ),
      );
      const timedOut = fetchKilledInGaza({ timeoutMs: 100 });
      await vi.advanceTimersByTimeAsync(100);
      await expect(timedOut).resolves.toMatchObject({ ok: false, error: { kind: 'timeout' } });

      const controller = new AbortController();
      const aborted = fetchKilledInGaza({ signal: controller.signal });
      controller.abort();
      await expect(aborted).resolves.toMatchObject({ ok: false, error: { kind: 'aborted' } });
    } finally {
      vi.useRealTimers();
    }
  });

  it('never exposes names, id, or dob', async () => {
    stubFetchJson(sample);
    const result = await fetchKilledInGaza();
    const serialized = JSON.stringify(result);
    for (const leaked of [
      'en_name',
      'ar_name',
      'Name 1',
      'SYN0000001',
      '2025-01-01',
      '"id"',
      'dob',
    ]) {
      expect(serialized).not.toContain(leaked);
    }
  });
});
