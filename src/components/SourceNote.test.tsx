import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SourceNote } from './SourceNote.tsx';

const HREF = 'https://data.techforpalestine.org/';

describe('SourceNote', () => {
  it('names the source and links to the portal', () => {
    render(<SourceNote datasetName="Killed in Gaza" href={HREF} />);
    expect(screen.getByText(/Source: Killed in Gaza,/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tech for Palestine' })).toHaveAttribute('href', HREF);
  });
});
