import { ChartFrame, DATA_PORTAL_URL, SourceNote } from '../../components';
import { HorizontalBarChart } from '../../components/HorizontalBarChart.tsx';
import type { DemographicsSummary } from '../../data/aggregators/demographics.ts';
import { ageSummary, sexSummary, shownBuckets } from './summaries.ts';

export interface DemographicChartsProps {
  demographics: DemographicsSummary;
  /** "last updated 27 July 2026", or `null` when the date is unavailable. Same date as the named figure. */
  namedUpdated: string | null;
}

const SEX_TITLE = 'Sex';
const AGE_TITLE = 'Age';

// The lazily loaded chart chunk: the only module that pulls in the chart library. One column at every width.
export default function DemographicCharts({ demographics, namedUpdated }: DemographicChartsProps) {
  const { total } = demographics;
  const bySex = shownBuckets(demographics.bySex);
  const byAgeBracket = shownBuckets(demographics.byAgeBracket);
  const description = (
    <p>
      Killed in Gaza list
      {namedUpdated === null ? '; last update date unavailable.' : `, ${namedUpdated}.`}
    </p>
  );
  const source = <SourceNote datasetName="Killed in Gaza" href={DATA_PORTAL_URL} />;

  return (
    <>
      <ChartFrame
        title={SEX_TITLE}
        description={description}
        summary={sexSummary(demographics)}
        rows={bySex.length}
        source={source}
      >
        <HorizontalBarChart title={SEX_TITLE} buckets={bySex} total={total} />
      </ChartFrame>
      <ChartFrame
        title={AGE_TITLE}
        description={description}
        summary={ageSummary(demographics)}
        rows={byAgeBracket.length}
        source={source}
      >
        <HorizontalBarChart title={AGE_TITLE} buckets={byAgeBracket} total={total} />
      </ChartFrame>
    </>
  );
}
