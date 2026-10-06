import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CapabilityEditor } from "@/components/admin/CapabilityEditor";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { SsoEditor } from "@/components/admin/SsoEditor";
import { BRAND } from "@/config/brand";
import {
  ADMIN_ROUTE,
  DEFAULT_PLATFORM_CONFIG,
  getConfig,
  isAnyCapabilityLive,
  isConfigPersistent,
  type PlatformConfig,
} from "@/config/platform";
import { platformConfigActions, usePlatformConfig } from "@/config/usePlatformConfig";
import { clearRuns } from "@/services/assessment/runStore";
import { adminAccessActions } from "@/session/useAdminAccess";
import { clearSession } from "@/session/session";

const SERVICE_CAPABILITIES = ["assessment", "drafting", "extraction", "library"] as const;

/**
 * Platform administration — where capability credentials are entered.
 *
 * HIDDEN BY DESIGN: this screen is not linked from the landing page, the
 * workspace navigation, the header or the footer. It is reached only by typing
 * its address, and its address is defined once in `src/config/platform.ts` so it
 * can be re-homed behind a different URL without touching any other file.
 *
 * It changes nothing until an administrator saves a complete configuration: every
 * capability defaults to simulated, and a half-configured one stays simulated.
 */
export default function PlatformAdmin() {
  const stored = usePlatformConfig();
  const [draft, setDraft] = useState<PlatformConfig>(() => getConfig());
  const [notice, setNotice] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);
  const anyLive = isAnyCapabilityLive(draft);

  const save = () => {
    platformConfigActions.saveConfig(draft);
    setNotice("Configuration saved to this browser.");
  };

  const discard = () => {
    setDraft(getConfig());
    setNotice("Unsaved changes discarded.");
  };

  const clearLocalData = () => {
    platformConfigActions.clearConfig();
    clearRuns();
    clearSession();
    setDraft(DEFAULT_PLATFORM_CONFIG);
    setNotice("Cleared: saved credentials, every recorded run, and the department session.");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <header className="space-y-1 border-b pb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Internal · not linked from any officer screen
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Platform administration
          </h1>
          <p className="max-w-3xl text-xs text-muted-foreground">
            {BRAND.productName} · {BRAND.entityCustodian}. Capability credentials are entered here
            and read by the platform's service seams, and the public landing page's wording, mark
            and tab icon are edited further down. This page is reached only by typing{" "}
            <span className="font-mono text-foreground">{ADMIN_ROUTE}</span>; nothing links to it.
          </p>
        </header>

        <section className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-xs leading-relaxed text-foreground">
          <strong className="font-semibold">How these values are stored.</strong> They are kept in
          this browser's local storage and are readable by anyone with access to this device's
          developer tools. That is acceptable for a pilot; for production the credential must live in
          a server-side proxy and never reach the browser.
          {!isConfigPersistent() && (
            <span className="mt-1 block text-warning">
              This browser refused persistent storage, so these settings last only for this visit.
            </span>
          )}
        </section>

        <section className="rounded-lg border bg-card p-3 text-xs leading-relaxed">
          <strong className="font-semibold">
            {anyLive ? "At least one capability is live." : "Everything is simulated."}
          </strong>{" "}
          {anyLive
            ? "Results may come from an external service. Check each capability's state below."
            : "The platform works end to end — click through every screen — with nothing external. Saving nothing here leaves it exactly as it is."}
        </section>

        {SERVICE_CAPABILITIES.map((id) => (
          <CapabilityEditor key={id} id={id} config={draft} onChange={setDraft} />
        ))}

        <SsoEditor config={draft} onChange={setDraft} />

        <ContentEditor />

        <section className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
          <Button size="sm" className="h-8 text-xs" onClick={save} disabled={!dirty}>
            Save configuration
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={discard}
            disabled={!dirty}
          >
            Discard changes
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={clearLocalData}>
            Clear local data
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={adminAccessActions.lockAdminScreen}
          >
            Lock this screen
          </Button>
          {dirty && (
            <span className="text-[10px] text-warning">
              Unsaved changes — the states above show what is entered.
            </span>
          )}
          {notice && <span className="text-[10px] font-medium text-primary">{notice}</span>}
        </section>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-xs font-semibold tracking-tight text-foreground">
            Before this platform goes live
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
            <li>A service must exist for each capability above. A key alone changes nothing.</li>
            <li>
              Document text extraction for PDF and DOCX is server-side; a browser cannot read those
              formats.
            </li>
            <li>
              A shared document library needs its own server. Until one is configured, a department's
              documents stay in the browser they were added in and are shared with nobody.
            </li>
            <li>
              Sign-in needs an identity-provider registration — issuer, client ID and redirect
              address — not a key.
            </li>
            <li>
              Re-home this screen behind its production address by changing{" "}
              <span className="font-mono text-foreground">ADMIN_ROUTE</span> in{" "}
              <span className="font-mono text-foreground">src/config/platform.ts</span>.
            </li>
            <li>
              Protect this screen with real authorisation once the identity provider is in place.
            </li>
            <li>
              Once a capability is live, outbound requests leave the browser. The officer workspace
              still runs with nothing configured.
            </li>
          </ol>
        </section>

        <footer className="flex flex-wrap items-center gap-3 border-t pt-3 text-[10px] text-muted-foreground">
          <Link to="/" className="font-medium text-primary hover:underline">
            Open the platform →
          </Link>
          <span>{BRAND.classification}</span>
        </footer>
      </div>
    </div>
  );
}

