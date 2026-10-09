import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';

vi.mock('../hooks/useDataset.ts', () => ({
  useDataset: () => ({
    status: 'success',
    data: { demographics: { total: 72_835, bySex: [], byAgeBracket: [] }, summary: null },
    error: null,
    retry: () => {},
  }),
}));

describe('App', () => {
  it('renders the "Shaded" heading and intro line', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Shaded' })).toBeInTheDocument();
    expect(screen.getByText(/open data bearing witness/i)).toBeInTheDocument();
  });

  it('renders the Gaza demographics view in the main landmark', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main');
    expect(
      within(main).getByRole('figure', { name: 'People killed in Gaza identified by name' }),
    ).toHaveTextContent('72,835');
  });

  it('renders the skip link as the first link, targeting #main', () => {
    render(<App />);
    const [firstLink] = screen.getAllByRole('link');
    expect(firstLink).toHaveTextContent('Skip to content');
    expect(firstLink).toHaveAttribute('href', '#main');
  });

  it('renders the footer inside the contentinfo landmark', () => {
    render(<App />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(/may undercount the real toll/i);
  });
});
