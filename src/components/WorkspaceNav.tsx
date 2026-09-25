import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Secondary navigation for the workspace. It is department-scoped by virtue of
 * living inside the guarded shell, so switching section never loses the
 * department context. `end` keeps "Overview" from staying active on sub-routes.
 */
const LINKS: ReadonlyArray<{ to: string; label: string; end?: boolean }> = [
  { to: "/app", label: "Overview", end: true },
  { to: "/app/policies", label: "Policy Register" },
  { to: "/app/simulations", label: "Simulation Register" },
  { to: "/app/documents", label: "Documents" },
  { to: "/app/reference", label: "Reference" },
];

export function WorkspaceNav() {
  return (
    <nav
      aria-label="Workspace sections"
      className="flex items-center gap-1 overflow-x-auto border-b bg-card px-4 py-1.5"
    >
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            cn(
              "whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
