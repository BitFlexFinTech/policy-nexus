import logo from "@/assets/zepari-logo.png";
import { cn } from "@/lib/utils";

/**
 * The ZEPARI mark, used ONLY on the research product's screens — the department side keeps the
 * government Coat of Arms, so the two products are never mistaken for one another.
 *
 * The artwork is the institute's own published logo (zepari.co.zw, 230×49) — a small, low
 * resolution raster, and their only published file. It is therefore never enlarged past its real
 * width (`max-w-[230px]`), which is what previously made it look "plastered": a small picture blown
 * up on a dark bar. It is now set at its real size on a light surface (see `ZepariMasthead`), the
 * way the institute uses it itself. On a dark surface the `dark` variant keeps a white ground,
 * exactly as the institute does.
 */
export function ZepariMark({ on = "light", className }: { on?: "light" | "dark"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center",
        on === "dark" && "rounded bg-white px-2 py-1",
        className,
      )}
    >
      <img
        src={logo}
        alt="Zimbabwe Economic Policy Analysis and Research Institute (ZEPARI)"
        className="h-full w-auto max-w-[230px] object-contain"
        decoding="async"
      />
    </span>
  );
}
