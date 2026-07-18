"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Isolates WebGL / Three failures so they never blank the whole marketing site.
 * CSP or missing WebGL must degrade gracefully, not throw an Application error.
 */
export class ThreeErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (typeof console !== "undefined") {
      console.warn("[NewPhase 3D] disabled after error:", error.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="absolute inset-0 radial-fade" aria-hidden />
        )
      );
    }
    return this.props.children;
  }
}
