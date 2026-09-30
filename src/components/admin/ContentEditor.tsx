import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import coatOfArms from "@/assets/zimbabwe-coat-of-arms.png";
import {
  CONTENT_FIELDS,
  CONTENT_GROUPS,
  DEFAULT_CONTENT,
  MAX_BRAND_ASSET_CHARS,
  contentDefault,
  getContent,
  isContentPersistent,
  isFieldOverridden,
  normaliseContent,
  type ContentOverride,
} from "@/config/content";
import { contentActions } from "@/config/useContent";

const FIELD_LABEL = "text-[10px] uppercase tracking-wide text-muted-foreground";

const LOCKED_REASON =
  "Read-only: the brief, a test, or the platform's own legal position pins this wording. " +
  "Changing it is a deliberate decision made in the code, not from this screen.";

/** Only the fields that carry editable wording. */
const EDITABLE_GROUPS = CONTENT_GROUPS.filter((group) => group !== "Fixed wording (read-only)");

const sameContent = (a: ContentOverride, b: ContentOverride) =>
  JSON.stringify(normaliseContent(a)) === JSON.stringify(normaliseContent(b));

/**
 * The landing-page content editor. An administrator rewrites the page's own
 * wording, and may replace the mark shown in the masthead and the browser-tab icon.
 * Nothing changes until Save is pressed, and the shipped wording is always one
 * Reset away.
 *
 * It deliberately cannot reach the identity strings, the fixed sentences or the
 * official Coat of Arms file — those are shown read-only, with the reason, so the
 * boundary is visible rather than surprising.
 */
export function ContentEditor() {
  const [draft, setDraft] = useState<ContentOverride>(() => getContent());
  const [notice, setNotice] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const faviconInput = useRef<HTMLInputElement>(null);

  const dirty = !sameContent(draft, getContent());

  const setText = (id: string, value: string) =>
    setDraft((prev) => ({ ...prev, text: { ...prev.text, [id]: value } }));

  const resetText = (id: string) =>
    setDraft((prev) => {
      const text = { ...prev.text };
      delete text[id];
      return { ...prev, text };
    });

  /** Read an uploaded image into a data address. Anything unusable changes nothing. */
  const readAsset = (file: File | undefined, apply: (dataUrl: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice(`${file.name} is not an image file — nothing was changed.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result || result.length > MAX_BRAND_ASSET_CHARS) {
        setNotice(
          `${file.name} is too large to keep (limit ${Math.round(MAX_BRAND_ASSET_CHARS / 1024)} KB) — nothing was changed.`,
        );
        return;
      }
      apply(result);
      setNotice(`${file.name} is ready — press Save to keep it.`);
    };
    reader.onerror = () => setNotice(`${file.name} could not be read — nothing was changed.`);
    reader.readAsDataURL(file);
  };

  const save = () => {
    contentActions.saveContent(draft);
    setDraft(getContent());
    setNotice("Saved to this browser. Open the landing page to see it.");
  };

  const discard = () => {
    setDraft(getContent());
    setNotice("Unsaved changes discarded.");
  };

  const clearAll = () => {
    contentActions.clearContent();
    setDraft(DEFAULT_CONTENT);
    if (logoInput.current) logoInput.current.value = "";
    if (faviconInput.current) faviconInput.current.value = "";
    setNotice("Every change removed — the page is back to the wording it ships with.");
  };

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <header className="space-y-1">
        <h2 className="text-xs font-semibold tracking-tight text-foreground">
          Landing page content
        </h2>
        <p className="max-w-3xl text-[10px] leading-relaxed text-muted-foreground">
          The wording your public landing page shows, the mark in its masthead, and the browser-tab
          icon. Changes are kept in this browser and are read by the page immediately. Nothing here
          changes a simulation result.{" "}
          {!isContentPersistent() && (
            <span className="text-warning">
              This browser refused persistent storage, so a change lasts only for this visit.
            </span>
          )}
        </p>
      </header>

      {EDITABLE_GROUPS.map((group) => (
        <div key={group} className="space-y-2 rounded-lg border bg-background/40 p-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-primary">{group}</h3>
          {CONTENT_FIELDS.filter((field) => field.group === group).map((field) => {
            const value = draft.text[field.id] ?? contentDefault(field.id);
            const overridden = isFieldOverridden(draft, field.id);
            return (
              <div key={field.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`content-${field.id}`} className={FIELD_LABEL}>
                    {field.label}
                  </Label>
                  {overridden && (
                    <button
                      type="button"
                      onClick={() => resetText(field.id)}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      Reset to shipped wording
                    </button>
                  )}
                </div>
                {field.multiline ? (
                  <Textarea
                    id={`content-${field.id}`}
                    value={value}
                    rows={3}
                    onChange={(event) => setText(field.id, event.target.value)}
                    className="min-h-0 text-xs"
                  />
                ) : (
                  <Input
                    id={`content-${field.id}`}
                    value={value}
                    onChange={(event) => setText(field.id, event.target.value)}
                    className="h-8 text-xs"
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}


      <div className="space-y-3 rounded-lg border bg-background/40 p-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-primary">Brand marks</h3>

        <div className="flex flex-wrap items-center gap-3">
          <img
            src={draft.logo || coatOfArms}
            alt="The mark shown in the masthead"
            className="h-12 w-12 rounded border border-border object-contain p-0.5"
          />
          <div className="min-w-[16rem] flex-1 space-y-1">
            <Label htmlFor="content-logo" className={FIELD_LABEL}>
              Masthead mark (PNG, JPG or SVG)
            </Label>
            <Input
              id="content-logo"
              ref={logoInput}
              type="file"
              accept="image/*"
              className="h-8 text-xs"
              onChange={(event) =>
                readAsset(event.target.files?.[0], (dataUrl) =>
                  setDraft((prev) => ({ ...prev, logo: dataUrl })),
                )
              }
            />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              The default is the official Coat of Arms. The official file itself is never altered —
              clear this to return to it.
            </p>
          </div>
          {draft.logo && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[10px]"
              onClick={() => setDraft((prev) => ({ ...prev, logo: "" }))}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded border border-border p-0.5">
            <img
              src={draft.favicon || "/favicon-32.png"}
              alt="The browser-tab icon"
              className="h-6 w-6 object-contain"
            />
          </span>
          <div className="min-w-[16rem] flex-1 space-y-1">
            <Label htmlFor="content-favicon" className={FIELD_LABEL}>
              Browser-tab icon (PNG, JPG or SVG)
            </Label>
            <Input
              id="content-favicon"
              ref={faviconInput}
              type="file"
              accept="image/*"
              className="h-8 text-xs"
              onChange={(event) =>
                readAsset(event.target.files?.[0], (dataUrl) =>
                  setDraft((prev) => ({ ...prev, favicon: dataUrl })),
                )
              }
            />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Replaces the tab icon on every screen. The iOS home-screen tile is left as it is.
            </p>
          </div>
          {draft.favicon && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[10px]"
              onClick={() => setDraft((prev) => ({ ...prev, favicon: "" }))}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 rounded-lg border bg-background/40 p-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Fixed wording (read-only)
        </h3>
        <p className="text-[10px] leading-relaxed text-muted-foreground">{LOCKED_REASON}</p>
        {CONTENT_FIELDS.filter((field) => field.locked).map((field) => (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={`content-${field.id}`} className={FIELD_LABEL}>
              {field.label}
            </Label>
            <Textarea
              id={`content-${field.id}`}
              value={field.default}
              readOnly
              rows={3}
              className="min-h-0 cursor-not-allowed bg-muted text-xs text-muted-foreground"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <Button size="sm" className="h-8 text-xs" onClick={save} disabled={!dirty}>
          Save content
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={discard} disabled={!dirty}>
          Discard changes
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={clearAll}>
          Reset everything
        </Button>
        {dirty && (
          <span className="text-[10px] text-warning">
            Unsaved changes — the boxes show what is entered.
          </span>
        )}
        {notice && <span className={cn("text-[10px] font-medium text-primary")}>{notice}</span>}
      </div>
    </section>
  );
}

