import { fireEvent, screen } from "@testing-library/react";

/**
 * Press Run Simulation the way an officer does.
 *
 * The first run in a department shows the one-time "before you run" notice (owner's item 5),
 * which must be answered before the run starts; this answers it by choosing to run. On every
 * later run the notice is absent, so the press starts the run directly. Either way the officer
 * reaches exactly the run they did before the notice existed.
 */
export const pressRunSimulation = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "Run Simulation" }));
  const runAnyway = screen.queryByRole("button", { name: "Run with the data I have" });
  if (runAnyway) fireEvent.click(runAnyway);
};
