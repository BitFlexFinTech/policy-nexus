import logo from "@/assets/zepari-logo.jpg";
import { cn } from "@/lib/utils";

/**
 * The ZEPARI mark, used ONLY on the research product's screens — the department side keeps the
 * government Coat of Arms, so the two products are never mistaken for one another.
 *
 * The institute's own artwork (zepari.co.zw) has a white ground, so on a dark masthead it sits on a
 * white chip, exactly as the institute uses it on its own site.
 */
export function ZepariMark({ on = "light", className }: { on?: "light" | "dark"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        on === "dark" && "rounded bg-white px-2 py-1",
        className,
      )}
    >
      <img
        src={logo}
        alt="Zimbabwe Economic Policy Analysis and Research Institute (ZEPARI)"
        className="h-6 w-auto"
      />
    </span>
  );
}
