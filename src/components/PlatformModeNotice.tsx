import { CAPABILITY_IDS, CAPABILITY_LABELS, describeCapability } from "@/config/platform";
import { usePlatformConfig } from "@/config/usePlatformConfig";

/**
 * A notice that appears ONLY when a capability is genuinely running live.
 *
 * While the platform is simulated it renders nothing at all, so the workspace
 * looks byte-for-byte as it always has. It exists so that no screen can be read
 * as simulated when it is not — and no figure can be mistaken for a live one
 * without the platform saying so.
 */
export function PlatformModeNotice() {
  const config = usePlatformConfig();
  const live = CAPABILITY_IDS.map((id) => describeCapability(config, id)).filter(
    (status) => status.state === "live",
  );

  if (live.length === 0) return null;

  return (
    <div className="border-b border-warning/40 bg-warning/5 px-4 py-1.5 text-[10px] leading-relaxed text-foreground">
      <strong className="font-semibold">Live services in use:</strong>{" "}
      {live.map((status) => CAPABILITY_LABELS[status.id]).join(", ")}. Everything not listed here is
      simulated.
    </div>
  );
}
