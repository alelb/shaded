import { Component, type ReactNode } from 'react';
import { LoadError } from '../../components';

export interface ChartsErrorBoundaryProps {
  /** Called by Retry. The parent remounts the boundary (a `key` change) with a fresh lazy import. */
  onRetry: () => void;
  children: ReactNode;
}

// Catches a failed chart chunk (e.g. offline after the first paint), so the KPI above stays visible.
export class ChartsErrorBoundary extends Component<ChartsErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <LoadError onRetry={this.props.onRetry} /> : this.props.children;
  }
}
