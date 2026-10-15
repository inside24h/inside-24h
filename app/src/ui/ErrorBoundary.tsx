import { Component, type ReactNode } from 'react';

/** Keeps a failure in one part (e.g. WebGL) from blanking the whole app. */
export class ErrorBoundary extends Component<{ fallback: (e: unknown) => ReactNode; children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) { return { error }; }
  componentDidCatch(error: unknown) { console.error('[inside24h]', error); }
  render() { return this.state.error ? this.props.fallback(this.state.error) : this.props.children; }
}
