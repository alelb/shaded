import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GazaDemographicsData } from '../../data/worker/gazaDemographics.ts';
import { useDataset, type UseDatasetResult } from '../../hooks/useDataset.ts';
import { GazaDemographicsView } from './GazaDemographicsView.tsx';

vi.mock('../../hooks/useDataset.ts', () => ({ useDataset: vi.fn() }));

const LABEL = 'People killed in Gaza identified by name';
const REPORTED_LABEL = 'People killed in Gaza since 7 October 2023';
const SEX_TITLE = 'Sex';
const AGE_TITLE = 'Age';

const DATA: GazaDemographicsData = {
  demographics: {
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
  },
  summary: {
    killedInGaza: { lastUpdate: '2026-07-27', records: 72_835 },
    gazaReported: { killedTotal: 74_250, lastUpdate: '2026-10-07' },
  },
};

const retry = vi.fn();

function mockDataset(result: Partial<UseDatasetResult<GazaDemographicsData>>) {
  vi.mocked(useDataset).mockReturnValue({
    status: 'success',
    data: null,
    error: null,
    retry,
    ...result,
  });
}

// jsdom has no ResizeObserver; the charts' layout is covered by `HorizontalBarChart.test.tsx`.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('GazaDemographicsView', () => {
  // The first import of the lazy chart chunk (Recharts) is slow in jsdom: load it once, outside `findBy` timeouts.
  beforeAll(async () => {
    await import('./DemographicCharts.tsx');
  });

  beforeEach(() => {
    retry.mockReset();
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the gaza-demographics dataset and shows the KPI and chart skeletons while loading', () => {
    mockDataset({ status: 'loading' });
    const { container } = render(<GazaDemographicsView />);
    expect(useDataset).toHaveBeenCalledWith('gaza-demographics');
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy).toBeInTheDocument();
    // The KPI skeleton plus one skeleton per chart.
    expect(busy?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });

  it('renders both charts with their summaries below the KPI card', async () => {
    mockDataset({ data: DATA });
    render(<GazaDemographicsView />);
    const sex = await screen.findByRole('figure', { name: SEX_TITLE });
    const age = screen.getByRole('figure', { name: AGE_TITLE });
    expect(sex).toHaveAccessibleDescription(
      'Of 72,835 people identified by name, 50,959 (70.0%) are male and 21,876 (30.0%) are female. ' +
        'Sex is not recorded for 0 people (0.0%).',
    );
    expect(age).toHaveAccessibleDescription(
      /^Of 72,835 people identified by name, 21,637 \(29\.7%\) were children/,
    );
    for (const chart of [sex, age]) {
      expect(
        within(chart).getByText('Killed in Gaza list, last updated 27 July 2026.'),
      ).toBeInTheDocument();
      expect(within(chart).getByText(/Source: Killed in Gaza/)).toBeInTheDocument();
    }
    // In order: the KPI card, then the sex and age charts.
    expect(screen.getAllByRole('figure')).toEqual([
      screen.getByRole('figure', { name: REPORTED_LABEL }),
      sex,
      age,
    ]);
  });

  it('leaves an empty Unknown bucket out of the chart, and draws it when it has records', async () => {
    // The plot is sized by the number of bars it draws (`--rows`).
    const plotRows = (figure: HTMLElement) =>
      figure.querySelector<HTMLElement>('[style]')?.style.getPropertyValue('--rows');

    mockDataset({ data: DATA });
    const { unmount } = render(<GazaDemographicsView />);
    let sex = await screen.findByRole('figure', { name: SEX_TITLE });
    expect(plotRows(sex)).toBe('2');
    expect(plotRows(screen.getByRole('figure', { name: AGE_TITLE }))).toBe('4');
    expect(sex).toHaveAccessibleDescription(/Sex is not recorded for 0 people \(0\.0%\)\.$/);
    unmount();

    const bySex = DATA.demographics.bySex.map((b) =>
      b.key === 'unknown' ? { ...b, count: 3 } : b,
    );
    mockDataset({ data: { ...DATA, demographics: { ...DATA.demographics, bySex } } });
    render(<GazaDemographicsView />);
    sex = await screen.findByRole('figure', { name: SEX_TITLE });
    expect(plotRows(sex)).toBe('3');
  });

  it('renders no charts when the named list is empty', () => {
    mockDataset({ data: { ...DATA, demographics: { ...DATA.demographics, total: 0 } } });
    render(<GazaDemographicsView />);
    expect(screen.queryByRole('figure', { name: SEX_TITLE })).not.toBeInTheDocument();
    expect(screen.queryByRole('figure', { name: AGE_TITLE })).not.toBeInTheDocument();
  });

  it('still renders the charts when the summary is null, without the date', async () => {
    mockDataset({ data: { ...DATA, summary: null } });
    render(<GazaDemographicsView />);
    const sex = await screen.findByRole('figure', { name: SEX_TITLE });
    expect(
      within(sex).getByText('Killed in Gaza list; last update date unavailable.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('figure', { name: AGE_TITLE })).toBeInTheDocument();
  });

  it('shows the error with a working Retry', () => {
    mockDataset({ status: 'error', error: { kind: 'network', message: 'Failed to fetch' } });
    render(<GazaDemographicsView />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('shows the empty state when the named list is empty and the summary is null', () => {
    mockDataset({ data: { demographics: { ...DATA.demographics, total: 0 }, summary: null } });
    render(<GazaDemographicsView />);
    expect(
      screen.getByText('No records are available in this dataset right now.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });

  it('shows the reported total as the main figure and the named count below it', async () => {
    mockDataset({ data: DATA });
    render(<GazaDemographicsView />);
    const figure = screen.getByRole('figure', { name: REPORTED_LABEL });
    expect(figure).toHaveTextContent('74,250');
    expect(
      within(figure).getByText('From Gaza daily reports, last updated 7 October 2026.'),
    ).toBeInTheDocument();
    expect(within(figure).getByText('72,835')).toBeInTheDocument();
    expect(
      within(figure).getByText('Killed in Gaza list, last updated 27 July 2026.'),
    ).toBeInTheDocument();
    expect(within(figure).getByText(/Gaza daily reports and Killed in Gaza/)).toBeInTheDocument();
    await screen.findByRole('figure', { name: SEX_TITLE });
  });

  it('leaves out the date when the reported date is missing', () => {
    const summary = DATA.summary && {
      ...DATA.summary,
      gazaReported: { killedTotal: 74_250, lastUpdate: null },
    };
    mockDataset({ data: { ...DATA, summary } });
    render(<GazaDemographicsView />);
    expect(screen.getByText('From Gaza daily reports.')).toBeInTheDocument();
  });

  it('shows the reported total even when the named list is empty', () => {
    mockDataset({ data: { ...DATA, demographics: { ...DATA.demographics, total: 0 } } });
    render(<GazaDemographicsView />);
    expect(screen.getByRole('figure', { name: REPORTED_LABEL })).toHaveTextContent('74,250');
  });

  it('falls back to the named count when the summary is null', () => {
    mockDataset({ data: { ...DATA, summary: null } });
    render(<GazaDemographicsView />);
    expect(screen.getByRole('figure', { name: LABEL })).toHaveTextContent('72,835');
    expect(screen.queryByText(/Gaza daily reports/)).not.toBeInTheDocument();
    expect(screen.getByText(/Last update date unavailable\./)).toBeInTheDocument();
    expect(screen.queryByText(/includes only people identified by name/)).not.toBeInTheDocument();
  });
});

describe('GazaDemographicsView when the chart chunk fails to load', () => {
  afterEach(() => {
    vi.doUnmock('./DemographicCharts.tsx');
    vi.resetModules();
  });

  it('keeps the KPI and shows the error with Retry in the chart area', async () => {
    vi.resetModules();
    vi.doMock('./DemographicCharts.tsx', () => {
      throw new Error('Failed to fetch dynamically imported module');
    });
    const { useDataset: mockedUseDataset } = await import('../../hooks/useDataset.ts');
    vi.mocked(mockedUseDataset).mockReturnValue({
      status: 'success',
      data: DATA,
      error: null,
      retry,
    });
    const { GazaDemographicsView: View } = await import('./GazaDemographicsView.tsx');

    render(<View />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('figure', { name: REPORTED_LABEL })).toHaveTextContent('74,250');
    expect(screen.queryByText(/dynamically imported/)).not.toBeInTheDocument();

    vi.doUnmock('./DemographicCharts.tsx');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('figure', { name: SEX_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(retry).not.toHaveBeenCalled();
  });
});
