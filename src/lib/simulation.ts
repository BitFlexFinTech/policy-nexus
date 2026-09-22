import { DOCUMENTS, SCENARIOS, type ScenarioId, type ScenarioMeta } from "@/data/documents";

/**
 * Deterministic simulation engine.
 *
 * Every output is a pure function of (policy text, scenario). The same input
 * always produces byte-identical results — no Date.now(), no Math.random().
 */

/** cyrb53 — stable 53-bit string hash. */
function hashString(input: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** mulberry32 — seeded PRNG. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface StakeholderResult {
  name: string;
  population: number;
  approval: number;
  sentiment: "Supportive" | "Neutral" | "Resistant";
  driver: string;
}

export interface KpiResult {
  label: string;
  value: string;
  score: number;
  delta: string;
  direction: "up" | "down" | "flat";
  note: string;
}

export interface RoundEvent {
  round: number;
  agent: string;
  type: "info" | "action" | "result" | "warning";
  message: string;
}

export interface RiskItem {
  factor: string;
  likelihood: number;
  impact: "Low" | "Moderate" | "High" | "Severe";
  mitigation: string;
}

export type ApprovalStatus = "Approved" | "Conditional" | "Pending" | "Objected";

export interface ApprovalPoint {
  milestone: string;
  approval: number;
  status: ApprovalStatus;
}

export interface StakeholderTrack {
  name: string;
  points: ApprovalPoint[];
}

export interface Milestone {
  name: string;
  week: number;
  gate: string;
  weightedApproval: number;
  status: ApprovalStatus;
}

export interface ApprovalTrackerData {
  milestones: Milestone[];
  tracks: StakeholderTrack[];
}

export interface SimulationReport {
  seed: string;
  policy: string;
  scenario: ScenarioMeta;
  documentTitle?: string;
  rounds: number;
  agents: number;
  approval: number;
  confidence: number;
  verdict: string;
  kpis: KpiResult[];
  stakeholders: StakeholderResult[];
  trace: RoundEvent[];
  risks: RiskItem[];
  ubuntu: { cohesion: number; equity: number; trust: number; narrative: string };
  recommendations: string[];
  tracker: ApprovalTrackerData;
}

const MILESTONE_DEFS: Record<ScenarioId, { name: string; week: number; gate: string }[]> = {
  "public-opinion": [
    { name: "Draft Published", week: 0, gate: "Cabinet clearance to consult" },
    { name: "Provincial Consultation", week: 4, gate: "All 10 provinces reported" },
    { name: "Stakeholder Hearings", week: 9, gate: "Union and operator submissions logged" },
    { name: "Revised Draft", week: 15, gate: "Mitigations incorporated" },
    { name: "Implementation Sign-off", week: 22, gate: "Weighted approval above 55%" },
  ],
  financial: [
    { name: "Monetary Statement", week: 0, gate: "RBZ committee endorsement" },
    { name: "Bank Sector Briefing", week: 3, gate: "Liquidity impact modelled" },
    { name: "Exporter Consultation", week: 7, gate: "Surrender terms agreed" },
    { name: "Market Pilot", week: 12, gate: "Interbank spread within band" },
    { name: "Full Rollout", week: 20, gate: "Reserve cover reported monthly" },
  ],
  narrative: [
    { name: "Policy Concept Note", week: 0, gate: "Ministry sponsor confirmed" },
    { name: "Sector Roundtables", week: 5, gate: "Producer and artist bodies heard" },
    { name: "Quota Modelling", week: 10, gate: "Content supply capacity tested" },
    { name: "Broadcaster Agreement", week: 16, gate: "Licence conditions accepted" },
    { name: "Season One Launch", week: 24, gate: "Audience retention monitored" },
  ],
  enterprise: [
    { name: "Regulatory Impact Draft", week: 0, gate: "Cost assessment published" },
    { name: "Industry Submissions", week: 4, gate: "Chambers and SME bodies filed" },
    { name: "Compliance Pilot", week: 11, gate: "Tiered obligations tested" },
    { name: "Investor Assurance", week: 18, gate: "Incentive terms locked" },
    { name: "Statutory Instrument", week: 26, gate: "Gazetted with transition period" },
  ],
};

const statusFor = (n: number): ApprovalStatus =>
  n >= 70 ? "Approved" : n >= 55 ? "Conditional" : n >= 40 ? "Pending" : "Objected";

const STAKEHOLDERS: Record<ScenarioId, { name: string; population: number; driver: string }[]> = {
  "public-opinion": [
    { name: "Urban Households (Harare/Bulawayo)", population: 3_120_000, driver: "Service delivery and cost of living" },
    { name: "Kombi Operators & Informal Traders", population: 1_480_000, driver: "Fare regulation and fuel pricing" },
    { name: "Civil Service Unions", population: 305_000, driver: "Wage parity and pension value" },
    { name: "Rural Communal Households", population: 4_760_000, driver: "Food security and input schemes" },
    { name: "Youth & Student Bodies", population: 2_240_000, driver: "Employment and tertiary funding" },
  ],
  financial: [
    { name: "Commercial Banks & Building Societies", population: 19, driver: "Reserve money targets and liquidity" },
    { name: "Exporters (Mining & Tobacco)", population: 4_200, driver: "Surrender requirements and ZiG settlement" },
    { name: "Retailers & Formal Wholesalers", population: 12_800, driver: "Pricing rules and exchange rate spread" },
    { name: "Diaspora Remittance Senders", population: 1_900_000, driver: "Corridor cost and payout currency" },
    { name: "Pension Funds & Insurers", population: 86, driver: "Asset revaluation and ZiG exposure" },
  ],
  narrative: [
    { name: "Broadcasters & Streaming Platforms", population: 42, driver: "Local content quota feasibility" },
    { name: "Musicians & Performing Artists", population: 34_000, driver: "Royalty flows and funding access" },
    { name: "Film & Television Producers", population: 2_600, driver: "Production financing and IP rights" },
    { name: "Audiences (Urban & Diaspora)", population: 5_400_000, driver: "Content relevance and language" },
    { name: "Heritage & Language Institutions", population: 310, driver: "Indigenous language preservation" },
  ],
  enterprise: [
    { name: "Manufacturers & Agro-processors", population: 3_900, driver: "Input costs and local content rules" },
    { name: "Telecoms, Banks & Insurers", population: 140, driver: "Data compliance and localisation cost" },
    { name: "SMEs & Cooperatives", population: 128_000, driver: "Licensing burden and market access" },
    { name: "Foreign Direct Investors", population: 480, driver: "Incentive stability and repatriation" },
    { name: "Logistics & Border Operators", population: 2_100, driver: "Tariff phase-down and clearance times" },
  ],
};

const KPI_DEFS: Record<ScenarioId, { label: string; note: string; base: number }[]> = {
  "public-opinion": [
    { label: "Public Approval Index", note: "Weighted national sentiment", base: 64 },
    { label: "Crisis Escalation Risk", note: "Probability of disorder within 90 days", base: 31 },
    { label: "Institutional Trust", note: "Confidence in implementing agencies", base: 57 },
    { label: "Information Integrity", note: "Resistance to misinformation cascades", base: 61 },
  ],
  financial: [
    { label: "ZiG Stability Forecast", note: "Exchange rate volatility confidence", base: 71 },
    { label: "Inflation Pass-through", note: "Month-on-month price transmission", base: 38 },
    { label: "Market Liquidity", note: "Interbank and retail settlement depth", base: 59 },
    { label: "Fiscal Headroom", note: "Deficit tolerance against target", base: 52 },
  ],
  narrative: [
    { label: "Narrative Coherence", note: "Consistency of national framing", base: 66 },
    { label: "Media Framing Favourability", note: "Tone across broadcast and digital", base: 58 },
    { label: "Creative Supply Capacity", note: "Sector ability to meet demand", base: 47 },
    { label: "Audience Retention", note: "Projected 12-month engagement", base: 62 },
  ],
  enterprise: [
    { label: "Investor Confidence", note: "Forward investment intention", base: 61 },
    { label: "Compliance Cost Load", note: "Burden as share of operating cost", base: 43 },
    { label: "Operational Readiness", note: "Firms able to comply on schedule", base: 55 },
    { label: "Supply Chain Resilience", note: "Tolerance to input disruption", base: 58 },
  ],
};

const RISK_DEFS: Record<ScenarioId, { factor: string; mitigation: string }[]> = {
  "public-opinion": [
    { factor: "Urban transport fare shock", mitigation: "Phase fare adjustment with targeted commuter subsidy" },
    { factor: "Civil service industrial action", mitigation: "Open structured bipartite wage negotiation early" },
    { factor: "Misinformation cascade on social platforms", mitigation: "Publish plain-language rollout timelines weekly" },
    { factor: "Rural food insecurity during lean season", mitigation: "Pre-position grain reserves in deficit districts" },
    { factor: "Provincial implementation variance", mitigation: "Devolve monitoring to provincial councils with dashboards" },
  ],
  financial: [
    { factor: "Parallel market premium widening", mitigation: "Increase interbank auction frequency and transparency" },
    { factor: "Reserve money overshoot", mitigation: "Hold quarterly reserve money growth within target band" },
    { factor: "Retailer pricing above interbank rate", mitigation: "Publish reference rates and monitor formal retail" },
    { factor: "Export surrender liquidity squeeze", mitigation: "Stagger settlement obligations across the quarter" },
    { factor: "Reserve asset cover erosion", mitigation: "Report gold and FX cover ratio monthly" },
  ],
  narrative: [
    { factor: "Content supply shortfall against quota", mitigation: "Stagger quota increase over four broadcast seasons" },
    { factor: "Perception of state narrative control", mitigation: "Route funding through independent adjudication panel" },
    { factor: "Royalty collection leakage", mitigation: "Digitise collection society reporting and audits" },
    { factor: "Diaspora audience disengagement", mitigation: "License content to diaspora streaming distribution" },
    { factor: "Language sub-quota capacity gap", mitigation: "Fund translation and dubbing production hubs" },
  ],
  enterprise: [
    { factor: "Compliance cost concentration on SMEs", mitigation: "Tiered obligations by annual turnover" },
    { factor: "Data localisation infrastructure gap", mitigation: "Approve certified regional hosting arrangements" },
    { factor: "Incentive instability deterring FDI", mitigation: "Lock incentive terms in investment agreements" },
    { factor: "Input tariff pass-through to prices", mitigation: "Duty rebate on non-substitutable inputs" },
    { factor: "Border clearance bottlenecks", mitigation: "Extend one-stop border post operating hours" },
  ],
};

const AGENT_POOL: Record<ScenarioId, string[]> = {
  "public-opinion": ["OASIS", "GraphRAG", "KombiOps", "CivilUnions", "RuralHH", "YouthBodies"],
  financial: ["OASIS", "GraphRAG", "BankSector", "Exporters", "Retailers", "Diaspora"],
  narrative: ["OASIS", "GraphRAG", "Broadcast", "Artists", "Audience", "Heritage"],
  enterprise: ["OASIS", "GraphRAG", "Manufacturing", "TelcoFin", "SMEs", "Logistics"],
};

const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];
const clamp = (n: number, lo = 4, hi = 96) => Math.max(lo, Math.min(hi, Math.round(n)));

export function runSimulation(policy: string, scenario: ScenarioId): SimulationReport {
  const normalised = policy.trim().replace(/\s+/g, " ");
  const meta = SCENARIOS.find((s) => s.id === scenario) as ScenarioMeta;
  const seedNum = hashString(`${scenario}::${normalised}`);
  const r = rng(seedNum);

  const rounds = 40 + Math.floor(r() * 5) * 10;
  const agents = 8_000 + Math.floor(r() * 18) * 1_000;

  const stakeholders: StakeholderResult[] = STAKEHOLDERS[scenario].map((s) => {
    const approval = clamp(38 + r() * 52, 12, 94);
    return {
      ...s,
      approval,
      sentiment: approval >= 66 ? "Supportive" : approval >= 45 ? "Neutral" : "Resistant",
    };
  });

  const approval = Math.round(
    stakeholders.reduce((acc, s) => acc + s.approval, 0) / stakeholders.length
  );
  const confidence = clamp(72 + r() * 24, 60, 97);

  const kpis: KpiResult[] = KPI_DEFS[scenario].map((k) => {
    const shift = Math.round((r() - 0.45) * 26);
    const score = clamp(k.base + shift);
    return {
      label: k.label,
      value: `${score}%`,
      score,
      delta: `${shift > 0 ? "+" : ""}${shift} pts`,
      direction: shift > 1 ? "up" : shift < -1 ? "down" : "flat",
      note: k.note,
    };
  });

  const risks: RiskItem[] = RISK_DEFS[scenario].map((d) => {
    const likelihood = clamp(18 + r() * 62, 8, 88);
    return {
      ...d,
      likelihood,
      impact: likelihood >= 70 ? "Severe" : likelihood >= 52 ? "High" : likelihood >= 34 ? "Moderate" : "Low",
    };
  });

  const agentsPool = AGENT_POOL[scenario];
  const traceCount = 14;
  const trace: RoundEvent[] = Array.from({ length: traceCount }, (_, i) => {
    const round = Math.max(1, Math.round(((i + 1) / traceCount) * rounds));
    const agent = i === 0 ? "OASIS" : i === traceCount - 1 ? "OASIS" : pick(r, agentsPool);
    const sh = pick(r, stakeholders);
    const kpi = pick(r, kpis);
    const risk = pick(r, risks);
    const roll = r();
    const type: RoundEvent["type"] =
      i === 0 ? "info" : i === traceCount - 1 ? "result" : roll > 0.78 ? "warning" : roll > 0.5 ? "result" : "action";
    const message =
      i === 0
        ? `Scenario ${meta.code} loaded — ${agents.toLocaleString()} ASO agents instantiated across ${stakeholders.length} stakeholder classes over ${rounds} rounds.`
        : i === traceCount - 1
        ? `Convergence reached at round ${rounds}. Weighted approval ${approval}% at ${confidence}% model confidence.`
        : type === "warning"
        ? `${risk.factor} — likelihood ${risk.likelihood}%, classified ${risk.impact.toLowerCase()} impact.`
        : type === "result"
        ? `${kpi.label} settles at ${kpi.value} (${kpi.delta}).`
        : `${sh.name}: ${sh.approval}% approval, driven by ${sh.driver.toLowerCase()}.`;
    return { round, agent, type, message };
  });

  const ubuntu = {
    cohesion: clamp(48 + r() * 44),
    equity: clamp(42 + r() * 46),
    trust: clamp(44 + r() * 44),
  };

  const verdict =
    approval >= 70
      ? "Proceed — broad stakeholder support with manageable residual risk."
      : approval >= 55
      ? "Proceed with conditions — sequence implementation and mitigate named risks first."
      : approval >= 42
      ? "Revise — material resistance concentrated in specific stakeholder classes."
      : "Hold — projected resistance and crisis risk exceed tolerance.";

  const topRisks = [...risks].sort((a, b) => b.likelihood - a.likelihood).slice(0, 3);
  const weakest = [...stakeholders].sort((a, b) => a.approval - b.approval)[0];

  const recommendations = [
    `Engage ${weakest.name} first — lowest projected approval at ${weakest.approval}% on ${weakest.driver.toLowerCase()}.`,
    ...topRisks.map((t) => `${t.mitigation} (addresses ${t.factor.toLowerCase()}, ${t.likelihood}% likelihood).`),
    `Re-run scenario ${meta.code} after the first implementation quarter to validate the ${kpis[0].label.toLowerCase()} trajectory.`,
  ];

  const milestoneDefs = MILESTONE_DEFS[scenario];

  const tracks: StakeholderTrack[] = stakeholders.map((s) => {
    const start = clamp(s.approval - 8 - r() * 18, 10, 92);
    return {
      name: s.name,
      points: milestoneDefs.map((m, i) => {
        const t = i / (milestoneDefs.length - 1);
        const wobble = (r() - 0.5) * 9 * (1 - t);
        const value = i === milestoneDefs.length - 1 ? s.approval : clamp(start + (s.approval - start) * t + wobble, 8, 95);
        return { milestone: m.name, approval: value, status: statusFor(value) };
      }),
    };
  });

  const milestones: Milestone[] = milestoneDefs.map((m, i) => {
    const weighted = Math.round(tracks.reduce((acc, t) => acc + t.points[i].approval, 0) / tracks.length);
    return { ...m, weightedApproval: weighted, status: statusFor(weighted) };
  });

  const doc = DOCUMENTS.find((d) => normalised.startsWith(d.excerpt.slice(0, 60)));

  return {
    seed: seedNum.toString(36).toUpperCase().slice(0, 10),
    policy: normalised,
    scenario: meta,
    documentTitle: doc?.title,
    rounds,
    agents,
    approval,
    confidence,
    verdict,
    kpis,
    stakeholders,
    trace,
    risks,
    ubuntu: {
      ...ubuntu,
      narrative: `Collective well-being holds at ${Math.round(
        (ubuntu.cohesion + ubuntu.equity + ubuntu.trust) / 3
      )}% under Ubuntu weighting: cohesion ${ubuntu.cohesion}%, distributional equity ${ubuntu.equity}%, institutional trust ${ubuntu.trust}%. Gains concentrate where stakeholder classes share the burden of adjustment rather than where aggregate output rises.`,
    },
    recommendations,
    tracker: { milestones, tracks },
  };
}
