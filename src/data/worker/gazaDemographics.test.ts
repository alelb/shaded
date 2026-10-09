import { afterEach, describe, expect, it, vi } from 'vitest';
import killedInGaza from '../sources/__fixtures__/killed-in-gaza.sample.json';
import summary from '../sources/__fixtures__/summary.sample.json';
import { KILLED_IN_GAZA_URL } from '../sources/killedInGaza.ts';
import { SUMMARY_URL } from '../sources/summary.ts';
import { loadGazaDemographics } from './gazaDemographics.ts';

type Reply = unknown | { status: number };

/** Stubs `fetch` by URL: a body is served as JSON, `{ status }` as an empty HTTP error. */
function stubFetch(replies: Record<string, Reply>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const reply = replies[url];
      if (typeof reply === 'object' && reply !== null && 'status' in reply) {
        return Promise.resolve(new Response('', { status: reply.status as number }));
      }
      return Promise.resolve(new Response(JSON.stringify(reply)));
    }),
  );
}

describe('loadGazaDemographics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns aggregates and summary facts when both sources succeed', async () => {
    stubFetch({ [KILLED_IN_GAZA_URL]: killedInGaza, [SUMMARY_URL]: summary });
    const result = await loadGazaDemographics();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.demographics.total).toBe(8);
    expect(result.data.summary).toMatchObject({
      killedInGaza: { lastUpdate: '2026-07-27', records: 72_835 },
      gazaReported: { killedTotal: 74_250 },
    });
  });

  it('keeps the result ok with summary null when only the summary fails', async () => {
    stubFetch({ [KILLED_IN_GAZA_URL]: killedInGaza, [SUMMARY_URL]: { status: 500 } });
    const result = await loadGazaDemographics();
    expect(result).toMatchObject({ ok: true, data: { demographics: { total: 8 }, summary: null } });
  });

  it('fails with the Killed in Gaza error kind when that source fails', async () => {
    stubFetch({ [KILLED_IN_GAZA_URL]: { status: 503 }, [SUMMARY_URL]: summary });
    await expect(loadGazaDemographics()).resolves.toMatchObject({
      ok: false,
      error: { kind: 'http', status: 503, url: KILLED_IN_GAZA_URL },
    });
  });

  it('posts aggregates only: no names, id, or dob', async () => {
    stubFetch({ [KILLED_IN_GAZA_URL]: killedInGaza, [SUMMARY_URL]: summary });
    const serialized = JSON.stringify(await loadGazaDemographics());
    for (const leaked of ['Name 1', 'SYN0000001', '1990-01-01', 'en_name', 'dob']) {
      expect(serialized).not.toContain(leaked);
    }
  });
});
