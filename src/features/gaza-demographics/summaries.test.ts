import { describe, expect, it } from 'vitest';
import {
  AGE_BRACKETS,
  SEX_BUCKETS,
  type DemographicsSummary,
} from '../../data/aggregators/demographics.ts';
import { ageSummary, sexSummary, shownBuckets } from './summaries.ts';

/** Live breakdown on 2026-10-09 (Phase 4–7 live check). */
const LIVE: DemographicsSummary = {
  total: 72_835,
  bySex: [
    { key: 'male', label: 'Male', count: 50_959 },
    { key: 'female', label: 'Female', count: 21_876 },
    { key: 'unknown', label: 'Unknown / Not specified', count: 0 },
  ],
  byAgeBracket: [
    { key: '0-17', label: '0–17', count: 21_637 },
    { key: '18-29', label: '18–29', count: 19_360 },
    { key: '30-59', label: '30–59', count: 26_664 },
    { key: '60+', label: '60+', count: 5_174 },
    { key: 'unknown', label: 'Unknown', count: 0 },
  ],
};

function withUnknown(count: number): DemographicsSummary {
  const setUnknown = <K extends string>(b: { key: K; label: string; count: number }) =>
    b.key === 'unknown' ? { ...b, count } : b;
  return {
    total: LIVE.total + count,
    bySex: LIVE.bySex.map(setUnknown),
    byAgeBracket: LIVE.byAgeBracket.map(setUnknown),
  };
}

describe('sexSummary', () => {
  it('describes the live breakdown', () => {
    expect(sexSummary(LIVE)).toBe(
      'Of 72,835 people identified by name, 50,959 (70.0%) are male and 21,876 (30.0%) are female. ' +
        'Sex is not recorded for 0 people (0.0%).',
    );
  });

  it.each([
    [0, 'Sex is not recorded for 0 people (0.0%).'],
    [1, 'Sex is not recorded for 1 person (<0.1%).'],
    [2, 'Sex is not recorded for 2 people (<0.1%).'],
  ])('always states the Unknown count (%i)', (count, sentence) => {
    expect(sexSummary(withUnknown(count))).toContain(sentence);
  });

  it('names every sex bucket from the definitions', () => {
    const summary = sexSummary(LIVE);
    for (const { key, label } of SEX_BUCKETS) {
      if (key !== 'unknown') expect(summary).toContain(label.toLowerCase());
    }
  });
});

describe('ageSummary', () => {
  it('describes the live breakdown, leading with children', () => {
    expect(ageSummary(LIVE)).toBe(
      'Of 72,835 people identified by name, 21,637 (29.7%) were children aged 0–17. ' +
        '19,360 (26.6%) were aged 18–29, 26,664 (36.6%) were aged 30–59, and 5,174 (7.1%) were aged 60+. ' +
        'Age is not recorded for 0 people (0.0%).',
    );
  });

  it.each([
    [0, 'Age is not recorded for 0 people (0.0%).'],
    [1, 'Age is not recorded for 1 person (<0.1%).'],
    [2, 'Age is not recorded for 2 people (<0.1%).'],
  ])('always states the Unknown count (%i)', (count, sentence) => {
    expect(ageSummary(withUnknown(count))).toContain(sentence);
  });

  it('puts the children sentence first', () => {
    const summary = ageSummary(LIVE);
    expect(summary).toMatch(
      /^Of 72,835 people identified by name, 21,637 \(29\.7%\) were children aged 0–17\. /,
    );
    expect(summary.indexOf('children')).toBeLessThan(summary.indexOf('18–29'));
  });

  it('names every age bracket from the definitions', () => {
    const summary = ageSummary(LIVE);
    for (const { key, label } of AGE_BRACKETS) {
      if (key !== 'unknown') expect(summary).toContain(label);
    }
    expect(summary).toContain('Age is not recorded');
  });
});

describe('shownBuckets', () => {
  it('leaves out an empty Unknown bucket and keeps the order', () => {
    expect(shownBuckets(LIVE.bySex).map((b) => b.key)).toEqual(['male', 'female']);
    expect(shownBuckets(LIVE.byAgeBracket).map((b) => b.key)).toEqual([
      '0-17',
      '18-29',
      '30-59',
      '60+',
    ]);
  });

  it('keeps a non-empty Unknown bucket and empty known buckets', () => {
    const buckets = [
      { key: 'male', label: 'Male', count: 0 },
      { key: 'unknown', label: 'Unknown / Not specified', count: 1 },
    ];
    expect(shownBuckets(buckets)).toEqual(buckets);
  });
});
