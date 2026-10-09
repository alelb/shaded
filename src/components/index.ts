// Reusable UI components (KpiCard, ChartFrame, SourceNote, StateBoundary). No data fetching here.
// `HorizontalBarChart` is not re-exported: it pulls in the chart library, and this barrel is part of the initial
// chunk. Lazily loaded modules import it from `./HorizontalBarChart.tsx` directly.
export { ChartFrame, ChartFrameSkeleton } from './ChartFrame.tsx';
export { formatCount, formatIsoDate, formatShare } from './format.ts';
export { KpiCard, KpiCardSkeleton } from './KpiCard.tsx';
export { SiteFooter, DATA_PORTAL_URL } from './SiteFooter.tsx';
export { SourceNote } from './SourceNote.tsx';
export { LoadError, StateBoundary } from './StateBoundary.tsx';
