import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/session/useSession";

/**
 * Route guard for everything under the workspace (`/app/**`).
 *
 * Without a department session there is no department context, so the workspace
 * cannot be shown — a direct URL visit or a reload after sign-out returns the
 * user to the department selector instead of rendering an unassigned dashboard.
 */
export function RequireSession() {
  const session = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/start" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}