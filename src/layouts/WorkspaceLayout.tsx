import { Outlet } from "react-router-dom";
import { HeaderBar } from "@/components/HeaderBar";
import { WorkspaceNav } from "@/components/WorkspaceNav";
import { SovereignFooter } from "@/components/SovereignFooter";

/**
 * The one workspace shell. Every `/app/**` screen renders inside it, so the
 * header, the secondary navigation and the sovereign footer exist once rather
 * than being duplicated per screen.
 *
 * The fixed-viewport assumption of the original dashboard is preserved: the
 * shell is `h-screen` + `flex-col` + `overflow-hidden`; each screen supplies its
 * own `flex-1 min-h-0` region and scrolls internally.
 */
export function WorkspaceLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <HeaderBar />
      <WorkspaceNav />
      <Outlet />
      <SovereignFooter />
    </div>
  );
}
