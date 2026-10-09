// Gaza demographics pipeline: fetch → normalize → aggregate. Plain async TypeScript, run by the dataset worker
// and tested directly. Only aggregates leave this module.
import { summarizeDemographics, type DemographicsSummary } from '../aggregators/demographics.ts';
import { normalizePeople } from '../normalize/person.ts';
import { ok, type FetchJsonOptions, type SourceResult } from '../sources/fetchJson.ts';
import { fetchKilledInGaza } from '../sources/killedInGaza.ts';
import { fetchSummary, type SummaryFacts } from '../sources/summary.ts';

export interface GazaDemographicsData {
  demographics: DemographicsSummary;
  /** `null` when the summary request failed: the KPI must not depend on it. */
  summary: SummaryFacts | null;
}

export async function loadGazaDemographics(
  options?: FetchJsonOptions,
): Promise<SourceResult<GazaDemographicsData>> {
  const [people, summary] = await Promise.all([fetchKilledInGaza(options), fetchSummary(options)]);
  if (!people.ok) return people;
  return ok({
    demographics: summarizeDemographics(normalizePeople(people.data)),
    summary: summary.ok ? summary.data : null,
  });
}
