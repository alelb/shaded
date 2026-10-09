import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiCard, KpiCardSkeleton } from './KpiCard.tsx';

describe('KpiCard', () => {
  it('formats the value and names the figure by its label', () => {
    render(<KpiCard label="People killed" value={72_835} />);
    const figure = screen.getByRole('figure', { name: 'People killed' });
    expect(figure).toHaveTextContent('72,835');
  });

  it('renders the description and footer when given', () => {
    render(<KpiCard label="L" value={1} description="About this" footer={<p>Source</p>} />);
    expect(screen.getByText('About this')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('shares the container class with the skeleton', () => {
    const { container: card } = render(<KpiCard label="L" value={1} />);
    const { container: skeleton } = render(<KpiCardSkeleton />);
    const cardClass = card.firstElementChild?.className;
    expect(cardClass).toBeTruthy();
    expect(skeleton.firstElementChild).toHaveClass(cardClass ?? '');
    expect(skeleton.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
