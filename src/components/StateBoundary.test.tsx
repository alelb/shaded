import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DatasetStatus } from '../hooks/useDataset.ts';
import { StateBoundary } from './StateBoundary.tsx';

function renderBoundary(status: DatasetStatus, isEmpty = false, onRetry = vi.fn()) {
  render(
    <StateBoundary status={status} isEmpty={isEmpty} onRetry={onRetry} skeleton={<p>skeleton</p>}>
      <p>content</p>
    </StateBoundary>,
  );
  return onRetry;
}

describe('StateBoundary', () => {
  it('renders the skeleton in a busy region with hidden loading text', () => {
    renderBoundary('loading');
    const skeleton = screen.getByText('skeleton');
    expect(skeleton.parentElement).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading data…')).toHaveClass('visually-hidden');
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders an alert and a Retry button that calls onRetry on error', () => {
    const onRetry = renderBoundary('error');
    expect(screen.getByRole('alert')).toHaveTextContent(
      "We couldn't load the data. Check your connection and try again.",
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders the empty message on success with isEmpty', () => {
    renderBoundary('success', true);
    expect(
      screen.getByText('No records are available in this dataset right now.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('renders children on success', () => {
    renderBoundary('success');
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
