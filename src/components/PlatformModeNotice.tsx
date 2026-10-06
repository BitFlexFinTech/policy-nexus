import {
  CAPABILITY_IDS,
  CAPABILITY_LABELS,
  describeCapability,
  isPlatformLive,
} from "@/config/platform";
import { usePlatformConfig } from "@/config/usePlatformConfig";

/**
 * The mode banner.
 *
 * While the platform is SIMULATED it renders nothing at all, so the workspace looks
 * byte-for-byte as it always has. When the whole platform is switched LIVE (the one master
 * switch on the administration screen) it says so, and names what is connected and what is not —
 * so no screen can be read as real when it is not, and no officer mistakes a live mode for a
 * simulated one.
 */
export function PlatformModeNotice() {
  const config = usePlatformConfig();
  if (!isPlatformLive(config)) return null;

  const statuses = CAPABILITY_IDS.map((id) => ({ id, status: describeCapability(config, id) }));
  const connected = statuses.filter((entry) => entry.status.state === "live");
  const notConnected = statuses.filter((entry) => entry.status.state !== "live");

  return (
    <div className="border-b border-warning/50 bg-warning/10 px-4 py-1.5 text-[10px] leading-relaxed text-foreground">
      <strong className="font-semibold">Live mode.</strong>{" "}
      {connected.length
        ? `Connected: ${connected.map((entry) => CAPABILITY_LABELS[entry.id]).join(", ")}.`
        : "No services are connected yet — nothing is shown rather than simulated results."}
      {notConnected.length
        ? ` Not connected: ${notConnected.map((entry) => CAPABILITY_LABELS[entry.id]).join(", ")}.`
        : ""}
    </div>
  );
}
