"use client";

import { Component, type ReactNode } from "react";

export class SectionErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-500">
            This section failed to load. The rest of the dashboard is still available.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
