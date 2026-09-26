import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The two visuals that explain what the assessment engine does with a policy
 * draft: the pipeline, stage by stage, and the compact schematic of the
 * simulated population built along the way.
 *
 * Both are read by Government officials who understand that AI exists but are
 * not expected to know how it is built — so the register is plain (policy,
 * institutions, stakeholders, relationships, perspectives, responses,
 * scenarios, patterns, risks, assessment) and no implementation vocabulary
 * appears. The five figures below are the approved conceptual indicators; none
 * of them is a measured counter and none is invented here.
 *
 * Deterministic by construction: the dot field is a fixed-length render of a
 * static array — no Math.random, no Date.now, no new Date — so the diagram is
 * identical on every render and in every build.
 * (see .clinerules/04-determinism-and-validation.md)
 */

/**
 * The population figure. Stated ONCE: the scale strip and the diagram's caption
 * both read it, so the two can never disagree about how large the population is.
 */
export const SIMULATED_AGENT_FIGURE = "1,000+";

/**
 * The four things the knowledge map holds — and the only place they are written.
 * The pipeline line and the diagram's rows both read from this array, so the
 * sentence and the list cannot drift apart.
 */
export const KNOWLEDGE_MAP_PARTS = [
  "Entities",
  "Relationships",
  "Institutions",
  "Interests",
] as const;

/**
 * The pipeline's line for the knowledge map, derived from the parts above:
 * "Entities • relationships • institutions • interests".
 */
export const KNOWLEDGE_MAP_LINE =
  KNOWLEDGE_MAP_PARTS[0] +
  KNOWLEDGE_MAP_PARTS.slice(1)
    .map((part) => ` \u2022 ${part.toLowerCase()}`)
    .join("");

/**
 * The five scale indicators, in the order they are read. Deliberately a mix of
 * magnitudes ("1,000+", "Multiple", "Hundreds") and capabilities — the point is
 * the scale and the complexity of the simulated environment, not a metric set.
 */
export const SIMULATION_SCALE = [
  { figure: SIMULATED_AGENT_FIGURE, label: "Simulated agents" },
  { figure: "Multiple", label: "Stakeholder groups" },
  { figure: "Hundreds", label: "Relationships" },
  { figure: "Scenario-based", label: "Interactions" },
  { figure: "Structured", label: "Policy assessment" },
] as const;

/**
 * The pipeline, in order, each stage with the one line it carries. The first two
 * stages describe the draft entering and being understood; the rest describe what
 * the system does with it. Written for an official, not for an engineer.
 */
export const SIMULATION_PIPELINE = [
  { title: "Policy draft", body: "The policy text the department submits." },
  {
    title: "Policy understanding",
    body: "The policy is read for its intent, scope and the institutions it touches.",
  },
  { title: "Knowledge map", body: KNOWLEDGE_MAP_LINE },
  { title: "Simulated population", body: "Thousands of individual agents" },
  { title: "Agent interactions", body: "Different perspectives \u2022 behaviours \u2022 responses" },
  { title: "Scenario run", body: "Interactions evolve across the simulated environment" },
  { title: "Policy intelligence", body: "Patterns \u2022 tensions \u2022 risks \u2022 areas of support" },
  { title: "Policy assessment", body: "Structured findings for human review" },
] as const;

/**
 * The dot field: 40 marks standing in for a population of thousands. A mark per
 * agent would mean four figures of DOM nodes to say the same thing, so the field
 * is a fixed, static render — one element per row-of-ten, never per agent.
 */
const AGENT_DOTS = Array.from({ length: 40 }, (_, index) => index);

/**
 * The pipeline as a vertical process diagram: numbered markers, a title and a
 * supporting line per stage, and a connector running to the next stage, so the
 * reader can see the policy passing through progressively deeper analysis.
 */
export function ProcessPipeline() {
  return (
    <ol className="mt-5" aria-label="The Nzwisiso process, stage by stage">
      {SIMULATION_PIPELINE.map((stage, index) => (
        <li key={stage.title} className="relative flex gap-3 pb-4 last:pb-0">
          {/* The rail is decorative — the number and the title carry the meaning. */}
          {index < SIMULATION_PIPELINE.length - 1 ? (
            <span aria-hidden="true" className="absolute bottom-0 left-3 top-7 w-px bg-primary/25" />
          ) : null}
          <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-card font-mono text-[11px] font-semibold text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase leading-snug tracking-wide text-foreground">
              {stage.title}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{stage.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** A connector between two diagram blocks. Decorative — hidden from assistive tech. */
function Connector() {
  return (
    <span aria-hidden="true" className="flex flex-col items-center py-1">
      <span className="h-4 w-px bg-primary/30" />
      <ChevronDown className="-mt-1.5 h-3.5 w-3.5 text-primary/50" />
    </span>
  );
}

/** One block of the schematic: a bordered surface with a caption and its contents. */
function DiagramBlock({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-primary/25 bg-card px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">{label}</p>
      {children}
    </div>
  );
}

/**
 * The compact schematic: the policy becomes a knowledge map, the map becomes a
 * simulated population of thousands of agents, the agents interact, and the
 * result is a structured assessment. It exists so the size of the environment
 * behind one draft is visible at a glance, in one panel, without a diagram or
 * animation library being added for it.
 */
export function AgentPopulationDiagram() {
  return (
    <div className="flex flex-col items-stretch rounded-lg border bg-primary-tint p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        The simulated environment
      </p>

      <div className="mt-4">
        <DiagramBlock label="Policy">
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            The draft under assessment
          </p>
        </DiagramBlock>
      </div>

      <Connector />

      <DiagramBlock label="Knowledge map">
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {KNOWLEDGE_MAP_PARTS.map((part) => (
            <li
              key={part}
              className="flex items-center gap-1.5 text-[11px] leading-relaxed text-muted-foreground"
            >
              <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-primary/50" />
              {part}
            </li>
          ))}
        </ul>
      </DiagramBlock>

      <Connector />

      <div className="rounded-md border border-primary/40 bg-card px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Simulated population
        </p>
        {/* One restrained entrance for the whole field — the marks settle into
            place together rather than each one moving on its own. The animation
            already ships with the app (the agent feed uses it); nothing new is
            added, and reduced-motion turns it off entirely. */}
        <div
          aria-hidden="true"
          className="mt-3 grid animate-slide-up-fade grid-cols-10 gap-1.5 motion-reduce:animate-none"
        >
          {AGENT_DOTS.map((dot) => (
            <span key={dot} className="h-1.5 w-1.5 justify-self-center rounded-full bg-primary/45" />
          ))}
        </div>
        <p className="mt-3 flex items-baseline justify-center gap-2">
          <span className="font-mono text-xl font-semibold leading-none text-foreground">
            {SIMULATED_AGENT_FIGURE}
          </span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">agents</span>
        </p>
      </div>

      <Connector />

      <DiagramBlock label="Interactions" />

      <Connector />

      <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Policy assessment
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          Structured findings for human review
        </p>
      </div>
    </div>
  );
}
