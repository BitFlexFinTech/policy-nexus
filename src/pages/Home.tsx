import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ClipboardCheck, FileText, Play, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepartmentGrid } from "@/components/departments/DepartmentGrid";
import { BRAND, DISCLAIMER, SOVEREIGNTY_STATEMENT, VOCABULARY } from "@/config/brand";
import {
  REFERENCE_DATE_LABEL,
  REFERENCE_FISCAL_YEAR,
  STAKEHOLDER_SEGMENTS,
} from "@/config/reference";
import {
  DEPARTMENT_COUNT,
  DEPARTMENTS,
  findDepartment,
  type DepartmentId,
} from "@/config/departments";
import { sessionActions, useSession } from "@/session/useSession";
import coatOfArms from "@/assets/zimbabwe-coat-of-arms.png";

/**
 * Coverage figures are DERIVED from the configuration, never written by hand, so
 * this page can never claim more coverage than the platform actually holds.
 */
const COVERAGE = {
  departments: DEPARTMENT_COUNT,
  groups: STAKEHOLDER_SEGMENTS.length,
  indicators: DEPARTMENTS.reduce((total, department) => total + department.indicators.length, 0),
  drafts: DEPARTMENTS.reduce((total, department) => total + department.policyTemplates.length, 0),
};

/** What the platform does — four capabilities, in the order a user meets them. */
const CAPABILITIES = [
  {
    icon: Users,
    title: "Model the national picture",
    body: "Every department carries its own stated priorities, published reference indicators, stakeholder groups and prepared policy drafts, so a measure is read against the context it actually lands in.",
  },
  {
    icon: Play,
    title: "Simulate before you commit",
    body: "The simulation core models how each stakeholder group responds and where the pressure points sit. The same department and the same draft always reproduce the identical result.",
  },
  {
    icon: ClipboardCheck,
    title: "Read the assessment",
    body: "A short executive summary for decisions, a full assessment for the detail, and a long-form report that records the working behind every figure.",
  },
  {
    icon: FileText,
    title: "Draft the policy itself",
    body: "The run also drafts the instrument: operative measures, risk mitigation, engagement, transitional and monitoring provisions — editable, and exportable to Word, PDF or print.",
  },
];

/** The three steps of a run, matching the journey in the workspace. */
const STEPS = [
  {
    title: "Provide the draft policy",
    body: "Paste the text, start from a draft the department has already prepared, or upload a PDF, DOCX or TXT file.",
  },
  {
    title: "Run the simulation",
    body: "The simulation core models every stakeholder group the department defines, over a stated horizon, from a seeded and reproducible process.",
  },
  {
    title: "Read the result and draft the policy",
    body: "Open the executive summary, the full assessment or the long-form report — then edit the drafted policy and export it.",
  },
];

/**
 * Public entry screen. Selecting a department enters the workspace for it; the
 * choice is stored in the session, so it survives navigation and reload.
 */
const Home = () => {
  const navigate = useNavigate();
  const session = useSession();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const selectedId = pendingId ?? session?.departmentId ?? null;
  const selectedDepartment = findDepartment(selectedId ?? undefined);

  const enterWorkspace = (departmentId: DepartmentId) => {
    const created = sessionActions.signInToDepartment(departmentId);
    if (!created) return;
    navigate("/app");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Official masthead: state identity first, service identity second. */}
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src={coatOfArms}
              alt="Zimbabwe Coat of Arms"
              className="h-10 w-10 shrink-0 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-primary-foreground/70">
                {BRAND.entity}
              </span>
              <span className="text-base font-semibold leading-tight tracking-tight">
                Nzwisiso<span className="text-gold"> AI</span>
              </span>
              <span className="hidden text-[10px] leading-tight text-primary-foreground/70 sm:block">
                {BRAND.productName}
              </span>
            </div>
          </div>
          <span className="hidden text-[10px] uppercase tracking-[0.16em] text-primary-foreground/70 md:inline">
            {BRAND.workspaceLabel}
          </span>
        </div>
        <div className="h-[3px] w-full bg-gold" />
      </header>

      {/* Service notice strip: what this service is, and the fixed reference frame. */}
      <div className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
          <span className="rounded-sm border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Internal service
          </span>
          <span className="text-[11px] leading-relaxed text-muted-foreground">
            Decision support for {BRAND.entity} ministries, departments and agencies. Simulation
            results are modelled, and are labelled as simulated wherever they appear.
          </span>
          <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>
              Reference date <span className="font-semibold text-foreground">{REFERENCE_DATE_LABEL}</span>
            </span>
            <span>
              Fiscal year <span className="font-semibold text-foreground">{REFERENCE_FISCAL_YEAR}</span>
            </span>
          </span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <section aria-labelledby="home-proposition">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {BRAND.workspaceLabel}
          </span>
          <h1
            id="home-proposition"
            className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {BRAND.tagline}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {BRAND.summary}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Bring a policy draft, and the{" "}
            <span className="font-medium text-foreground">{VOCABULARY.simulationCore}</span> models
            how stakeholder groups respond, what the fiscal and currency effects look like, and where
            the risks sit — before the measure is finalised. Every run then produces an assessment
            and a drafted policy you can edit.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild size="lg" className="h-9 text-sm">
              <a href="#start">
                Start a simulation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <a
              href="#capabilities"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              See what the platform does
            </a>
          </div>
        </section>

        <section id="capabilities" aria-labelledby="capabilities-heading" className="mt-12 scroll-mt-6">
          <h2
            id="capabilities-heading"
            className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            What this platform does
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            One workspace for the whole policy cycle: prepare the draft, test how it lands, read the
            assessment, and take away the instrument itself.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((capability) => (
              <article
                key={capability.title}
                className="flex h-full flex-col gap-2 rounded-lg border bg-card p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary">
                  <capability.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground">
                  {capability.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{capability.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="coverage-heading"
          className="mt-12 rounded-lg border bg-card p-5"
        >
          <h2
            id="coverage-heading"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Platform coverage
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
            <div>
              <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
                {COVERAGE.departments}
              </dd>
              <dt className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Departments
              </dt>
            </div>
            <div>
              <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
                {COVERAGE.groups}
              </dd>
              <dt className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Stakeholder groups modelled
              </dt>
            </div>
            <div>
              <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
                {COVERAGE.indicators}
              </dd>
              <dt className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Reference indicators
              </dt>
            </div>
            <div>
              <dd className="font-mono text-2xl font-semibold leading-none text-foreground">
                {COVERAGE.drafts}
              </dd>
              <dt className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Prepared policy drafts
              </dt>
            </div>
          </dl>
          <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
            Counts are read directly from the department reference configuration, so this page cannot
            claim more coverage than the platform holds.
          </p>
        </section>

        <section id="how-it-works" aria-labelledby="how-heading" className="mt-12 scroll-mt-6">
          <h2
            id="how-heading"
            className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            How it works
          </h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-lg border bg-card p-4">
                <span className="font-mono text-xs font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="deterministic-heading"
          className="mt-12 rounded-lg border border-l-4 border-border border-l-primary bg-card p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="deterministic-heading"
                className="text-sm font-semibold tracking-tight text-foreground"
              >
                Deterministic, local, and reproducible
              </h2>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                The same policy draft, submitted for the same department over the same horizon, always
                reproduces the identical run and the identical documents. Results are computed locally
                in scenario mode (Mock): no policy text and no result is sent to any external service.
              </p>
            </div>
          </div>
        </section>

        <section
          id="start"
          aria-labelledby="start-heading"
          className="mt-12 scroll-mt-6 rounded-lg border bg-card p-5 sm:p-6"
        >
          <h2
            id="start-heading"
            className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            Start: choose your department
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Choose the department whose policy you are preparing. Its reference indicators, prepared
            drafts and documents are loaded into the workspace, and you can change department at any
            time.
          </p>

          {session && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background p-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Department session active
                </span>
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {findDepartment(session.departmentId)?.name}
                </span>
              </div>
              <Button size="sm" onClick={() => navigate("/app")}>
                Continue to workspace
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          )}

          <div className="mb-3 mt-5 flex items-baseline justify-between gap-3 border-b pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select a department
            </h3>
            <span className="text-xs text-muted-foreground">
              {selectedDepartment ? `Selected: ${selectedDepartment.name}` : "No department selected"}
            </span>
          </div>

          <DepartmentGrid selectedId={selectedId} onSelect={setPendingId} />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <p className="max-w-2xl text-[10px] leading-relaxed text-muted-foreground">
              {DISCLAIMER.short}
            </p>
            <Button
              disabled={!selectedDepartment}
              onClick={() => selectedDepartment && enterWorkspace(selectedDepartment.id)}
            >
              Enter {selectedDepartment ? selectedDepartment.shortName : "workspace"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>

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
                  Nzwisiso<span className="text-gold"> AI</span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-primary-foreground/70">
                  {BRAND.productName}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-primary-foreground/70">
                  {BRAND.entity}
                </p>
              </div>
            </div>

            <nav aria-label="Platform" className="flex flex-col gap-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/60">
                Platform
              </h2>
              <a
                href="#capabilities"
                className="text-xs text-primary-foreground/85 underline-offset-4 hover:underline"
              >
                What this platform does
              </a>
              <a
                href="#how-it-works"
                className="text-xs text-primary-foreground/85 underline-offset-4 hover:underline"
              >
                How it works
              </a>
              <a
                href="#start"
                className="text-xs text-primary-foreground/85 underline-offset-4 hover:underline"
              >
                Start a simulation
              </a>
            </nav>

            <div className="flex flex-col gap-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/60">
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
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/60">
                Administration
              </h2>
              <p className="text-xs leading-relaxed text-primary-foreground/85">
                {BRAND.entityCustodian}
              </p>
              <p className="text-xs leading-relaxed text-primary-foreground/70">
                Methodology and limitations are published in the workspace reference section.
              </p>
            </div>
          </div>

          <p className="mt-8 border-t border-primary-foreground/15 pt-5 text-[10px] leading-relaxed text-primary-foreground/70">
            {SOVEREIGNTY_STATEMENT}
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-medium tracking-tight">{BRAND.attribution}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-primary-foreground/55">
                {BRAND.classification}
              </p>
            </div>
            <p className="text-[10px] text-primary-foreground/60">
              Simulated results · Prepared for decision support
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;