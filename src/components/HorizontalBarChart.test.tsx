import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HorizontalBarChart } from './HorizontalBarChart.tsx';

const WIDTH = 360;
const HEIGHT = 240;

// jsdom has no layout: report a fixed size so `ResponsiveContainer` renders the chart.
class ResizeObserverStub {
  private readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    const entry = {
      target,
      contentRect: { width: WIDTH, height: HEIGHT, top: 0, left: 0, right: WIDTH, bottom: HEIGHT },
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}

const BUCKETS = [
  { key: 'male', label: 'Male', count: 50_959 },
  { key: 'female', label: 'Female', count: 21_876 },
  { key: 'unknown', label: 'Unknown / Not specified', count: 0 },
];

describe('HorizontalBarChart', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(WIDTH);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(HEIGHT);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: WIDTH,
      height: HEIGHT,
      top: 0,
      left: 0,
      right: WIDTH,
      bottom: HEIGHT,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('labels every bucket and writes every count, including 0', () => {
    const { container } = render(
      <HorizontalBarChart
        title="Sex of people identified by name"
        buckets={BUCKETS}
        total={72_835}
      />,
    );
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    // `Text` splits a wrapped label into one `tspan` per line (per word in jsdom, which cannot measure text).
    const ticks = [...(svg?.querySelectorAll('.recharts-yAxis-tick-labels text') ?? [])].map(
      (node) => [...node.querySelectorAll('tspan')].map((tspan) => tspan.textContent).join(' '),
    );
    expect(ticks).toEqual(['Male', 'Female', 'Unknown / Not specified']);
    const labels = [...(svg?.querySelectorAll('.recharts-label-list text') ?? [])].map(
      (node) => node.textContent,
    );
    expect(labels).toEqual(['50,959', '21,876', '0']);
  });

  it('names the SVG with the chart title', () => {
    render(
      <HorizontalBarChart
        title="Sex of people identified by name"
        buckets={BUCKETS}
        total={72_835}
      />,
    );
    // Recharts' accessibility layer gives the SVG `role="application"`; its `<title>` is the accessible name.
    expect(
      screen.getByRole('application', { name: 'Sex of people identified by name' }),
    ).toBeInTheDocument();
  });
});
