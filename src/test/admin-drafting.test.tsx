import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "@/App";
import { ADMIN_ROUTE, DEFAULT_DRAFTING_MODEL, clearConfig } from "@/config/platform";
import { clearSession } from "@/session/session";

const enterAdmin = () => {
  window.history.pushState({}, "", ADMIN_ROUTE);
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Yes, I am the administrator" }));
};

describe("the OpenRouter drafting setup", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearConfig();
    clearSession();
  });

  it("shows only a key and a model for the drafting model — no address field", () => {
    enterAdmin();
    const section = screen
      .getByRole("heading", { name: "Drafting model (OpenRouter)" })
      .closest("section");
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).getByLabelText("OpenRouter key")).toBeInTheDocument();
    expect(within(section as HTMLElement).getByLabelText("Model")).toBeInTheDocument();
    expect(within(section as HTMLElement).queryByLabelText("Service address")).toBeNull();
  });

  it("fills the default model when the drafting model is switched on", () => {
    enterAdmin();
    fireEvent.click(screen.getByRole("switch", { name: "Drafting model (OpenRouter) runs live" }));
    expect(screen.getByLabelText("Model")).toHaveTextContent(DEFAULT_DRAFTING_MODEL);
  });

  it("opens the model picker anchored to the field and lists real models", () => {
    enterAdmin();
    fireEvent.click(screen.getByRole("combobox", { name: "Model" }));
    expect(screen.getByText(DEFAULT_DRAFTING_MODEL)).toBeInTheDocument();
    // A second, different real model is offered too.
    expect(screen.getByText("deepseek/deepseek-v4-pro")).toBeInTheDocument();
  });

  it("lets the administrator pick a suggested model, changing the field", () => {
    enterAdmin();
    fireEvent.click(screen.getByRole("combobox", { name: "Model" }));
    fireEvent.click(screen.getByText("deepseek/deepseek-v4-pro"));
    expect(screen.getByLabelText("Model")).toHaveTextContent("deepseek/deepseek-v4-pro");
  });
});
