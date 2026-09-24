/**
 * Engine adapter — the single switch between scripted demo data and the live
 * backend (MiroFish orchestration: OASIS simulation, GraphRAG knowledge graph,
 * Zep memory, ReportAgent). Internal names must never reach user-facing copy.
 */
import type { ScenarioId } from "@/data/documents";
import { runSimulation, type SimulationReport } from "@/lib/simulation";

export const DEMO_MODE = true;
export const API_BASE = "http://localhost:5001/api";

export interface EngineStatus {
  core: { state: "Ready" | "Running" | "Complete"; agents: number; progress: number };
  knowledge: { entities: number; relationships: number; density: number; lastIndexed: string };
  memory: { utilisation: number; episodes: number; health: "Healthy" | "Degraded" };
}

export async function simulate(policy: string, scenario: ScenarioId): Promise<SimulationReport> {
  if (DEMO_MODE) return runSimulation(policy, scenario);
  // Live: Flask wrapper around MiroFish main.py
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ policy, scenario }),
  });
  if (!res.ok) throw new Error(`Simulation service returned ${res.status}`);
  return res.json();
}

export async function fetchStatus(): Promise<EngineStatus | null> {
  if (DEMO_MODE) return null;
  const res = await fetch(`${API_BASE}/status`);
  return res.ok ? res.json() : null;
}

/** Government e-services API gateway hook (stub). */
export async function gatewayPublish(topic: string, payload: unknown) {
  if (DEMO_MODE) return { ok: true, topic, queued: true };
  const res = await fetch(`${API_BASE}/gateway/${topic}`, { method: "POST", body: JSON.stringify(payload) });
  return { ok: res.ok, topic, queued: false };
}

/** WOGMELS (Whole-of-Government M&E) indicator push hook (stub). */
export async function pushToWogmels(report: SimulationReport) {
  return gatewayPublish("wogmels/indicators", {
    seed: report.seed,
    scenario: report.scenario.code,
    approval: report.approval,
    kpis: report.kpis.map((k) => ({ label: k.label, score: k.score })),
  });
}
