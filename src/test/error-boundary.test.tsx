import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/** A component that always throws while rendering, as a screen with bad data would. */
const Boom = () => {
  throw new Error("render boom");
};

describe("the error boundary", () => {
  it("shows a recoverable message instead of a blank screen", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText("This screen could not load")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload the page" })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("renders its children untouched when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>Everything is fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Everything is fine")).toBeInTheDocument();
  });
});
