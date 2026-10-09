import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from './__fixtures__/summary.sample.json';
import { fetchSummary, SUMMARY_URL, toSummaryFacts, type SummaryFacts } from './summary.ts';

const EXPECTED: SummaryFacts = {
  killedInGaza: { lastUpdate: '2026-07-27', records: 72_835 },
  gazaReported: { killedTotal: 74_250, lastUpdate: '2026-10-07' },
};

const ALL_NULL: SummaryFacts = {
  killedInGaza: { lastUpdate: null, records: null },
  gazaReported: { killedTotal: null, lastUpdate: null },
};

function withKnown(known: Record<string, unknown>) {
  return { ...fixture, known_killed_in_gaza: { ...fixture.known_killed_in_gaza, ...known } };
}

describe('toSummaryFacts', () => {
  it('maps the fixture to the expected facts', () => {
    expect(toSummaryFacts(fixture)).toEqual(EXPECTED);
  });

  it.each([
    ['an empty object', {}],
    ['null objects', { gaza: null, known_killed_in_gaza: null }],
    ['array objects', { gaza: [], known_killed_in_gaza: [] }],
    ['a non-object value', 'summary'],
    ['null', null],
  ])('returns null fields for %s', (_label, value) => {
    expect(toSummaryFacts(value)).toEqual(ALL_NULL);
  });

  it('returns a null reported total when gaza.killed is missing', () => {
    const facts = toSummaryFacts({ ...fixture, gaza: { last_update: '2026-10-07' } });
    expect(facts.gazaReported).toEqual({ killedTotal: null, lastUpdate: '2026-10-07' });
  });

  it.each(['2026-7-27', '', 20260727, null, '27/07/2026'])('rejects the date %o', (date) => {
    expect(toSummaryFacts(withKnown({ last_update: date })).killedInGaza.lastUpdate).toBeNull();
  });

  it.each([-1, 1.5, '72835', NaN, Infinity, null])('rejects the count %o', (records) => {
    expect(toSummaryFacts(withKnown({ records })).killedInGaza.records).toBeNull();
  });

  it('accepts a count of 0', () => {
    expect(toSummaryFacts(withKnown({ records: 0 })).killedInGaza.records).toBe(0);
  });
});

describe('fetchSummary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the v3 endpoint and returns the facts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture))));
    await expect(fetchSummary()).resolves.toEqual({ ok: true, data: EXPECTED });
    expect(fetch).toHaveBeenCalledWith(SUMMARY_URL, expect.anything());
  });

  it.each([
    ['an array', []],
    ['a string', 'summary'],
    ['null', null],
  ])('maps %s to a shape error', async (_label, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
    await expect(fetchSummary()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'shape', url: SUMMARY_URL },
    });
  });

  it('passes http errors through', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(fetchSummary()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'http', status: 404 },
    });
  });
});
