import { useSyncExternalStore } from "react";
import type { ScenarioId } from "@/data/documents";
import { getDepartment } from "@/config/departments";

/**
 * In-memory demo store (per browser tab). In live mode the same shapes are
 * persisted by the backend SQLite database via src/lib/engine.ts.
 */

export interface Session {
  departmentId: string;
}

export interface HistoryRecord {
  id: string;
  title: string;
  department: string;
  date: string;
  durationSec: number;
  agents: number;
  keyFinding: string;
  status: "Complete" | "Running" | "Queued";
  policy: string;
  scenario: ScenarioId;
}

export interface AuditEntry {
  seq: number;
  at: string;
  actor: string;
  action: string;
  detail: string;
  hash: string;
}

export interface DraftVersion {
  version: number;
  at: string;
  department: string;
  title: string;
  text: string;
  note: string;
}

interface State {
  session: Session | null;
  online: boolean;
  history: HistoryRecord[];
  audit: AuditEntry[];
  versions: DraftVersion[];
  syncQueue: string[];
  clock: number; // deterministic logical clock (minutes since demo epoch)
}

const EPOCH = Date.UTC(2026, 8, 24, 7, 0); // fixed demo epoch: 24 Sep 2026 09:00 CAT

export const demoTime = (minutes: number) => {
  const d = new Date(EPOCH + minutes * 60_000);
  return d.toISOString().slice(0, 16).replace("T", " ");
};

const seedHistory: HistoryRecord[] = [
  { id: "SIM-0101", title: "ZiG Mandatory Tax Settlement for Exporters", department: "Ministry of Finance", date: "2026-09-17", durationSec: 412, agents: 18000, keyFinding: "Exporter liquidity squeeze in Q1; 61% weighted approval", status: "Complete", scenario: "financial", policy: "Exporters shall settle 50% of domestic tax obligations in ZiG from the next fiscal quarter, with the balance payable in foreign currency. Simulate liquidity, exchange rate and exporter response." },
  { id: "SIM-0100", title: "2026 National Digital Regulatory Framework", department: "Ministry of ICT", date: "2026-09-16", durationSec: 538, agents: 22000, keyFinding: "SME compliance burden is the lead risk", status: "Complete", scenario: "enterprise", policy: "Establish a unified digital regulatory framework covering data localisation, platform licensing and AI accountability under the Cyber and Data Protection Act. Simulate telecom, bank, SME and investor response." },
  { id: "SIM-0099", title: "El Niño Pfumvudza/Intwasa Input Expansion", department: "Ministry of Agriculture", date: "2026-09-15", durationSec: 366, agents: 14000, keyFinding: "Strong rural support; logistics risk in deficit districts", status: "Complete", scenario: "public-opinion", policy: "Expand the Pfumvudza/Intwasa climate-proofed input scheme to 3.2 million households ahead of a forecast El Niño season, with drought-tolerant seed varieties. Simulate A1/A2 farmer and rural household response." },
  { id: "SIM-0098", title: "Civil Service Wage Adjustment — ZiG Parity", department: "Ministry of Public Service", date: "2026-09-14", durationSec: 301, agents: 11000, keyFinding: "Union resistance unless USD cushion is retained", status: "Complete", scenario: "public-opinion", policy: "Adjust civil service salaries by 20% in ZiG terms with a USD cushion allowance retained for two quarters. Simulate union, fiscal and household response." },
  { id: "SIM-0097", title: "Heritage-Based Curriculum Rollout", department: "Ministry of Education", date: "2026-09-12", durationSec: 289, agents: 9000, keyFinding: "Language sub-quota capacity gap flagged", status: "Complete", scenario: "narrative", policy: "Roll out the Heritage-Based Curriculum in all primary schools with indigenous language instruction up to Grade 3. Simulate parent, teacher and heritage institution response." },
  { id: "SIM-0096", title: "Lithium Beneficiation Requirement", department: "Ministry of Mines", date: "2026-09-10", durationSec: 447, agents: 16000, keyFinding: "Investor confidence dips; incentives recommended", status: "Complete", scenario: "enterprise", policy: "Require lithium miners to process ore to concentrate or higher domestically within 24 months, with an export ban on raw ore. Simulate miner, investor and logistics response." },
];

const seedAudit: AuditEntry[] = [
  { seq: 1, at: demoTime(-1440), actor: "System", action: "BOOT", detail: "NZwisiso node started on National Data Centre", hash: "" },
  { seq: 2, at: demoTime(-1430), actor: "Ministry of Finance", action: "RUN_SIMULATION", detail: "SIM-0101 ZiG Mandatory Tax Settlement", hash: "" },
];

let state: State = {
  session: (() => {
    try {
      const raw = sessionStorage.getItem("nzwisiso.session");
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  })(),
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  history: seedHistory,
  audit: chain(seedAudit),
  versions: [],
  syncQueue: [],
  clock: 0,
};

/** Hash-chained audit entries: each hash covers the previous one (tamper-evident). */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}
function chain(entries: AuditEntry[]) {
  let prev = "00000000";
  return entries.map((e) => {
    const h = hash(prev + e.seq + e.at + e.actor + e.action + e.detail);
    prev = h;
    return { ...e, hash: h };
  });
}

const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const useStore = <T,>(sel: (s: State) => T) =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => sel(state)
  );
export const getState = () => state;

const tick = () => {
  state.clock += 1;
  return demoTime(state.clock);
};

export function actorName() {
  return getDepartment(state.session?.departmentId)?.name ?? "Anonymous";
}

export function logAudit(action: string, detail: string) {
  const prev = state.audit[state.audit.length - 1];
  const entry: AuditEntry = { seq: prev.seq + 1, at: tick(), actor: actorName(), action, detail, hash: "" };
  entry.hash = hash(prev.hash + entry.seq + entry.at + entry.actor + entry.action + entry.detail);
  set({ audit: [...state.audit, entry] });
  if (!state.online) set({ syncQueue: [...state.syncQueue, `${action}: ${detail}`] });
}

export function signIn(departmentId: string) {
  sessionStorage.setItem("nzwisiso.session", JSON.stringify({ departmentId }));
  set({ session: { departmentId } });
  logAudit("SIGN_IN", `Demo sign-in (production: Government SSO)`);
}

export function signOut() {
  logAudit("SIGN_OUT", "Session ended");
  sessionStorage.removeItem("nzwisiso.session");
  set({ session: null });
}

export function addHistory(r: Omit<HistoryRecord, "id" | "date">) {
  const n = 102 + state.history.filter((h) => h.id.startsWith("SIM-01")).length - 2;
  const rec: HistoryRecord = { ...r, id: `SIM-${String(n).padStart(4, "0")}`, date: demoTime(state.clock).slice(0, 10) };
  set({ history: [rec, ...state.history] });
  return rec;
}

export function saveVersion(title: string, text: string, note: string) {
  const v: DraftVersion = { version: state.versions.length + 1, at: tick(), department: actorName(), title, text, note };
  set({ versions: [...state.versions, v] });
  logAudit("SAVE_DRAFT", `v${v.version} ${title}`);
}

export function setOnline(online: boolean) {
  if (online && !state.online && state.syncQueue.length) {
    const n = state.syncQueue.length;
    set({ online, syncQueue: [] });
    logAudit("SYNC", `${n} queued action(s) synchronised on reconnect`);
    return;
  }
  set({ online });
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => setOnline(true));
  window.addEventListener("offline", () => setOnline(false));
}
