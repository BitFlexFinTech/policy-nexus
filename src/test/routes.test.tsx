import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";

/**
 * Route smoke test. Every route must actually render without throwing. A rules
 * of hooks violation passes typecheck and build cleanly and only fails here.
 */
const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

describe("routes smoke-render", () => {
  it("renders the public homepage at /", () => {
    renderAt("/");
    expect(screen.getByRole("group", { name: /select a department/i })).toBeInTheDocument();
  });

  it("renders the department workspace at /app", () => {
    renderAt("/app");
    expect(screen.getByText("Engine Vitals")).toBeInTheDocument();
    expect(screen.getByText("Simulation History")).toBeInTheDocument();
    expect(screen.getByText("Document Library")).toBeInTheDocument();
  });

  it("renders NotFound for an unknown route", () => {
    renderAt("/a-route-that-does-not-exist");
    expect(screen.getByText("404")).toBeInTheDocument();
  });
});