// Plain-language summaries of the demographic breakdowns (each chart's text equivalent), and the buckets each chart
// shows.
// Pure functions: no React. Labels and order come from the buckets; the Unknown sentence is always present, even at 0.
import { formatCount, formatShare } from '../../components/format.ts';
import type { CountBucket, DemographicsSummary } from '../../data/aggregators/demographics.ts';

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/** `1` → `"1 person"`, `72835` → `"72,835 people"`. */
function people(n: number): string {
  return n === 1 ? '1 person' : `${formatCount(n)} people`;
}

function figure(bucket: CountBucket<string>, total: number): string {
  return `${formatCount(bucket.count)} (${formatShare(bucket.count, total)})`;
}

function bucketByKey<K extends string>(buckets: readonly CountBucket<K>[], key: K): CountBucket<K> {
  const bucket = buckets.find((b) => b.key === key);
  if (bucket === undefined) throw new Error(`Missing "${key}" bucket`);
  return bucket;
}

function unknownSentence(
  field: string,
  buckets: readonly CountBucket<string>[],
  total: number,
): string {
  const unknown = bucketByKey(buckets, 'unknown');
  return `${field} is not recorded for ${people(unknown.count)} (${formatShare(unknown.count, total)}).`;
}

/** "Of 72,835 people identified by name, 50,959 (70.0%) are male and 21,876 (30.0%) are female. Sex is not…" */
export function sexSummary({ total, bySex }: DemographicsSummary): string {
  const known = bySex.filter((b) => b.key !== 'unknown');
  const parts = known.map((b) => `${figure(b, total)} are ${b.label.toLowerCase()}`);
  return [
    `Of ${people(total)} identified by name, ${listFormat.format(parts)}.`,
    unknownSentence('Sex', bySex, total),
  ].join(' ');
}

/** Leads with children (0–17), then the other brackets in order, then the Unknown sentence. */
export function ageSummary({ total, byAgeBracket }: DemographicsSummary): string {
  const children = bucketByKey(byAgeBracket, '0-17');
  const others = byAgeBracket.filter((b) => b.key !== '0-17' && b.key !== 'unknown');
  const parts = others.map((b) => `${figure(b, total)} were aged ${b.label}`);
  return [
    `Of ${people(total)} identified by name, ${figure(children, total)} were children aged ${children.label}.`,
    `${listFormat.format(parts)}.`,
    unknownSentence('Age', byAgeBracket, total),
  ].join(' ');
}

/**
 * The buckets drawn in the chart: an empty Unknown bucket is left out. The summary still
 * states the Unknown count, including 0, so nothing is silently dropped.
 */
export function shownBuckets<K extends string>(
  buckets: readonly CountBucket<K>[],
): readonly CountBucket<K>[] {
  return buckets.filter((bucket) => bucket.key !== 'unknown' || bucket.count > 0);
}
