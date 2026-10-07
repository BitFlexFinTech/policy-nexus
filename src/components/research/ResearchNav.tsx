import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * The research workspace's secondary navigation. Each tool is its own screen, so a researcher works
 * on one thing at a time instead of scrolling past everything. `end` keeps "Overview" from staying
 * active on a sub-route. It is scoped by living inside the guarded research shell.
 */
const LINKS: ReadonlyArray<{ to: string; label: string; end?: boolean }> = [
  { to: "/research/app", label: "Overview", end: true },
  { to: "/research/app/library", label: "Library" },
  { to: "/research/app/data", label: "Data sources" },
  { to: "/research/app/ask", label: "Ask" },
  { to: "/research/app/brief", label: "Policy brief" },
  { to: "/research/app/barometer", label: "Economic Barometer" },
  { to: "/research/app/findings", label: "Findings" },
];

export function ResearchNav() {
  return (
    <nav
      aria-label="Research assistant sections"
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
                ? "bg-zp-blue/10 text-zp-navy"
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