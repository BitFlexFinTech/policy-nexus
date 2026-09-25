import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { BRAND, SOVEREIGNTY_STATEMENT } from "@/config/brand";
import { REFERENCE_DATE_LABEL, REFERENCE_FISCAL_YEAR } from "@/config/reference";
import { COVERAGE } from "@/lib/coverage";
import coatOfArms from "@/assets/zimbabwe-coat-of-arms.png";

/**
 * ONE shell for both PUBLIC screens — the landing page (`/`) and the department
 * chooser (`/start`). The masthead, the service notice strip and the official
 * footer are defined once, so the two screens cannot drift apart in identity.
 *
 * The workspace has its own shell (`WorkspaceLayout`) because it is
 * department-scoped and sits inside the session guard.
 */
export function PublicPageShell({ children }: { children: ReactNode }) {
  const location = useLocation();

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
      <OfficialMasthead />
      <OfficialNoticeStrip />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">{children}</main>
      <OfficialFooter />
    </div>
  );
}

/**
 * The product wordmark, with the final word in the accent gold. The words come
 * from `BRAND.name` — the split is presentation only, so the product name still
 * has exactly one home in the codebase.
 */
function Wordmark() {
  const [base, ...rest] = BRAND.name.split(" ");
  const accent = rest.join(" ");
  if (!accent) return <>{base}</>;
  return (
    <>
      {base} <span className="text-gold">{accent}</span>
    </>
  );
}

/** State identity first, service identity second, closed by the national rule. */
function OfficialMasthead() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src={coatOfArms}
            alt="Zimbabwe Coat of Arms"
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/75">
              {BRAND.entity}
            </span>
            <span className="text-base font-semibold leading-tight tracking-tight">
              <Wordmark />
            </span>
            <span className="hidden text-[11px] leading-snug text-primary-foreground/75 sm:block">
              {BRAND.platformLabel}
            </span>
          </div>
        </div>
        <span className="hidden text-[11px] uppercase tracking-[0.16em] text-primary-foreground/75 md:inline">
          {BRAND.initiativeShort}
        </span>
      </div>
      <div className="h-[3px] w-full bg-gold" />
    </header>
  );
}

/** What this service is, and the fixed reference frame it is read against. */
function OfficialNoticeStrip() {
  return (
    <div className="border-b bg-primary-tint">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 sm:px-6">
        <span className="rounded-sm border border-primary/30 bg-card px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
          Internal service
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          Decision support for {BRAND.entity} ministries, departments and agencies. Simulation results
          are modelled, and are labelled as simulated wherever they appear.
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>
            Reference date <span className="font-semibold text-foreground">{REFERENCE_DATE_LABEL}</span>
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
function OfficialFooter() {
  return (
    <footer className="border-t border-primary-foreground/10 bg-primary text-primary-foreground">
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
          </nav>

          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">
              Reference frame
            </h2>
            <p className="text-xs leading-relaxed text-primary-foreground/85">
              Fiscal year {REFERENCE_FISCAL_YEAR}
            </p>
            <p className="text-xs leading-relaxed text-primary-foreground/85">
              Prepared against the {REFERENCE_DATE_LABEL} reference date.
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
          </div>
          <p className="text-[10px] text-primary-foreground/75">
            Simulated results · Prepared for decision support
          </p>
        </div>
      </div>
    </footer>
  );
}
