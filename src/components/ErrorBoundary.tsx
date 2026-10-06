import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * The last line of defence (owner's rule, 2026-10-06: a screen must NEVER blank out).
 *
 * If any screen throws while rendering, React unmounts the whole tree and the officer is left
 * staring at an empty page — which is exactly what happened once on the administration screen. This
 * catches that and shows a plain, honest message with a way to recover, so a rendering fault is a
 * visible, recoverable state rather than a blank screen.
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Recorded for developer tools only; never shown to the officer.
    console.error("A screen failed to render:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-md space-y-3 rounded-lg border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            This screen could not load
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Something on this screen failed to render. Your saved work is safe. Reload the page to try
            again. If it keeps happening, the data kept in this browser may be the cause.
          </p>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>
        </section>
      </div>
    );
  }
}
