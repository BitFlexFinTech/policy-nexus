import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useResearchSession } from "@/session/useResearchSession";

/**
 * The research assistant's route guard. A signed-out visit to any `/research/**` screen is sent to
 * the research landing page at `/research`, so a researcher never lands on an empty screen. The two
 * products keep separate guards, so a department session never opens the research side, or the reverse.
 */
export function RequireResearchSession() {
  const session = useResearchSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/research" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}