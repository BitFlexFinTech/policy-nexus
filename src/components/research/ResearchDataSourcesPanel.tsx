import { useState, useSyncExternalStore } from "react";
import { Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatReferenceDate } from "@/config/reference";
import { usePlatformConfig } from "@/config/usePlatformConfig";
import {
  getResearchDataSourcesServerSnapshot,
  getResearchDataSourcesSnapshot,
  isResearchDataSourceStorePersistent,
  subscribeToResearchDataSources,
} from "@/services/research/researchDataSources";
import { researchConnectorStoreFor } from "@/services/research/researchConnectorStore";

/**
 * ZEPARI's data sources — the institution data-connectors (ZEPARI Batch D).
 *
 * The owner's decision: the research assistant reads figures from the institute's own data sources.
 * ZEPARI's administrator records those sources here (a name, the source's address, and what it
 * provides). This surface keeps NO figures: nothing is read from a source until ZEPARI's own server
 * is connected, and it says so plainly, so the platform never invents a source or a figure. The
 * strict boundary holds too — no figure from here ever reaches the policy-simulation engine.
 */
export function ResearchDataSourcesPanel() {
  const config = usePlatformConfig();
  const store = researchConnectorStoreFor(config);
  useSyncExternalStore(
    subscribeToResearchDataSources,
    getResearchDataSourcesSnapshot,
    getResearchDataSourcesServerSnapshot,
  );
  const sources = store.list();

  const [notices, setNotices] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [provides, setProvides] = useState("");

  const add = async () => {
    const cleanName = name.trim();
    const cleanAddress = address.trim();
    const cleanProvides = provides.trim();
    if (!cleanName || !cleanAddress) {
      setNotices(["A data source needs both a name and its address."]);
      return;
    }
    try {
      await store.add({ name: cleanName, address: cleanAddress, provides: cleanProvides });
      setName("");
      setAddress("");
      setProvides("");
      setNotices([`${cleanName} — recorded. No figure is read from it yet.`]);
    } catch (error) {
      setNotices([
        `${cleanName} — this browser recorded it, but the shared server did not accept it (${
          error instanceof Error ? error.message : "unknown error"
        }).`,
      ]);
    }
  };

  const reportFailure = (error: unknown) =>
    setNotices([
      `This browser updated the list, but the shared server did not accept the change (${
        error instanceof Error ? error.message : "unknown error"
      }).`,
    ]);

  return (
    <section aria-labelledby="research-sources-heading" className="rounded-lg border bg-card p-4 sm:p-5">
      <h2
        id="research-sources-heading"
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Data sources (institution data-connectors)
      </h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        The institute's own data sources, recorded by ZEPARI's administrator. {sources.length}{" "}
        {sources.length === 1 ? "source is" : "sources are"} recorded. No figures are read from them
        yet — reading starts when ZEPARI's own server is connected.
      </p>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Kept on: {store.label}.</span> {store.limitation}
        {isResearchDataSourceStorePersistent()
          ? ""
          : " This browser refused to keep data between visits, so they last only until this page is closed."}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Name</span>
          <Input
            value={name}
            placeholder="e.g. ZEPARI Economic Barometer"
            onChange={(event) => setName(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Address</span>
          <Input
            value={address}
            placeholder="The source's address"
            onChange={(event) => setAddress(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            What it provides
          </span>
          <Input
            value={provides}
            placeholder="e.g. quarterly economic indicators"
            onChange={(event) => setProvides(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void add()}>
          Add this source
        </Button>
      </div>

      {notices.length > 0 && (
        <ul className="mt-3 space-y-1" aria-live="polite">
          {notices.map((notice) => (
            <li key={notice} className="text-[10px] leading-relaxed text-muted-foreground">
              {notice}
            </li>
          ))}
        </ul>
      )}

      {sources.length > 0 && (
        <ul className="mt-3 space-y-1">
          {sources.map((source) => (
            <li
              key={source.id}
              className="flex items-start justify-between gap-3 rounded-md border bg-background px-3 py-2"
            >
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 truncate text-xs text-foreground">
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {source.name}
                </span>
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  {source.address}
                </span>
                {source.provides && (
                  <span className="text-[10px] text-muted-foreground">{source.provides}</span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  Recorded {formatReferenceDate(source.addedAt)}
                </span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 shrink-0 text-[10px]"
                aria-label={`Remove ${source.name}`}
                onClick={() => void store.remove(source.id).catch(reportFailure)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
