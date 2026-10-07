import { useState, useSyncExternalStore } from "react";
import { Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlatformConfig } from "@/config/usePlatformConfig";
import {
  getResearchBarometerServerSnapshot,
  getResearchBarometerSnapshot,
  isResearchBarometerStorePersistent,
  subscribeToResearchBarometer,
  type BarometerReading,
} from "@/services/research/researchBarometer";
import { researchBarometerStoreFor } from "@/services/research/researchBarometerStore";

/**
 * The Economic Barometer (ZEPARI Batch G).
 *
 * The institute's own economic indicators, tracked over time. A reading is one figure for one
 * indicator in one period, and it MUST name the body that published it — so the barometer never shows
 * a figure without its source. ZEPARI's own records, kept in this browser for now, behind a swap-in
 * seam. Nothing here reaches the simulation engine.
 */
export function ResearchBarometerPanel() {
  const config = usePlatformConfig();
  const store = researchBarometerStoreFor(config);
  useSyncExternalStore(
    subscribeToResearchBarometer,
    getResearchBarometerSnapshot,
    getResearchBarometerServerSnapshot,
  );
  const readings = store.list();

  const [notices, setNotices] = useState<string[]>([]);
  const [indicator, setIndicator] = useState("");
  const [period, setPeriod] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [source, setSource] = useState("");

  const add = async () => {
    const cleanIndicator = indicator.trim();
    const cleanPeriod = period.trim();
    const cleanValue = value.trim();
    const cleanSource = source.trim();
    if (!cleanIndicator || !cleanPeriod || !cleanValue || !cleanSource) {
      setNotices([
        "A reading needs an indicator, a period, a figure AND the body that published it — a figure is never recorded without its source.",
      ]);
      return;
    }
    try {
      await store.add({
        indicator: cleanIndicator,
        period: cleanPeriod,
        value: cleanValue,
        unit: unit.trim(),
        source: cleanSource,
      });
      setIndicator("");
      setPeriod("");
      setValue("");
      setUnit("");
      setSource("");
      setNotices([`${cleanIndicator} (${cleanPeriod}) — recorded.`]);
    } catch (error) {
      setNotices([
        `This browser recorded it, but the barometer server did not accept it (${
          error instanceof Error ? error.message : "unknown error"
        }).`,
      ]);
    }
  };

  const reportFailure = (error: unknown) =>
    setNotices([
      `This browser updated the barometer, but the server did not accept the change (${
        error instanceof Error ? error.message : "unknown error"
      }).`,
    ]);

  // Group the readings by indicator, so the barometer reads as a set of tracked series.
  const groups = Array.from(
    readings.reduce((map, reading) => {
      const list = map.get(reading.indicator) ?? [];
      list.push(reading);
      map.set(reading.indicator, list);
      return map;
    }, new Map<string, BarometerReading[]>()),
  ).map(([name, entries]) => ({ name, entries }));

  return (
    <section aria-labelledby="research-barometer-heading" className="rounded-lg border bg-card p-4 sm:p-5">
      <h2
        id="research-barometer-heading"
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
        Economic Barometer
      </h2>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        ZEPARI's own economic indicators, tracked over time. Every figure names the body that published
        it, so the barometer never shows a number without its source.{" "}
        {groups.length} {groups.length === 1 ? "indicator is" : "indicators are"} tracked.
      </p>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Kept on: {store.label}.</span> {store.limitation}
        {isResearchBarometerStorePersistent()
          ? ""
          : " This browser refused to keep data between visits, so they last only until this page is closed."}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.6fr)_minmax(0,1.2fr)_auto] sm:items-end">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Indicator</span>
          <Input
            value={indicator}
            placeholder="e.g. Headline inflation"
            onChange={(event) => setIndicator(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Period</span>
          <Input
            value={period}
            placeholder="e.g. 2026 Q1"
            onChange={(event) => setPeriod(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Figure</span>
          <Input
            value={value}
            placeholder="e.g. 12.4"
            onChange={(event) => setValue(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Unit</span>
          <Input
            value={unit}
            placeholder="%"
            onChange={(event) => setUnit(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Source</span>
          <Input
            value={source}
            placeholder="e.g. ZIMSTAT CPI, 2026 Q1"
            onChange={(event) => setSource(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </label>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void add()}>
          Add this reading
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

      {groups.length > 0 && (
        <div className="mt-3 space-y-3">
          {groups.map((group) => (
            <div key={group.name} className="rounded-md border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold tracking-tight text-foreground">{group.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {group.entries.length} {group.entries.length === 1 ? "reading" : "readings"}
                </span>
              </div>
              <ul className="mt-1 space-y-1">
                {group.entries.map((reading) => (
                  <li key={reading.id} className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs text-foreground">
                        {reading.period}: {reading.value}
                        {reading.unit ? ` ${reading.unit}` : ""}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{reading.source}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 shrink-0 text-[10px]"
                      aria-label={`Remove ${group.name} ${reading.period}`}
                      onClick={() => void store.remove(reading.id).catch(reportFailure)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px]"
            onClick={() => void store.clear().catch(reportFailure)}
          >
            Remove all
          </Button>
        </div>
      )}
    </section>
  );
}
