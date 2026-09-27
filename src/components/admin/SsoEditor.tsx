import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CAPABILITY_LABELS, describeCapability, type PlatformConfig } from "@/config/platform";
import { CapabilityStateBadge } from "./CapabilityEditor";

const FIELD_LABEL = "text-[10px] uppercase tracking-wide text-muted-foreground";

/**
 * Government sign-in. This is configured with an identity provider, not a key:
 * a client ID is public. Until an issuer is registered, sign-in stays the
 * one-click simulated entry the workspace already states.
 */
export function SsoEditor({
  config,
  onChange,
}: {
  config: PlatformConfig;
  onChange: (next: PlatformConfig) => void;
}) {
  const status = describeCapability(config, "sso");
  const sso = config.sso;

  const update = (patch: Partial<typeof sso>) => onChange({ ...config, sso: { ...sso, ...patch } });

  return (
    <section className="rounded-lg border bg-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold tracking-tight text-foreground">
            {CAPABILITY_LABELS.sso}
          </h3>
          <p className="text-[10px] text-muted-foreground">{status.detail}</p>
        </div>
        <div className="flex items-center gap-3">
          <CapabilityStateBadge status={status} />
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Switch
              checked={sso.mode === "live"}
              onCheckedChange={(checked) => update({ mode: checked ? "live" : "simulated" })}
              aria-label="Government sign-in runs live"
            />
            Live
          </span>
        </div>
      </header>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="sso-issuer" className={FIELD_LABEL}>
            Issuer address
          </Label>
          <Input
            id="sso-issuer"
            value={sso.issuer}
            placeholder="Absolute address of the identity provider"
            onChange={(event) => update({ issuer: event.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sso-client" className={FIELD_LABEL}>
            Client ID (public, not a secret)
          </Label>
          <Input
            id="sso-client"
            value={sso.clientId}
            onChange={(event) => update({ clientId: event.target.value })}
            className="h-8 font-mono text-xs"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="sso-redirect" className={FIELD_LABEL}>
            Redirect address
          </Label>
          <Input
            id="sso-redirect"
            value={sso.redirectUri}
            placeholder="Where the provider returns the officer"
            onChange={(event) => update({ redirectUri: event.target.value })}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        Registering this address with the provider is part of the identity-provider setup, not
        something this screen can do.{" "}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px]"
          onClick={() => update({ issuer: "", clientId: "", redirectUri: "", mode: "simulated" })}
        >
          Clear sign-in settings
        </Button>
      </p>
    </section>
  );
}
