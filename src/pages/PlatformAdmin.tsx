import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CapabilityEditor } from "@/components/admin/CapabilityEditor";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { PlatformOverview } from "@/components/admin/PlatformOverview";
import { SsoEditor } from "@/components/admin/SsoEditor";
import { SupportInbox } from "@/components/admin/SupportInbox";
import { BRAND } from "@/config/brand";
import {
  ADMIN_ROUTE,
  DEFAULT_PLATFORM_CONFIG,
  getConfig,
  isAnyCapabilityLive,
  isConfigPersistent,
  type PlatformConfig,
} from "@/config/platform";
import { SUPPORT_DESK_LIMITATION } from "@/config/support";
import { platformConfigActions, usePlatformConfig } from "@/config/usePlatformConfig";
import { clearAllBrowserData } from "@/lib/browserData";
import { adminAccessActions } from "@/session/useAdminAccess";

/**
 * The capability cards kept on this screen (owner's instructions, demo).
 *
 * Two OpenRouter cards stay because their keys are typed in by hand and are the real services
 * usable now: the **drafting** key (the Nzwisiso policy drafter) and the **research** key (the
 * ZEPARI research assistant), entered separately so each assistant's usage is metered against its
 * own key. The other service cards are removed: their addresses are fixed and live in
 * configuration, and the ONE platform-mode control governs every service at once. Government
 * sign-in is deliberately left as it is.
 */
const SERVICE_CAPABILITIES = ["drafting", "research"] as const;

/**
 * Platform administration — where capability credentials are entered.
 *
 * REACHED FROM THE FOOTER, PROTECTED BY THE GATE: the public footer carries one discreet
 * link here (owner's instruction, 2026-10-06 — an administrator must be able to find their
 * own screen), and the route sits behind `AdminGate`, which asks "Are you the administrator?"
 * before showing the settings. The address is defined once in `src/config/platform.ts`, so it
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
  const live = draft.platformMode === "live";

  /**
   * The ONE master switch (owner's rule, 2026-10-06). It sets the whole platform — every
   * capability at once — and takes effect immediately, so there is no hunting across five
   * separate switches. Simulated runs the scenario engine and shows its results; Live uses only
   * real services and shows nothing (a clear "not connected" state) where one is missing.
   */
  const setMode = (nextLive: boolean) => {
    const next = platformConfigActions.setPlatformMode(nextLive ? "live" : "simulated");
    setDraft(next);
    setNotice(
      nextLive
        ? "Platform mode: Live. Nothing is simulated; a service that is not connected shows nothing."
        : "Platform mode: Simulated. The platform runs on its own scenario engine.",
    );
  };

  const save = () => {
    platformConfigActions.saveConfig(draft);
    setNotice("Configuration saved to this browser.");
  };

  const discard = () => {
    setDraft(getConfig());
    setNotice("Unsaved changes discarded.");
  };

  /**
   * Forgets everything this browser saved for the platform, in one click. The owner's instruction
   * (2026-10-06): if legacy data ever causes trouble, the administrator can reset the browser
   * themselves rather than being stranded. The one place that composes the reset is
   * `src/lib/browserData.ts`, so this handler cannot fall out of step with the stores.
   */
  const clearBrowserData = () => {
    clearAllBrowserData();
    setDraft(DEFAULT_PLATFORM_CONFIG);
    setNotice(
      "Cleared this browser's saved data: credentials, the department session, every recorded run, " +
        "every added document, every saved draft and note, and every support case. The page is back " +
        "to how it ships.",
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <header className="space-y-1 border-b pb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Internal · reached from the site footer, protected by the administrator gate
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Platform administration
          </h1>
          <p className="max-w-3xl text-xs text-muted-foreground">
            {BRAND.productName} · {BRAND.entityCustodian}. Capability credentials are entered here
            and read by the platform's service seams, and the public landing page's wording, mark
            and tab icon are edited further down. It is reached from the site footer (and by typing{" "}
            <span className="font-mono text-foreground">{ADMIN_ROUTE}</span>), and the administrator
            gate asks one question before it will show these settings.
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

        <section className="rounded-lg border border-primary/30 bg-primary-tint p-3 text-xs leading-relaxed text-foreground">
          <strong className="font-semibold">The demonstration keys are already saved in this build.</strong>{" "}
          Both assistants — the {BRAND.productName} policy drafter and the ZEPARI research assistant —
          are live the moment the site opens: their keys are built into this copy of the platform, so
          nothing is typed in before a demonstration. This screen stays available if a key ever needs
          changing.
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
              Platform mode
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                {live ? "Live" : "Simulated"}
              </span>
            </h2>
            <p className="mt-0.5 max-w-2xl text-[10px] leading-relaxed text-muted-foreground">
              {live
                ? "Live: the platform uses only real services. Nothing is simulated, and any service that is not connected shows nothing rather than an invented result."
                : "Simulated: the platform runs its own scenario engine and shows its results, plainly labelled as simulated."}
            </p>
          </div>
          <span className="flex items-center gap-2 text-xs text-foreground">
            <Switch checked={live} onCheckedChange={setMode} aria-label="Platform mode is live" />
            {live ? "Live" : "Simulated"}
          </span>
        </section>

        <PlatformOverview />

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

        <SupportInbox limitation={SUPPORT_DESK_LIMITATION} />

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
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={clearBrowserData}
            title="Forgets everything this browser saved for the platform, in one click."
          >
            Clear this browser's saved data
          </Button>
          <span className="w-full text-[10px] leading-snug text-muted-foreground">
            One click. Forgets every credential, run, document, draft and support case this browser
            holds, and signs the department out — so data left behind by an earlier build cannot
            cause trouble. This screen's own administrator answer for the tab is kept.
          </span>
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

