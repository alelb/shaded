import {
  DATA_PORTAL_URL,
  formatCount,
  formatIsoDate,
  KpiCard,
  KpiCardSkeleton,
  SourceNote,
  StateBoundary,
} from '../../components';
import { useDataset } from '../../hooks/useDataset.ts';
import styles from './GazaDemographicsView.module.css';

// One date per figure, always worded "last updated": "as of 7 October" would read as "since 7 October" (2023).
function lastUpdated(isoDate: string | null | undefined): string | null {
  return isoDate == null ? null : `last updated ${formatIsoDate(isoDate)}`;
}

// Gaza demographics view. The main figure is the total from Gaza daily reports; the named count sits below it as a
// separate figure from a separate dataset, never merged. Without the summary, the named count is the main figure.
export function GazaDemographicsView() {
  const { status, data, retry } = useDataset('gaza-demographics');
  const named = data?.demographics.total ?? 0;
  const summary = data?.summary ?? null;
  const reported = summary?.gazaReported ?? null;
  const reportedTotal = reported?.killedTotal ?? null;
  const namedUpdated = lastUpdated(summary?.killedInGaza.lastUpdate);
  const reportedUpdated = lastUpdated(reported?.lastUpdate);

  const card =
    reportedTotal === null ? (
      <KpiCard
        label="People killed in Gaza identified by name"
        value={named}
        description={
          <p>
            The list does not include everyone reported killed.{' '}
            {namedUpdated === null ? 'Last update date unavailable.' : `List ${namedUpdated}.`}
          </p>
        }
        footer={<SourceNote datasetName="Killed in Gaza" href={DATA_PORTAL_URL} />}
      />
    ) : (
      <KpiCard
        // Start of the daily reports series (first `report_date` in `casualties_daily.json`).
        label="People killed in Gaza since 7 October 2023"
        value={reportedTotal}
        description={
          <p>
            From Gaza daily reports
            {reportedUpdated === null ? '' : `, ${reportedUpdated}`}.
          </p>
        }
        footer={
          <>
            <div className={styles.named}>
              <p>
                <strong className={styles.namedValue}>{formatCount(named)}</strong> identified by
                name
              </p>
              <p className={styles.namedNote}>
                Killed in Gaza list
                {namedUpdated === null ? '; last update date unavailable.' : `, ${namedUpdated}.`}
              </p>
            </div>
            <SourceNote
              datasetName="Gaza daily reports and Killed in Gaza"
              href={DATA_PORTAL_URL}
            />
          </>
        }
      />
    );

  return (
    <section className={styles.view} aria-label="Gaza demographics">
      <StateBoundary
        status={status}
        isEmpty={named === 0 && reportedTotal === null}
        onRetry={retry}
        skeleton={<KpiCardSkeleton />}
      >
        {card}
      </StateBoundary>
    </section>
  );
}
