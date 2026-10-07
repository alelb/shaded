import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';

describe('App', () => {
  it('renders the "Shaded" heading and intro line', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Shaded' })).toBeInTheDocument();
    expect(screen.getByText(/open data bearing witness/i)).toBeInTheDocument();
  });

  it('renders the main landmark with the placeholder', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main');
    expect(main).toHaveTextContent('Data views are being prepared.');
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
