import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartFrame, ChartFrameSkeleton } from './ChartFrame.tsx';

const TITLE = 'Sex of people identified by name';
const SUMMARY = 'Of 72,835 people identified by name, 50,959 (70.0%) are male.';

function renderFrame() {
  return render(
    <ChartFrame
      title={TITLE}
      description={<p>Killed in Gaza list, last updated 27 July 2026.</p>}
      summary={SUMMARY}
      rows={2}
      source={<p>Source: Killed in Gaza</p>}
    >
      <div data-testid="chart" />
    </ChartFrame>,
  );
}

describe('ChartFrame', () => {
  it('is a figure named by its title and described by its summary', () => {
    renderFrame();
    const figure = screen.getByRole('figure', { name: TITLE });
    expect(figure).toHaveAccessibleDescription(SUMMARY);
    expect(within(figure).getByTestId('chart')).toBeInTheDocument();
    expect(within(figure).getByText('Source: Killed in Gaza')).toBeInTheDocument();
  });

  it('keeps the summary for screen readers only, with no data table', () => {
    renderFrame();
    expect(screen.getByText(SUMMARY)).toHaveClass('visually-hidden');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ChartFrameSkeleton', () => {
  it("shares the frame's container class and plot height, hidden from assistive tech", () => {
    const { container: frame } = renderFrame();
    const { container: skeleton } = render(<ChartFrameSkeleton rows={2} />);
    const frameRoot = frame.querySelector('figure');
    const skeletonRoot = skeleton.firstElementChild;
    expect(skeletonRoot).toHaveAttribute('aria-hidden', 'true');
    expect(skeletonRoot?.className).toBe(frameRoot?.className);

    const framePlot = screen.getByTestId('chart').parentElement;
    const skeletonPlot = skeletonRoot?.querySelector('[style]');
    expect(skeletonPlot?.getAttribute('style')).toBe(framePlot?.getAttribute('style'));
    expect(skeletonPlot?.className).toContain(framePlot?.className ?? 'missing');
  });
});
