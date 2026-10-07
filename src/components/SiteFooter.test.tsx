import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from './SiteFooter.tsx';

describe('SiteFooter', () => {
  it('links the data attribution to the Tech for Palestine portal', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'Tech for Palestine' })).toHaveAttribute(
      'href',
      'https://data.techforpalestine.org/',
    );
  });

  it('shows the limitations note', () => {
    render(<SiteFooter />);
    expect(screen.getByText(/reported figures may undercount the real toll/i)).toBeInTheDocument();
  });
});
