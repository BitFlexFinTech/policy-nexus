import { SOVEREIGNTY_STATEMENT } from "@/config/brand";

/**
 * The sovereign-compute statement. It is read from the single source of truth
 * in `src/config/brand.ts`; no host, node or vendor name appears here.
 */
export function SovereignFooter() {
  return (
    <footer className="flex items-center justify-center border-t bg-primary px-4 py-2">
      <span className="text-[10px] tracking-wide text-primary-foreground/80 text-center">
        🛡 {SOVEREIGNTY_STATEMENT}
      </span>
    </footer>
  );
}
