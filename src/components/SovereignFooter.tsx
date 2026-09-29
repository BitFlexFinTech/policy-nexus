import { PROMOTER, SERVICE_POSITION, SOVEREIGNTY_STATEMENT } from "@/config/brand";

/**
 * The sovereign-compute statement, the audience line and the project promoter credit — all read
 * from the single source of truth in `src/config/brand.ts`; no host, node or vendor name appears
 * here, and the promoter line is deliberately the smallest text on the bar so it never competes
 * with the Ministry's own attribution.
 */
export function SovereignFooter() {
  return (
    <footer className="flex flex-col items-center justify-center border-t bg-primary px-4 py-2">
      <span className="text-[10px] tracking-wide text-primary-foreground/80 text-center">
        🛡 {SOVEREIGNTY_STATEMENT}
      </span>
      <span className="mt-0.5 text-[10px] tracking-wide text-primary-foreground/80 text-center">
        {SERVICE_POSITION.audience}
      </span>
      <span className="mt-0.5 text-[9px] tracking-wide text-primary-foreground/75 text-center">
        {PROMOTER.line}
      </span>
    </footer>
  );
}
