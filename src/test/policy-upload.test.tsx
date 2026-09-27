import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";
import { clearSession, signInToDepartment } from "@/session/session";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

/** Put files on the hidden upload input, as the browser would. */
const uploadFiles = (files: File[]) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: files });
  fireEvent.change(input);
};

describe("policy upload — what the screen says was read", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSession();
  });

  it("shows a .txt file with the real extraction status", async () => {
    signInToDepartment("fin");
    renderAt("/app");
    uploadFiles([new File(["A drafted policy on tax bands."], "bands.txt", { type: "text/plain" })]);

    expect(await screen.findByText("bands.txt")).toBeInTheDocument();
    expect(await screen.findByText("Text extracted.")).toBeInTheDocument();
  });

  it("states that a .pdf was not read, rather than implying it was", async () => {
    signInToDepartment("fin");
    renderAt("/app");
    uploadFiles([new File(["%PDF-1.4"], "brief.pdf", { type: "application/pdf" })]);

    expect(await screen.findByText("brief.pdf")).toBeInTheDocument();
    expect(await screen.findByText(/Text extraction \(Mock\)/)).toBeInTheDocument();
  });

  it("uses the text read from the file as the run's policy text", async () => {
    signInToDepartment("fin");
    renderAt("/app");
    uploadFiles([
      new File(["A drafted policy on tax bands."], "bands.txt", { type: "text/plain" }),
    ]);
    await screen.findByText("Text extracted.");

    fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));

    // The run's title is derived from the policy text, so seeing it proves the
    // file's own words reached the engine — and the source still reads `upload`.
    expect(await screen.findByText(/A drafted policy on tax bands/)).toBeInTheDocument();
    expect(await screen.findByText(/source upload/)).toBeInTheDocument();
  });
});
