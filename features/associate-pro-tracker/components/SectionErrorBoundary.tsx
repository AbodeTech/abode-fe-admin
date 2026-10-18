"use client";

import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  /** Named in the fallback, so the admin knows which part failed. */
  section: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Keeps one failing section from taking down the page.
 *
 * A class component because React has no hook equivalent for
 * `componentDidCatch` — this is the one place in the feature that isn't a
 * function component.
 *
 * Retry re-mounts the subtree, which re-runs its query. That is enough for a
 * transient failure; a persistent one simply lands back here.
 */
export class SectionErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-900">
              Couldn&apos;t load the {this.props.section} section
            </p>
            <p className="text-xs text-amber-800">
              {this.state.error.message || "Something went wrong."} The rest of the page is
              unaffected.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={this.reset}>
          <RotateCw className="mr-2 h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    );
  }
}
