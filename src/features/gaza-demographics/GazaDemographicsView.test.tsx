import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GazaDemographicsData } from '../../data/worker/gazaDemographics.ts';
import { useDataset, type UseDatasetResult } from '../../hooks/useDataset.ts';
import { GazaDemographicsView } from './GazaDemographicsView.tsx';

vi.mock('../../hooks/useDataset.ts', () => ({ useDataset: vi.fn() }));

const LABEL = 'People killed in Gaza identified by name';
const REPORTED_LABEL = 'People killed in Gaza since 7 October 2023';

const DATA: GazaDemographicsData = {
  demographics: { total: 72_835, bySex: [], byAgeBracket: [] },
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

describe('GazaDemographicsView', () => {
  beforeEach(() => {
    retry.mockReset();
  });

  it('requests the gaza-demographics dataset and shows the skeleton while loading', () => {
    mockDataset({ status: 'loading' });
    const { container } = render(<GazaDemographicsView />);
    expect(useDataset).toHaveBeenCalledWith('gaza-demographics');
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
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

  it('shows the reported total as the main figure and the named count below it', () => {
    mockDataset({ data: DATA });
    render(<GazaDemographicsView />);
    const figure = screen.getByRole('figure', { name: REPORTED_LABEL });
    expect(figure).toHaveTextContent('74,250');
    expect(
      screen.getByText('From Gaza daily reports, last updated 7 October 2026.'),
    ).toBeInTheDocument();
    expect(screen.getByText('72,835')).toBeInTheDocument();
    expect(screen.getByText('Killed in Gaza list, last updated 27 July 2026.')).toBeInTheDocument();
    expect(screen.getByText(/Gaza daily reports and Killed in Gaza/)).toBeInTheDocument();
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
