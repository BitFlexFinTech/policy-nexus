import { useEffect, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { BRAND, PROMOTER, SOVEREIGNTY_STATEMENT, WORDMARK } from "@/config/brand";
import { REFERENCE_FISCAL_YEAR } from "@/config/reference";
import { ADMIN_ROUTE } from "@/config/platform";
import { formatClock, useNow } from "@/lib/clock";
import { COVERAGE } from "@/lib/coverage";
import { logoSrc } from "@/config/content";
import { useContent } from "@/config/useContent";
import { cn } from "@/lib/utils";
import coatOfArms from "@/assets/zimbabwe-coat-of-arms.png";

/**
 * ONE shell for the PUBLIC screens, with TWO colour identities (owner's instruction, 2026-10-07):
 * the department/policy tool wears the emerald State palette (`accent="emerald"`, the default), and
 * the PLATFORM HOME wears Zimbabwe GOLD (`accent="gold"`) — so opening the home page and opening a
 * tool are visibly different things, not the same page frame reused. Both identities are drawn from
 * the tokens already in `src/index.css`; no new colour is introduced.
 *
 * `hero` is an optional full-width band rendered at the very top of the page, directly under the
 * masthead. The home page uses it for its gold service-card band, which sits above the content and
 * so does not disturb it.
 */
type Accent = "emerald" | "gold";

/**
 * The colour of the shell's dark surfaces, per identity. The gold identity paints the masthead and
 * hero band in the brand gold and the footer in the flag's black, with the text variables overridden
 * INLINE on those wrappers (they inherit to every child), so not one inner class has to change.
 */
const SURFACE = {
  emerald: {
    masthead: "bg-primary",
    mastheadText: undefined as CSSProperties | undefined,
    rule: "bg-gold",
    strip: "bg-primary-tint",
    chip: "border-primary/30 text-primary",
    footer: "bg-primary",
    footerText: undefined as CSSProperties | undefined,
    wordmarkSuffix: "text-gold",
  },
  gold: {
    masthead: "bg-gold",
    /* Black text on the brand gold — the flag's gold-and-black. */
    mastheadText: { "--primary-foreground": "0 0% 10%" } as CSSProperties,
    /* A black rule under a gold masthead (a gold rule would be invisible on gold). */
    rule: "bg-gold-foreground",
    strip: "bg-gold/15",
    chip: "border-gold-foreground/30 text-gold-foreground",
    /* The flag's black, with gold text. */
    footer: "bg-gold-foreground",
    footerText: { "--primary-foreground": "45 100% 60%" } as CSSProperties,
    wordmarkSuffix: "text-gold-foreground",
  },
} as const;

export function PublicPageShell({
  children,
  accent = "emerald",
  hero,
}: {
  children: ReactNode;
  accent?: Accent;
  hero?: ReactNode;
}) {
  const location = useLocation();
  const content = useContent();
  const surface = SURFACE[accent];

  // Section links such as `/#capabilities` must land on the section even when they
  // are followed from the other public screen: a browser only scrolls to a hash on
  // a document load, so a client-side navigation needs this.
  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target) target.scrollIntoView({ block: "start" });
  }, [location]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OfficialMasthead
        markSrc={logoSrc(content, coatOfArms)}
        atHome={location.pathname === "/"}
        surface={surface}
      />
      <OfficialNoticeStrip surface={surface} />
      {hero}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <OfficialFooter surface={surface} />
    </div>
  );
}

/**
 * The product wordmark, with the final word in the accent gold. The words come
 * from `BRAND.name` — the split is presentation only, so the product name still
 * has exactly one home in the codebase.
 */
function Wordmark({ suffixClass = "text-gold" }: { suffixClass?: string }) {
  return (
    <>
      {WORDMARK.base} <span className={suffixClass}>{WORDMARK.suffix}</span>
    </>
  );
}

/** State identity first, service identity second, closed by the national rule. */
function OfficialMasthead({
  markSrc,
  atHome,
  surface,
}: {
  markSrc: string;
  atHome: boolean;
  surface: (typeof SURFACE)[Accent];
}) {
  return (
    <header
      className={cn("text-primary-foreground", surface.masthead)}
      style={surface.mastheadText}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src={markSrc}
            alt="Zimbabwe Coat of Arms"
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/75">
              {BRAND.entity}
            </span>
            <span className="text-base font-semibold leading-tight tracking-tight">
              <Wordmark suffixClass={surface.wordmarkSuffix} />
            </span>
            <span className="hidden text-[11px] leading-snug text-primary-foreground/75 sm:block">
              {BRAND.platformLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-[11px] uppercase tracking-[0.16em] text-primary-foreground/75 md:inline">
            {BRAND.initiativeShort}
          </span>
          {/* The way home for a tool page (owner's instruction, 2026-10-07): shown on every public
              page EXCEPT the platform home itself. It lives in the masthead so it costs NO height in
              the page's content — the tool landing's primary action must stay on a phone's first
              screen, which the browser test measures. */}
          {!atHome && (
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary-foreground underline-offset-4 hover:underline"
            >
              ← Back to home
            </Link>
          )}
        </div>
      </div>
      <div className={cn("h-[3px] w-full", surface.rule)} />
    </header>
  );
}

/** What this service is, and the live date plus the fixed reference frame it is read
 *  against. The reference date is the frame the platform's figures are computed for;
 *  "Today" is the real date and time, so a reader can always see when they are looking. */
function OfficialNoticeStrip({ surface }: { surface: (typeof SURFACE)[Accent] }) {
  const now = useNow();
  return (
    <div className={cn("border-b", surface.strip)}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 sm:px-6">
        <span
          className={cn(
            "rounded-sm border bg-card px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            surface.chip,
          )}
        >
          Internal service
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          Decision support for {BRAND.entity} ministries, departments and agencies. Simulation results
          are modelled, and are labelled as simulated wherever they appear.
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {/* The live date. Hidden on the narrowest phones only, where the strip already
              wraps; it is always shown from the small breakpoint up, and the footer carries
              it on every width. Keeps the phone's primary action above the fold. */}
          <span className="hidden sm:inline">
            Today <span className="font-semibold text-foreground">{formatClock(now)}</span>
          </span>
          <span>
            Fiscal year <span className="font-semibold text-foreground">{REFERENCE_FISCAL_YEAR}</span>
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * The official footer. It names the accountable body (the attribution line) and
 * states who may see the service (the classification), which is rendered smaller
 * than the attribution — the two are a pair and their relative size is asserted
 * in both the unit and the browser tests.
 */
function OfficialFooter({ surface }: { surface: (typeof SURFACE)[Accent] }) {
  const now = useNow();
  return (
    <footer
      className={cn("border-t border-primary-foreground/10 text-primary-foreground", surface.footer)}
      style={surface.footerText}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <img
              src={coatOfArms}
              alt=""
              aria-hidden="true"
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div>
              <p className="text-sm font-semibold tracking-tight">
                <Wordmark />
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-primary-foreground/75">
                {BRAND.productName}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-primary-foreground/75">
                {BRAND.entity}
              </p>
            </div>
          </div>

          <nav aria-label="Platform" className="flex flex-col gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">
              Platform
            </h2>
            <Link
              to="/"
              className="text-xs text-primary-foreground/85 underline-offset-4 hover:underline"
            >
              Overview
            </Link>
            <Link
              to="/#capabilities"
              className="text-xs text-primary-foreground/85 underline-offset-4 hover:underline"
            >
              What this platform does
            </Link>
            <Link
              to="/#how-it-works"
              className="text-xs text-primary-foreground/85 underline-offset-4 hover:underline"
            >
              How it works
            </Link>
            <Link
              to="/start"
              className="text-xs text-primary-foreground/85 underline-offset-4 hover:underline"
            >
              Choose your Department
            </Link>
            <Link
              to="/research"
              className="text-xs text-primary-foreground/85 underline-offset-4 hover:underline"
            >
              ZEPARI research assistant
            </Link>
          </nav>

          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">
              Reference frame
            </h2>
            <p className="text-xs leading-relaxed text-primary-foreground/85">
              Today {formatClock(now)}
            </p>
            <p className="text-xs leading-relaxed text-primary-foreground/85">
              Fiscal year {REFERENCE_FISCAL_YEAR}
            </p>
            <p className="text-xs leading-relaxed text-primary-foreground/85">
              {COVERAGE.departments} departments · {COVERAGE.groups} stakeholder groups
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">
              Administration
            </h2>
            <p className="text-xs leading-relaxed text-primary-foreground/85">
              {BRAND.entityCustodian}
            </p>
            <p className="text-xs leading-relaxed text-primary-foreground/75">
              Methodology and limitations are published in the workspace reference section.
            </p>
            <Link
              to={ADMIN_ROUTE}
              className="text-xs text-primary-foreground/85 underline-offset-4 hover:underline"
            >
              Platform administration
            </Link>
          </div>
        </div>

        <p className="mt-8 border-t border-primary-foreground/15 pt-5 text-[10px] leading-relaxed text-primary-foreground/75">
          {SOVEREIGNTY_STATEMENT}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-tight">{BRAND.attribution}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-primary-foreground/75">
              {BRAND.classification}
            </p>
            <p className="mt-1 text-[9px] leading-relaxed text-primary-foreground/75">
              {PROMOTER.line}
            </p>
          </div>
          <p className="text-[10px] text-primary-foreground/75">
            Simulated results · Prepared for decision support
          </p>
        </div>

        {/* The copyright line, centred (owner's item 2, 2026-10-07). */}
        <p className="mt-4 border-t border-primary-foreground/15 pt-4 text-center text-[10px] tracking-wide text-primary-foreground/75">
          {PROMOTER.copyright}
        </p>
      </div>
    </footer>
  );
}
