import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ModelCombobox } from "@/components/admin/ModelCombobox";
import {
  CAPABILITY_LABELS,
  DEFAULT_DRAFTING_MODEL,
  OPENROUTER_CHAT_ENDPOINT,
  describeCapability,
  type CapabilityConfig,
  type CapabilityId,
  type CapabilityStatus,
  type PlatformConfig,
} from "@/config/platform";
import { probeEndpoint, type ProbeResult } from "@/services/platform/probe";

const STATE_CLASS: Record<CapabilityStatus["state"], string> = {
  live: "bg-success/15 text-success",
  misconfigured: "bg-warning/15 text-warning",
  simulated: "bg-muted text-muted-foreground",
};

/** The state of one capability, using the app's existing token idiom. */
export function CapabilityStateBadge({ status }: { status: CapabilityStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        STATE_CLASS[status.state],
      )}
    >
      {status.state}
    </span>
  );
}

const FIELD_LABEL = "text-[10px] uppercase tracking-wide text-muted-foreground";

/**
 * One service capability: its mode, its address, its credential, and a real
 * connection test that reports exactly what happened. Nothing here runs until a
 * platform administrator says so.
 */
export function CapabilityEditor({
  id,
  config,
  onChange,
}: {
  id: Exclude<CapabilityId, "sso">;
  config: PlatformConfig;
  onChange: (next: PlatformConfig) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [probing, setProbing] = useState(false);
  const [probe, setProbe] = useState<ProbeResult | null>(null);

  const capability = config[id];
  const status = describeCapability(config, id);

  const update = (patch: Partial<CapabilityConfig>) => {
    const next = { ...capability, ...patch };
    // The drafting capability is reached through OpenRouter, whose address is fixed and known:
    // fill it (and the default model) automatically, so the key the administrator types is the
    // only thing they must supply. The capability's mode is NOT set here — the ONE platform-mode
    // control governs every capability at once (owner's instruction).
    if (id === "drafting" || id === "research") {
      next.endpoint = next.endpoint.trim() || OPENROUTER_CHAT_ENDPOINT;
      next.model = next.model.trim() || DEFAULT_DRAFTING_MODEL;
    }
    onChange({
      ...config,
      assessment: id === "assessment" ? next : config.assessment,
      drafting: id === "drafting" ? next : config.drafting,
      research: id === "research" ? next : config.research,
      extraction: id === "extraction" ? next : config.extraction,
    });
    setProbe(null);
  };

  const runProbe = async () => {
    setProbing(true);
    setProbe(await probeEndpoint(capability.endpoint, capability.key));
    setProbing(false);
  };

  return (
    <section className="rounded-lg border bg-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold tracking-tight text-foreground">
            {CAPABILITY_LABELS[id]}
          </h3>
          <p className="text-[10px] text-muted-foreground">{status.detail}</p>
        </div>
        <CapabilityStateBadge status={status} />
      </header>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {id !== "drafting" && id !== "research" && (
          <div className="space-y-1">
            <Label htmlFor={`cap-${id}-endpoint`} className={FIELD_LABEL}>
              Service address
            </Label>
            <Input
              id={`cap-${id}-endpoint`}
              value={capability.endpoint}
              placeholder="Absolute address of the service"
              onChange={(event) => update({ endpoint: event.target.value })}
              className="h-8 text-xs"
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor={`cap-${id}-key`} className={FIELD_LABEL}>
            {id === "drafting" ? "OpenRouter key" : id === "research" ? "ZEPARI OpenRouter key" : "Key"}
          </Label>
          <div className="flex gap-2">
            <Input
              id={`cap-${id}-key`}
              type={revealed ? "text" : "password"}
              value={capability.key}
              onChange={(event) => update({ key: event.target.value })}
              className="h-8 font-mono text-xs"
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 shrink-0 text-[10px]"
              onClick={() => setRevealed((value) => !value)}
            >
              {revealed ? "Hide" : "Show"}
            </Button>
          </div>
        </div>

        {(id === "drafting" || id === "research") && (
          <div className="space-y-1">
            <Label htmlFor={`cap-${id}-model`} className={FIELD_LABEL}>
              {id === "research" ? "Research model" : "Model"}
            </Label>
            <ModelCombobox
              id={`cap-${id}-model`}
              aria-label={id === "research" ? "Research model" : "Model"}
              value={capability.model}
              onChange={(model) => update({ model })}
            />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Search the suggested models, or type any model id OpenRouter offers. The list is a
              suggestion, not a limit.
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-[10px]"
          disabled={probing || !capability.endpoint.trim()}
          onClick={() => void runProbe()}
        >
          {probing ? "Testing…" : "Test connection"}
        </Button>
        {probe && (
          <span className={cn("text-[10px]", probe.ok ? "text-success" : "text-warning")}>
            {probe.detail}
          </span>
        )}
      </div>
    </section>
  );
}
